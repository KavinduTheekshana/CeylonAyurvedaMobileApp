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
import { useLocation } from '../contexts/LocationContext';
import { getTherapistDisplayName } from '../utils/therapistUtils'; 

interface Therapist {
  id: number;
  name: string;
   nickname?: string;
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
  count?: number;
}

export default function OnlineTherapistScreen() {
  const router = useRouter();
  const { selectedLocation } = useLocation();
  const [therapists, setTherapists] = useState<Therapist[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [isGuest, setIsGuest] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

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
      setError(null);

      // Build API URL with location parameter if location is selected
      let apiUrl = `${API_BASE_URL}/api/therapists/online`;

      if (selectedLocation) {
        apiUrl += `?location_id=${selectedLocation.id}`;
        console.log(`Filtering online therapists by location: ${selectedLocation.name} (ID: ${selectedLocation.id})`);
      }

      console.log(`API URL: ${apiUrl}`);

      // Make API request to fetch only online therapists
      const response = await axios.get<ApiResponse>(
        apiUrl,
        {
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
        }
      );

      console.log('API Response:', response.data);

      if (response.data.success) {
        // Process therapist data to include full image URLs
        const processedTherapists = response.data.data.map((therapist: Therapist) => ({
          ...therapist,
          image: therapist.image || therapist.profile_photo_path 
            ? `${API_BASE_URL}/storage/${therapist.image || therapist.profile_photo_path}`
            : null,
        }));

        setTherapists(processedTherapists);
        console.log('Online therapists loaded successfully:', processedTherapists.length);

        if (processedTherapists.length === 0 && selectedLocation) {
          console.log(`No online therapists found for location: ${selectedLocation.name}`);
        }
      } else {
        // Handle API error response
        const errorMessage = response.data.message || 'Failed to fetch online therapists';
        setError(errorMessage);
        console.error('API Error:', errorMessage);
      }
    } catch (error: any) {
      console.error('Error fetching online therapists:', error);
      
      // Handle different types of errors
      if (error.response) {
        // Server responded with error status
        const serverMessage = error.response.data?.message || 'Server error occurred';
        setError(`Unable to load online therapists: ${serverMessage}`);
      } else if (error.request) {
        // Request was made but no response received
        setError('Unable to connect to server. Please check your internet connection.');
      } else {
        // Something else happened
        setError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedLocation]);

  // Initial load and location dependency
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
      pathname: '/(screens)/TherapistDetailsScreen',
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

    // Navigate directly to therapist services screen
    router.push({
      pathname: '/(screens)/TherapistServicesScreen',
      params: {
        therapistId: therapist.id.toString(),
        therapistName: therapist.name
      }
    });
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
             <Text className="text-lg font-bold text-black mb-1">
                {getTherapistDisplayName(item)}
              </Text>
            
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

  // Empty state component
  const renderEmptyState = () => {
    if (loading) return null;

    return (
      <View className="flex-1 justify-center items-center py-10">
        <MaterialIcons name="person-off" size={64} color="#9A563A" />
        <Text className="text-xl font-bold mt-4 text-center text-gray-800">
          No Online Therapists Available
        </Text>
        <Text className="text-base text-gray-500 text-center mt-2 px-6 leading-6">
          {selectedLocation
            ? `There are currently no therapists available online in ${selectedLocation.name}. They may be offline or serving other clients.`
            : "There are currently no therapists available online at this time."
          }
        </Text>
        <Text className="text-sm text-gray-500 text-center mt-3 px-6">
          Try refreshing or consider booking a regular appointment instead.
        </Text>
        <TouchableOpacity
          className="py-3.5 px-6 rounded-xl mt-6 flex-row items-center"
          style={{ backgroundColor: '#9A563A' }}
          onPress={fetchOnlineTherapists}
        >
          <Feather name="refresh-cw" size={18} color="white" />
          <Text className="text-white font-semibold ml-2">Refresh</Text>
        </TouchableOpacity>
      </View>
    );
  };

  // Error state component
  const renderErrorState = () => {
    return (
      <View className="flex-1 justify-center items-center py-10">
        <MaterialIcons name="error-outline" size={64} color="#DC2626" />
        <Text className="text-xl font-bold mt-4 text-center text-red-600">
          Oops! Something went wrong
        </Text>
        <Text className="text-base text-gray-500 text-center mt-2 px-6 leading-6">
          {error}
        </Text>
        <TouchableOpacity
          className="py-3.5 px-6 rounded-xl mt-6 flex-row items-center"
          style={{ backgroundColor: '#9A563A' }}
          onPress={fetchOnlineTherapists}
        >
          <Feather name="refresh-cw" size={18} color="white" />
          <Text className="text-white font-semibold ml-2">Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-[#FAFAFA]">
      {/* Content */}
      {loading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#9A563A" />
          <Text className="mt-2 text-base text-gray-500">Loading online therapists...</Text>
          {selectedLocation && (
            <Text className="mt-1 text-sm text-gray-400">
              Searching in {selectedLocation.name}
            </Text>
          )}
        </View>
      ) : error ? (
        renderErrorState()
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
      {isGuest && !loading && (
        <View className="p-4 m-4 rounded-xl" style={{ backgroundColor: '#9A563A' }}>
          <Text className="text-white font-bold text-center mb-2">
            Join to Connect with Therapists
          </Text>
          <Text className="text-white text-sm text-center mb-3">
            Create an account to start online therapy sessions
          </Text>
          <TouchableOpacity
            className="bg-white py-2.5 px-4 rounded-lg"
            onPress={() => router.push('/(auth)/LoginScreen')}
          >
            <Text className="font-bold text-center" style={{ color: '#9A563A' }}>Get Started</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}