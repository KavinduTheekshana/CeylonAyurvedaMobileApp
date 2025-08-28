import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
  SafeAreaView,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons, Feather } from '@expo/vector-icons';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '@/config/api';

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

interface ApiResponse {
  success: boolean;
  data: Therapist[];
  message?: string;
}

export default function OnlineTherapistScreen() {
  const router = useRouter();
  const [therapists, setTherapists] = useState<Therapist[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [isGuest, setIsGuest] = useState<boolean>(false);

  // Check if user is guest
  useEffect(() => {
    const checkGuestStatus = async () => {
      try {
        const userMode = await AsyncStorage.getItem('user_mode');
        setIsGuest(userMode === 'guest');
      } catch (error) {
        console.error('Error checking guest status:', error);
      }
    };
    
    checkGuestStatus();
  }, []);

  // Fetch online therapists
  const fetchOnlineTherapists = useCallback(async () => {
    try {
      setLoading(true);

      // Make API request to fetch only online therapists
      const response = await axios.get<ApiResponse>(
        `${API_BASE_URL}/api/therapists/online`,
        {
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
        }
      );

      if (response.data.success) {
        // Process therapist data to include full image URLs
        const processedTherapists = response.data.data.map((therapist: Therapist) => ({
          ...therapist,
          image: therapist.image || therapist.profile_photo_path 
            ? `${API_BASE_URL}/storage/${therapist.image || therapist.profile_photo_path}`
            : null,
        }));

        setTherapists(processedTherapists);
      } else {
        Alert.alert('Error', response.data.message || 'Failed to fetch therapists');
      }
    } catch (error) {
      console.error('Error fetching online therapists:', error);
      Alert.alert('Error', 'Failed to load online therapists. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchOnlineTherapists();
  }, [fetchOnlineTherapists]);

  // Pull to refresh
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchOnlineTherapists();
  }, [fetchOnlineTherapists]);

  // Handle therapist selection
  const handleTherapistPress = (therapist: Therapist) => {
    if (isGuest) {
      Alert.alert(
        'Login Required',
        'Please login to start a session with a therapist',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Login', onPress: () => router.push('/(auth)/LoginScreen') }
        ]
      );
      return;
    }

    // Navigate to therapist detail or session screen
    router.push({
      pathname: '/(screens)/TherapistDetailScreen',
      params: {
        therapistId: therapist.id.toString(),
        therapistData: JSON.stringify(therapist)
      }
    });
  };

  // Start session directly
  const handleStartSession = (therapist: Therapist) => {
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

    Alert.alert(
      'Start Session',
      `Would you like to start a session with ${therapist.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Start Session', 
          onPress: () => {
            // Navigate to video call or session screen
            router.push({
              pathname: '/(screens)/TherapySessionScreen',
              params: {
                therapistId: therapist.id.toString(),
                therapistName: therapist.name
              }
            });
          }
        }
      ]
    );
  };

  // Calculate years of experience
  const getYearsOfExperience = (workStartDate?: string) => {
    if (!workStartDate) return 'New';
    
    const startDate = new Date(workStartDate);
    const currentDate = new Date();
    const years = currentDate.getFullYear() - startDate.getFullYear();
    
    return years > 0 ? `${years} years` : 'Less than 1 year';
  };

  // Render therapist item
  const renderTherapistItem = ({ item }: { item: Therapist }) => (
    <TouchableOpacity
      className="bg-white rounded-xl mb-4 overflow-hidden shadow-sm border border-gray-100"
      onPress={() => handleTherapistPress(item)}
    >
      <View className="p-4">
        <View className="flex-row items-start">
          {/* Therapist Image */}
          <View className="mr-4">
            {item.image ? (
              <Image
                source={{ uri: item.image }}
                className="w-16 h-16 rounded-full"
                resizeMode="cover"
              />
            ) : (
              <View className="w-16 h-16 rounded-full bg-gray-200 justify-center items-center">
                <Feather name="user" size={28} color="#9A563A" />
              </View>
            )}
            
            {/* Online status indicator */}
            <View className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white justify-center items-center">
              <View className="w-2 h-2 bg-white rounded-full" />
            </View>
          </View>

          {/* Therapist Info */}
          <View className="flex-1">
            <Text className="text-lg font-bold text-black mb-1">{item.name}</Text>
            
            {item.bio && (
              <Text className="text-sm text-gray-600 mb-2" numberOfLines={2}>
                {item.bio}
              </Text>
            )}
            
            <View className="flex-row items-center mb-2">
              <MaterialIcons name="work-outline" size={14} color="#9A563A" />
              <Text className="text-xs text-gray-500 ml-1">
                Experience: {getYearsOfExperience(item.work_start_date)}
              </Text>
            </View>

            <View className="flex-row items-center">
              <View className="w-2 h-2 bg-green-500 rounded-full mr-2" />
              <Text className="text-sm text-green-600 font-medium">Available Now</Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View className="flex-row mt-4 space-x-3">
          <TouchableOpacity
            className="flex-1 py-4 px-5 rounded-lg flex-row items-center justify-center m-1"
            style={{ backgroundColor: '#9A563A' }}
            onPress={() => handleStartSession(item)}
          >
            <MaterialIcons name="video-call" size={18} color="white" />
            <Text className="text-white font-bold ml-2">Start Session</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            className="flex-1 py-4 px-5 rounded-lg flex-row items-center justify-center m-1"
            style={{ borderColor: '#9A563A', borderWidth: 1 }}
            onPress={() => handleTherapistPress(item)}
          >
            <MaterialIcons name="info-outline" size={18} color="#9A563A" />
            <Text className="font-bold ml-2" style={{ color: '#9A563A' }}>View Profile</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  // Empty state
  const renderEmptyState = () => {
    if (loading) return null;

    return (
      <View className="flex-1 justify-center items-center py-10">
        <MaterialIcons name="person-off" size={64} color="#9A563A" />
        <Text className="text-lg font-bold mt-4 text-center">
          No Online Therapists
        </Text>
        <Text className="text-gray-500 text-center mt-2 px-10">
          There are currently no therapists available online. Please check back later.
        </Text>
        <TouchableOpacity
          className="bg-primary py-3 px-6 rounded-full mt-6 flex-row items-center"
          onPress={fetchOnlineTherapists}
        >
          <Feather name="refresh-cw" size={18} color="white" />
          <Text className="text-white font-bold ml-2">Refresh</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-[#FAFAFA]">
      {/* Header */}
      <View className="flex-row items-center px-4 py-3 bg-white border-b border-gray-100">
        <TouchableOpacity
          onPress={() => router.back()}
          className="mr-3"
        >
          <MaterialIcons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        
        <View className="flex-1">
          <Text className="text-xl font-bold text-black">Online Therapists</Text>
          <Text className="text-sm text-gray-500">
            {therapists.length} therapist{therapists.length !== 1 ? 's' : ''} available
          </Text>
        </View>
        
        <View className="flex-row items-center">
          <View className="w-2 h-2 bg-green-500 rounded-full mr-2" />
          <Text className="text-sm text-green-600 font-medium">Live</Text>
        </View>
      </View>

      {/* Content */}
      {loading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#9A563A" />
          <Text className="mt-2 text-gray-500">Loading online therapists...</Text>
        </View>
      ) : (
        <FlatList
          data={therapists}
          renderItem={renderTherapistItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={{ padding: 16, flexGrow: 1 }}
          ListEmptyComponent={renderEmptyState}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={["#9A563A"]}
              tintColor="#9A563A"
            />
          }
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Guest banner */}
      {isGuest && (
        <View className="p-4 m-4 rounded-xl" style={{ backgroundColor: '#9A563A' }}>
          <Text className="text-white font-bold text-center mb-2">
            Join to Connect with Therapists
          </Text>
          <Text className="text-white text-sm text-center mb-3">
            Create an account to start online therapy sessions
          </Text>
          <TouchableOpacity
            className="bg-white py-2 px-4 rounded-lg"
            onPress={() => router.push('/(auth)/LoginScreen')}
          >
            <Text className="font-bold text-center" style={{ color: '#9A563A' }}>Get Started</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}