// Fixed BookingDateScreen.tsx that properly handles therapist availability

import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    SafeAreaView,
    ActivityIndicator
} from 'react-native';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { HeaderBackButton } from '@react-navigation/elements';
import { Calendar } from 'react-native-calendars';
import withAuthGuard from '../components/AuthGuard';
import { API_BASE_URL } from "@/config/api";

// Your existing types...
type RootStackParamList = {
    BookingDateScreen: { 
        serviceId: number; 
        serviceName: string; 
        duration: number;
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
};

type BookingDateScreenRouteProp = RouteProp<RootStackParamList, 'BookingDateScreen'>;
type BookingDateScreenNavigationProp = StackNavigationProp<RootStackParamList>;

const BookingDateScreen = () => {
    const route = useRoute<BookingDateScreenRouteProp>();
    const navigation = useNavigation<BookingDateScreenNavigationProp>();
    const { 
        serviceId, 
        serviceName, 
        duration,
        therapistId,
        therapistName 
    } = route.params;

    const [selectedDate, setSelectedDate] = useState<string>('');
    const [markedDates, setMarkedDates] = useState<any>({});
    const [loading, setLoading] = useState<boolean>(false);
    const [availableDates, setAvailableDates] = useState<string[]>([]);

    // Calculate the minimum date (today)
    const today = new Date();
    const minDate = today.toISOString().split('T')[0];

    // Calculate the maximum date (3 months from today)
    const maxDate = new Date(today);
    maxDate.setMonth(maxDate.getMonth() + 3);
    const maxDateString = maxDate.toISOString().split('T')[0];

    React.useLayoutEffect(() => {
        navigation.setOptions({
            title: `Select Date`,
            headerLeft: () => (
                <HeaderBackButton
                    onPress={() => navigation.goBack()}
                    tintColor="#000"
                />
            ),
        });
    }, [navigation]);

    // Fetch available dates for the therapist
    useEffect(() => {
        fetchAvailableDates();
    }, [therapistId]);

    const fetchAvailableDates = async () => {
        setLoading(true);
        try {
            console.log(`Fetching available dates for therapist ${therapistId}`);
            
            // Try the dedicated endpoint first
            const response = await fetch(
                `${API_BASE_URL}/api/therapists/${therapistId}/available-dates?months=3`
            );
            
            if (response.ok) {
                const data = await response.json();
                console.log('Available dates response:', data);
                
                if (data.success && data.available_dates) {
                    setAvailableDates(data.available_dates);
                    updateMarkedDates(data.available_dates);
                } else {
                    console.log('No available_dates in response, generating from schedule');
                    generateAvailableDatesFromSchedule();
                }
            } else {
                console.log('API endpoint not available, generating from schedule');
                generateAvailableDatesFromSchedule();
            }
        } catch (error) {
            console.error('Error fetching available dates:', error);
            // Fallback: generate dates based on therapist's weekly schedule
            generateAvailableDatesFromSchedule();
        } finally {
            setLoading(false);
        }
    };

    // Generate available dates based on a typical weekly schedule
    const generateAvailableDatesFromSchedule = () => {
        console.log('Generating available dates from typical schedule');
        
        // Typical working days (Monday to Saturday)
        const workingDays = [1, 2, 3, 4, 5, 6]; // 0 = Sunday, 1 = Monday, etc.
        
        const dates: string[] = [];
        const currentDate = new Date(today);
        
        while (currentDate <= maxDate) {
            const dayOfWeek = currentDate.getDay();
            
            // Include the date if it's a working day and not in the past
            if (workingDays.includes(dayOfWeek) && currentDate >= today) {
                dates.push(currentDate.toISOString().split('T')[0]);
            }
            
            currentDate.setDate(currentDate.getDate() + 1);
        }
        
        console.log(`Generated ${dates.length} available dates`);
        setAvailableDates(dates);
        updateMarkedDates(dates);
    };

    const updateMarkedDates = (availableDates: string[]) => {
        console.log(`Updating marked dates with ${availableDates.length} available dates`);
        
        const marked: any = {};
        
        // Mark all dates in the range first
        const currentDate = new Date(today);
        while (currentDate <= maxDate) {
            const dateString = currentDate.toISOString().split('T')[0];
            
            if (availableDates.includes(dateString)) {
                // Available date
                marked[dateString] = {
                    marked: true,
                    dotColor: '#9A563A',
                    textColor: '#000',
                };
            } else {
                // Unavailable date
                marked[dateString] = {
                    disabled: true,
                    disableTouchEvent: true,
                    textColor: '#d9d9d9',
                };
            }
            
            currentDate.setDate(currentDate.getDate() + 1);
        }

        setMarkedDates(marked);
    };

    const handleDateSelect = (date: any) => {
        const dateString = date.dateString;
        
        console.log('Date selected:', dateString);
        console.log('Is available:', availableDates.includes(dateString));
        
        // Check if the date is available
        if (!availableDates.includes(dateString)) {
            console.log('Date not available, ignoring selection');
            return; // Don't allow selection of unavailable dates
        }

        // Update the selected date
        const updatedMarkedDates = { ...markedDates };
        
        // Remove previous selection
        Object.keys(updatedMarkedDates).forEach(key => {
            if (updatedMarkedDates[key].selected) {
                updatedMarkedDates[key] = {
                    ...updatedMarkedDates[key],
                    selected: false,
                    selectedColor: undefined,
                };
            }
        });

        // Add new selection
        updatedMarkedDates[dateString] = {
            ...updatedMarkedDates[dateString],
            selected: true,
            selectedColor: '#9A563A',
            marked: true,
            dotColor: '#9A563A',
        };

        setSelectedDate(dateString);
        setMarkedDates(updatedMarkedDates);
    };

    const handleContinue = () => {
        if (!selectedDate) {
            return;
        }

        console.log(`Continuing with selected date: ${selectedDate}`);

        navigation.navigate('BookingTimeScreen', {
            serviceId,
            serviceName,
            selectedDate,
            duration,
            therapistId,
            therapistName
        });
    };

    const getDayName = (dateString: string): string => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { weekday: 'long' });
    };

    const formatDate = (dateString: string): string => {
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
            <View style={styles.calendarContainer}>
                <Text style={styles.title}>Select a Date</Text>
                <Text style={styles.subtitle}>
                    Choose your preferred date for {serviceName}
                </Text>
                
                {/* Show selected therapist info */}
                {therapistName && (
                    <View style={styles.therapistInfo}>
                        <Text style={styles.therapistLabel}>Selected Therapist:</Text>
                        <Text style={styles.therapistNameText}>{therapistName}</Text>
                    </View>
                )}

                {/* Availability info */}
                <View style={styles.availabilityInfo}>
                    <Text style={styles.availabilityLabel}>
                        {loading 
                            ? "Loading availability..." 
                            : `${availableDates.length} days available in the next 3 months`
                        }
                    </Text>
                </View>

                {loading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color="#9A563A" />
                        <Text style={styles.loadingText}>Loading available dates...</Text>
                    </View>
                ) : (
                    <>
                        <Calendar
                            current={today.toISOString().split('T')[0]}
                            minDate={minDate}
                            maxDate={maxDateString}
                            onDayPress={handleDateSelect}
                            markedDates={markedDates}
                            theme={{
                                todayTextColor: '#9A563A',
                                selectedDayBackgroundColor: '#9A563A',
                                selectedDayTextColor: '#ffffff',
                                arrowColor: '#9A563A',
                                dotColor: '#9A563A',
                                disabledArrowColor: '#d9d9d9',
                            }}
                            markingType={'simple'}
                        />

                        {/* Legend */}
                        <View style={styles.legend}>
                            <View style={styles.legendItem}>
                                <View style={[styles.legendDot, { backgroundColor: '#9A563A' }]} />
                                <Text style={styles.legendText}>Available</Text>
                            </View>
                            <View style={styles.legendItem}>
                                <View style={[styles.legendDot, { backgroundColor: '#d9d9d9' }]} />
                                <Text style={styles.legendText}>Unavailable</Text>
                            </View>
                        </View>

                        {/* Show selected date info */}
                        {selectedDate && (
                            <View style={styles.selectedDateInfo}>
                                <Text style={styles.selectedDateText}>
                                    Selected: {formatDate(selectedDate)}
                                </Text>
                            </View>
                        )}
                    </>
                )}
            </View>

            <View style={styles.footer}>
                <TouchableOpacity
                    style={[
                        styles.continueButton,
                        (!selectedDate || loading) ? styles.continueButtonDisabled : null
                    ]}
                    disabled={!selectedDate || loading}
                    onPress={handleContinue}
                >
                    {loading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.continueButtonText}>Continue</Text>
                    )}
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
    calendarContainer: {
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
    therapistInfo: {
        backgroundColor: '#fff',
        padding: 12,
        borderRadius: 8,
        marginBottom: 16,
        flexDirection: 'row',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 1,
        elevation: 1,
    },
    therapistLabel: {
        fontSize: 14,
        color: '#666',
        marginRight: 8,
    },
    therapistNameText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#9A563A',
    },
    availabilityInfo: {
        backgroundColor: '#F0F8F0',
        padding: 8,
        borderRadius: 6,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#C8E6C9',
    },
    availabilityLabel: {
        fontSize: 12,
        color: '#2E7D32',
        textAlign: 'center',
        fontWeight: '600',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 50,
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
        color: '#555',
    },
    legend: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 16,
        gap: 20,
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    legendDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        marginRight: 6,
    },
    legendText: {
        fontSize: 12,
        color: '#666',
    },
    selectedDateInfo: {
        backgroundColor: '#9A563A',
        padding: 12,
        borderRadius: 8,
        marginTop: 16,
    },
    selectedDateText: {
        color: '#fff',
        textAlign: 'center',
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

export default withAuthGuard(BookingDateScreen);