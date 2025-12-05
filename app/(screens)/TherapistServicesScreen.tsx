// app/(screens)/TherapistServicesScreen.tsx

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
  FlatList,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MaterialIcons, Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '@/config/api';
import { useLocation } from '../contexts/LocationContext';
import { useNavigation } from '@react-navigation/native';
import { HeaderBackButton } from '@react-navigation/elements';

interface Service {
  id: number;
  title: string;
  subtitle?: string;
  description?: string;
  benefits?: string;
  image?: string;
  duration: number;
  price: string;
  discount_price?: string;
  has_discount: boolean;
  is_free_service: boolean;
  offer: boolean;
  treatment: {
    id: number;
    name: string;
    image?: string;
  };
  is_available: boolean;
  availability_message?: string;
}

interface TherapistInfo {
  id: number;
  name: string;
  nickname?: string;
  email: string;
  phone: string;
  image?: string;
  bio?: string;
  work_start_date?: string;
  online_status: boolean;
}

export default function TherapistServicesScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const { therapistId, therapistName } = useLocalSearchParams();
  const { selectedLocation } = useLocation();

  const [services, setServices] = useState<Service[]>([]);
  const [therapist, setTherapist] = useState<TherapistInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isGuest, setIsGuest] = useState(false);

  // Set up header with back button
  useEffect(() => {
    (navigation as any).setOptions({
      title: 'Therapist Services',
      headerLeft: () => (
        <HeaderBackButton
          onPress={() => {
            if (navigation.canGoBack()) {
              navigation.goBack();
            } else {
              router.back();
            }
          }}
          tintColor="#000"
        />
      ),
    });
  }, [navigation, router]);

  useEffect(() => {
    checkGuestStatus();
    fetchTherapistServices();
  }, [therapistId, selectedLocation]);

  const checkGuestStatus = async () => {
    try {
      const userMode = await AsyncStorage.getItem('user_mode');
      setIsGuest(userMode === 'guest');
    } catch (error) {
      console.error('Error checking guest status:', error);
    }
  };

  const fetchTherapistServices = async () => {
    try {
      setLoading(true);
      setError(null);

      // Build API URL
      let apiUrl = `${API_BASE_URL}/api/therapists/${therapistId}/services`;
      if (selectedLocation) {
        apiUrl += `?location_id=${selectedLocation.id}`;
      }

      const response = await fetch(apiUrl);
      const data = await response.json();

      if (data.success) {
        setServices(data.data.services);
        setTherapist(data.data.therapist);
      } else {
        throw new Error(data.message || 'Failed to fetch services');
      }
    } catch (error) {
      console.error('Error fetching therapist services:', error);
      setError('Failed to load services. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleServiceSelect = (service: Service) => {
    if (isGuest) {
      Alert.alert(
        'Login Required',
        'Please login to book a service',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Login', onPress: () => router.push('/(auth)/LoginScreen') }
        ]
      );
      return;
    }

    if (!service.is_available) {
      Alert.alert(
        'Service Not Available',
        service.availability_message || 'This service is not available yet',
        [{ text: 'OK' }]
      );
      return;
    }

    // Navigate to the existing BookingDateScreen with therapist info
    // This uses your EXISTING flow, just with pre-selected therapist
    router.push({
      pathname: '/(screens)/BookingDateScreen',
      params: {
        serviceId: service.id.toString(),
        serviceName: service.title,
        duration: service.duration.toString(),
        therapistId: therapistId.toString(),
        therapistName: therapistName || therapist?.name || '',
        // Pass work start date if available
        therapistWorkStartDate: therapist?.work_start_date
      }
    });
  };

  const formatPrice = (price: string, discountPrice?: string) => {
    const numPrice = parseFloat(price);
    const numDiscountPrice = discountPrice ? parseFloat(discountPrice) : null;

    if (numDiscountPrice !== null && numDiscountPrice === 0) {
      return 'FREE';
    }

    if (numDiscountPrice !== null && numDiscountPrice < numPrice) {
      return `£${numDiscountPrice}`;
    }

    return `£${numPrice}`;
  };

  const renderService = ({ item }: { item: Service }) => {
    const price = formatPrice(item.price, item.discount_price);
    const originalPrice = item.has_discount ? `£${parseFloat(item.price)}` : null;

    return (
      <TouchableOpacity
        className={`bg-white rounded-2xl p-4 mb-4${!item.is_available ? ' opacity-60' : ''}`}
        style={{
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 4,
        }}
        onPress={() => handleServiceSelect(item)}
        disabled={!item.is_available}
      >
        <View className="flex-row">
          {/* Service Image */}
          {item.image ? (
            <Image
              source={{ uri: item.image }}
              className="w-24 h-24 rounded-xl mr-3"
              resizeMode="cover"
            />
          ) : (
            <View className="w-24 h-24 rounded-xl bg-gray-200 mr-3 justify-center items-center">
              <Feather name="image" size={30} color="#9A563A" />
            </View>
          )}

          {/* Service Details */}
          <View className="flex-1">
            <Text className="text-lg font-bold text-gray-800 mb-1">{item.title}</Text>
            {item.subtitle && (
              <Text className="text-sm text-gray-600 mb-2">{item.subtitle}</Text>
            )}

            {/* Duration and Price */}
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center">
                <MaterialIcons name="timer" size={16} color="#9A563A" />
                <Text className="text-sm text-gray-600 ml-1">{item.duration} mins</Text>
              </View>

              <View className="flex-row items-center">
                {originalPrice && (
                  <Text className="text-sm text-gray-400 line-through mr-2">{originalPrice}</Text>
                )}
                <Text className={`text-lg font-bold${
                  item.is_free_service ? ' text-green-600' : ' text-[#9A563A]'
                }`}>
                  {price}
                </Text>
              </View>
            </View>

            {/* Treatment Category */}
            <View className="mt-2 flex-row items-center">
              <Text className="text-xs text-gray-500">Category: </Text>
              <Text className="text-xs text-[#9A563A] font-medium">{item.treatment.name}</Text>
            </View>

            {/* Availability Warning */}
            {!item.is_available && item.availability_message && (
              <View className="mt-2 bg-yellow-100 px-2 py-1 rounded">
                <Text className="text-xs text-yellow-800">{item.availability_message}</Text>
              </View>
            )}

            {/* Special Offers */}
            {item.offer && item.is_available && (
              <View className="mt-2 bg-red-100 px-2 py-1 rounded self-start">
                <Text className="text-xs text-red-600 font-semibold">Special Offer</Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 justify-center items-center">
        <ActivityIndicator size="large" color="#9A563A" />
        <Text className="mt-2 text-gray-600">Loading services...</Text>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 justify-center items-center px-4">
        <MaterialIcons name="error-outline" size={64} color="#DC2626" />
        <Text className="text-xl font-bold text-red-600 mt-4 mb-2">Error</Text>
        <Text className="text-gray-600 text-center mb-6">{error}</Text>
        <TouchableOpacity
          className="bg-[#9A563A] py-3 px-6 rounded-xl"
          onPress={fetchTherapistServices}
        >
          <Text className="text-white font-semibold">Try Again</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">

      {/* Therapist Info Card */}
      {therapist && (
        <View className="bg-white mx-4 mt-4 p-4 rounded-xl shadow-sm">
          <View className="flex-row items-center">
            {therapist.image ? (
              <Image
                source={{ uri: therapist.image }}
                className="w-16 h-16 rounded-full mr-3"
                resizeMode="cover"
              />
            ) : (
              <View className="w-16 h-16 rounded-full bg-gray-200 mr-3 justify-center items-center">
                <Feather name="user" size={24} color="#9A563A" />
              </View>
            )}
            <View className="flex-1">
              <Text className="text-lg font-bold text-gray-800">{therapist.name}</Text>
              <Text className="text-sm text-gray-600">{therapist.email}</Text>
              {therapist.online_status && (
                <View className="flex-row items-center mt-1">
                  <View className="w-2 h-2 bg-green-500 rounded-full mr-1" />
                  <Text className="text-xs text-green-600">Available Now</Text>
                </View>
              )}
            </View>
          </View>
        </View>
      )}

      {/* Services List */}
      <FlatList
        data={services}
        renderItem={renderService}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={{ padding: 16, paddingTop: 8 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View className="flex-1 justify-center items-center py-20">
            <Feather name="inbox" size={64} color="#D1D5DB" />
            <Text className="text-gray-500 text-lg mt-4">No services available</Text>
            <Text className="text-gray-400 text-sm mt-2 text-center">
              This therapist doesn't have any services assigned yet
            </Text>
          </View>
        }
      />

      {/* Guest Banner */}
      {isGuest && services.length > 0 && (
        <View className="bg-[#F3F0EC] px-4 py-3 border-t border-gray-200">
          <Text className="text-center text-[#9A563A] text-sm">
            Login to book services with {therapist?.name || 'this therapist'}
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
}