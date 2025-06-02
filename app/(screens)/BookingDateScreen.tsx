// Updated BookingDateScreen.tsx with NativeWind styling

import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
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

            // First, get therapist schedule from the service endpoint
            const therapistResponse = await fetch(
                `${API_BASE_URL}/api/services/${serviceId}/therapists`
            );

            if (therapistResponse.ok) {
                const therapistData = await therapistResponse.json();
                console.log('Therapist data response:', therapistData);

                if (therapistData.success && Array.isArray(therapistData.data)) {
                    // Find the specific therapist
                    const therapist = therapistData.data.find((t: any) => t.id === therapistId);

                    if (therapist && therapist.schedule) {
                        console.log('Found therapist schedule:', therapist.schedule);
                        generateAvailableDatesFromSchedule(therapist.schedule);
                        return;
                    }
                }
            }

            // Try the dedicated endpoint as fallback
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
                    console.log('No available_dates in response, using fallback schedule');
                    generateAvailableDatesFromSchedule();
                }
            } else {
                console.log('API endpoint not available, using fallback schedule');
                generateAvailableDatesFromSchedule();
            }
        } catch (error) {
            console.error('Error fetching available dates:', error);
            // Fallback: generate dates based on default schedule
            generateAvailableDatesFromSchedule();
        } finally {
            setLoading(false);
        }
    };

    // Generate available dates based on therapist's actual schedule
    const generateAvailableDatesFromSchedule = (schedule?: any[]) => {
        console.log('Generating available dates from schedule:', schedule);

        let workingDays: number[] = [];

        if (schedule && Array.isArray(schedule)) {
            // Convert day names to day numbers and filter active days
            const dayNameToNumber: { [key: string]: number } = {
                'sunday': 0,
                'monday': 1,
                'tuesday': 2,
                'wednesday': 3,
                'thursday': 4,
                'friday': 5,
                'saturday': 6
            };

            workingDays = schedule
                .filter(slot => slot.is_active) // Only include active slots
                .map(slot => dayNameToNumber[slot.day_of_week.toLowerCase()])
                .filter((day, index, array) => array.indexOf(day) === index) // Remove duplicates
                .filter(day => day !== undefined); // Remove invalid days

            console.log('Working days from schedule:', workingDays);
        } else {
            // Fallback to typical working days if no schedule provided
            console.log('No schedule provided, using fallback working days');
            workingDays = [1, 2, 3, 4, 5, 6]; // Monday to Saturday
        }

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

        console.log(`Generated ${dates.length} available dates for working days:`, workingDays);
        setAvailableDates(dates);
        updateMarkedDates(dates);
    };

    const updateMarkedDates = (availableDates: string[]) => {
        console.log(`Updating marked dates with ${availableDates.length} available dates`);

        const marked: any = {};

        // Mark available dates as selectable
        availableDates.forEach(dateString => {
            marked[dateString] = {
                marked: true,
                dotColor: '#9A563A',
                activeOpacity: 1,
                selected: false,
                selectedColor: '#9A563A',
                textColor: '#000'
            };
        });

        // Create a comprehensive list of all dates in the range to disable unavailable ones
        const currentDate = new Date(today);
        const endDate = new Date(maxDate);

        while (currentDate <= endDate) {
            const dateString = currentDate.toISOString().split('T')[0];

            // If this date is not in availableDates, mark it as disabled
            if (!availableDates.includes(dateString)) {
                marked[dateString] = {
                    disabled: true,
                    disableTouchEvent: true,
                    textColor: '#d9d9d9',
                    activeOpacity: 0.3
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

        // Check if the date is available - this is crucial
        if (!availableDates.includes(dateString)) {
            console.log('Date not available, ignoring selection');
            return; // Don't allow selection of unavailable dates
        }

        // Create new marked dates object
        const updatedMarkedDates = { ...markedDates };

        // Remove previous selection styling from all dates
        Object.keys(updatedMarkedDates).forEach(key => {
            if (updatedMarkedDates[key].selected) {
                updatedMarkedDates[key] = {
                    ...updatedMarkedDates[key],
                    selected: false,
                    selectedColor: undefined,
                };
            }
        });

        // Add selection styling to the new date
        updatedMarkedDates[dateString] = {
            ...updatedMarkedDates[dateString],
            selected: true,
            selectedColor: '#9A563A',
            selectedTextColor: '#ffffff',
            marked: true,
            dotColor: '#ffffff', // White dot on selected date
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
        <SafeAreaView className="flex-1 bg-gray-100">
            <View className="flex-1 p-4">
                <Text className="text-2xl font-bold mb-2">Select a Date</Text>
                <Text className="text-base text-gray-600 mb-4">
                    Choose your preferred date for {serviceName}
                </Text>

                {/* Show selected therapist info */}
                {therapistName && (
                    <View className="bg-white p-3 rounded-lg mb-4 shadow-sm">
                        <Text className="text-sm text-gray-600 mb-1">Selected Therapist:</Text>
                        <Text className="text-base font-semibold text-amber-800">{therapistName}</Text>
                    </View>
                )}

                {/* Availability info */}
                <View className="bg-green-50 p-2 rounded-md mb-4 border border-green-200">
                    <Text className="text-xs text-green-800 text-center font-semibold">
                        {loading
                            ? "Loading availability..."
                            : `${availableDates.length} days available in the next 3 months`
                        }
                    </Text>
                </View>

                {loading ? (
                    <View className="flex-1 justify-center items-center py-12">
                        <ActivityIndicator size="large" color="#9A563A" />
                        <Text className="mt-4 text-base text-gray-600">Loading available dates...</Text>
                    </View>
                ) : (
                    <>
                        <Calendar
                            current={today.toISOString().split('T')[0]}
                            minDate={minDate}
                            maxDate={maxDateString}
                            onDayPress={handleDateSelect}
                            markedDates={markedDates}
                            // Disable all dates by default - only available dates will be enabled
                            disableAllTouchEventsForDisabledDays={true}
                            enableSwipeMonths={true}
                            style={{
                                borderRadius: 12,         // your desired radius
                                elevation: 3,              // shadow on Android
                                overflow: 'hidden',        // important to make borderRadius work
                                backgroundColor: '#fff',   // optional for contrast
                            }}
                            theme={{
                                todayTextColor: '#9A563A',
                                selectedDayBackgroundColor: '#9A563A',
                                selectedDayTextColor: '#ffffff',
                                arrowColor: '#9A563A',
                                dotColor: '#9A563A',
                                disabledArrowColor: '#d9d9d9',
                                textDisabledColor: '#d9d9d9',
                                dayTextColor: '#000000',
                                monthTextColor: '#000000',
                                indicatorColor: '#9A563A',
                                textDayFontFamily: 'System',
                                textMonthFontFamily: 'System',
                                textDayHeaderFontFamily: 'System',
                                textDayFontWeight: '300',
                                textMonthFontWeight: '400',
                                textDayHeaderFontWeight: '400',
                                textDayFontSize: 16,
                                textMonthFontSize: 18,
                                textDayHeaderFontSize: 14,
                            }}
                            markingType={'simple'}
                            hideExtraDays={true}
                            firstDay={1} // Start week on Monday
                        />

                        {/* Legend */}
                        <View className="flex-row justify-center mt-4 gap-5">
                            <View className="flex-row items-center">
                                <View className="w-3 h-3 rounded-full bg-amber-800 mr-1.5" />
                                <Text className="text-xs text-gray-600">Available</Text>
                            </View>
                            <View className="flex-row items-center">
                                <View className="w-3 h-3 rounded-full bg-gray-300 mr-1.5" />
                                <Text className="text-xs text-gray-600">Unavailable</Text>
                            </View>
                        </View>

                        {/* Show selected date info */}
                        {selectedDate && (
                            <View className="bg-amber-800 p-3 rounded-lg mt-4">
                                <Text className="text-white text-center font-semibold">
                                    Selected: {formatDate(selectedDate)}
                                </Text>
                            </View>
                        )}
                    </>
                )}
            </View>

            <View className="p-4 bg-white border-t border-gray-200">
                <TouchableOpacity
                    className={`p-4 rounded-lg items-center ${(!selectedDate || loading) ? 'bg-gray-300' : 'bg-amber-800'
                        }`}
                    disabled={!selectedDate || loading}
                    onPress={handleContinue}
                >
                    {loading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text className="text-white text-base font-semibold">Continue</Text>
                    )}
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

export default withAuthGuard(BookingDateScreen);