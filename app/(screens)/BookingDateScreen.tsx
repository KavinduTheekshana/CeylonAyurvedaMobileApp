import React, { useState } from 'react';
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
    BookingDateScreen: { serviceId: number; serviceName: string; duration: number };
    BookingTimeScreen: {
        serviceId: number;
        serviceName: string;
        selectedDate: string;
        duration: number;
    };
};

// Type for the route
type BookingDateScreenRouteProp = RouteProp<RootStackParamList, 'BookingDateScreen'>;

// Type for the navigation
type BookingDateScreenNavigationProp = StackNavigationProp<RootStackParamList>;

const BookingDateScreen = () => {
    const route = useRoute<BookingDateScreenRouteProp>();
    const navigation = useNavigation<BookingDateScreenNavigationProp>();
    const { serviceId, serviceName, duration } = route.params;

    const [selectedDate, setSelectedDate] = useState<string>('');
    const [markedDates, setMarkedDates] = useState<any>({});
    const [loading, setLoading] = useState<boolean>(false);

    // Calculate the minimum date (today)
    const today = new Date();
    const minDate = today.toISOString().split('T')[0];

    // Calculate the maximum date (3 months from today)
    const maxDate = new Date(today);
    maxDate.setMonth(maxDate.getMonth() + 3);
    const maxDateString = maxDate.toISOString().split('T')[0];

    React.useLayoutEffect(() => {
        navigation.setOptions({
            title: `Select Date - ${serviceName}`,
            headerLeft: () => (
                <HeaderBackButton
                    onPress={() => navigation.goBack()}
                    tintColor="#000"
                />
            ),
        });
    }, [navigation, serviceName]);

    const handleDateSelect = (date: any) => {
        // Update the selected date
        const dateString = date.dateString;

        // Update the marked dates object
        const updatedMarkedDates: any = {};
        updatedMarkedDates[dateString] = {
            selected: true,
            selectedColor: '#9A563A',
        };

        setSelectedDate(dateString);
        setMarkedDates(updatedMarkedDates);
    };

    const handleContinue = () => {
        if (!selectedDate) {
            return; // Don't proceed if no date is selected
        }

        // Navigate to time selection screen (you'll need to create this screen)
        navigation.navigate('BookingTimeScreen', {
            serviceId,
            serviceName,
            selectedDate,
            duration
        });
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.calendarContainer}>
                <Text style={styles.title}>Select a Date</Text>
                <Text style={styles.subtitle}>
                    Please select your preferred date for the {serviceName} service
                </Text>

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
                    }}
                />
            </View>

            <View style={styles.footer}>
                <TouchableOpacity
                    style={[
                        styles.continueButton,
                        !selectedDate ? styles.continueButtonDisabled : null
                    ]}
                    disabled={!selectedDate}
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
        marginBottom: 24,
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

export default BookingDateScreen;