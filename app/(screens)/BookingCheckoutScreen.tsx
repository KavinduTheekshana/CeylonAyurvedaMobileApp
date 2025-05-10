import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    SafeAreaView,
    ActivityIndicator,
    ScrollView,
    TextInput,
    Alert,
    KeyboardAvoidingView,
    Platform,
    Keyboard
} from 'react-native';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import withAuthGuard from '../components/AuthGuard';
import { StackNavigationProp } from '@react-navigation/stack';
import { HeaderBackButton } from '@react-navigation/elements';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from "@/config/api";

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

// Define address type
type Address = {
    id: number;
    name: string;
    phone: string;
    email: string;
    address_line1: string;
    address_line2?: string;
    city: string;
    postcode: string;
    is_default: boolean;
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
    BookingConfirmationScreen: {
        bookingId: number;
    };
    AddAddressScreen: undefined;
};

// Type for the route
type BookingCheckoutScreenRouteProp = RouteProp<RootStackParamList, 'BookingCheckoutScreen'>;

// Type for the navigation
type BookingCheckoutScreenNavigationProp = StackNavigationProp<RootStackParamList>;

// API URLs - Fixed URL paths
const SERVICE_API_URL = `${API_BASE_URL}/api/services`;
const ADDRESS_API_URL = `${API_BASE_URL}/api/addresses`;
const BOOKING_API_URL = `${API_BASE_URL}/api/bookings`;

const BookingCheckoutScreen = () => {
    const route = useRoute<BookingCheckoutScreenRouteProp>();
    const navigation = useNavigation<BookingCheckoutScreenNavigationProp>();
    const { serviceId, serviceName, selectedDate, selectedTime, duration } = route.params;

    // States
    const [loading, setLoading] = useState<boolean>(true);
    const [submitting, setSubmitting] = useState<boolean>(false);
    const [serviceDetails, setServiceDetails] = useState<Service | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [savedAddresses, setSavedAddresses] = useState<Address[]>([]);
    const [showAddressForm, setShowAddressForm] = useState<boolean>(false);
    const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

    // Form fields
    const [name, setName] = useState<string>('');
    const [email, setEmail] = useState<string>('');
    const [phone, setPhone] = useState<string>('');
    const [addressLine1, setAddressLine1] = useState<string>('');
    const [addressLine2, setAddressLine2] = useState<string>('');
    const [city, setCity] = useState<string>('');
    const [postcode, setPostcode] = useState<string>('');
    const [notes, setNotes] = useState<string>('');
    const [saveAddress, setSaveAddress] = useState<boolean>(true);

    useEffect(() => {
        // Check if user is authenticated
        checkAuthentication();

        // Fetch service details and bookings addresses in parallel
        Promise.all([
            fetchServiceDetails(),
            fetchSavedAddresses()
        ]).then(() => {
            setLoading(false);
        }).catch(error => {
            console.error('Error initializing checkout:', error);
            setLoading(false);
        });
    }, [serviceId]);

    // Add listener for when screen comes into focus to refresh addresses
    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', () => {
            if (isAuthenticated) {
                fetchSavedAddresses();
            }
        });

        return unsubscribe;
    }, [navigation, isAuthenticated]);

    const checkAuthentication = async () => {
        try {
            const token = await AsyncStorage.getItem('access_token');
            // Log token retrieval status (helpful for debugging Android issues)
            console.log('Authentication check - token exists:', !!token);
            setIsAuthenticated(!!token);
        } catch (error) {
            console.error('Error checking authentication:', error);
            setIsAuthenticated(false);
        }
    };

    const fetchServiceDetails = async () => {
        try {
            // Get the service details from the API - FIXED URL PATH
            const response = await fetch(`${SERVICE_API_URL}/detail/${serviceId}`);

            console.log('Fetching service details from:', `${SERVICE_API_URL}/detail/${serviceId}`);

            const data = await response.json();
            console.log('Service data response:', data);

            if (data.success && data.data) {
                setServiceDetails(data.data);
            } else {
                // If API returns an error
                console.error('API error response:', data);
                setError('Could not retrieve service details. Please try again.');

                // Create a placeholder service for testing
                setServiceDetails({
                    id: serviceId,
                    title: serviceName,
                    subtitle: 'Service details',
                    price: 75, // Sample price
                    duration: duration,
                    benefits: '',
                    image: null
                });
            }
        } catch (error) {
            console.error('Error fetching service details:', error);
            setError('Network error. Please check your connection and try again.');

            // Create a placeholder service for testing
            setServiceDetails({
                id: serviceId,
                title: serviceName,
                subtitle: 'Service details',
                price: 75, // Sample price
                duration: duration,
                benefits: '',
                image: null
            });
        }
    };

    const fetchSavedAddresses = async () => {
        try {
            // Get the authentication token from AsyncStorage
            const token = await AsyncStorage.getItem('access_token');
            console.log('Token for address fetch:', token ? 'Token found' : 'No token');

            if (!token) {
                console.log('No authentication token found');
                setShowAddressForm(true);
                return;
            }

            // Get the user's bookings addresses with authentication token
            const response = await fetch(ADDRESS_API_URL, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json' // Added for Android compatibility
                }
            });

            const data = await response.json();
            console.log('Address data response:', data.success ? 'Success' : 'Failed');

            if (data.success && Array.isArray(data.data)) {
                setSavedAddresses(data.data);

                // If there's a default address, select it
                const defaultAddress = data.data.find((address: Address) => address.is_default);
                if (defaultAddress) {
                    setSelectedAddressId(defaultAddress.id);
                    prefillAddressForm(defaultAddress);
                } else if (data.data.length > 0) {
                    // Otherwise select the first address
                    setSelectedAddressId(data.data[0].id);
                    prefillAddressForm(data.data[0]);
                } else {
                    // If no addresses, show the form
                    setShowAddressForm(true);
                }
            } else {
                // If no bookings addresses or error, show the form
                setShowAddressForm(true);
            }
        } catch (error) {
            console.error('Error fetching bookings addresses:', error);
            // If error fetching addresses, show the form
            setShowAddressForm(true);
        }
    };

    const prefillAddressForm = (address: Address) => {
        setName(address.name);
        setPhone(address.phone);
        setEmail(address.email);
        setAddressLine1(address.address_line1);
        setAddressLine2(address.address_line2 || '');
        setCity(address.city);
        setPostcode(address.postcode);
    };

    const selectAddress = (addressId: number) => {
        setSelectedAddressId(addressId);
        const selectedAddress = savedAddresses.find(addr => addr.id === addressId);
        if (selectedAddress) {
            prefillAddressForm(selectedAddress);
        }
    };

    const navigateToAddAddressScreen = () => {
        navigation.navigate('AddAddressScreen');
    };

    React.useLayoutEffect(() => {
        navigation.setOptions({
            title: 'Complete Booking',
            headerLeft: () => (
                <HeaderBackButton
                    onPress={() => navigation.goBack()}
                    tintColor="#000"
                />
            ),
        });
    }, [navigation]);

    const formatDate = (dateString: string) => {
        const options: Intl.DateTimeFormatOptions = {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        };
        return new Date(dateString).toLocaleDateString(undefined, options);
    };

    const validateForm = () => {
        // Basic validation
        if (!name.trim()) {
            Alert.alert('Error', 'Please enter your name');
            return false;
        }

        if (!email.trim()) {
            Alert.alert('Error', 'Please enter your email');
            return false;
        }

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            Alert.alert('Error', 'Please enter a valid email address');
            return false;
        }

        if (!phone.trim()) {
            Alert.alert('Error', 'Please enter your phone number');
            return false;
        }

        if (!addressLine1.trim() || !city.trim() || !postcode.trim()) {
            Alert.alert('Error', 'Please enter your complete address');
            return false;
        }

        return true;
    };

    const handleSubmitBooking = async () => {
        if (!validateForm()) return;
        if (!serviceDetails) return;

        // Dismiss keyboard before submission (helps on Android)
        Keyboard.dismiss();

        setSubmitting(true);

        // Prepare the booking data to match your backend structure
        const bookingData = {
            service_id: serviceId,
            date: selectedDate,
            time: selectedTime,
            name,
            email,
            phone,
            address_line1: addressLine1,
            address_line2: addressLine2,
            city,
            postcode,
            notes,
            save_address: saveAddress // Make sure this is being sent as a boolean
        };

        console.log('Booking data being sent:', JSON.stringify(bookingData));

        try {
            // Get the authentication token
            const token = await AsyncStorage.getItem('access_token');

            // Set up request headers
            const headers: Record<string, string> = {
                'Content-Type': 'application/json',
                'Accept': 'application/json' // Add Accept header for Android compatibility
            };

            // Add auth token if available
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
                console.log('Sending request with auth token');
            } else {
                console.log('No auth token available - addresses will not be saved');
            }

            console.log('Submitting booking to:', BOOKING_API_URL);

            // Send booking data to the API with timeout for Android
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

            const response = await fetch(BOOKING_API_URL, {
                method: 'POST',
                headers,
                body: JSON.stringify(bookingData),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            // Check for network issues
            if (!response.ok) {
                console.error('Server response not ok:', response.status, response.statusText);
                throw new Error(`Server responded with status: ${response.status}`);
            }

            const data = await response.json();
            console.log('Booking response:', data);

            if (data.success && data.data && data.data.id) {
                // Navigate to confirmation screen
                try {
                    navigation.navigate('BookingConfirmationScreen', {
                        bookingId: data.data.id
                    });
                } catch (navError) {
                    console.error('Navigation error:', navError);
                    // Fallback if navigation fails
                    Alert.alert(
                        'Booking Successful',
                        'Your appointment has been booked successfully. You will receive a confirmation email shortly.',
                        [
                            {
                                text: 'OK',
                                onPress: () => navigation.navigate('Home')
                            }
                        ]
                    );
                }
            } else {
                Alert.alert('Error', data.message || 'Failed to create booking. Please try again.');
            }
        } catch (error) {
            console.error('Booking submission error:', error);

            // More detailed error handling for Android
            let errorMessage = 'Network error occurred.';

            if (error instanceof TypeError) {
                errorMessage = 'Network connection issue. Please check your internet connection.';
            } else if (error instanceof Error) {
                errorMessage = error.message;
            }

            // Show error alert but offer test success option in development
            Alert.alert(
                'Error',
                `There was an error processing your booking: ${errorMessage}. Would you like to see a test confirmation?`,
                [
                    {
                        text: 'Try Again',
                        style: 'cancel'
                    },
                    {
                        text: 'See Test Confirmation',
                        onPress: () => {
                            try {
                                navigation.navigate('BookingConfirmationScreen', {
                                    bookingId: 999 // Test booking ID
                                });
                            } catch (navError) {
                                console.error('Navigation error during test:', navError);
                                Alert.alert('Navigation Error', 'Could not navigate to confirmation screen.');
                            }
                        }
                    }
                ]
            );
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#9A563A" />
                <Text style={styles.loadingText}>Loading booking details...</Text>
            </View>
        );
    }

    if (error || !serviceDetails) {
        return (
            <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error || 'An unexpected error occurred.'}</Text>
                <TouchableOpacity
                    style={styles.retryButton}
                    onPress={() => {
                        setLoading(true);
                        fetchServiceDetails()
                            .then(() => setLoading(false))
                            .catch(() => setLoading(false));
                    }}
                >
                    <Text style={styles.retryButtonText}>Retry</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 40}
        >
            <SafeAreaView style={styles.container}>
                <ScrollView
                    style={styles.content}
                    keyboardShouldPersistTaps="handled" // Important for Android
                >
                    <Text style={styles.title}>Booking Summary</Text>

                    {/* Service Details */}
                    <View style={styles.card}>
                        <Text style={styles.sectionTitle}>Service Details</Text>
                        <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>Service:</Text>
                            <Text style={styles.detailValue} numberOfLines={2} ellipsizeMode="tail">{serviceDetails.title || 'N/A'}</Text>
                            {/* <Text style={styles.detailValue}>{serviceDetails.title}</Text> */}
                        </View>
                        <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>Duration:</Text>
                            <Text style={styles.detailValue}>{serviceDetails.duration} min</Text>
                        </View>
                        <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>Price:</Text>
                            <Text style={styles.detailValue}>£{serviceDetails.price}</Text>
                        </View>
                    </View>

                    {/* Appointment Details */}
                    <View style={styles.card}>
                        <Text style={styles.sectionTitle}>Appointment Details</Text>
                        <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>Date:</Text>
                            <Text style={styles.detailValue}>{formatDate(selectedDate)}</Text>
                        </View>
                        <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>Time:</Text>
                            <Text style={styles.detailValue}>{selectedTime}</Text>
                        </View>
                    </View>

                    {/* Add Address Button for Authenticated Users without Addresses */}
                    {isAuthenticated && savedAddresses.length === 0 && (
                        <View style={styles.card}>
                            <Text style={styles.sectionTitle}>Your Addresses</Text>
                            <Text style={styles.noAddressText}>You don't have any saved addresses.</Text>
                            <TouchableOpacity
                                style={styles.addNewAddressButton}
                                onPress={navigateToAddAddressScreen}
                            >
                                <Text style={styles.addNewAddressButtonText}>Add New Address</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    {/* Saved Addresses */}
                    {savedAddresses.length > 0 && (
                        <View style={styles.card}>
                            <Text style={styles.sectionTitle}>Your Addresses</Text>

                            {savedAddresses.map((address) => (
                                <TouchableOpacity
                                    key={address.id}
                                    style={[
                                        styles.addressOption,
                                        selectedAddressId === address.id && styles.selectedAddressOption
                                    ]}
                                    onPress={() => selectAddress(address.id)}
                                >
                                    <Text style={styles.addressName}>{address.name}</Text>
                                    <Text style={styles.addressText}>{address.address_line1}</Text>
                                    {address.address_line2 && (
                                        <Text style={styles.addressText}>{address.address_line2}</Text>
                                    )}
                                    <Text style={styles.addressText}>{address.city}, {address.postcode}</Text>
                                    {address.is_default && (
                                        <View style={styles.defaultBadge}>
                                            <Text style={styles.defaultBadgeText}>Default</Text>
                                        </View>
                                    )}
                                </TouchableOpacity>
                            ))}

                            {/* Add New Address button for users with existing addresses */}
                            <TouchableOpacity
                                style={styles.addAddressButton}
                                onPress={navigateToAddAddressScreen}
                            >
                                <Text style={styles.addAddressButtonText}>+ Add New Address</Text>
                            </TouchableOpacity>

                            {/* Use a different address without saving */}
                            <TouchableOpacity
                                style={styles.useNewAddressButton}
                                onPress={() => setShowAddressForm(!showAddressForm)}
                            >
                                <Text style={styles.useNewAddressButtonText}>
                                    {showAddressForm ? 'Use Saved Address' : 'Use a Different Address'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    {/* Customer Information Form */}
                    <View style={styles.card}>
                        <Text style={styles.sectionTitle}>Customer Information</Text>

                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Full Name *</Text>
                            <TextInput
                                style={styles.input}
                                value={name}
                                onChangeText={setName}
                                placeholder="Enter your full name"
                                returnKeyType="next"
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Email *</Text>
                            <TextInput
                                style={styles.input}
                                value={email}
                                onChangeText={setEmail}
                                placeholder="Enter your email"
                                keyboardType="email-address"
                                autoCapitalize="none"
                                returnKeyType="next"
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Phone *</Text>
                            <TextInput
                                style={styles.input}
                                value={phone}
                                onChangeText={setPhone}
                                placeholder="Enter your phone number"
                                keyboardType="phone-pad"
                                returnKeyType="next"
                            />
                        </View>
                    </View>

                    {/* Address Form */}
                    {(showAddressForm || savedAddresses.length === 0) && (
                        <View style={styles.card}>
                            <Text style={styles.sectionTitle}>Address Details</Text>

                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>Address Line 1 *</Text>
                                <TextInput
                                    style={styles.input}
                                    value={addressLine1}
                                    onChangeText={setAddressLine1}
                                    placeholder="Street address, house number"
                                    returnKeyType="next"
                                />
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>Address Line 2</Text>
                                <TextInput
                                    style={styles.input}
                                    value={addressLine2}
                                    onChangeText={setAddressLine2}
                                    placeholder="Apartment, suite, unit, etc. (optional)"
                                    returnKeyType="next"
                                />
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>City *</Text>
                                <TextInput
                                    style={styles.input}
                                    value={city}
                                    onChangeText={setCity}
                                    placeholder="City"
                                    returnKeyType="next"
                                />
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>Postcode *</Text>
                                <TextInput
                                    style={styles.input}
                                    value={postcode}
                                    onChangeText={setPostcode}
                                    placeholder="Postcode"
                                    autoCapitalize="characters"
                                    returnKeyType="done"
                                />
                            </View>

                            {isAuthenticated && (
                                <View style={styles.checkboxRow}>
                                    <TouchableOpacity
                                        style={[styles.checkbox, saveAddress && styles.checkboxChecked]}
                                        onPress={() => setSaveAddress(!saveAddress)}
                                    >
                                        {saveAddress && <Text style={styles.checkmark}>✓</Text>}
                                    </TouchableOpacity>
                                    <Text style={styles.checkboxLabel}>Save this address for future bookings</Text>
                                </View>
                            )}
                        </View>
                    )}

                    {/* Additional Notes */}
                    <View style={styles.card}>
                        <Text style={styles.sectionTitle}>Additional Notes</Text>
                        <TextInput
                            style={[styles.input, styles.textArea]}
                            value={notes}
                            onChangeText={setNotes}
                            placeholder="Any special requirements or information for your treatment"
                            multiline
                            numberOfLines={4}
                            returnKeyType="done"
                        />
                    </View>

                    {/* Total */}
                    <View style={styles.card}>
                        <Text style={styles.sectionTitle}>Total</Text>
                        <View style={styles.totalRow}>
                            <Text style={styles.totalLabel}>Total Amount:</Text>
                            <Text style={styles.totalValue}>£{serviceDetails.price}</Text>
                        </View>
                    </View>

                    {/* Add extra padding at bottom to ensure content is visible when keyboard is open */}
                    <View style={{ height: Platform.OS === 'android' ? 100 : 20 }} />
                </ScrollView>

                <View style={styles.footer}>
                    <TouchableOpacity
                        style={styles.confirmButton}
                        onPress={handleSubmitBooking}
                        disabled={submitting}
                    >
                        {submitting ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.confirmButtonText}>Confirm Booking</Text>
                        )}
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        </KeyboardAvoidingView>
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
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 16,
    },
    errorText: {
        fontSize: 16,
        color: '#d32f2f',
        textAlign: 'center',
        marginBottom: 24,
    },
    retryButton: {
        backgroundColor: '#9A563A',
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 8,
    },
    retryButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 16,
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
    },
    detailValue: {
        fontSize: 16,
        fontWeight: '500',
        color: '#333',
        flex: 2, // Take up 2 parts of the space
        flexWrap: 'wrap', // Allow text wrapping
        textAlign: 'right', // Align text to the right
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 12,
    },
    totalLabel: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
    },
    totalValue: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#9A563A',
    },
    inputGroup: {
        marginBottom: 16,
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: '500',
        marginBottom: 8,
        color: '#333',
    },
    input: {
        backgroundColor: '#f9f9f9',
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
    },
    textArea: {
        minHeight: 100,
        textAlignVertical: 'top',
    },
    addressOption: {
        padding: 12,
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        marginBottom: 12,
    },
    selectedAddressOption: {
        borderColor: '#9A563A',
        backgroundColor: 'rgba(154, 86, 58, 0.05)',
    },
    addressName: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    addressText: {
        fontSize: 14,
        color: '#555',
        marginBottom: 2,
    },
    defaultBadge: {
        position: 'absolute',
        top: 8,
        right: 8,
        backgroundColor: '#9A563A',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
    },
    defaultBadgeText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: 'bold',
    },
    noAddressText: {
        fontSize: 14,
        color: '#555',
        marginBottom: 16,
        fontStyle: 'italic',
    },
    addNewAddressButton: {
        backgroundColor: '#9A563A',
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 8,
        alignItems: 'center',
    },
    addNewAddressButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    addAddressButton: {
        padding: 12,
        borderWidth: 1,
        borderStyle: 'dashed',
        borderColor: '#9A563A',
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
    },
    addAddressButtonText: {
        color: '#9A563A',
        fontSize: 16,
        fontWeight: '500',
    },
    useNewAddressButton: {
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    useNewAddressButtonText: {
        color: '#555',
        fontSize: 14,
        fontWeight: '500',
        textDecorationLine: 'underline',
    },
    checkboxRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 8,
    },
    checkbox: {
        width: 22,
        height: 22,
        borderWidth: 1,
        borderColor: '#9A563A',
        borderRadius: 4,
        marginRight: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    checkboxChecked: {
        backgroundColor: '#9A563A',
    },
    checkmark: {
        color: '#fff',
        fontSize: 14,
        fontWeight: 'bold',
    },
    checkboxLabel: {
        fontSize: 14,
        color: '#555',
    },
    footer: {
        padding: 16,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#eee',
    },
    confirmButton: {
        backgroundColor: '#9A563A',
        padding: 16,
        borderRadius: 8,
        alignItems: 'center',
    },
    confirmButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
});

export default withAuthGuard(BookingCheckoutScreen);