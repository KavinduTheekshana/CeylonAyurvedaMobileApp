import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    SafeAreaView,
    ActivityIndicator,
    FlatList,
    Image,
    Alert,
    ScrollView
} from 'react-native';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { HeaderBackButton } from '@react-navigation/elements';
import { API_BASE_URL } from "@/config/api";
import withAuthGuard from '../components/AuthGuard';
import { Feather, MaterialIcons } from '@expo/vector-icons';
import { useLocation } from '../contexts/LocationContext'; // Import location context

// Define Therapist type with all availability data including work_start_date
type Therapist = {
    id: number;
    name: string;
    email: string;
    phone: string;
    image: string | null;
    bio: string | null;
    work_start_date: string; // Added work start date
    status: boolean;
    available_slots_count: number;
    available_dates_count: number;
    schedule: {
        day_of_week: string;
        start_time: string;
        end_time: string;
        is_active: boolean;
    }[];
};

// Define your Service type
type Service = {
    id: number;
    title: string;
    subtitle: string;
    price: number;
    duration: number;
    benefits: string;
    image: string | null;
    description?: string;
};

// Define your navigation param list for all screens
type RootStackParamList = {
    Home: undefined;
    Services: { treatmentId: string; treatmentName: string };
    ServiceDetails: { service: Service };
    BookingDateScreen: { 
        serviceId: number; 
        serviceName: string; 
        duration: number;
        therapistId: number;
        therapistName: string;
        therapistWorkStartDate: string; // Added work start date parameter
    };
    BookingTherapistScreen: {
        serviceId: number;
        serviceName: string;
        duration: number;
    };
    TherapistDetailsScreen: {
        therapistId: number;
        therapistName: string;
    };
    BookingTimeScreen: {
        serviceId: number;
        serviceName: string;
        selectedDate: string;
        duration: number;
        therapistId: number;
        therapistName: string;
    };
    BookingCheckoutScreen: {
        serviceId: number;
        serviceName: string;
        selectedDate: string;
        selectedTime: string;
        duration: number;
        therapistId: number;
        therapistName: string;
    };
};

// Type for the route
type BookingTherapistScreenRouteProp = RouteProp<RootStackParamList, 'BookingTherapistScreen'>;

// Type for the navigation
type BookingTherapistScreenNavigationProp = StackNavigationProp<RootStackParamList>;

// API URL for fetching therapists
const API_URL = `${API_BASE_URL}/api/services`;

const BookingTherapistScreen = () => {
    const route = useRoute<BookingTherapistScreenRouteProp>();
    const navigation = useNavigation<BookingTherapistScreenNavigationProp>();
    const { serviceId, serviceName, duration } = route.params;
    
    // Get selected location from context
    const { selectedLocation } = useLocation();

    const [selectedTherapist, setSelectedTherapist] = useState<Therapist | null>(null);
    const [therapists, setTherapists] = useState<Therapist[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // Fetch available therapists for the service from the API
        fetchTherapists();
    }, [serviceId, selectedLocation]); // Add selectedLocation as dependency

    const fetchTherapists = async () => {
        setLoading(true);
        setError(null);

        try {
            // console.log(`Fetching therapists for service ${serviceId}`);
            
            // Build API URL with location parameter if location is selected
            let apiUrl = `${API_URL}/${serviceId}/therapists`;
            
            if (selectedLocation) {
                apiUrl += `?location_id=${selectedLocation.id}`;
                // console.log(`Filtering by location: ${selectedLocation.name} (ID: ${selectedLocation.id})`);
            }
            
            // console.log(`API URL: ${apiUrl}`);

            const response = await fetch(apiUrl);
            const data = await response.json();

            // console.log('=== FULL API RESPONSE ===');
            // console.log(JSON.stringify(data, null, 2));

            if (data.success && Array.isArray(data.data)) {
                // Show all active therapists (location filtering is now done on backend)
                const activeTherapists = data.data.filter((therapist: Therapist) => {
                    return therapist.status;
                });

                setTherapists(activeTherapists);
                // console.log('Therapists loaded successfully:', activeTherapists.length);
                
                if (activeTherapists.length === 0 && selectedLocation) {
                    console.log(`No therapists found for location: ${selectedLocation.name}`);
                }
            } else {
                throw new Error(data.message || 'Failed to fetch therapists');
            }
        } catch (error) {
            console.error('Error fetching therapists:', error);
            setError('Failed to load therapists for this location. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // Helper function to format work start date
    const formatWorkStartDate = (dateString: string) => {
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('en-GB', {
                day: 'numeric',
                month: 'short',
                year: 'numeric'
            });
        } catch (error) {
            return dateString;
        }
    };

    // Helper function to check if therapist has started work
    const hasTherapistStartedWork = (therapist: Therapist) => {
        if (!therapist.work_start_date) return true; // No start date means available
        
        const workStartDate = new Date(therapist.work_start_date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        workStartDate.setHours(0, 0, 0, 0);
        
        return workStartDate <= today;
    };

    // Helper function to format available days
    const formatAvailableDays = (schedule: Therapist['schedule']) => {
        if (!schedule || schedule.length === 0) {
            return 'No availability';
        }

        const daysOrder = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
        const dayAbbreviations = {
            'monday': 'Mon',
            'tuesday': 'Tue',
            'wednesday': 'Wed',
            'thursday': 'Thu',
            'friday': 'Fri',
            'saturday': 'Sat',
            'sunday': 'Sun'
        };

        const availableDays = schedule
            .filter(slot => slot.is_active)
            .map(slot => slot.day_of_week)
            .filter((day, index, self) => self.indexOf(day) === index) // Remove duplicates
            .sort((a, b) => daysOrder.indexOf(a) - daysOrder.indexOf(b))
            .map(day => dayAbbreviations[day as keyof typeof dayAbbreviations]);

        return availableDays.length > 0 ? availableDays.join(', ') : 'No availability';
    };

    // Helper function to get availability status color classes
    const getAvailabilityColorClass = (count: number) => {
        if (count === 0) return 'text-red-600';
        if (count < 5) return 'text-amber-500';
        return 'text-emerald-500';
    };

    React.useLayoutEffect(() => {
        navigation.setOptions({
            title: `Select Therapist`,
            headerLeft: () => (
                <HeaderBackButton
                    onPress={() => navigation.goBack()}
                    tintColor="#000"
                />
            ),
        });
    }, [navigation]);

    const handleTherapistSelect = (therapist: Therapist) => {
        setSelectedTherapist(therapist);
    };

    // Handle view profile
    const handleViewProfile = (therapist: Therapist) => {
        // Navigate to therapist details screen
        navigation.navigate('TherapistDetailsScreen', {
            therapistId: therapist.id,
            therapistName: therapist.name
        });
    };

    const handleContinue = () => {
        if (!selectedTherapist) {
            Alert.alert('Error', 'Please select a therapist to continue');
            return;
        }

        // Navigate to date selection screen with therapist info and work start date
        navigation.navigate('BookingDateScreen', {
            serviceId,
            serviceName,
            duration,
            therapistId: selectedTherapist.id,
            therapistName: selectedTherapist.name,
            therapistWorkStartDate: selectedTherapist.work_start_date // Pass work start date
        });
    };

    const renderTherapistCard = ({ item }: { item: Therapist }) => {
        const isSelected = selectedTherapist?.id === item.id;
        const availabilityColorClass = getAvailabilityColorClass(item.available_slots_count);
        const hasStartedWork = hasTherapistStartedWork(item);

        return (
            <TouchableOpacity
                className={`bg-white rounded-2xl p-5 m-2 border-2 relative ${isSelected ? 'border-[#9A563A] bg-orange-50' : 'border-transparent'
                    }`}
                style={{
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.1,
                    shadowRadius: 8,
                    elevation: 4,
                }}
                onPress={() => handleTherapistSelect(item)}
                activeOpacity={0.7}
            >
                {/* Selection indicator */}
                {isSelected && (
                    <View className="absolute top-4 right-4 bg-[#9A563A] w-7 h-7 rounded-full justify-center items-center z-10">
                        <Feather name="check" size={16} color="#fff" />
                    </View>
                )}

                {/* Therapist Header */}
                <View className="flex-row mb-4">
                    {/* Profile Image */}
                    <View className="mr-4">
                        {item.image ? (
                            <Image
                                source={{ uri: item.image }}
                                className="w-20 h-20 rounded-full"
                                resizeMode="cover"
                            />
                        ) : (
                            <View className="w-20 h-20 rounded-full bg-[#9A563A] justify-center items-center">
                                <Text className="text-white text-2xl font-bold">
                                    {item.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                                </Text>
                            </View>
                        )}
                    </View>

                    {/* Therapist Info */}
                    <View className="flex-1 justify-center">
                        <Text className="text-xl font-bold text-gray-800 mb-1">{item.name}</Text>
                        <Text className="text-sm text-gray-500 mb-0.5">{item.email}</Text>
                        <Text className="text-sm text-gray-500">{item.phone}</Text>
                    </View>
                </View>

                {/* Work Start Date Section */}
                <View className="mb-4 pt-2 border-t border-gray-200">
                    <View className="flex-row items-center">
                        <MaterialIcons 
                            name="work" 
                            size={16} 
                            color={hasStartedWork ? "#10B981" : "#3B82F6"} 
                        />
                        <Text className="text-sm text-gray-500 ml-2 mr-2 flex-1">
                            {hasStartedWork ? 'Started Work' : 'Will Start Work'}
                        </Text>
                        <Text className={`text-sm font-semibold ${hasStartedWork ? 'text-green-600' : 'text-blue-600'}`}>
                            {formatWorkStartDate(item.work_start_date)}
                        </Text>
                    </View>
                    
                    {!hasStartedWork && (
                        <View className="mt-2 flex-row items-center">
                            <MaterialIcons name="schedule" size={14} color="#6B7280" />
                            <Text className="text-xs text-gray-500 ml-2">
                                Bookings available from {formatWorkStartDate(item.work_start_date)}
                            </Text>
                        </View>
                    )}
                </View>

                {/* Availability Summary */}
                <View className="mb-4">
                    <View className="mb-2">
                        <View className="flex-row items-center">
                            <MaterialIcons name="today" size={16} color="#9A563A" />
                            <Text className="text-sm text-gray-500 ml-2 mr-2 flex-1">Available Days</Text>
                            <Text className="text-sm font-semibold text-gray-800">
                                {formatAvailableDays(item.schedule)}
                            </Text>
                        </View>
                    </View>

                    <View className="mb-2">
                        <View className="flex-row items-center">
                            <MaterialIcons
                                name="event-available"
                                size={16}
                                color={item.available_dates_count === 0 ? '#DC2626' : item.available_dates_count < 5 ? '#F59E0B' : '#10B981'}
                            />
                            <Text className="text-sm text-gray-500 ml-2 mr-2 flex-1">Next 3 Months</Text>
                            <Text className={`text-sm font-semibold ${getAvailabilityColorClass(item.available_dates_count)}`}>
                                {item.available_dates_count} days available
                            </Text>
                        </View>
                    </View>

                    <View className="mb-2">
                        <View className="flex-row items-center">
                            <MaterialIcons
                                name="access-time"
                                size={16}
                                color={item.available_slots_count === 0 ? '#DC2626' : item.available_slots_count < 5 ? '#F59E0B' : '#10B981'}
                            />
                            <Text className="text-sm text-gray-500 ml-2 mr-2 flex-1">
                                {hasStartedWork ? 'Today' : 'From Start Date'}
                            </Text>
                            <Text className={`text-sm font-semibold ${availabilityColorClass}`}>
                                {hasStartedWork ? `${item.available_slots_count} slots available` : 'Future bookings available'}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Detailed Schedule */}
                {item.schedule && item.schedule.length > 0 && (
                    <View className="pt-4 border-t border-gray-200">
                        <Text className="text-base font-semibold text-gray-800 mb-3">Weekly Schedule</Text>
                        <View className="flex-row flex-wrap">
                            {item.schedule
                                .filter(slot => slot.is_active)
                                .map((slot, index) => (
                                    <View
                                        key={index}
                                        className="bg-gray-100 px-3 py-2 rounded-lg mr-2 mb-2 items-center"
                                        style={{ minWidth: 80, flexBasis: 'auto' }}
                                    >
                                        <Text className="text-xs font-semibold text-[#9A563A] mb-0.5">
                                            {slot.day_of_week.charAt(0).toUpperCase() + slot.day_of_week.slice(1, 3)}
                                        </Text>
                                        <Text className="text-xs text-gray-500">
                                            {slot.start_time} - {slot.end_time}
                                        </Text>
                                    </View>
                                ))}
                        </View>
                    </View>
                )}

                {/* View Profile Button - Bottom Right Corner */}
                <View className="mt-4 flex-row justify-end">
                    <TouchableOpacity
                        className="bg-white border border-[#9A563A] px-4 py-2 rounded-lg flex-row items-center shadow-md"
                        onPress={() => handleViewProfile(item)}
                        activeOpacity={0.7}
                        style={{
                            elevation: 3,
                            shadowColor: '#000',
                            shadowOffset: { width: 0, height: 1 },
                            shadowOpacity: 0.22,
                            shadowRadius: 2.22,
                        }}
                    >
                        <Feather name="eye" size={16} color="#9A563A" />
                        <Text className="text-[#9A563A] text-sm font-semibold ml-2">View Profile</Text>
                    </TouchableOpacity>
                </View>
            </TouchableOpacity>
        );
    };

    if (loading) {
        return (
            <View className="flex-1 justify-center items-center p-8">
                <ActivityIndicator size="large" color="#9A563A" />
                <Text className="mt-4 text-base text-gray-500">Loading therapists...</Text>
                {selectedLocation && (
                    <Text className="mt-2 text-sm text-gray-400">
                        Searching in {selectedLocation.name}
                    </Text>
                )}
            </View>
        );
    }

    if (error) {
        return (
            <View className="flex-1 justify-center items-center p-8">
                <MaterialIcons name="error-outline" size={64} color="#DC2626" />
                <Text className="text-xl font-bold text-red-600 mt-4 mb-2">Oops! Something went wrong</Text>
                <Text className="text-base text-gray-500 text-center mb-6 leading-6">{error}</Text>
                <TouchableOpacity
                    className="bg-[#9A563A] py-3.5 px-7 rounded-xl"
                    onPress={fetchTherapists}
                >
                    <Text className="text-white text-base font-semibold">Try Again</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-gray-50">
            <View className="flex-1 p-4">
                {/* Header */}
                <View className="mb-6">
                    <Text className="text-3xl font-bold text-gray-800 mb-2">Choose Your Therapist</Text>
                    <Text className="text-base text-gray-500 leading-6">
                        Select a therapist for your {serviceName} session
                    </Text>
                    {selectedLocation && (
                        <View className="flex-row items-center mt-2">
                            <Feather name="map-pin" size={14} color="#9A563A" />
                            <Text className="text-sm text-gray-600 ml-1">
                                Available in {selectedLocation.name}
                            </Text>
                        </View>
                    )}
                </View>

                {therapists.length > 0 ? (
                    <FlatList
                        data={therapists}
                        renderItem={renderTherapistCard}
                        keyExtractor={(item) => item.id.toString()}
                        contentContainerStyle={{ paddingBottom: 100 }}
                        showsVerticalScrollIndicator={false}
                        ItemSeparatorComponent={() => <View className="h-4" />}
                    />
                ) : (
                    <View className="flex-1 justify-center items-center p-8">
                        <MaterialIcons name="person-off" size={64} color="#9CA3AF" />
                        <Text className="text-xl font-bold text-gray-800 mt-4 mb-2">
                            No Therapists Available
                        </Text>
                        <Text className="text-base text-gray-500 text-center leading-6">
                            {selectedLocation 
                                ? `There are currently no active therapists available for this service in ${selectedLocation.name}.`
                                : "There are currently no active therapists available for this service."
                            }
                        </Text>
                        <Text className="text-base text-gray-500 text-center leading-6 mt-2">
                            Please try again later or contact support.
                        </Text>
                    </View>
                )}
            </View>

            {/* Continue Button */}
            <View className="p-4 bg-white border-t border-gray-200">
                <TouchableOpacity
                    className={`py-4 px-6 rounded-xl flex-row items-center justify-center ${selectedTherapist ? 'bg-[#9A563A]' : 'bg-gray-300'
                        }`}
                    disabled={!selectedTherapist}
                    onPress={handleContinue}
                >
                    <Text className="text-white text-base font-semibold">
                        {selectedTherapist ? `Continue with ${selectedTherapist.name}` : 'Select a Therapist'}
                    </Text>
                    {selectedTherapist && (
                        <Feather name="arrow-right" size={20} color="#fff" style={{ marginLeft: 8 }} />
                    )}
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

// Wrap the component with the AuthGuard
export default withAuthGuard(BookingTherapistScreen);