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
import { fetchBookingCountData } from '../utils/booking';

// Define your Service type with booking_count added
type Service = {
    id: number;
    title: string;
    subtitle: string;
    price: number;
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

const ServiceDetailsScreen = () => {
    const router = useRouter();
    const navigation = useNavigation();
    const params = useLocalSearchParams();
    const [isGuest, setIsGuest] = useState<boolean>(false);
    const [authModalVisible, setAuthModalVisible] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(false);
    const [bookingData, setBookingData] = useState<{count: number, max: number}>({
        count: 0,
        max: 80 // Maximum capacity
    });

    // Check if user is a guest
    useEffect(() => {
        const checkUserMode = async () => {
            const userMode = await AsyncStorage.getItem('user_mode');
            setIsGuest(userMode === 'guest');
        };
        
        checkUserMode();
    }, []);

    // Parse the service data from the params
    let service: Service;
    try {
        // Check if we have a params.service
        if (!params.service) {
          console.log('No service data found in params:', params);
          throw new Error('No service data provided');
        }

        // Try to parse the service JSON
        if (typeof params.service === 'string') {
          try {
            service = JSON.parse(params.service);
            console.log('Successfully parsed service JSON:', service);
          } catch (parseError) {
            console.error('Failed to parse service JSON:', parseError, params.service);
            throw new Error('Invalid service data format');
          }
        } else {
          // Handle case where params.service is already an object
          service = params.service as any;
          console.log('Service data is already an object:', service);
        }

        // Validate that we have the required properties
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

    // Fetch booking count data
 useEffect(() => {
    const loadBookingData = async () => {
        setLoading(true);
        try {
            // Use the utility function that includes fallback logic
            const bookingData = await fetchBookingCountData(service.id, API_BASE_URL);
            setBookingData(bookingData);
        } catch (error) {
            console.error('Error loading booking data:', error);
            // The fallback is already handled in fetchBookingCountData
        } finally {
            setLoading(false);
        }
    };
    
    loadBookingData();
}, [service.id]);

    // For debugging - check what data we actually have
    console.log('Service details data:', service);

    const handleBookNow = () => {
        // If guest, show auth modal
        if (isGuest) {
            setAuthModalVisible(true);
            return;
        }
        
        // Otherwise, proceed to booking flow
        router.push({
            pathname: "/(screens)/BookingDateScreen",
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
                        <View style={styles.infoBox}>
                            <Text style={styles.infoLabel}>Price</Text>
                            <Text style={styles.infoValue}>£{service.price}</Text>
                        </View>

                        <View style={styles.infoBox}>
                            <Text style={styles.infoLabel}>Duration</Text>
                            <Text style={styles.infoValue}>{service.duration} min</Text>
                        </View>
                    </View>

                    {/* Booking Progress Bar */}
                    <View style={styles.bookingProgressContainer}>
                        {loading ? (
                            <ActivityIndicator size="small" color="#9A563A" style={{marginVertical: 20}} />
                        ) : (
                            <BookingProgressBar 
                                current={bookingData.count} 
                                max={bookingData.max}
                                label="Booking Popularity" 
                            />
                        )}
                           <Text style={styles.infoLabel}>Once you've completed 80 bookings, one of our team members will get in touch with you. At that point, you'll also have the option to reschedule your booking if needed. For now, just choose a date and time to create your pre booking.</Text>
                    </View>

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
                <TouchableOpacity style={styles.bookButton} onPress={handleBookNow}>
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
});

export default ServiceDetailsScreen;