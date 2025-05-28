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

// Define API endpoint
const API_URL = `${API_BASE_URL}/api/treatments`;

// Define the TypeScript interface for the Treatment object
interface Treatment {
  id: number;
  name: string;
  image: string | null;
  description: string;
  offers: number; // Changed from boolean to number since API returns 1/0
}

const TreatmentsScreen = () => {
  const [treatments, setTreatments] = useState<Treatment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [isGuest, setIsGuest] = useState<boolean>(false);
  const [showGuestNotification, setShowGuestNotification] = useState<boolean>(false);
  const router = useRouter();

  // Check if user is a guest and show notification
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
    fetch(API_URL)
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
  }, []);

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
      
      <Text className="w-full text-3xl pb-3 text-black font-bold">
        Treatments
      </Text>
      
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
            
            {/* Fixed condition: Check for 1 instead of true */}
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