import React, {useState, useEffect} from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    SafeAreaView,
    ActivityIndicator,
    ScrollView,
    Alert,
    Image
} from 'react-native';
import {useRoute, RouteProp, useNavigation} from '@react-navigation/native';
import {StackNavigationProp} from '@react-navigation/stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {API_BASE_URL} from "@/config/api";

// Define booking type
type Booking = {
    id: number;
    service_id: number;
    user_id: number | null;
    date: string;
    time: string;
    name: string;
    email: string;
    phone: string;
    address_line1: string;
    address_line2: string | null;
    city: string;
    postcode: string;
    notes: string | null;
    price: number;
    reference: string;
    status: string;
    service?: {
        id: number;
        title: string;
        subtitle: string;
        price: number;
        duration: number;
    };
};

// Define your navigation param list
type RootStackParamList = {
    Home: undefined;
    BookingConfirmationScreen: {
        bookingId: number;
    };
};

// Type for the route
type BookingConfirmationScreenRouteProp = RouteProp<RootStackParamList, 'BookingConfirmationScreen'>;

// Type for the navigation
type BookingConfirmationScreenNavigationProp = StackNavigationProp<RootStackParamList>;

const BookingConfirmationScreen = () => {
    const route = useRoute<BookingConfirmationScreenRouteProp>();
    const navigation = useNavigation<BookingConfirmationScreenNavigationProp>();
    const {bookingId} = route.params;

    const [loading, setLoading] = useState<boolean>(true);
    const [booking, setBooking] = useState<Booking | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchBookingDetails();
    }, [bookingId]);

    const fetchBookingDetails = async () => {
        try {
            // Get auth token
            const token = await AsyncStorage.getItem('access_token');

            // Headers
            const headers: Record<string, string> = {
                'Content-Type': 'application/json'
            };

            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            // Fetch booking details
            const response = await fetch(`${API_BASE_URL}/api/bookings/${bookingId}`, {
                headers
            });
            console.log(`${API_BASE_URL}/api/bookings/${bookingId}`);
            const data = await response.json();

            if (data.success && data.data) {
                setBooking(data.data);
            } else {
                setError('Could not retrieve booking details. Please check your email for confirmation.');
            }
        } catch (error) {
            console.error('Error fetching booking details:', error);
            setError('Network error. Please check your connection and try again.');
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString: string) => {
        const options: Intl.DateTimeFormatOptions = {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        };
        return new Date(dateString).toLocaleDateString(undefined, options);
    };

    const handleReturnHome = () => {
        navigation.reset({
            index: 0,
            routes: [{name: 'Home'}],
        });
    };



    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#9A563A"/>
                <Text style={styles.loadingText}>Loading booking confirmation...</Text>
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView style={styles.content}>
                <View style={styles.header}>
                    <View style={styles.checkmarkCircle}>
                        <Text style={styles.checkmark}>✓</Text>
                    </View>
                    <Text style={styles.title}>Booking Confirmed!</Text>
                    <Text style={styles.subtitle}>
                        Thank you for your booking. We look forward to seeing you soon!
                    </Text>
                </View>

                {booking ? (
                    <View style={styles.card}>
                        <Text style={styles.sectionTitle}>Booking Details</Text>
                        <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>Reference:</Text>
                            <Text style={styles.detailValue}>{booking.reference}</Text>
                        </View>
                        <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>Service:</Text>
                            <Text style={styles.detailValue}>{booking.service_name || 'N/A'}</Text>
                        </View>
                        <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>Date:</Text>
                            <Text style={styles.detailValue}>{formatDate(booking.date)}</Text>
                        </View>
                        <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>Time:</Text>
                            <Text style={styles.detailValue}>{booking.time}</Text>
                        </View>
                        <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>Price:</Text>
                            <Text style={styles.detailValue}>£{booking.price}</Text>
                        </View>
                        <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>Status:</Text>
                            <Text style={[styles.detailValue, styles.statusText]}>
                                {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                            </Text>
                        </View>
                    </View>
                ) : (
                    <View style={styles.card}>
                        <Text style={styles.errorText}>
                            {error || 'Your booking has been confirmed but details are not available at the moment.'}
                        </Text>
                        <Text style={styles.alternateText}>
                            Please check your email for confirmation details.
                        </Text>
                    </View>
                )}

                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>What's Next?</Text>
                    <Text style={styles.infoText}>
                        We've sent a confirmation email to your email address with all the details of your booking.
                    </Text>
                    <Text style={styles.infoText}>
                        If you need to change or cancel your appointment, please contact us at least 24 hours in
                        advance.
                    </Text>
                </View>

                <TouchableOpacity
                    style={styles.homeButton}
                    onPress={handleReturnHome}
                >
                    <Text style={styles.homeButtonText}>Return to Home</Text>
                </TouchableOpacity>
            </ScrollView>
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
    header: {
        alignItems: 'center',
        marginBottom: 24,
        paddingVertical: 20,
    },
    checkmarkCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#9A563A',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    checkmark: {
        color: '#fff',
        fontSize: 40,
        fontWeight: 'bold',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 8,
        color: '#333',
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        paddingHorizontal: 20,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 8,
        padding: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 1},
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 12,
        color: '#333',
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    detailLabel: {
        fontSize: 16,
        color: '#555',
    },
    detailValue: {
        fontSize: 16,
        fontWeight: '500',
        color: '#333',
    },
    statusText: {
        color: '#9A563A',
        fontWeight: 'bold',
    },
    errorText: {
        fontSize: 16,
        color: '#d32f2f',
        marginBottom: 12,
    },
    alternateText: {
        fontSize: 14,
        color: '#666',
    },
    infoText: {
        fontSize: 15,
        color: '#555',
        marginBottom: 12,
        lineHeight: 22,
    },
    homeButton: {
        backgroundColor: '#9A563A',
        padding: 16,
        borderRadius: 8,
        alignItems: 'center',
        marginVertical: 24,
    },
    homeButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
});

export default BookingConfirmationScreen;