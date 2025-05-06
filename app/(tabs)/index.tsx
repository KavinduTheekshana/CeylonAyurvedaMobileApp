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

// Define API endpoint
const API_URL = `${API_BASE_URL}/api/treatments`;

// Define the TypeScript interface for the Treatment object
interface Treatment {
  id: number;
  name: string;
  image: string | null;
  description: string;
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
      const userMode = await AsyncStorage.getItem('user_mode');
      const notificationShown = await AsyncStorage.getItem('guest_notification_shown');
      
      if (userMode === 'guest' && notificationShown !== 'true') {
        setIsGuest(true);
        setShowGuestNotification(true);
        // Mark notification as shown to avoid showing it again
        await AsyncStorage.setItem('guest_notification_shown', 'true');
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
              image: item.image
                  ? `${API_BASE_URL}/storage/${item.image}`
                  : null,
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
        <ActivityIndicator
            size="large"
            color="#9A563A"
            className="flex-1 justify-center items-center"
        />
    );
  }

  return (
      <View className="flex-1 p-4 mb-20 bg-gray-100">
        {/* Guest Notification */}
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
            keyExtractor={(item) => item.id.toString()}
            numColumns={2}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 20 }}
            refreshControl={
              <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  colors={["#9A563A"]} // Android
                  tintColor="#9A563A" // iOS
              />
            }
            renderItem={({ item }) => (
                <TouchableOpacity
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
                    className="bg-white rounded-[14px] overflow-hidden mb-4 w-[48%] shadow-sm m-1"
                >
                  {item.image && (
                      <Image
                          source={{ uri: item.image }}
                          className="w-full h-[120px] rounded-t-md"
                      />
                  )}
                  <Text className="text-base font-bold mt-1 text-center px-2 py-2">
                    {item.name}
                  </Text>
                </TouchableOpacity>
            )}
        />
      </View>
  );
};

export default TreatmentsScreen;