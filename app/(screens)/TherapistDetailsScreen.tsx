import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    SafeAreaView,
    ActivityIndicator,
    ScrollView,
    Image,
    Alert,
    Linking,
    Dimensions,
    StyleSheet
} from 'react-native';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { HeaderBackButton } from '@react-navigation/elements';
import { API_BASE_URL } from "@/config/api";
import { Feather, MaterialIcons, Ionicons } from '@expo/vector-icons';
import BookingProgressBar from '../components/BookingProgressBar';
import { chatService } from '../services/chatService';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');

// Define Therapist type with all details from API including booking_count
type TherapistDetails = {
    id: number;
    name: string;
    email: string;
    phone: string;
    image: string | null;
    bio: string | null;
    work_start_date: string;
    status: boolean;
    total_booking_count: number;
    created_at: string;
    updated_at: string;
    booking_count?: number; // Added booking count
    schedule: {
        day_of_week: string;
        start_time: string;
        end_time: string;
        is_active: boolean;
    }[];
    available_days: string;
    services: {
        id: number;
        title: string;
        price: string;
        duration: number;
    }[];
    availability_stats: {
        available_dates_count: number;
        today_slots_count: number;
        next_available_dates: string[];
    };
    specializations: string[];
    certifications: string[];
    experience_years: number | null;
    languages: string[];
};

// Define your navigation param list
type RootStackParamList = {
    TherapistDetailsScreen: {
        therapistId: number;
        therapistName: string;
    };
};

// Type for the route
type TherapistDetailsScreenRouteProp = RouteProp<RootStackParamList, 'TherapistDetailsScreen'>;

// Type for the navigation
type TherapistDetailsScreenNavigationProp = StackNavigationProp<RootStackParamList>;

const TherapistDetailsScreen = () => {
    const route = useRoute<TherapistDetailsScreenRouteProp>();
    const navigation = useNavigation<TherapistDetailsScreenNavigationProp>();
    const router = useRouter();
    const { therapistId, therapistName } = route.params;

    const [therapist, setTherapist] = useState<TherapistDetails | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [chatLoading, setChatLoading] = useState<boolean>(false); 
    const [bookingData, setBookingData] = useState<{ count: number, max: number }>({
        count: 0,
        max: 80
    });

    useEffect(() => {
        fetchTherapistDetails();
    }, [therapistId]);

    // Generate fallback booking count for therapists (fixed version)
    const generateFallbackBookingCount = (therapistId: number, totalBookingCount?: number): number => {
        // Use total_booking_count if available, otherwise generate based on therapist ID
        if (totalBookingCount !== undefined && totalBookingCount !== null) {
            // Use the actual total booking count, but cap it at 80 for the progress bar
            return Math.min(80, totalBookingCount);
        }
        
        // Fallback: generate a pseudo-random number based on therapist ID
        const seed = therapistId * 7 + 13; // Simple pseudo-random generation
        const baseCount = Math.floor((seed % 50) + 10); // Generate between 10-60
        
        // Ensure the result is between 0 and 80
        return Math.max(0, Math.min(80, baseCount));
    };

    const fetchTherapistDetails = async () => {
        setLoading(true);
        setError(null);

        try {
            console.log(`Fetching therapist details for ID: ${therapistId}`);

            const response = await fetch(`${API_BASE_URL}/api/therapists/details/${therapistId}`);
            const data = await response.json();

            console.log('Therapist details response:', data);

            if (data.success && data.data) {
                setTherapist(data.data);
                
                // Set booking data - use API data if available, otherwise fallback
                const bookingCount = data.data.booking_count || 
                                   generateFallbackBookingCount(therapistId, data.data.total_booking_count);
                setBookingData({
                    count: bookingCount,
                    max: 80
                });
            } else {
                throw new Error(data.message || 'Failed to fetch therapist details');
            }
        } catch (error) {
            console.error('Error fetching therapist details:', error);
            setError('Failed to load therapist details. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // Helper function to format day names
    const formatDayName = (day: string) => {
        const days = {
            'monday': 'Mon',
            'tuesday': 'Tue',
            'wednesday': 'Wed',
            'thursday': 'Thu',
            'friday': 'Fri',
            'saturday': 'Sat',
            'sunday': 'Sun'
        };
        return days[day as keyof typeof days] || day;
    };

    // Helper function to format dates
    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-GB', {
            weekday: 'short',
            day: 'numeric',
            month: 'short'
        });
    };

    // Handle phone call
    const handlePhoneCall = () => {
        if (therapist?.phone) {
            const phoneUrl = `tel:${therapist.phone}`;
            Linking.canOpenURL(phoneUrl)
                .then((supported) => {
                    if (supported) {
                        Linking.openURL(phoneUrl);
                    } else {
                        Alert.alert('Error', 'Phone call not supported on this device');
                    }
                })
                .catch((err) => console.error('An error occurred', err));
        }
    };
    
 const startChat = async () => {
        if (!therapist) {
            Alert.alert('Error', 'Therapist information not available');
            return;
        }

        try {
            setChatLoading(true);
            const result = await chatService.createOrAccessChat(therapist.id);
            
            if (result.success && result.data) {
                router.push({
                    pathname: '/(screens)/ChatScreen',
                    params: { 
                        roomId: result.data.chat_room_id.toString(), 
                        therapistName: therapist.name 
                    }
                });
            } else {
                Alert.alert(
                    'Unable to Start Chat', 
                    result.message || 'You need to book a session with this therapist first to start chatting.'
                );
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to start chat. Please try again.');
            console.error('Chat start error:', error);
        } finally {
            setChatLoading(false);
        }
    };


    // Handle email
    const handleEmail = () => {
        if (therapist?.email) {
            const emailUrl = `mailto:${therapist.email}`;
            Linking.canOpenURL(emailUrl)
                .then((supported) => {
                    if (supported) {
                        Linking.openURL(emailUrl);
                    } else {
                        Alert.alert('Error', 'Email not supported on this device');
                    }
                })
                .catch((err) => console.error('An error occurred', err));
        }
    };

    React.useLayoutEffect(() => {
        navigation.setOptions({
            title: therapistName || 'Therapist Details',
            headerLeft: () => (
                <HeaderBackButton
                    onPress={() => navigation.goBack()}
                    tintColor="#000"
                />
            ),
        });
    }, [navigation, therapistName]);

    if (loading) {
        return (
            <View className="flex-1 justify-center items-center p-8 bg-gray-50">
                <ActivityIndicator size="large" color="#9A563A" />
                <Text className="mt-4 text-base text-gray-500">Loading therapist details...</Text>
            </View>
        );
    }

    if (error || !therapist) {
        return (
            <View className="flex-1 justify-center items-center p-8 bg-gray-50">
                <MaterialIcons name="error-outline" size={64} color="#DC2626" />
                <Text className="text-xl font-bold text-red-600 mt-4 mb-2">Oops! Something went wrong</Text>
                <Text className="text-base text-gray-500 text-center mb-6 leading-6">{error}</Text>
                <TouchableOpacity
                    className="bg-[#9A563A] py-3.5 px-7 rounded-xl"
                    onPress={fetchTherapistDetails}
                >
                    <Text className="text-white text-base font-semibold">Try Again</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const today = new Date();
    const workStartDate = new Date(therapist.work_start_date);
    const isFutureDate = workStartDate > today;
    
    return (
        <SafeAreaView className="flex-1 bg-gray-50">
            <ScrollView
                className="flex-1"
                contentContainerStyle={{ paddingBottom: 20 }}
                showsVerticalScrollIndicator={false}
            >
                {/* Hero Section with Gradient Background */}
                <View className="bg-gradient-to-br from-[#9A563A] to-[#9A563A] pt-6 pb-8 px-6 relative overflow-hidden">
                    {/* Decorative circles */}
                    <View className="absolute -top-4 -right-4 w-24 h-24 bg-white/10 rounded-full" />
                    <View className="absolute -bottom-2 -left-2 w-16 h-16 bg-white/5 rounded-full" />

                    <View className="flex-row items-center">
                        {/* Profile Image */}
                        <View className="mr-4">
                            {therapist.image ? (
                                <Image
                                    source={{ uri: therapist.image }}
                                    className="w-24 h-24 rounded-full border-4 border-white/20"
                                    resizeMode="cover"
                                />
                            ) : (
                                <View className="w-24 h-24 rounded-full bg-white/20 justify-center items-center border-4 border-white/20">
                                    <Text className="text-white text-2xl font-bold">
                                        {therapist.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                                    </Text>
                                </View>
                            )}
                        </View>

                        {/* Therapist Info */}
                        <View className="flex-1">
                            <Text className="text-2xl font-bold text-black mb-1">{therapist.name}</Text>
                            <View className={`px-3 py-1 rounded-full self-start ${therapist.status ? 'bg-green-500' : 'bg-red-500'}`}>
                                <Text className="text-white text-xs font-semibold">
                                    {therapist.status && !isFutureDate
                                        ? 'Available'
                                        : isFutureDate
                                            ? `Available on: ${new Date(workStartDate).toLocaleDateString()}`
                                            : 'Unavailable'
                                    }
                                </Text>
                            </View>
                            <Text className="text-[#9A563A] mt-2 text-sm">
                                {therapist.available_days}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Booking Progress Bar - Only show if therapist hasn't started work yet */}
                {isFutureDate && (
                    <View className="px-4 -mt-4 mb-6">
                        <View className="bg-white rounded-2xl p-4 shadow-lg">
                            <BookingProgressBar
                                current={bookingData.count}
                                max={bookingData.max}
                                label="Pre-Booking Progress"
                            />
                            <Text className="text-xs text-gray-500 mt-2 text-center">
                                Once we reach 80 pre-bookings, our team will contact you to schedule your appointment
                            </Text>
                        </View>
                    </View>
                )}

                 {/* Chat Button - Fixed with proper styling */}
                <View className="px-4 mb-6">
                    <TouchableOpacity 
                        style={styles.chatButton} 
                        onPress={startChat}
                        disabled={chatLoading}
                    >
                        {chatLoading ? (
                            <ActivityIndicator size="small" color="#9A563A" />
                        ) : (
                            <Ionicons name="chatbubble-outline" size={20} color="#9A563A" />
                        )}
                        <Text style={styles.chatButtonText}>
                            {chatLoading ? 'Loading...' : `Message ${therapist.name}`}
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Quick Stats Cards */}
                <View className={`px-4 ${isFutureDate ? 'mb-6' : '-mt-4 mb-6'}`}>
                    <View className="bg-white rounded-2xl p-4 flex-row shadow-lg">
                        <View className="flex-1 items-center">
                            <Text className="text-2xl font-bold text-[#9A563A]">{therapist.availability_stats.available_dates_count}</Text>
                            <Text className="text-xs text-gray-500 text-center">Available Days</Text>
                        </View>
                        <View className="w-px bg-gray-200 mx-4" />
                        <View className="flex-1 items-center">
                            <Text className="text-2xl font-bold text-green-600">{therapist.services.length}</Text>
                            <Text className="text-xs text-gray-500 text-center">Services</Text>
                        </View>
                        <View className="w-px bg-gray-200 mx-4" />
                        <View className="flex-1 items-center">
                            <Text className="text-2xl font-bold text-[#9A563A]">{therapist.availability_stats.today_slots_count}</Text>
                            <Text className="text-xs text-gray-500 text-center">Today's Slots</Text>
                        </View>
                    </View>
                </View>

                {/* Contact Buttons */}
                <View className="flex-row px-4 mb-6 space-x-3">
                    <TouchableOpacity
                        className="flex-1 bg-[#9A563A] py-4 m-2 rounded-xl flex-row items-center justify-center"
                        onPress={handlePhoneCall}
                    >
                        <Feather name="phone" size={18} color="#fff" />
                        <Text className="text-white font-semibold ml-2">Call</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        className="flex-1 bg-gray-200 py-4 m-2 rounded-xl flex-row items-center justify-center"
                        onPress={handleEmail}
                    >
                        <Feather name="mail" size={18} color="#374151" />
                        <Text className="text-gray-700 font-semibold ml-2">Email</Text>
                    </TouchableOpacity>
                </View>

                {/* About Section */}
                {therapist.bio && (
                    <View className="bg-white rounded-2xl mx-4 p-6 mb-6 shadow-sm">
                        <Text className="text-xl font-bold text-gray-800 mb-3">About</Text>
                        <Text className="text-gray-700 leading-6">{therapist.bio}</Text>
                    </View>
                )}

                {/* Services Section */}
                <View className="bg-white rounded-2xl mx-4 p-6 mb-6 shadow-sm">
                    <Text className="text-xl font-bold text-gray-800 mb-4">Services Offered</Text>
                    <View className="space-y-3">
                        {therapist.services.map((service, index) => (
                            <View key={service.id} className="flex-row items-center justify-between p-3 mb-2 bg-gray-50 rounded-xl">
                                <View className="flex-1">
                                    <Text className="text-base font-semibold text-gray-800" numberOfLines={1}>
                                        {service.title}
                                    </Text>
                                    <Text className="text-sm text-gray-500">
                                        {service.duration} minutes
                                    </Text>
                                </View>
                                <Text className="text-lg font-bold text-[#9A563A]">
                                    £{parseFloat(service.price).toFixed(0)}
                                </Text>
                            </View>
                        ))}
                    </View>
                </View>

                {/* Weekly Schedule */}
                <View className="bg-white rounded-2xl mx-4 p-6 mb-6 shadow-sm">
                    <Text className="text-xl font-bold text-gray-800 mb-4">Weekly Schedule</Text>
                    <View className="space-y-3">
                        {therapist.schedule.map((slot, index) => (
                            <View key={index} className="flex-row items-center justify-between mb-2 py-3 px-4 bg-gray-50 rounded-xl">
                                <View className="flex-row items-center">
                                    <View className="w-10 h-10 bg-[#9A563A] rounded-full items-center justify-center mr-3">
                                        <Text className="text-white font-bold text-xs">
                                            {formatDayName(slot.day_of_week)}
                                        </Text>
                                    </View>
                                    <Text className="text-base font-medium text-gray-800 capitalize">
                                        {slot.day_of_week}
                                    </Text>
                                </View>
                                <Text className="text-gray-600 font-medium">
                                    {slot.start_time} - {slot.end_time}
                                </Text>
                            </View>
                        ))}
                    </View>
                </View>

                {/* Next Available Dates */}
                <View className="bg-white rounded-2xl mx-4 p-6 mb-6 shadow-sm">
                    <Text className="text-xl font-bold text-gray-800 mb-4">Next Available Dates</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} className="space-x-3">
                        <View className="flex-row space-x-3">
                            {therapist.availability_stats.next_available_dates.map((date, index) => (
                                <View key={index} className="bg-gradient-to-b from-amber-100 to-amber-50 m-1 px-4 py-3 rounded-xl border border-[#9A563A] min-w-[80px] items-center">
                                    <Text className="text-[#9A563A] font-bold text-xs">
                                        {formatDate(date)}
                                    </Text>
                                </View>
                            ))}
                        </View>
                    </ScrollView>
                </View>

                {/* Contact Information */}
                <View className="bg-white rounded-2xl mx-4 p-6 mb-6 shadow-sm">
                    <Text className="text-xl font-bold text-gray-800 mb-4">Contact Information</Text>
                    <View className="space-y-4">
                        <View className="flex-row items-center">
                            <View className="w-10 h-10 bg-orange-100 rounded-full items-center justify-center mr-3">
                                <Feather name="mail" size={16} color="#9A563A" />
                            </View>
                            <Text className="text-gray-700 flex-1">{therapist.email}</Text>
                        </View>

                        <View className="flex-row items-center mt-1">
                            <View className="w-10 h-10 bg-green-100 rounded-full items-center justify-center mr-3">
                                <Feather name="phone" size={16} color="#10B981" />
                            </View>
                            <Text className="text-gray-700 flex-1">{therapist.phone}</Text>
                        </View>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

// Styles for the chat button
const styles = StyleSheet.create({
    chatButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FFFFFF',
        borderWidth: 2,
        borderColor: '#9A563A',
        borderRadius: 12,
        paddingVertical: 14,
        paddingHorizontal: 20,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 3.84,
        elevation: 5,
    },
    chatButtonText: {
        color: '#9A563A',
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 8,
    },
});

export default TherapistDetailsScreen;