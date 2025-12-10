import React, { useState, useEffect } from 'react';
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
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from "@/config/api";
import { getTherapistDisplayName } from '@/utils/therapistUtils';

// Define booking type - UPDATED to include therapist information
type Booking = {
    id: number;
    service_id: number;
    service_name: string;
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
    original_price?: number; // Add this
    discount_amount?: number; // Add this
    coupon_code?: string; // Add this
    reference: string;
    status: string;
    therapist_id?: number;
    therapist_name?: string;
    therapist_nickname?: string | null;
    service?: {
        id: number;
        service_name: string;
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
    const { bookingId } = route.params;

    const [loading, setLoading] = useState<boolean>(true);
    const [booking, setBooking] = useState<Booking | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        navigation.setOptions({
            headerLeft: () => null,
            headerTitle: "Booking Confirmation",
            headerBackVisible: false,
            headerBackTitle: null,
            headerLeftContainerStyle: { width: 0 },
        })

        fetchBookingDetails();
    }, [bookingId, navigation]);

    const fetchBookingDetails = async () => {
        try {
            const token = await AsyncStorage.getItem('access_token');

            const headers: Record<string, string> = {
                'Content-Type': 'application/json'
            };

            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

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

    const formatTime12Hour = (timeString: string) => {
        try {
            let hours: number;
            let minutes: number;

            if (/^\d{2}:\d{2}$/.test(timeString)) {
                const [h, m] = timeString.split(':').map(Number);
                hours = h;
                minutes = m;
            }
            else if (timeString.includes('T')) {
                const date = new Date(timeString);
                hours = date.getUTCHours();
                minutes = date.getUTCMinutes();
            }
            else if (/^\d{2}:\d{2}:\d{2}$/.test(timeString)) {
                const [h, m] = timeString.substring(0, 5).split(':').map(Number);
                hours = h;
                minutes = m;
            }
            else {
                return timeString;
            }

            const period = hours >= 12 ? 'PM' : 'AM';
            const displayHours = hours % 12 || 12;

            return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
        } catch (error) {
            console.error('Error formatting time:', error);
            return timeString;
        }
    };

    const handleReturnHome = () => {
        navigation.reset({
            index: 0,
            routes: [{ name: 'Home' }],
        });
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#9A563A" />
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
                            <Text style={styles.detailValue} numberOfLines={2} ellipsizeMode="tail">
                                {booking.service_name || 'N/A'}
                            </Text>
                        </View>
                        {booking.therapist_name && (
                            <View style={styles.detailRow}>
                                <Text style={styles.detailLabel}>Therapist:</Text>
                                <Text style={styles.detailValue}>
                                    {getTherapistDisplayName({
                                        name: booking.therapist_name,
                                        nickname: booking.therapist_nickname
                                    })}
                                </Text>
                            </View>
                        )}
                        <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>Date:</Text>
                            <Text style={styles.detailValue}>{formatDate(booking.date)}</Text>
                        </View>
                        <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>Time:</Text>
                            <Text style={styles.detailValue}>{formatTime12Hour(booking.time)}</Text>
                        </View>

                        {/* Price Information with Discount */}
                        {booking.original_price && booking.discount_amount && booking.discount_amount > 0 ? (
                            <>
                                <View style={styles.detailRow}>
                                    <Text style={styles.detailLabel}>Original Price:</Text>
                                    <Text style={[styles.detailValue, styles.originalPriceText]}>
                                        £{booking.original_price.toFixed(2)}
                                    </Text>
                                </View>
                                {booking.coupon_code && (
                                    <View style={styles.detailRow}>
                                        <Text style={styles.detailLabel}>Coupon Applied:</Text>
                                        <Text style={[styles.detailValue, styles.couponText]}>
                                            {booking.coupon_code}
                                        </Text>
                                    </View>
                                )}
                                <View style={styles.detailRow}>
                                    <Text style={styles.detailLabel}>Discount:</Text>
                                    <Text style={[styles.detailValue, styles.discountText]}>
                                        -£{booking.discount_amount.toFixed(2)}
                                    </Text>
                                </View>
                                <View style={styles.detailRow}>
                                    <Text style={styles.detailLabel}>Final Price:</Text>
                                    <Text style={[styles.detailValue, styles.finalPriceText]}>
                                        £{booking.price.toFixed(2)}
                                    </Text>
                                </View>
                            </>
                        ) : (
                            <View style={styles.detailRow}>
                                <Text style={styles.detailLabel}>Price:</Text>
                                <Text style={styles.detailValue}>£{booking.price}</Text>
                            </View>
                        )}

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
                    {/* NEW: Additional information about therapist */}
                    {booking?.therapist_name && (
                        <Text style={styles.infoText}>
                            Your appointment is scheduled with {getTherapistDisplayName({
                                name: booking.therapist_name,
                                nickname: booking.therapist_nickname
                            })}. Please arrive 10 minutes early for your session.
                        </Text>
                    )}
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
        shadowOffset: { width: 0, height: 1 },
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
        flex: 1,
    },
    detailValue: {
        fontSize: 16,
        fontWeight: '500',
        color: '#333',
        flex: 2,
        flexWrap: 'wrap',
        textAlign: 'right',
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
    originalPriceText: {
        textDecorationLine: 'line-through',
        color: '#888',
    },
    couponText: {
        color: '#10B981',
        fontWeight: '600',
    },
    discountText: {
        color: '#E53E3E',
        fontWeight: '600',
    },
    finalPriceText: {
        color: '#9A563A',
        fontWeight: 'bold',
        fontSize: 18,
    },
});

export default BookingConfirmationScreen;