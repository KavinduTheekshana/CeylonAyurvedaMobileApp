// app/(investment)/details.tsx - Updated with NativeWind
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Image,
  FlatList,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Feather, MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '@/config/api';

interface Therapist {
  id: number;
  name: string;
  email: string;
  phone: string;
  image: string | null;
  bio: string;
  work_start_date: string;
  status: boolean;
}

interface LocationData {
  id: number;
  name: string;
  city: string;
  address: string;
  image: string | null;
  description: string | null;
  franchisee_name: string | null;
  franchisee_email: string | null;
  franchisee_phone: string | null;
  franchisee_photo: string | null;
  franchisee_activate_date: string | null;
  total_invested: number;
  investment_limit: number;
  total_investors: number;
  is_open_for_investment: boolean;
  remaining_amount: number;
  progress_percentage: number;
  therapists: Therapist[];
}

const LocationDetailsScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams();

  // States for API data
  const [locationData, setLocationData] = useState<LocationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get locationId from params (can come from different sources)
  const locationId = params.locationId || params.id;

  useEffect(() => {
    if (locationId) {
      loadLocationDetails();
    } else {
      // Try to parse from locationData param as fallback
      try {
        const parsedData = JSON.parse(params.locationData as string);
        setLocationData(parsedData);
        setLoading(false);
      } catch (error) {
        setError('No location ID provided');
        setLoading(false);
      }
    }
  }, [locationId, params.locationData]);

  const loadLocationDetails = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log(`Fetching location details for ID: ${locationId}`);

      // Get auth token
      const token = await AsyncStorage.getItem('access_token');

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      };

      // Add auth header if token exists
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      console.log("LOCATIONID", locationId);
      // Call the opportunities API endpoint
      const response = await fetch(`${API_BASE_URL}/api/opportunities/${locationId}`, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.success && data.data) {
        // Process the API response data
        const processedData: LocationData = {
          id: data.data.id,
          name: data.data.name,
          city: data.data.city,
          address: data.data.address,
          image: data.data.image && data.data.image.startsWith('http')
            ? data.data.image
            : data.data.image
              ? `${API_BASE_URL}/storage/${data.data.image}`
              : null,
          description: data.data.description,
          franchisee_name: data.data.franchisee_name,
          franchisee_email: data.data.franchisee_email,
          franchisee_phone: data.data.franchisee_phone,
          franchisee_photo: data.data.franchisee_photo
            ? (data.data.franchisee_photo.startsWith('http')
              ? data.data.franchisee_photo
              : `${API_BASE_URL}/storage/${data.data.franchisee_photo}`)
            : null,
          franchisee_activate_date: data.data.franchisee_activate_date,
          total_invested: parseFloat(data.data.total_invested || '0'),
          investment_limit: parseFloat(data.data.investment_limit || '10000'),
          total_investors: parseInt(data.data.total_investors || '0'),
          is_open_for_investment: data.data.is_open_for_investment !== false,
          remaining_amount: parseFloat(data.data.remaining_amount || '0'),
          progress_percentage: parseFloat(data.data.progress_percentage || '0'),
          therapists: data.data.therapists?.map((therapist: any) => ({
            id: therapist.id,
            name: therapist.name,
            email: therapist.email,
            phone: therapist.phone,
            image: therapist.image
              ? (therapist.image.startsWith('http')
                ? therapist.image
                : `${API_BASE_URL}/storage/${therapist.image}`)
              : null,
            bio: therapist.bio,
            work_start_date: therapist.work_start_date,
            status: therapist.status,
          })) || [],
        };

        setLocationData(processedData);
      } else {
        throw new Error(data.message || 'Failed to load location details');
      }

    } catch (error: any) {
      console.error('Error loading location details:', error);
      setError(error.message || 'Failed to load location details');
      Alert.alert('Error', 'Failed to load location details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const handleInvestNow = () => {
    if (!locationData) return;

    // Navigate to investment screen
    router.push({
      pathname: `/(investment)/[locationId]`,
      params: {
        locationId: locationData.id.toString(),
        locationName: locationData.name
      }
    });
  };

  const renderTherapistCard = ({ item }: { item: Therapist }) => (
    <View className="flex-row bg-gray-50 rounded-xl p-4 mb-3">
      <View className="relative mr-4">
        {item.image ? (
          <Image
            source={{ uri: item.image }}
            className="w-20 h-20 rounded-full"
            resizeMode="cover"
          />
        ) : (
          <View className="w-20 h-20 rounded-full bg-gray-200 justify-center items-center">
            <MaterialIcons name="person" size={32} color="#9A563A" />
          </View>
        )}
        <View 
          className={`absolute bottom-1 right-1 w-4 h-4 rounded-full border-2 border-white ${
            item.status ? 'bg-green-500' : 'bg-red-500'
          }`}
        />
      </View>
      <View className="flex-1">
        <Text className="text-lg font-bold text-gray-800 mb-2">{item.name}</Text>
        <View className="flex-row items-center mb-1">
          <MaterialIcons name="phone" size={16} color="#6B7280" />
          <Text className="text-sm text-gray-600 ml-1.5">{item.phone}</Text>
        </View>
        <View className="flex-row items-center mb-1">
          <MaterialIcons name="email" size={16} color="#6B7280" />
          <Text className="text-sm text-gray-600 ml-1.5">{item.email}</Text>
        </View>
        <View className="flex-row items-center mb-1">
          <MaterialIcons name="calendar-today" size={16} color="#6B7280" />
          <Text className="text-sm text-gray-600 ml-1.5">
            Started: {formatDate(item.work_start_date)}
          </Text>
        </View>
        {item.bio && (
          <Text className="text-sm text-gray-600 leading-5 mt-2 italic" numberOfLines={3}>
            {item.bio}
          </Text>
        )}
      </View>
    </View>
  );

  // Loading state
  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <View className="flex-row items-center justify-between px-4 py-4 border-b border-gray-200">
          <TouchableOpacity
            className="p-2"
            onPress={() => router.back()}
          >
            <Feather name="arrow-left" size={24} color="#000" />
          </TouchableOpacity>
          <Text className="text-lg font-bold text-gray-800">Loading...</Text>
          <View className="w-10" />
        </View>
        <View className="flex-1 justify-center items-center px-8">
          <ActivityIndicator size="large" color="#9A563A" />
          <Text className="mt-4 text-base text-gray-600">Loading location details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Error state
  if (error || !locationData) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <View className="flex-row items-center justify-between px-4 py-4 border-b border-gray-200">
          <TouchableOpacity
            className="p-2"
            onPress={() => router.back()}
          >
            <Feather name="arrow-left" size={24} color="#000" />
          </TouchableOpacity>
          <Text className="text-lg font-bold text-gray-800">Error</Text>
          <View className="w-10" />
        </View>
        <View className="flex-1 justify-center items-center px-8">
          <MaterialIcons name="error-outline" size={64} color="#DC2626" />
          <Text className="text-xl font-bold text-red-600 mt-4 mb-2">Failed to Load Details</Text>
          <Text className="text-base text-gray-600 text-center leading-6 mb-6">
            {error || 'Unknown error occurred'}
          </Text>
          <TouchableOpacity
            className="bg-[#9A563A] px-6 py-3 rounded-lg"
            onPress={loadLocationDetails}
          >
            <Text className="text-white text-base font-semibold">Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-4 border-b border-gray-200">
        <TouchableOpacity
          className="p-2"
          onPress={() => router.back()}
        >
          <Feather name="arrow-left" size={24} color="#000" />
        </TouchableOpacity>
        <Text className="text-lg font-bold text-gray-800 flex-1 text-center mx-4" numberOfLines={1}>
          {locationData.name}
        </Text>
        <View className="w-10" />
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Location Image */}
        {locationData.image && (
          <View className="h-64 relative">
            <Image
              source={{ uri: locationData.image }}
              className="w-full h-full"
              resizeMode="cover"
            />
            {/* Status Overlay */}
            <View className="absolute top-4 right-4">
              <View className={`px-3 py-1.5 rounded-lg ${
                locationData.is_open_for_investment ? 'bg-green-500' : 'bg-red-500'
              }`}>
                <Text className="text-white text-sm font-semibold">
                  {locationData.is_open_for_investment ? 'Open for Investment' : 'Investment Closed'}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Basic Information */}
        <View className="bg-white mt-2 px-5 py-5">
          <Text className="text-xl font-bold text-gray-800 mb-4">Location Information</Text>
          <View className="bg-gray-50 rounded-xl p-4">
            <View className="flex-row mb-3 items-start">
              <Text className="text-sm font-semibold text-gray-600 w-24 flex-shrink-0">Name:</Text>
              <Text className="text-sm text-gray-800 flex-1 leading-5">{locationData.name}</Text>
            </View>
            <View className="flex-row mb-3 items-start">
              <Text className="text-sm font-semibold text-gray-600 w-24 flex-shrink-0">Address:</Text>
              <Text className="text-sm text-gray-800 flex-1 leading-5">{locationData.address}</Text>
            </View>
            <View className="flex-row mb-3 items-start">
              <Text className="text-sm font-semibold text-gray-600 w-24 flex-shrink-0">City:</Text>
              <Text className="text-sm text-gray-800 flex-1 leading-5">{locationData.city}</Text>
            </View>
            <View className="flex-row items-start">
              <Text className="text-sm font-semibold text-gray-600 w-24 flex-shrink-0">Phone:</Text>
              <Text className={`text-sm flex-1 leading-5 ${
                locationData.franchisee_phone ? 'text-gray-800' : 'text-gray-400 italic'
              }`}>
                {locationData.franchisee_phone || 'Not available'}
              </Text>
            </View>
          </View>
        </View>

        {/* Franchisee Information */}
        <View className="bg-white mt-2 px-5 py-5">
          <Text className="text-xl font-bold text-gray-800 mb-4">Franchisee</Text>
          <View className="bg-gray-50 rounded-xl p-4">
            <View className="flex-row items-center">
              <View className="mr-4">
                {locationData.franchisee_photo ? (
                  <Image
                    source={{ uri: locationData.franchisee_photo }}
                    className="w-20 h-20 rounded-full"
                    resizeMode="cover"
                  />
                ) : (
                  <View className="w-20 h-20 rounded-full bg-gray-200 justify-center items-center">
                    <MaterialIcons name="person" size={32} color="#9A563A" />
                  </View>
                )}
              </View>
              <View className="flex-1">
                <Text className="text-lg font-bold text-gray-800 mb-1">
                  {locationData.franchisee_name || 'Not available'}
                </Text>
                <Text className="text-sm text-gray-600 mb-0.5">
                  {locationData.franchisee_email || 'Not available'}
                </Text>
                <Text className="text-sm text-gray-600 mb-0.5">
                  {locationData.franchisee_phone || 'Not available'}
                </Text>
                {locationData.franchisee_activate_date && (
                  <Text className="text-xs text-gray-500 mt-1">
                    Activated: {formatDate(locationData.franchisee_activate_date)}
                  </Text>
                )}
              </View>
            </View>
          </View>
        </View>

        {/* Branch Management Section */}
        <View className="bg-white mt-2 px-5 py-5">
          <Text className="text-xl font-bold text-gray-800 mb-4">Branch Management</Text>
          <View className="flex-row flex-wrap justify-between mb-5">
            <View className="w-[48%] items-center bg-gray-50 rounded-xl p-4 mb-3">
              <Text className="text-2xl font-bold text-[#9A563A] mb-1">
                £{locationData.total_invested.toLocaleString()}
              </Text>
              <Text className="text-xs text-gray-600 text-center font-medium">Total Invested</Text>
            </View>
            <View className="w-[48%] items-center bg-gray-50 rounded-xl p-4 mb-3">
              <Text className="text-2xl font-bold text-[#9A563A] mb-1">
                £{locationData.investment_limit.toLocaleString()}
              </Text>
              <Text className="text-xs text-gray-600 text-center font-medium">Investment Limit</Text>
            </View>
            <View className="w-[48%] items-center bg-gray-50 rounded-xl p-4 mb-3">
              <Text className="text-2xl font-bold text-[#9A563A] mb-1">
                {locationData.total_investors}
              </Text>
              <Text className="text-xs text-gray-600 text-center font-medium">Total Investors</Text>
            </View>
            <View className="w-[48%] items-center bg-gray-50 rounded-xl p-4 mb-3">
              <Text className="text-2xl font-bold text-[#9A563A] mb-1">
                {locationData.progress_percentage.toFixed(1)}%
              </Text>
              <Text className="text-xs text-gray-600 text-center font-medium">Progress</Text>
            </View>
          </View>

          {/* Progress Bar */}
          <View className="mt-2">
            <View className="h-2.5 bg-gray-200 rounded-full mb-2">
              <View
                className="h-full bg-[#9A563A] rounded-full"
                style={{ width: `${Math.min(locationData.progress_percentage, 100)}%` }}
              />
            </View>
            <Text className="text-sm text-gray-600 text-center font-medium">
              £{locationData.remaining_amount.toLocaleString()} remaining
            </Text>
          </View>
        </View>

        {/* Description */}
        {locationData.description && (
          <View className="bg-white mt-2 px-5 py-5">
            <Text className="text-xl font-bold text-gray-800 mb-4">Description</Text>
            <View className="bg-gray-50 rounded-xl p-4">
              <Text className="text-base text-gray-700 leading-6">{locationData.description}</Text>
            </View>
          </View>
        )}

        {/* Therapists */}
        {locationData.therapists.length > 0 && (
          <View className="bg-white mt-2 px-5 py-5">
            <Text className="text-xl font-bold text-gray-800 mb-4">
              Therapists ({locationData.therapists.length})
            </Text>
            <FlatList
              data={locationData.therapists}
              renderItem={renderTherapistCard}
              keyExtractor={(item) => item.id.toString()}
              scrollEnabled={false}
              ItemSeparatorComponent={() => <View className="h-2" />}
            />
          </View>
        )}

        {/* Invest Button */}
        {locationData.is_open_for_investment && (
          <View className="bg-white mt-2 px-5 py-5">
            <TouchableOpacity
              className="flex-row items-center justify-center bg-[#9A563A] rounded-xl py-4 px-6"
              onPress={handleInvestNow}
            >
              <Text className="text-lg font-bold text-white mr-2">Invest Now</Text>
              <Feather name="arrow-right" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        )}

        {/* Bottom Spacing */}
        <View className="h-5" />
      </ScrollView>
    </SafeAreaView>
  );
};

export default LocationDetailsScreen;