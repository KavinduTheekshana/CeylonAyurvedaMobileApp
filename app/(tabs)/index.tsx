import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  Image,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
} from "react-native";
import { useRouter } from "expo-router";
import { API_BASE_URL } from "@/config/api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import GuestNotification from "../components/GuestNotification";
import OffersBadge from "../components/OffersBadge";
import LocationSwitcher from "../components/LocationSwitcher";
import { useLocation } from "../contexts/LocationContext";
import { MaterialIcons } from "@expo/vector-icons";

// Define API endpoint
const API_URL = `${API_BASE_URL}/api/treatments`;

interface Treatment {
  id: number;
  name: string;
  image: string | null;
  description: string;
  offers: number;
}

const TreatmentsScreen = () => {
  const [treatments, setTreatments] = useState<Treatment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [isGuest, setIsGuest] = useState<boolean>(false);
  const [showGuestNotification, setShowGuestNotification] = useState<boolean>(false);
  const router = useRouter();
  const { selectedLocation } = useLocation();

  useEffect(() => {
    const checkGuestStatus = async () => {
      try {
        const userMode = await AsyncStorage.getItem('user_mode');
        const notificationShown = await AsyncStorage.getItem('guest_notification_shown');
        
        if (userMode === 'guest' && notificationShown !== 'true') {
          setIsGuest(true);
          setShowGuestNotification(true);
          await AsyncStorage.setItem('guest_notification_shown', 'true');
        }
      } catch (error) {
        console.error('Error checking guest status:', error);
      }
    };
    
    checkGuestStatus();
  }, []);

  const fetchTreatments = useCallback(() => {
    // Filter treatments by location if location is selected
    const url = selectedLocation 
        ? `${API_URL}?location_id=${selectedLocation.id}`
        : API_URL;
        
    fetch(url)
        .then((response) => response.json())
        .then((data) => {
          if (data.success && Array.isArray(data.data)) {
            const updatedData = data.data.map((item: Treatment) => ({
              ...item,
              image: item.image ? `${API_BASE_URL}/storage/${item.image}` : null,
            }));
            setTreatments(updatedData);
          }
        })
        .catch((error) => console.error("Error fetching treatments:", error))
        .finally(() => {
          setLoading(false);
          setRefreshing(false);
        });
  }, [selectedLocation]);

  useEffect(() => {
    fetchTreatments();
  }, [fetchTreatments]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchTreatments();
  }, [fetchTreatments]);

  const handleLogin = () => {
    router.push('/(auth)/LoginScreen');
  };

  const handleDismissNotification = () => {
    setShowGuestNotification(false);
  };

  const handleOnlineTherapistPress = () => {
    router.push('/(screens)/OnlineTherapistScreen');
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-100">
        <ActivityIndicator size="large" color="#9A563A" />
      </View>
    );
  }

  return (
    <View className="flex-1 p-4 mb-20 bg-gray-100">
      <GuestNotification
        visible={showGuestNotification}
        onLogin={handleLogin}
        onDismiss={handleDismissNotification}
        message="Login or create an account to book appointments"
      />
      
      {/* Location Switcher */}
      <LocationSwitcher />
      
      <Text className="w-full text-3xl pb-3 text-black font-bold">
        Treatments
      </Text>

      {/* Online Therapist Card */}
      <TouchableOpacity
        className="rounded-[14px] mb-4 p-4 shadow-lg flex-row items-center"
        style={{
          backgroundColor: '#9A563A', // Your primary color
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.25,
          shadowRadius: 3.84,
          elevation: 5,
        }}
        onPress={handleOnlineTherapistPress}
      >
        <View className="flex-1">
          <View className="flex-row items-center mb-2">
            <MaterialIcons name="video-call" size={24} color="white" />
            <Text className="text-white text-lg font-bold ml-2">
              Online Therapist
            </Text>
          </View>
          <Text className="text-white text-sm opacity-90">
            Connect with certified therapists online
          </Text>
          <View className="flex-row items-center mt-2">
            <View className="w-2 h-2 bg-green-400 rounded-full mr-2" />
            <Text className="text-white text-xs">Available Now</Text>
          </View>
        </View>
        <MaterialIcons name="arrow-forward-ios" size={20} color="white" />
      </TouchableOpacity>
      
      <FlatList
        data={treatments}
        keyExtractor={(item) => `treatment-${item.id}`}
        numColumns={2}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 20 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#9A563A"]}
            tintColor="#9A563A"
          />
        }
        renderItem={({ item, index }) => (
          <TouchableOpacity
            key={`treatment-item-${item.id}`}
            onPress={() =>
              router.push({
                pathname: "/(screens)/[id]",
                params: {
                  id: item.id.toString(),
                  treatmentId: item.id.toString(),
                  treatmentName: item.name
                },
              })
            }
            className="bg-white rounded-[14px] mb-4 w-[48%] shadow-sm m-1 relative"
          >
            {item.image && (
              <Image
                source={{ uri: item.image }}
                className="w-full h-[120px] rounded-t-[14px]"
                resizeMode="cover"
              />
            )}
            
            {item.offers === 1 && (
              <OffersBadge 
                size="small" 
                position="topRight"
                color="#FF6B6B"
                text="Offers Available"
              />
            )}
            
            <View className="pt-3 pb-3">
              <Text className="text-base font-bold text-center text-black">
                {item.name}
              </Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
};

export default TreatmentsScreen;