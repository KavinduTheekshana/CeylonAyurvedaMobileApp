import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    SafeAreaView,
    ActivityIndicator,
    FlatList
} from 'react-native';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { HeaderBackButton } from '@react-navigation/elements';
import {API_BASE_URL} from "@/config/api";
import withAuthGuard from '../components/AuthGuard';

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

// Define the time slot type
type TimeSlot = {
    id: string;
    time: string;
    available: boolean;
};

// Define your navigation param list for all screens
type RootStackParamList = {
    Home: undefined;
    Services: { treatmentId: string; treatmentName: string };
    ServiceDetails: { service: Service };
    BookingDateScreen: { serviceId: number; serviceName: string; duration: number };
    BookingTimeScreen: {
        serviceId: number;
        serviceName: string;
        selectedDate: string;
        duration: number;
    };
    BookingCheckoutScreen: {
        serviceId: number;
        serviceName: string;
        selectedDate: string;
        selectedTime: string;
        duration: number;
    };
};

// Type for the route
type BookingTimeScreenRouteProp = RouteProp<RootStackParamList, 'BookingTimeScreen'>;

// Type for the navigation
type BookingTimeScreenNavigationProp = StackNavigationProp<RootStackParamList>;

// API URL for available time slots
const API_URL = `${API_BASE_URL}/api/timeslots`;

const BookingTimeScreen = () => {
    const route = useRoute<BookingTimeScreenRouteProp>();
    const navigation = useNavigation<BookingTimeScreenNavigationProp>();
    const { serviceId, serviceName, selectedDate, duration } = route.params;

    const [selectedTime, setSelectedTime] = useState<string>('');
    const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        // Fetch available time slots from the API
        fetchTimeSlots();
    }, [serviceId, selectedDate, duration]);

    const fetchTimeSlots = () => {
        setLoading(true);

        console.log(`${API_URL}?serviceId=${serviceId}&date=${selectedDate}&duration=${duration}`);
        // Request available time slots from the API
        fetch(`${API_URL}?serviceId=${serviceId}&date=${selectedDate}&duration=${duration}`)
            .then(response => response.json())
            .then(data => {
                if (data.success && Array.isArray(data.data)) {
                    setTimeSlots(data.data);
                } else {
                    // If the API is not available or there's an error, use sample data
                    generateSampleTimeSlots();
                }
            })
            .catch(error => {
                console.error('Error fetching time slots:', error);
                // Generate sample time slots if API fails
                generateSampleTimeSlots();
            })
            .finally(() => {
                setLoading(false);
            });
    };

    const generateSampleTimeSlots = () => {
        // Generate sample time slots for testing
        const slots: TimeSlot[] = [];

        // Business hours from 9am to 5pm with 30-minute intervals
        const startHour = 9;
        const endHour = 17;
        const intervalMinutes = 30;

        for (let hour = startHour; hour < endHour; hour++) {
            for (let minute = 0; minute < 60; minute += intervalMinutes) {
                const timeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;

                // Randomly mark some slots as unavailable
                const available = Math.random() > 0.3;

                slots.push({
                    id: `slot-${hour}-${minute}`,
                    time: timeStr,
                    available: available
                });
            }
        }

        setTimeSlots(slots);
    };

    React.useLayoutEffect(() => {
        navigation.setOptions({
            title: `Select Time - ${serviceName}`,
            headerLeft: () => (
                <HeaderBackButton
                    onPress={() => navigation.goBack()}
                    tintColor="#000"
                />
            ),
        });
    }, [navigation, serviceName]);

    const handleTimeSelect = (time: string) => {
        setSelectedTime(time);
    };

    const handleContinue = () => {
        if (!selectedTime) {
            return; // Don't proceed if no time is selected
        }

        // Navigate to checkout screen
        navigation.navigate('BookingCheckoutScreen', {
            serviceId,
            serviceName,
            selectedDate,
            selectedTime,
            duration
        });
    };

    const renderTimeSlot = ({ item }: { item: TimeSlot }) => {
        const isSelected = selectedTime === item.time;

        return (
            <TouchableOpacity
                style={[
                    styles.timeSlot,
                    !item.available && styles.unavailableTimeSlot,
                    isSelected && styles.selectedTimeSlot
                ]}
                onPress={() => item.available && handleTimeSelect(item.time)}
                disabled={!item.available}
            >
                <Text
                    style={[
                        styles.timeText,
                        !item.available && styles.unavailableTimeText,
                        isSelected && styles.selectedTimeText
                    ]}
                >
                    {item.time}
                </Text>
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                <Text style={styles.title}>Select a Time</Text>
                <Text style={styles.subtitle}>
                    Available time slots for {selectedDate}
                </Text>
                <Text style={styles.durationText}>
                    Treatment duration: {duration} minutes
                </Text>

                {loading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color="#9A563A" />
                        <Text style={styles.loadingText}>Loading available times...</Text>
                    </View>
                ) : (
                    timeSlots.length > 0 ? (
                        <FlatList
                            data={timeSlots}
                            renderItem={renderTimeSlot}
                            keyExtractor={(item) => item.id}
                            numColumns={3}
                            contentContainerStyle={styles.timeSlotsContainer}
                        />
                    ) : (
                        <View style={styles.noTimesContainer}>
                            <Text style={styles.noTimesText}>
                                No available time slots for this date. Please try another date.
                            </Text>
                        </View>
                    )
                )}
            </View>

            <View style={styles.footer}>
                <TouchableOpacity
                    style={[
                        styles.continueButton,
                        !selectedTime ? styles.continueButtonDisabled : null
                    ]}
                    disabled={!selectedTime}
                    onPress={handleContinue}
                >
                    <Text style={styles.continueButtonText}>Continue</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    content: {
        flex: 1,
        padding: 16,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: '#555',
        marginBottom: 8,
    },
    durationText: {
        fontSize: 14,
        color: '#666',
        marginBottom: 24,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
        color: '#555',
    },
    timeSlotsContainer: {
        paddingVertical: 8,
    },
    timeSlot: {
        flex: 1,
        margin: 6,
        padding: 16,
        borderRadius: 8,
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 1,
    },
    selectedTimeSlot: {
        backgroundColor: '#9A563A',
    },
    unavailableTimeSlot: {
        backgroundColor: '#f0f0f0',
        opacity: 0.7,
    },
    timeText: {
        fontSize: 16,
        fontWeight: '500',
        color: '#333',
    },
    selectedTimeText: {
        color: '#fff',
    },
    unavailableTimeText: {
        color: '#999',
        textDecorationLine: 'line-through',
    },
    noTimesContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 16,
    },
    noTimesText: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
    },
    footer: {
        padding: 16,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#eee',
    },
    continueButton: {
        backgroundColor: '#9A563A',
        padding: 16,
        borderRadius: 8,
        alignItems: 'center',
    },
    continueButtonDisabled: {
        backgroundColor: '#cccccc',
    },
    continueButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
});

// Wrap the component with the AuthGuard
export default withAuthGuard(BookingTimeScreen);