import {
    View,
    Text,
    SafeAreaView,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    RefreshControl,
    Image,
    Alert,
    StyleSheet,
    Dimensions,
    Modal,
  } from "react-native";
  import React, { useState, useEffect, useCallback } from "react";
  import { useRouter } from "expo-router";
  import { SafeAreaProvider } from "react-native-safe-area-context";
  import {
    Feather,
    FontAwesome5,
    MaterialIcons,
    Entypo,
  } from "@expo/vector-icons";
  import axios from "axios";
  import AsyncStorage from "@react-native-async-storage/async-storage";
  import { API_BASE_URL } from "@/config/api";

  // Types
  interface Booking {
    id: number;
    service: {
      id: number;
      name: string;
      price: number;
      image: string | null;
    };
    date: string;
    time: string;
    formatted_date: string;
    formatted_time: string;
    reference: string;
    price: number;
    status: string;
    can_cancel: boolean;
    treatment_name?: string;
  }

  interface Pagination {
    total: number;
    count: number;
    per_page: number;
    current_page: number;
    total_pages: number;
  }

  interface BookingsResponse {
    data: Booking[];
    pagination: Pagination;
  }

  export default function MyBookings() {
    const router = useRouter();
    const { width } = Dimensions.get("window");

    // State
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [pagination, setPagination] = useState<Pagination | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [refreshing, setRefreshing] = useState<boolean>(false);
    const [page, setPage] = useState<number>(1);
    const [loadingMore, setLoadingMore] = useState<boolean>(false);
    const [modalVisible, setModalVisible] = useState<boolean>(false);
    const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
    const [cancelLoading, setCancelLoading] = useState<boolean>(false);

    // Fetch bookings
    const fetchBookings = useCallback(
      async (pageNumber = 1, shouldRefresh = false) => {
        try {
          if (shouldRefresh) {
            setRefreshing(true);
          } else if (pageNumber === 1) {
            setLoading(true);
          } else {
            setLoadingMore(true);
          }

          // Get token
          const token = await AsyncStorage.getItem("access_token");

          if (!token) {
            // Handle not logged in
            Alert.alert("Error", "You must be logged in to view bookings");
            router.replace("/(auth)");
            return;
          }

          // Make API request
          const response = await axios.get<BookingsResponse>(
            `${API_BASE_URL}/api/auth/bookings/list?page=${pageNumber}`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
                Accept: "application/json",
              },
            }
          );

          // Update state
          if (shouldRefresh || pageNumber === 1) {
            setBookings(response.data.data);
          } else {
            setBookings((prev) => [...prev, ...response.data.data]);
          }

          setPagination(response.data.pagination);
          setPage(pageNumber);
        } catch (error) {
          console.error("Error fetching bookings:", error);
          Alert.alert("Error", "Failed to load bookings. Please try again.");
        } finally {
          setLoading(false);
          setRefreshing(false);
          setLoadingMore(false);
        }
      },
      [router]
    );

    // Initial load
    useEffect(() => {
      fetchBookings();
    }, [fetchBookings]);

    // Pull to refresh
    const onRefresh = useCallback(() => {
      fetchBookings(1, true);
    }, [fetchBookings]);

    // Load more
    const handleLoadMore = useCallback(() => {
      if (loadingMore) return;
      if (pagination && page < pagination.total_pages) {
        fetchBookings(page + 1);
      }
    }, [pagination, page, loadingMore, fetchBookings]);

    // Cancel booking
    const handleCancelBooking = useCallback(
      async (bookingId: number) => {
        // Close modal if open
        setModalVisible(false);

        Alert.alert(
          "Cancel Booking",
          "Are you sure you want to cancel this booking?",
          [
            {
              text: "No",
              style: "cancel",
            },
            {
              text: "Yes, Cancel",
              style: "destructive",
              onPress: async () => {
                try {
                  // Show cancel loading indicator
                  setCancelLoading(true);

                  const token = await AsyncStorage.getItem("access_token");

                  if (!token) {
                    Alert.alert(
                      "Error",
                      "You must be logged in to cancel bookings"
                    );
                    router.replace("/(auth)");
                    return;
                  }

                  // Use fetch API for better cross-platform compatibility
                  const response = await fetch(
                    `${API_BASE_URL}/api/bookings/${bookingId}/cancel`,
                    {
                      method: "POST",
                      headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                        Accept: "application/json",
                      },
                      body: JSON.stringify({}),
                    }
                  );

                  // Parse the response
                  const data = await response.json();

                  // Check if the cancellation was successful
                  if (data.success) {
                    // Update booking status locally to avoid fetching again
                    setBookings((prev) =>
                      prev.map((booking) =>
                        booking.id === bookingId
                          ? { ...booking, status: "cancelled", can_cancel: false }
                          : booking
                      )
                    );

                    Alert.alert(
                      "Success",
                      "Your booking has been cancelled successfully"
                    );
                  } else {
                    // If the API returns a failure message
                    Alert.alert(
                      "Error",
                      data.message ||
                        "Failed to cancel booking. Please try again."
                    );
                  }
                } catch (error) {
                  // Log the detailed error for debugging
                  console.error("Error cancelling booking:", error);

                  // Extract the error message if possible
                  let errorMessage =
                    "Failed to cancel booking. Please try again.";

                  if (error instanceof Error) {
                    errorMessage = `Error: ${error.message}`;
                  }

                  Alert.alert("Error", errorMessage);
                } finally {
                  // Hide cancel loading indicator
                  setCancelLoading(false);
                }
              },
            },
          ]
        );
      },
      [router]
    );

    // Reschedule booking
    const handleRescheduleBooking = useCallback(
      (bookingId: number) => {
        setModalVisible(false);
        router.push(`/RescheduleBookingScreen?id=${bookingId}`);
      },
      [router]
    );

    // Show options modal
    const showOptionsModal = useCallback((booking: Booking) => {
      setSelectedBooking(booking);
      setModalVisible(true);
    }, []);

    // Status badge color
    const getStatusColor = (status: string) => {
      switch (status.toLowerCase()) {
        case "confirmed":
          return "#28a745"; // Green
        case "completed":
          return "#17a2b8"; // Blue
        case "cancelled":
          return "#dc3545"; // Red
        case "pending":
          return "#ffc107"; // Yellow
        default:
          return "#6c757d"; // Gray
      }
    };

    // Render booking item
    const renderBookingItem = ({ item }: { item: Booking }) => (
      <TouchableOpacity
        className="bg-white rounded-xl mb-4 overflow-hidden"
        style={styles.bookingCard}
        onPress={() =>
          router.push(`/(screens)/BookingConfirmationScreen?bookingId=${item.id}`)
        }
      >
        {/* Service image and info */}
        <View className="flex-row">
          <View className="w-1/3" style={styles.imageContainer}>
            <Image
              source={
                item.service.image
                  ? { uri: item.service.image }
                  : require("@/assets/images/default-avatar.jpg")
              }
              className="h-full w-full"
              style={{ height: 120 }}
              resizeMode="cover"
            />
          </View>
          <View className="w-2/3 p-3">
            {/* Options button - three dots menu */}
            {/* Show options for all non-cancelled bookings */}
            {item.status !== "cancelled" && (
              <TouchableOpacity
                style={styles.optionsButton}
                onPress={() => showOptionsModal(item)}
              >
                <Entypo name="dots-three-vertical" size={16} color="#666" />
              </TouchableOpacity>
            )}

            {/* Service name */}
            <Text className="text-lg font-bold text-black mb-1" numberOfLines={1}>
              {item.service.name}
            </Text>

            {/* Treatment name if available */}
            {item.treatment_name && (
              <Text className="text-sm text-gray-700 mb-1" numberOfLines={1}>
                Treatment: {item.treatment_name}
              </Text>
            )}

            {/* Reference */}
            <View className="flex-row items-center mb-1">
              <Text className="text-xs text-gray-500">Ref: </Text>
              <Text className="text-xs font-medium">{item.reference}</Text>
            </View>

            {/* Date and time */}
            <View className="flex-row items-center mb-1">
              <FontAwesome5 name="calendar-alt" size={12} color="#666" />
              <Text className="text-xs text-gray-700 ml-1">
                {item.formatted_date}
              </Text>
              <Text className="text-xs text-gray-700 mx-1">|</Text>
              <Feather name="clock" size={12} color="#666" />
              <Text className="text-xs text-gray-700 ml-1">
                {item.formatted_time}
              </Text>
            </View>

            {/* Price and status */}
            <View className="flex-row justify-between items-center mt-auto">
              <Text className="text-base font-bold color-primary">
                £{typeof item.price === "number" ? item.price.toFixed(2) : "0.00"}
              </Text>

              {/* Status badge moved to bottom right */}
              <View
                style={[
                  styles.statusBadge,
                  { backgroundColor: getStatusColor(item.status) },
                ]}
              >
                <Text className="text-white font-medium text-xs capitalize">
                  {item.status}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );

    // Empty state
    const renderEmptyState = () => {
      if (loading) return null;

      return (
        <View className="flex-1 justify-center items-center py-10">
          <MaterialIcons name="event-busy" size={64} color="#9A563A" />
          <Text className="text-lg font-bold mt-4 text-center">
            No Bookings Yet
          </Text>
          <Text className="text-gray-500 text-center mt-2 px-10">
            You don't have any bookings at the moment. Book a service to get
            started.
          </Text>
          <TouchableOpacity
            className="bg-primary py-3 px-6 rounded-full mt-6 flex-row items-center"
            onPress={() => router.push("/")}
          >
            <Feather name="plus" size={18} color="white" />
            <Text className="text-white font-bold ml-2">Book a Service</Text>
          </TouchableOpacity>
        </View>
      );
    };

    // Footer (loading more indicator)
    const renderFooter = () => {
      if (!loadingMore) return null;

      return (
        <View className="py-4 flex-row justify-center">
          <ActivityIndicator size="small" color="#9A563A" />
        </View>
      );
    };

    return (
      <SafeAreaProvider>
        <SafeAreaView className="flex-1 bg-[#FAFAFA]">
          {/* Content */}
          {loading ? (
            <View className="flex-1 justify-center items-center">
              <ActivityIndicator size="large" color="#9A563A" />
            </View>
          ) : (
            <FlatList
              data={bookings}
              renderItem={renderBookingItem}
              keyExtractor={(item) => item.id.toString()}
              contentContainerStyle={{ padding: 16, flexGrow: 1 }}
              ListEmptyComponent={renderEmptyState}
              ListFooterComponent={renderFooter}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  colors={["#9A563A"]}
                  tintColor="#9A563A"
                />
              }
              onEndReached={handleLoadMore}
              onEndReachedThreshold={0.5}
              showsVerticalScrollIndicator={false}
            />
          )}

          {/* Cancel Loading Overlay */}
          {cancelLoading && (
            <View style={styles.loadingOverlay}>
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#9A563A" />
                <Text style={styles.loadingText}>Cancelling booking...</Text>
              </View>
            </View>
          )}

          {/* Options Modal */}
          <Modal
            animationType="fade"
            transparent={true}
            visible={modalVisible}
            onRequestClose={() => setModalVisible(false)}
          >
            <TouchableOpacity
              style={styles.modalOverlay}
              activeOpacity={1}
              onPress={() => setModalVisible(false)}
            >
              <View style={styles.modalContainer}>
                <View style={styles.modalContent}>
                  {/* Modal Header */}
                  <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>Booking Options</Text>
                    <TouchableOpacity onPress={() => setModalVisible(false)}>
                      <Feather name="x" size={24} color="#333" />
                    </TouchableOpacity>
                  </View>

                  {/* Modal Body */}
                  {selectedBooking && (
                    <>
                      {/* Only show reschedule option if booking is not cancelled */}
                      {/* {selectedBooking.status !== "cancelled" && (
                        <TouchableOpacity
                          style={styles.modalOption}
                          onPress={() =>
                            handleRescheduleBooking(selectedBooking.id)
                          }
                        >
                          <Feather name="calendar" size={20} color="#9A563A" />
                          <Text style={styles.modalOptionText}>Reschedule</Text>
                        </TouchableOpacity>
                      )} */}


                      {selectedBooking.status !== "cancelled" && (
                        <TouchableOpacity
                          style={[styles.modalOption, styles.lastOption]}
                          onPress={() => handleCancelBooking(selectedBooking.id)}
                        >
                          <MaterialIcons name="cancel" size={20} color="#dc3545" />
                          <Text
                            style={[styles.modalOptionText, { color: "#dc3545" }]}
                          >
                            Cancel Booking
                          </Text>
                        </TouchableOpacity>
                      )}

                      {/* If booking is already cancelled, show message */}
                      {selectedBooking.status === "cancelled" && (
                        <Text style={styles.noOptionsText}>
                          No actions available for cancelled bookings.
                        </Text>
                      )}
                    </>
                  )}
                </View>
              </View>
            </TouchableOpacity>
          </Modal>
        </SafeAreaView>
      </SafeAreaProvider>
    );
  }

  const styles = StyleSheet.create({
    bookingCard: {
      elevation: 8, // works on Android
      shadowColor: "#000", // iOS
      shadowOffset: { width: 0, height: 4 }, // iOS
      shadowOpacity: 0.3, // iOS
      shadowRadius: 4.65, // iOS
      borderRadius: 12,
      backgroundColor: "#fff",
      borderWidth: 1,
      borderColor: "#f0f0f0",
    },
    imageContainer: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 3,
      elevation: 5,
      overflow: "hidden",
    },
    statusBadge: {
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 6,
    },
    optionsButton: {
      position: "absolute",
      top: 4,
      right: 4,
      width: 28,
      height: 28,
      justifyContent: "center",
      alignItems: "center",
      zIndex: 10,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.5)",
      justifyContent: "flex-end",
    },
    modalContainer: {
      backgroundColor: "white",
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      padding: 16,
      minHeight: 200,
    },
    modalContent: {
      width: "100%",
    },
    modalHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 16,
      paddingBottom: 12,
      borderBottomWidth: 1,
      borderBottomColor: "#eee",
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: "bold",
      color: "#333",
    },
    modalOption: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: "#f0f0f0",
    },
    lastOption: {
      borderBottomWidth: 0,
    },
    modalOptionText: {
      fontSize: 16,
      marginLeft: 12,
      color: "#333",
    },
    noOptionsText: {
      fontSize: 16,
      color: "#666",
      textAlign: "center",
      padding: 20,
      fontStyle: "italic",
    },
    loadingOverlay: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "rgba(0,0,0,0.3)",
      justifyContent: "center",
      alignItems: "center",
      zIndex: 1000,
    },
    loadingContainer: {
      backgroundColor: "white",
      borderRadius: 10,
      padding: 20,
      alignItems: "center",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      elevation: 5,
    },
    loadingText: {
      marginTop: 10,
      fontSize: 16,
      color: "#333",
    },
  });