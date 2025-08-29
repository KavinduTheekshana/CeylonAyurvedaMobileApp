import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MaterialIcons, Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Therapist {
  id: number;
  name: string;
  email: string;
  phone: string;
  image?: string;
  bio?: string;
  work_start_date?: string;
  status: boolean;
  online_status: boolean;
  profile_photo_path?: string;
  last_login_at?: string;
}

export default function TherapistDetailScreen() {
  const router = useRouter();
  const { therapistId, therapistData } = useLocalSearchParams();
  const [therapist, setTherapist] = useState<Therapist | null>(null);
  const [isGuest, setIsGuest] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    const checkGuestStatus = async () => {
      try {
        const userMode = await AsyncStorage.getItem('user_mode');
        setIsGuest(userMode === 'guest');
      } catch (error) {
        console.error('Error checking guest status:', error);
      }
    };

    const loadTherapistData = () => {
      try {
        if (therapistData && typeof therapistData === 'string') {
          const parsedData = JSON.parse(therapistData);
          setTherapist(parsedData);
        }
      } catch (error) {
        console.error('Error parsing therapist data:', error);
        Alert.alert('Error', 'Failed to load therapist information');
        router.back();
      }
    };

    checkGuestStatus();
    loadTherapistData();
  }, [therapistData]);

  // Calculate years of experience
  const getYearsOfExperience = (workStartDate?: string) => {
    if (!workStartDate) return 'New';
    
    const startDate = new Date(workStartDate);
    const currentDate = new Date();
    const years = currentDate.getFullYear() - startDate.getFullYear();
    
    return years > 0 ? `${years} year${years !== 1 ? 's' : ''}` : 'Less than 1 year';
  };

  // Format date
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long' 
      });
    } catch (error) {
      return 'N/A';
    }
  };

  // Handle start session
  const handleStartSession = () => {
    if (isGuest) {
      Alert.alert(
        'Login Required',
        'Please login to start a therapy session',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Login', onPress: () => router.push('/(auth)/LoginScreen') }
        ]
      );
      return;
    }

    if (!therapist) return;

    // Navigate to therapist services screen instead of showing alert
    router.push({
      pathname: '/(screens)/TherapistServicesScreen',
      params: {
        therapistId: therapist.id.toString(),
        therapistName: therapist.name
      }
    });
  };

  // Handle call therapist
  const handleCallTherapist = () => {
    if (isGuest) {
      Alert.alert(
        'Login Required',
        'Please login to contact therapist',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Login', onPress: () => router.push('/(auth)/LoginScreen') }
        ]
      );
      return;
    }

    if (!therapist?.phone) {
      Alert.alert('Error', 'Phone number not available');
      return;
    }

    Alert.alert(
      'Call Therapist',
      `Would you like to call ${therapist.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Call', onPress: () => {
          // Here you would integrate with phone calling functionality
          // For now, just show the phone number
          Alert.alert('Phone Number', therapist.phone);
        }}
      ]
    );
  };

  if (!therapist) {
    return (
      <SafeAreaView className="flex-1 bg-[#FAFAFA] justify-center items-center">
        <ActivityIndicator size="large" color="#9A563A" />
        <Text className="mt-2 text-gray-500">Loading therapist details...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-[#FAFAFA]">

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Therapist Header */}
        <View className="bg-white p-6 items-center border-b border-gray-100">
          {/* Profile Image */}
          <View className="relative mb-4">
            {therapist.image ? (
              <Image
                source={{ uri: therapist.image }}
                className="w-24 h-24 rounded-full"
                resizeMode="cover"
              />
            ) : (
              <View className="w-24 h-24 rounded-full bg-gray-200 justify-center items-center">
                <Feather name="user" size={40} color="#9A563A" />
              </View>
            )}
            
            {/* Online status indicator */}
            {therapist.online_status && (
              <View className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-white justify-center items-center">
                <View className="w-2 h-2 bg-white rounded-full" />
              </View>
            )}
          </View>

          {/* Name and Status */}
          <Text className="text-2xl font-bold text-black mb-2">{therapist.name}</Text>
          
          <View className="flex-row items-center mb-4">
            <MaterialIcons name="work-outline" size={16} color="#9A563A" />
            <Text className="text-gray-600 ml-2">
              {getYearsOfExperience(therapist.work_start_date)} of experience
            </Text>
          </View>

          {therapist.online_status ? (
            <View className="bg-green-100 px-4 py-2 rounded-full">
              <Text className="text-green-700 font-medium">Available Now</Text>
            </View>
          ) : (
            <View className="bg-gray-100 px-4 py-2 rounded-full">
              <Text className="text-gray-600 font-medium">Currently Offline</Text>
            </View>
          )}
        </View>

        {/* Bio Section */}
        {therapist.bio && (
          <View className="bg-white p-6 mb-4">
            <Text className="text-lg font-bold text-black mb-3">About</Text>
            <Text className="text-gray-700 leading-6">{therapist.bio}</Text>
          </View>
        )}

        {/* Experience Section */}
        <View className="bg-white p-6 mb-4">
          <Text className="text-lg font-bold text-black mb-3">Experience</Text>
          
          <View className="flex-row items-center mb-2">
            <MaterialIcons name="calendar-today" size={16} color="#9A563A" />
            <Text className="text-gray-700 ml-2">
              Started: {formatDate(therapist.work_start_date)}
            </Text>
          </View>
          
          <View className="flex-row items-center">
            <MaterialIcons name="timer" size={16} color="#9A563A" />
            <Text className="text-gray-700 ml-2">
              {getYearsOfExperience(therapist.work_start_date)} of professional experience
            </Text>
          </View>
        </View>

        {/* Contact Info Section */}
        <View className="bg-white p-6 mb-4">
          <Text className="text-lg font-bold text-black mb-3">Contact Information</Text>
          
          <View className="flex-row items-center mb-2">
            <MaterialIcons name="email" size={16} color="#9A563A" />
            <Text className="text-gray-700 ml-2">{therapist.email}</Text>
          </View>
          
          {therapist.phone && (
            <View className="flex-row items-center">
              <MaterialIcons name="phone" size={16} color="#9A563A" />
              <Text className="text-gray-700 ml-2">{therapist.phone}</Text>
            </View>
          )}
        </View>

        {/* Spacer for action buttons */}
        <View className="h-24" />
      </ScrollView>

      {/* Action Buttons */}
      <View className="bg-white p-5 border-t border-gray-100">
        <View className="flex-row gap-3">
          {/* Start Session Button */}
          <TouchableOpacity
            className={`flex-1 py-5 px-4 rounded-xl flex-row items-center justify-center ${
              therapist.online_status 
                ? '' 
                : 'bg-gray-300'
            }`}
            style={therapist.online_status ? { backgroundColor: '#9A563A' } : {}}
            onPress={handleStartSession}
            disabled={!therapist.online_status}
          >
            <MaterialIcons 
              name="video-call" 
              size={20} 
              color={therapist.online_status ? "white" : "#666"} 
            />
            <Text className={`font-bold ml-2 ${
              therapist.online_status ? 'text-white' : 'text-gray-600'
            }`}>
              {therapist.online_status ? 'Start Session' : 'Offline'}
            </Text>
          </TouchableOpacity>
          
          {/* Call Button */}
          <TouchableOpacity
            className="py-5 px-4 rounded-xl flex-row items-center justify-center"
            style={{ borderColor: '#9A563A', borderWidth: 1 }}
            onPress={handleCallTherapist}
          >
            <MaterialIcons name="phone" size={20} color="#9A563A" />
            <Text className="font-bold ml-2" style={{ color: '#9A563A' }}>Call</Text>
          </TouchableOpacity>
        </View>

        {/* Guest banner */}
        {isGuest && (
          <View className="mt-4 p-3 rounded-xl" style={{ backgroundColor: '#F3F0EC' }}>
            <Text className="text-center" style={{ color: '#9A563A', fontSize: 14 }}>
              Login to start sessions and contact therapists
            </Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}