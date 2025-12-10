// app/(screens)/ServiceDetails.tsx - Updated with offer support

import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    Image,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    SafeAreaView,
    ActivityIndicator,
    Alert
} from 'react-native';
import { useLocalSearchParams, useRouter, useNavigation } from 'expo-router';
import { Feather } from "@expo/vector-icons";
import { HeaderBackButton } from "@react-navigation/elements";
import AsyncStorage from '@react-native-async-storage/async-storage';
import AuthRequiredModal from '../components/AuthRequiredModal';
import { API_BASE_URL } from "@/config/api";
import BookingProgressBar from '../components/BookingProgressBar';
import { fetchBookingCountData } from '@/utils/booking';

// Define your Service type with offer field added
type Service = {
    id: number;
    title: string;
    subtitle: string;
    price: number;
    discount_price?: number | null;
    offer: number; // Added offer field (0 or 1)
    duration: number;
    benefits: string;
    image: string | null;
    description?: string;
    booking_count?: number;
    treatment?: {
        id: number;
        name: string;
    };
};

// Define Booking type
interface UserBooking {
    id: number;
    service_id: number;
    status: string;
}

const ServiceDetailsScreen = () => {
    const router = useRouter();
    const navigation = useNavigation();
    const params = useLocalSearchParams();
    const [isGuest, setIsGuest] = useState<boolean>(false);
    const [authModalVisible, setAuthModalVisible] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(false);
    const [bookingData, setBookingData] = useState<{ count: number, max: number }>({
        count: 0,
        max: 80 // Maximum capacity
    });
    const [userBookings, setUserBookings] = useState<UserBooking[]>([]);
    const [hasBookedThisService, setHasBookedThisService] = useState<boolean>(false);
    const [loadingBookings, setLoadingBookings] = useState<boolean>(false);

    // Helper function to check if service is free
    const isServiceFree = (service: Service): boolean => {
        return (
            service.discount_price !== null &&
            service.discount_price !== undefined &&
            parseFloat(String(service.discount_price)) === 0
        );
    };

    // Helper function to check if service has an offer
    const hasOffer = (service: Service): boolean => {
        return service.offer === 1;
    };

    // Check if user is a guest
    useEffect(() => {
        const checkUserMode = async () => {
            const userMode = await AsyncStorage.getItem('user_mode');
            setIsGuest(userMode === 'guest');

            // If not a guest, fetch their bookings
            if (userMode !== 'guest') {
                fetchUserBookings();
            }
        };

        checkUserMode();
    }, []);

    // Fetch user's booking history
    const fetchUserBookings = async () => {
        setLoadingBookings(true);
        try {
            const token = await AsyncStorage.getItem('access_token');

            if (!token) {
                console.log('No auth token - cannot fetch bookings');
                return;
            }

            const response = await fetch(`${API_BASE_URL}/api/auth/bookings/list`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            });

            const data = await response.json();

            setUserBookings(data.data);
            const serviceBooked = data.data.some((booking: UserBooking) =>
                booking.service_id === service.id
            );

            setHasBookedThisService(serviceBooked);
            // console.log('Has user booked this service?', serviceBooked);
        } catch (error) {
            console.error('Error fetching user bookings:', error);
        } finally {
            setLoadingBookings(false);
        }
    };

    // Parse the service data from the params
    let service: Service;
    try {
        if (!params.service) {
            console.log('No service data found in params:', params);
            throw new Error('No service data provided');
        }

        if (typeof params.service === 'string') {
            try {
                service = JSON.parse(params.service);
                // console.log('Successfully parsed service JSON:', service);
            } catch (parseError) {
                console.error('Failed to parse service JSON:', parseError, params.service);
                throw new Error('Invalid service data format');
            }
        } else {
            service = params.service as any;
            console.log('Service data is already an object:', service);
        }

        if (!service.id || !service.title) {
            console.error('Service data missing required properties:', service);
            throw new Error('Incomplete service data');
        }

        // Set the header title to the service title
        useEffect(() => {
            navigation.setOptions({
                title: service.title,
                headerLeft: () => (
                    <HeaderBackButton
                        onPress={() => {
                            if (navigation.canGoBack()) {
                                navigation.goBack();
                            } else {
                                navigation.goBack();
                            }
                        }}
                        tintColor="#000"
                    />
                ),
            });
        }, [navigation, service.title, router]);

    } catch (e) {
        console.error('Error handling service data:', e);
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>Error loading service details: {(e as Error).message}</Text>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => router.back()}>
                        <Text style={styles.backButtonText}>Go Back</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    // Fetch booking count data - only if service has an offer
    useEffect(() => {
        const loadBookingData = async () => {
            // Only fetch booking data if the service has an offer
            if (!hasOffer(service)) {
                return;
            }

            setLoading(true);
            try {
                const bookingData = await fetchBookingCountData(service.id, API_BASE_URL);
                setBookingData(bookingData);
            } catch (error) {
                console.error('Error loading booking data:', error);
            } finally {
                setLoading(false);
            }
        };

        loadBookingData();
    }, [service.id]);

    // Determine if Book Now button should be disabled - only for free services with offers
    const shouldDisableBookButton = hasOffer(service) && isServiceFree(service) && hasBookedThisService;

    const handleBookNow = () => {
        // If guest, show auth modal
        if (isGuest) {
            setAuthModalVisible(true);
            return;
        }

        // If free service with offer and already booked, show message but don't proceed
        if (hasOffer(service) && isServiceFree(service) && hasBookedThisService) {
            Alert.alert(
                "Booking Limit Reached",
                "You've already booked this free service. Each user can book a free service only once.",
                [{ text: "OK" }]
            );
            return;
        }

        // Navigate to therapist selection screen
        router.push({
            pathname: "/(screens)/BookingVisitTypeScreen",
            params: {
                serviceId: service.id,
                serviceName: service.title,
                duration: service.duration
            }
        });
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView>
                {service.image && (
                    <Image
                        source={{ uri: service.image }}
                        style={styles.image}
                        resizeMode="cover"
                    />
                )}

                <View style={styles.contentContainer}>
                    <Text style={styles.title}>{service.title}</Text>
                    {service.subtitle && (
                        <Text style={styles.subtitle}>{service.subtitle}</Text>
                    )}

                    <View style={styles.infoRow}>
                        {(() => {
                            const isFreeService = service.discount_price !== null &&
                                service.discount_price !== undefined &&
                                parseFloat(String(service.discount_price)) === 0;

                            return (
                                <>
                                    <View style={[
                                        styles.infoBox,
                                        isFreeService && hasOffer(service) && styles.freeServiceInfoBox
                                    ]}>
                                        <Text style={styles.infoLabel}>Price</Text>
                                        {service.discount_price !== null && service.discount_price !== undefined ? (
                                            isFreeService && hasOffer(service) ? (
                                                <Text style={styles.freePrice}>FREE</Text>
                                            ) : (
                                                <View style={styles.priceContainer}>
                                                    <Text style={styles.discountPrice}>£{service.discount_price}</Text>
                                                    <Text style={styles.originalPrice}>£{service.price}</Text>
                                                </View>
                                            )
                                        ) : (
                                            <Text style={styles.infoValue}>£{service.price}</Text>
                                        )}
                                    </View>

                                    <View style={styles.infoBox}>
                                        <Text style={styles.infoLabel}>Duration</Text>
                                        <Text style={styles.infoValue}>{service.duration} min</Text>
                                    </View>
                                </>
                            );
                        })()}
                    </View>

                    {/* Booking Progress Bar - ONLY shown when service has offer enabled */}
                    {hasOffer(service) && (
                        <View style={styles.bookingProgressContainer}>
                            {loading ? (
                                <ActivityIndicator size="small" color="#9A563A" style={{ marginVertical: 20 }} />
                            ) : (
                                <BookingProgressBar
                                    current={bookingData.count}
                                    max={bookingData.max}
                                    label="Booking Popularity"
                                />
                            )}
                            <Text style={styles.infoLabel}>
                                Once you've completed 80 bookings, one of our team members will get in touch with you. 
                                At that point, you'll also have the option to reschedule your booking if needed. 
                                For now, just choose a date and time to create your pre booking.
                            </Text>

                            {isServiceFree(service) && (
                                hasBookedThisService ? (
                                    <View style={styles.alreadyBookedContainer}>
                                        <Feather name="check-circle" size={16} color="#F44336" style={{ marginRight: 5 }} />
                                        <Text style={styles.alreadyBookedText}>
                                            You have already booked this free service.
                                        </Text>
                                    </View>
                                ) : (
                                    <View style={styles.freeServiceLimitBox}>
                                        <Feather name="info" size={16} color="#9A563A" style={{ marginRight: 8 }} />
                                        <Text style={styles.freeServiceLimitText}>
                                            Note: Free services are limited to one booking per user.
                                        </Text>
                                    </View>
                                )
                            )}
                        </View>
                    )}

             

                    {service.benefits && (
                        <View style={styles.descriptionContainer}>
                            <Text style={styles.descriptionTitle}>Benefits</Text>
                            <Text style={styles.description}>{service.benefits}</Text>
                        </View>
                    )}

                    {service.description && (
                        <View style={styles.descriptionContainer} className="mt-5">
                            <Text style={styles.descriptionTitle}>Description</Text>
                            <Text style={styles.description}>{service.description}</Text>
                        </View>
                    )}
                </View>
            </ScrollView>

            <View style={styles.footer}>
                <TouchableOpacity
                    style={[
                        styles.bookButton,
                        shouldDisableBookButton && styles.disabledBookButton
                    ]}
                    onPress={handleBookNow}
                    disabled={shouldDisableBookButton}
                >
                    <Text style={styles.bookButtonText}>Book Now</Text>
                </TouchableOpacity>
            </View>

            {/* Auth Required Modal */}
            <AuthRequiredModal
                visible={authModalVisible}
                onClose={() => setAuthModalVisible(false)}
                message="Please login or create an account to book this service"
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    errorText: {
        fontSize: 18,
        color: 'red',
        marginBottom: 20,
    },
    backButton: {
        backgroundColor: '#9A563A',
        padding: 12,
        borderRadius: 8,
    },
    backButtonText: {
        color: '#fff',
        fontSize: 16,
    },
    image: {
        width: '100%',
        height: 250,
    },
    contentContainer: {
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
    infoRow: {
        flexDirection: 'row',
        marginBottom: 24,
    },
    infoBox: {
        flex: 1,
        backgroundColor: '#fff',
        padding: 12,
        borderRadius: 8,
        marginRight: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 1,
        elevation: 1,
    },
    freeServiceInfoBox: {
        backgroundColor: '#E8F5E9',
        borderWidth: 1,
        borderColor: '#81C784',
    },
    infoLabel: {
        fontSize: 12,
        color: '#777',
        marginBottom: 4,
    },
    infoValue: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
    },
    priceContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    discountPrice: {
        fontSize: 18,
        fontWeight: '600',
        color: '#9A563A',
    },
    originalPrice: {
        fontSize: 14,
        textDecorationLine: 'line-through',
        color: '#999',
        marginLeft: 8,
    },
    freePrice: {
        fontSize: 18,
        fontWeight: '700',
        color: '#2E7D32',
    },
    bookingProgressContainer: {
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
    offerBadgeContainer: {
        alignItems: 'center',
        marginBottom: 16,
    },
    offerBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FF4081',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 3,
    },
    offerBadgeText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
        marginLeft: 6,
    },
    descriptionContainer: {
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 1,
        marginTop: 10,
    },
    descriptionTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 12,
    },
    description: {
        fontSize: 14,
        lineHeight: 22,
        color: '#444',
    },
    footer: {
        padding: 16,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#eee',
    },
    bookButton: {
        backgroundColor: '#9A563A',
        padding: 16,
        borderRadius: 8,
        alignItems: 'center',
    },
    bookButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    disabledBookButton: {
        backgroundColor: '#cccccc',
    },
    alreadyBookedContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 10,
        padding: 10,
        backgroundColor: '#FFEBEE',
        borderRadius: 6,
        borderWidth: 1,
        borderColor: '#FFCDD2',
    },
    alreadyBookedText: {
        color: '#D32F2F',
        fontSize: 14,
        fontWeight: '500',
        flex: 1,
    },
    freeServiceLimitBox: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 10,
        padding: 10,
        backgroundColor: '#FFF8E1',
        borderRadius: 6,
        borderWidth: 1,
        borderColor: '#FFECB3',
    },
    freeServiceLimitText: {
        color: '#9A563A',
        fontSize: 14,
        fontWeight: '500',
        flex: 1,
    },
});

export default ServiceDetailsScreen;