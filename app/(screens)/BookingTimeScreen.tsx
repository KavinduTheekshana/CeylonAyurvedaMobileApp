import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    SafeAreaView,
    ActivityIndicator,
    FlatList,
    Alert
} from 'react-native';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { HeaderBackButton } from '@react-navigation/elements';
import { API_BASE_URL } from "@/config/api";
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
    formatted_time?: string;
};

// Define therapist schedule type
type TherapistSchedule = {
    day_of_week: string;
    start_time: string;
    end_time: string;
    is_active: boolean;
};

// Define booking type
type ExistingBooking = {
    id: number;
    date: string;
    time: string;
    service: {
        duration: number;
    };
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
        therapistId?: number;
        therapistName?: string;
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
type BookingTimeScreenRouteProp = RouteProp<RootStackParamList, 'BookingTimeScreen'>;

// Type for the navigation
type BookingTimeScreenNavigationProp = StackNavigationProp<RootStackParamList>;

const BookingTimeScreen = () => {
    const route = useRoute<BookingTimeScreenRouteProp>();
    const navigation = useNavigation<BookingTimeScreenNavigationProp>();
    const {
        serviceId,
        serviceName,
        selectedDate,
        duration,
        therapistId,
        therapistName
    } = route.params;

    const [selectedTime, setSelectedTime] = useState<string>('');
    const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [therapistSchedule, setTherapistSchedule] = useState<TherapistSchedule[]>([]);
    const [existingBookings, setExistingBookings] = useState<ExistingBooking[]>([]);

    useEffect(() => {
        // Fetch therapist schedule and existing bookings
        fetchTherapistData();
    }, [serviceId, selectedDate, duration, therapistId]);

    const fetchTherapistData = async () => {
        setLoading(true);
        try {
            console.log(`Fetching data for therapist ${therapistId} on ${selectedDate}`);
            
            // Fetch therapist schedule
            await Promise.all([
                fetchTherapistSchedule(),
                fetchExistingBookings()
            ]);
            
        } catch (error) {
            console.error('Error fetching therapist data:', error);
            Alert.alert('Error', 'Failed to load available time slots. Please try again.');
        }
    };

    const fetchTherapistSchedule = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/services/${serviceId}/therapists`);
            const data = await response.json();
            
            if (data.success && Array.isArray(data.data)) {
                const therapist = data.data.find((t: any) => t.id === therapistId);
                
                if (therapist && therapist.schedule) {
                    console.log('Therapist schedule:', therapist.schedule);
                    setTherapistSchedule(therapist.schedule);
                    return therapist.schedule;
                }
            }
            
            // Fallback schedule if API doesn't provide one
            const fallbackSchedule = [
                { day_of_week: 'monday', start_time: '09:00', end_time: '17:00', is_active: true },
                { day_of_week: 'tuesday', start_time: '09:00', end_time: '17:00', is_active: true },
                { day_of_week: 'wednesday', start_time: '09:00', end_time: '17:00', is_active: true },
                { day_of_week: 'thursday', start_time: '09:00', end_time: '17:00', is_active: true },
                { day_of_week: 'friday', start_time: '09:00', end_time: '17:00', is_active: true },
                { day_of_week: 'saturday', start_time: '09:00', end_time: '17:00', is_active: true }
            ];
            
            console.log('Using fallback schedule');
            setTherapistSchedule(fallbackSchedule);
            return fallbackSchedule;
            
        } catch (error) {
            console.error('Error fetching therapist schedule:', error);
            throw error;
        }
    };

    const fetchExistingBookings = async () => {
        try {
            // This would be your API endpoint to get existing bookings for the therapist on the selected date
            console.log(`Fetching existing bookings for therapist ${therapistId} on ${selectedDate}`);
            const response = await fetch(
                `${API_BASE_URL}/api/therapists/${therapistId}/bookings?date=${selectedDate}`
            );
            
            if (response.ok) {
                const data = await response.json();
                
                if (data.success && Array.isArray(data.data)) {
                    console.log('Existing bookings:', data.data);
                    setExistingBookings(data.data);
                    return data.data;
                }
            }
            
            // If endpoint doesn't exist or fails, return empty array
            console.log('No existing bookings found or endpoint not available');
            setExistingBookings([]);
            return [];
            
        } catch (error) {
            console.error('Error fetching existing bookings:', error);
            setExistingBookings([]);
            return [];
        }
    };

    // Generate time slots based on therapist schedule and existing bookings
    useEffect(() => {
        if (therapistSchedule.length > 0) {
            generateTimeSlots();
        }
    }, [therapistSchedule, existingBookings, selectedDate, duration]);

    const generateTimeSlots = () => {
        console.log('Generating time slots for', selectedDate);
        
        // Get the day of the week for the selected date
        const selectedDateObj = new Date(selectedDate);
        const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        const selectedDayName = dayNames[selectedDateObj.getDay()];
        
        console.log('Selected day:', selectedDayName);
        
        // Find the therapist's schedule for this day
        const daySchedule = therapistSchedule.filter(
            schedule => schedule.day_of_week.toLowerCase() === selectedDayName && schedule.is_active
        );
        
        if (daySchedule.length === 0) {
            console.log('No schedule found for', selectedDayName);
            setTimeSlots([]);
            setLoading(false);
            return;
        }
        
        console.log('Day schedule:', daySchedule);
        
        const slots: TimeSlot[] = [];
        const slotInterval = 30; // 30-minute intervals
        const now = new Date();
        const isToday = selectedDate === now.toISOString().split('T')[0];
        
        daySchedule.forEach((schedule, scheduleIndex) => {
            const startTime = parseTime(schedule.start_time);
            const endTime = parseTime(schedule.end_time);
            
            let currentTime = new Date(startTime);
            
            while (currentTime < endTime) {
                const timeString = formatTime(currentTime);
                const slotEndTime = new Date(currentTime.getTime() + duration * 60000); // Add service duration
                
                // Check if slot end time exceeds the schedule end time
                if (slotEndTime > endTime) {
                    break;
                }
                
                // Check if this slot is in the past (for today only)
                let isPastTime = false;
                if (isToday) {
                    const slotDateTime = new Date();
                    slotDateTime.setHours(currentTime.getHours(), currentTime.getMinutes(), 0, 0);
                    isPastTime = slotDateTime <= now;
                }
                
                // Check if this slot conflicts with existing bookings
                const isBooked = existingBookings.some(booking => {
                    const bookingStart = parseTime(booking.time);
                    const bookingEnd = new Date(bookingStart.getTime() + (booking.service?.duration || 60) * 60000);
                    
                    // Check for time overlap
                    return (currentTime < bookingEnd && slotEndTime > bookingStart);
                });
                
                const isAvailable = !isPastTime && !isBooked;
                
                slots.push({
                    id: `${scheduleIndex}-${timeString}`,
                    time: timeString,
                    available: isAvailable,
                    formatted_time: formatTime12Hour(currentTime)
                });
                
                // Move to next slot
                currentTime = new Date(currentTime.getTime() + slotInterval * 60000);
            }
        });
        
        console.log(`Generated ${slots.length} time slots, ${slots.filter(s => s.available).length} available`);
        setTimeSlots(slots);
        setLoading(false);
    };

    // Helper function to parse time string (HH:MM) to Date object
    const parseTime = (timeString: string): Date => {
        const [hours, minutes] = timeString.split(':').map(Number);
        const date = new Date();
        date.setHours(hours, minutes, 0, 0);
        return date;
    };

    // Helper function to format Date object to HH:MM string
    const formatTime = (date: Date): string => {
        return date.toTimeString().slice(0, 5);
    };

    // Helper function to format time in 12-hour format
    const formatTime12Hour = (date: Date): string => {
        return date.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
    };

    React.useLayoutEffect(() => {
        navigation.setOptions({
            title: `Select Time`,
            headerLeft: () => (
                <HeaderBackButton
                    onPress={() => navigation.goBack()}
                    tintColor="#000"
                />
            ),
        });
    }, [navigation]);

    const handleTimeSelect = (time: string) => {
        setSelectedTime(time);
    };

    const handleContinue = () => {
        if (!selectedTime) {
            Alert.alert('Please Select Time', 'Please select an available time slot to continue.');
            return;
        }

        console.log(`Continuing with selected time: ${selectedTime}`);

        navigation.navigate('BookingCheckoutScreen', {
            serviceId,
            serviceName,
            selectedDate,
            selectedTime,
            duration,
            therapistId,
            therapistName
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
                    {item.formatted_time || item.time}
                </Text>
                {!item.available && (
                    <Text style={styles.unavailableLabel}>Booked</Text>
                )}
            </TouchableOpacity>
        );
    };

    const formatSelectedDate = (dateString: string): string => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                <Text style={styles.title}>Select a Time</Text>
                <Text style={styles.subtitle}>
                    Available time slots for {formatSelectedDate(selectedDate)}
                </Text>

                {/* Show service and therapist info */}
                <View style={styles.bookingInfo}>
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Service:</Text>
                        <Text style={styles.infoValue}>{serviceName}</Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Therapist:</Text>
                        <Text style={styles.infoValue}>{therapistName}</Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Duration:</Text>
                        <Text style={styles.infoValue}>{duration} minutes</Text>
                    </View>
                </View>

                {loading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color="#9A563A" />
                        <Text style={styles.loadingText}>Loading available times...</Text>
                    </View>
                ) : (
                    timeSlots.length > 0 ? (
                        <>
                            <View style={styles.slotsHeader}>
                                <Text style={styles.slotsHeaderText}>
                                    {timeSlots.filter(slot => slot.available).length} Available Slots
                                </Text>
                            </View>
                            <FlatList
                                data={timeSlots}
                                renderItem={renderTimeSlot}
                                keyExtractor={(item) => item.id}
                                numColumns={3}
                                contentContainerStyle={styles.timeSlotsContainer}
                                showsVerticalScrollIndicator={false}
                            />
                        </>
                    ) : (
                        <View style={styles.noTimesContainer}>
                            <Text style={styles.noTimesText}>
                                No available time slots for {therapistName} on this date. 
                                Please try another date.
                            </Text>
                            <TouchableOpacity 
                                style={styles.backButton}
                                onPress={() => navigation.goBack()}
                            >
                                <Text style={styles.backButtonText}>Choose Different Date</Text>
                            </TouchableOpacity>
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
                    <Text style={styles.continueButtonText}>
                        {selectedTime ? `Continue with ${timeSlots.find(slot => slot.time === selectedTime)?.formatted_time}` : 'Select a Time'}
                    </Text>
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
        marginBottom: 16,
    },
    bookingInfo: {
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 8,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 1,
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 4,
    },
    infoLabel: {
        fontSize: 14,
        color: '#666',
    },
    infoValue: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
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
    slotsHeader: {
        paddingVertical: 12,
        paddingHorizontal: 4,
    },
    slotsHeaderText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
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
        minHeight: 60,
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
        fontWeight: '600',
    },
    unavailableTimeText: {
        color: '#999',
    },
    unavailableLabel: {
        fontSize: 10,
        color: '#999',
        marginTop: 2,
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
        marginBottom: 20,
        lineHeight: 24,
    },
    backButton: {
        backgroundColor: '#9A563A',
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 8,
    },
    backButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
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

export default withAuthGuard(BookingTimeScreen);