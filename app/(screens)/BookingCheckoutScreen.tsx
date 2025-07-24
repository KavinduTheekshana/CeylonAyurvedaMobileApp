// BookingCheckoutScreen.tsx - Updated with Stripe payment method selection

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
import { useLocation } from '../contexts/LocationContext';
import { Feather, MaterialIcons } from '@expo/vector-icons';
import { useStripe } from '@stripe/stripe-react-native';

// Define your Service type - UPDATED with discount_price
type Service = {
    id: number;
    title: string;
    subtitle: string;
    price: number;
    discount_price?: number;
    offer: number;
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

// Add Coupon type
type Coupon = {
    id: number;
    code: string;
    type: 'percentage' | 'fixed';
    value: number;
    description?: string;
};

// Payment Method Types
type PaymentMethod = 'card' | 'bank_transfer';

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
    BookingConfirmationScreen: {
        bookingId: number;
    };
    AddAddressScreen: undefined;
};

// Type for the route
type BookingCheckoutScreenRouteProp = RouteProp<RootStackParamList, 'BookingCheckoutScreen'>;

// Type for the navigation
type BookingCheckoutScreenNavigationProp = StackNavigationProp<RootStackParamList>;

// API URLs
const SERVICE_API_URL = `${API_BASE_URL}/api/services`;
const ADDRESS_API_URL = `${API_BASE_URL}/api/addresses`;
const BOOKING_API_URL = `${API_BASE_URL}/api/bookings`;
const COUPON_API_URL = `${API_BASE_URL}/api/coupons`;

/**
 * Calculate distance between two points using Haversine formula (in miles)
 */
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 3959; // Earth's radius in miles
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

/**
 * Get coordinates for a UK postcode using postcodes.io API
 */
async function getPostcodeCoordinates(postcode: string): Promise<{ lat: number, lng: number } | null> {
    try {
        const cleanPostcode = postcode.replace(/\s+/g, '').toUpperCase();
        const response = await fetch(`https://api.postcodes.io/postcodes/${cleanPostcode}`);

        if (!response.ok) {
            console.log('Postcode API response not OK:', response.status);
            return null;
        }

        const data = await response.json();

        if (data.status === 200 && data.result) {
            return {
                lat: data.result.latitude,
                lng: data.result.longitude
            };
        }

        return null;
    } catch (error) {
        console.error('Error geocoding postcode:', error);
        return null;
    }
}

/**
 * Validate if address is within location's service radius
 */
async function validateAddressLocation(postcode: string, selectedLocation: any): Promise<{
    isValid: boolean;
    distance?: number;
    errorMessage?: string;
}> {
    if (!selectedLocation) {
        return {
            isValid: false,
            errorMessage: 'No location selected for validation.'
        };
    }

    // If no coordinates available for the location, be more permissive
    if (!selectedLocation.latitude || !selectedLocation.longitude) {
        console.log('Location coordinates not available, allowing address');
        return { isValid: true };
    }

    try {
        // Get coordinates for the input postcode
        const coordinates = await getPostcodeCoordinates(postcode);

        if (!coordinates) {
            console.log('Could not get coordinates for postcode, allowing address');
            return { isValid: true }; // Be permissive if we can't validate
        }

        console.log(`Postcode Coordinates: ${coordinates.lat}, ${coordinates.lng}`);
        console.log(`Location Coordinates: ${selectedLocation.latitude}, ${selectedLocation.longitude}`);

        // Calculate distance
        const distance = calculateDistance(
            selectedLocation.latitude,
            selectedLocation.longitude,
            coordinates.lat,
            coordinates.lng
        );

        const serviceRadius = selectedLocation.service_radius_miles || 10; // Default to 10 miles if not set

        console.log(`Calculated Distance: ${distance.toFixed(2)} miles`);
        console.log(`Service Radius: ${serviceRadius} miles`);
        console.log(`Is Valid: ${distance <= serviceRadius}`);

        if (distance <= serviceRadius) {
            return {
                isValid: true,
                distance: Math.round(distance * 10) / 10
            };
        } else {
            return {
                isValid: false,
                distance: Math.round(distance * 10) / 10,
                errorMessage: `This address is ${Math.round(distance * 10) / 10} miles from ${selectedLocation.name}. We only service addresses within ${serviceRadius} miles of this location.`
            };
        }

    } catch (error) {
        console.error('Error validating location distance:', error);
        // On error, allow the address to be saved
        return { isValid: true };
    }
}

const BookingCheckoutScreen = () => {
    const route = useRoute<BookingCheckoutScreenRouteProp>();
    const navigation = useNavigation<BookingCheckoutScreenNavigationProp>();
    const { selectedLocation } = useLocation();
    const { initPaymentSheet, presentPaymentSheet } = useStripe();
    
    const {
        serviceId,
        serviceName,
        selectedDate,
        selectedTime,
        duration,
        therapistId,
        therapistName
    } = route.params;

    // States
    const [loading, setLoading] = useState<boolean>(true);
    const [submitting, setSubmitting] = useState<boolean>(false);
    const [validatingLocation, setValidatingLocation] = useState<boolean>(false);
    const [serviceDetails, setServiceDetails] = useState<Service | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [savedAddresses, setSavedAddresses] = useState<Address[]>([]);
    const [showAddressForm, setShowAddressForm] = useState<boolean>(false);
    const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

    // Location validation states
    const [isAddressValid, setIsAddressValid] = useState<boolean>(true);
    const [addressValidationMessage, setAddressValidationMessage] = useState<string>('');
    const [addressValidationDistance, setAddressValidationDistance] = useState<number | null>(null);

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

    // Payment method states
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('card');

    // COUPON STATES
    const [couponCode, setCouponCode] = useState<string>('');
    const [validatingCoupon, setValidatingCoupon] = useState<boolean>(false);
    const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
    const [couponError, setCouponError] = useState<string>('');
    const [couponDiscount, setCouponDiscount] = useState<number>(0);
    const [finalPrice, setFinalPrice] = useState<number>(0);

    // HELPER FUNCTIONS FOR PRICING WITH COUPON
    const getBasePrice = (): number => {
        if (!serviceDetails) return 0;

        // Check if discount_price is a number and >= 0
        if (typeof serviceDetails.discount_price === 'number' && serviceDetails.discount_price >= 0) {
            return serviceDetails.discount_price;
        }

        // Otherwise use regular price
        return serviceDetails.price;
    };

    const calculateFinalPrice = (): number => {
        const basePrice = getBasePrice();
        return Math.max(0, basePrice - couponDiscount);
    };

    const hasServiceDiscount = (): boolean => {
        if (!serviceDetails) return false;
        return typeof serviceDetails.discount_price === 'number' && serviceDetails.discount_price >= 0;
    };

    const getServiceDiscountAmount = (): number => {
        if (!hasServiceDiscount() || !serviceDetails) return 0;
        return serviceDetails.price - (serviceDetails.discount_price || 0);
    };

    const getServiceDiscountPercentage = (): number => {
        if (!hasServiceDiscount() || !serviceDetails) return 0;
        const discountAmount = getServiceDiscountAmount();
        return Math.round((discountAmount / serviceDetails.price) * 100);
    };

    const getTotalSavings = (): number => {
        return getServiceDiscountAmount() + couponDiscount;
    };

    // Update final price whenever base price or coupon discount changes
    useEffect(() => {
        setFinalPrice(calculateFinalPrice());
    }, [serviceDetails, couponDiscount]);

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

    // Validate address whenever postcode changes
    useEffect(() => {
        if (postcode.trim() && selectedLocation) {
            validateCurrentAddress();
        } else {
            setIsAddressValid(true);
            setAddressValidationMessage('');
            setAddressValidationDistance(null);
        }
    }, [postcode, selectedLocation]);

    const validateCurrentAddress = async () => {
        if (!postcode.trim() || !selectedLocation) return;

        setValidatingLocation(true);
        try {
            const validationResult = await validateAddressLocation(postcode, selectedLocation);

            setIsAddressValid(validationResult.isValid);
            setAddressValidationMessage(validationResult.errorMessage || '');
            setAddressValidationDistance(validationResult.distance || null);

            if (validationResult.isValid && validationResult.distance) {
                setAddressValidationMessage(`✓ Address is within service area (${validationResult.distance} miles from ${selectedLocation.name})`);
            }
        } catch (error) {
            console.error('Address validation error:', error);
            setIsAddressValid(true); // Be permissive on error
            setAddressValidationMessage('');
        } finally {
            setValidatingLocation(false);
        }
    };

    const checkAuthentication = async () => {
        try {
            const token = await AsyncStorage.getItem('access_token');
            console.log('Authentication check - token exists:', !!token);
            setIsAuthenticated(!!token);
        } catch (error) {
            console.error('Error checking authentication:', error);
            setIsAuthenticated(false);
        }
    };

    const fetchServiceDetails = async () => {
        try {
            const response = await fetch(`${SERVICE_API_URL}/detail/${serviceId}`);
            const data = await response.json();

            if (data.success && data.data) {
                const serviceData = {
                    ...data.data,
                    price: parseFloat(data.data.price) || 0,
                    discount_price: data.data.discount_price ? parseFloat(data.data.discount_price) : undefined
                };

                setServiceDetails(serviceData);
            } else {
                console.error('API error response:', data);
                setError('Could not retrieve service details. Please try again.');

                setServiceDetails({
                    id: serviceId,
                    title: serviceName,
                    subtitle: 'Service details',
                    price: 75,
                    duration: duration,
                    benefits: '',
                    image: null
                });
            }
        } catch (error) {
            console.error('Error fetching service details:', error);
            setError('Network error. Please check your connection and try again.');

            setServiceDetails({
                id: serviceId,
                title: serviceName,
                subtitle: 'Service details',
                price: 75,
                duration: duration,
                benefits: '',
                image: null
            });
        }
    };

    const fetchSavedAddresses = async () => {
        try {
            const token = await AsyncStorage.getItem('access_token');
            console.log('Token for address fetch:', token ? 'Token found' : 'No token');

            if (!token) {
                console.log('No authentication token found');
                setShowAddressForm(true);
                return;
            }

            const response = await fetch(ADDRESS_API_URL, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            });

            const data = await response.json();

            if (data.success && Array.isArray(data.data)) {
                setSavedAddresses(data.data);

                const defaultAddress = data.data.find((address: Address) => address.is_default);
                if (defaultAddress) {
                    setSelectedAddressId(defaultAddress.id);
                    prefillAddressForm(defaultAddress);
                } else if (data.data.length > 0) {
                    setSelectedAddressId(data.data[0].id);
                    prefillAddressForm(data.data[0]);
                } else {
                    setShowAddressForm(true);
                }
            } else {
                setShowAddressForm(true);
            }
        } catch (error) {
            console.error('Error fetching bookings addresses:', error);
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

    // COUPON VALIDATION FUNCTION
    const validateCoupon = async () => {
        if (!couponCode.trim()) {
            setCouponError('Please enter a coupon code');
            return;
        }

        setValidatingCoupon(true);
        setCouponError('');

        try {
            const token = await AsyncStorage.getItem('access_token');
            const headers: Record<string, string> = {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            };

            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            const response = await fetch(`${COUPON_API_URL}/validate`, {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    code: couponCode.toUpperCase(),
                    service_id: serviceId,
                    amount: getBasePrice()
                })
            });

            const data = await response.json();

            if (data.valid) {
                setAppliedCoupon(data.coupon);
                setCouponDiscount(data.discount_amount);
                setCouponError('');
                Alert.alert(
                    'Success!',
                    `Coupon applied! You saved £${data.discount_amount.toFixed(2)}`
                );
            } else {
                setCouponError(data.message || 'Invalid coupon code');
                setAppliedCoupon(null);
                setCouponDiscount(0);
            }
        } catch (error) {
            console.error('Error validating coupon:', error);
            setCouponError('Failed to validate coupon. Please try again.');
            setAppliedCoupon(null);
            setCouponDiscount(0);
        } finally {
            setValidatingCoupon(false);
        }
    };

    const removeCoupon = () => {
        setAppliedCoupon(null);
        setCouponDiscount(0);
        setCouponCode('');
        setCouponError('');
    };

    // Helper function to get payment method icon and text
    const getPaymentMethodDisplay = (method: string) => {
        switch (method) {
            case 'bank_transfer':
                return {
                    icon: 'account-balance',
                    text: 'Bank Transfer',
                    color: '#9A563A'
                };
            case 'card':
            default:
                return {
                    icon: 'credit-card',
                    text: 'Card Payment',
                    color: '#9A563A'
                };
        }
    };

    // Payment Method Selection Component
    const PaymentMethodSelector = () => (
        <View className="mb-5">
            <Text className="text-sm font-medium text-gray-700 mb-3">Payment Method</Text>

            {/* Card Payment Option */}
            <TouchableOpacity
                className={`flex-row items-center p-4 mb-3 border-2 rounded-lg ${paymentMethod === 'card' ? 'border-amber-700 bg-orange-50' : 'border-gray-200 bg-white'
                    }`}
                onPress={() => setPaymentMethod('card')}
            >
                <View className={`w-5 h-5 rounded-full border-2 mr-3 ${paymentMethod === 'card' ? 'border-amber-700 bg-amber-700' : 'border-gray-400'
                    }`}>
                    {paymentMethod === 'card' && (
                        <View className="w-full h-full flex items-center justify-center">
                            <View className="w-2 h-2 bg-white rounded-full" />
                        </View>
                    )}
                </View>
                <View className="flex-1">
                    <View className="flex-row items-center mb-1">
                        <MaterialIcons name="credit-card" size={20} color="#9A563A" />
                        <Text className="text-base font-semibold text-gray-800 ml-2">Credit/Debit Card</Text>
                    </View>
                    <Text className="text-sm text-gray-500">Pay securely with your card</Text>
                </View>
            </TouchableOpacity>

            {/* Bank Transfer Option */}
            <TouchableOpacity
                className={`flex-row items-center p-4 border-2 rounded-lg ${paymentMethod === 'bank_transfer' ? 'border-amber-700 bg-orange-50' : 'border-gray-200 bg-white'
                    }`}
                onPress={() => setPaymentMethod('bank_transfer')}
            >
                <View className={`w-5 h-5 rounded-full border-2 mr-3 ${paymentMethod === 'bank_transfer' ? 'border-amber-700 bg-amber-700' : 'border-gray-400'
                    }`}>
                    {paymentMethod === 'bank_transfer' && (
                        <View className="w-full h-full flex items-center justify-center">
                            <View className="w-2 h-2 bg-white rounded-full" />
                        </View>
                    )}
                </View>
                <View className="flex-1">
                    <View className="flex-row items-center mb-1">
                        <MaterialIcons name="account-balance" size={20} color="#9A563A" />
                        <Text className="text-base font-semibold text-gray-800 ml-2">Bank Transfer</Text>
                    </View>
                    <Text className="text-sm text-gray-500">Our team will contact you with transfer details</Text>
                </View>
            </TouchableOpacity>

            {/* Bank Transfer Notice */}
            {paymentMethod === 'bank_transfer' && (
                <View className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <View className="flex-row items-start">
                        <MaterialIcons name="info" size={16} color="#9A563A" />
                        <View className="flex-1 ml-2">
                            <Text className="text-sm text-amber-800 font-medium mb-1">Bank Transfer Process:</Text>
                            <Text className="text-xs text-amber-700">
                                1. Submit your booking request{'\n'}
                                2. Our team will contact you within 24 hours{'\n'}
                                3. Complete bank transfer using provided details{'\n'}
                                4. Booking confirmed after payment verification
                            </Text>
                        </View>
                    </View>
                </View>
            )}
        </View>
    );

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
        if (!name.trim()) {
            Alert.alert('Error', 'Please enter your name');
            return false;
        }

        if (!email.trim()) {
            Alert.alert('Error', 'Please enter your email');
            return false;
        }

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

    // Handle bank transfer booking
    const handleBankTransferBooking = async () => {
        if (!validateForm()) return;
        if (!serviceDetails) return;

        // Check if address is valid (within service radius)
        if (!isAddressValid) {
            Alert.alert(
                'Address Outside Service Area',
                addressValidationMessage || 'This address is outside our service area for the selected location.',
                [{ text: 'OK' }]
            );
            return;
        }

        setSubmitting(true);

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
            save_address: saveAddress,
            therapist_id: therapistId,
            therapist_name: therapistName,
            location_id: selectedLocation?.id,
            payment_method: 'bank_transfer',
            coupon_code: appliedCoupon ? appliedCoupon.code : null
        };

        try {
            const token = await AsyncStorage.getItem('access_token');

            const headers: Record<string, string> = {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            };

            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            const response = await fetch(BOOKING_API_URL, {
                method: 'POST',
                headers,
                body: JSON.stringify(bookingData),
            });

            if (!response.ok) {
                throw new Error(`Server responded with status: ${response.status}`);
            }

            const data = await response.json();

            if (data.success && data.data && data.data.id) {
                Alert.alert(
                    'Booking Request Submitted!',
                    `Your booking request for ${serviceName} has been submitted successfully. Our admin team will contact you within 24 hours with bank transfer details.\n\nReference: ${data.data.reference || 'N/A'}\n\nOnce the payment is completed, your booking will be confirmed.`,
                    [
                        {
                            text: 'OK',
                            onPress: () => {
                                try {
                                    navigation.navigate('BookingConfirmationScreen', {
                                        bookingId: data.data.id
                                    });
                                } catch (navError) {
                                    console.error('Navigation error:', navError);
                                    navigation.navigate('Home');
                                }
                            },
                        },
                    ]
                );
            } else {
                Alert.alert('Error', data.message || 'Failed to submit booking request. Please try again.');
            }
        } catch (error) {
            console.error('Bank transfer booking error:', error);
            Alert.alert('Error', 'There was an error processing your booking request. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    // Handle card payment booking
    const handleCardPaymentBooking = async () => {
        if (!validateForm()) return;
        if (!serviceDetails) return;

        // Check if address is valid (within service radius)
        if (!isAddressValid) {
            Alert.alert(
                'Address Outside Service Area',
                addressValidationMessage || 'This address is outside our service area for the selected location.',
                [{ text: 'OK' }]
            );
            return;
        }

        setSubmitting(true);

        try {
            const token = await AsyncStorage.getItem('access_token');
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
                save_address: saveAddress,
                therapist_id: therapistId,
                therapist_name: therapistName,
                location_id: selectedLocation?.id,
                payment_method: 'card',
                coupon_code: appliedCoupon ? appliedCoupon.code : null
            };

            const headers: Record<string, string> = {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            };

            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            // Create booking and get payment intent
            const response = await fetch(BOOKING_API_URL, {
                method: 'POST',
                headers,
                body: JSON.stringify(bookingData),
            });

            if (!response.ok) {
                throw new Error(`Server responded with status: ${response.status}`);
            }

            const data = await response.json();

            if (!data.success) {
                throw new Error(data.message || 'Failed to create booking');
            }

            const { booking, payment_intent } = data.data;

            // Initialize Stripe payment sheet
            const { error: initError } = await initPaymentSheet({
                merchantDisplayName: 'Ceylon Ayurveda Health',
                paymentIntentClientSecret: payment_intent.client_secret,
                defaultBillingDetails: {
                    name: name,
                    email: email,
                    phone: phone,
                    address: {
                        line1: addressLine1,
                        line2: addressLine2,
                        city: city,
                        postalCode: postcode,
                        country: 'GB',
                    }
                },
                appearance: {
                    colors: {
                        primary: '#9A563A',
                    },
                },
            });

            if (initError) {
                throw new Error(initError.message);
            }

            // Present payment sheet
            const { error: paymentError } = await presentPaymentSheet();

            if (paymentError) {
                if (paymentError.code !== 'Canceled') {
                    throw new Error(paymentError.message);
                }
                // User canceled payment
                return;
            }

            // Payment successful - confirm with backend
            const confirmResponse = await fetch(`${API_BASE_URL}/api/bookings/confirm-payment`, {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    payment_intent_id: payment_intent.payment_intent_id,
                }),
            });

            const confirmData = await confirmResponse.json();

            if (confirmData.success) {
                Alert.alert(
                    'Payment Successful!',
                    `Your booking for ${serviceName} has been confirmed and payment processed successfully.\n\nReference: ${booking?.reference || 'N/A'}`,
                    [
                        {
                            text: 'OK',
                            onPress: () => {
                                try {
                                    navigation.navigate('BookingConfirmationScreen', {
                                        bookingId: booking?.id || data.data.id
                                    });
                                } catch (navError) {
                                    console.error('Navigation error:', navError);
                                    navigation.navigate('Home');
                                }
                            },
                        },
                    ]
                );
            } else {
                throw new Error(confirmData.message || 'Failed to confirm payment');
            }

        } catch (error: any) {
            console.error('Card payment booking error:', error);
            Alert.alert('Payment Failed', error.message || 'There was an error processing your payment. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleSubmitBooking = async () => {
        Keyboard.dismiss();
        
        if (paymentMethod === 'bank_transfer') {
            await handleBankTransferBooking();
        } else {
            await handleCardPaymentBooking();
        }
    };

    // Determine if the confirm button should be disabled
    const isConfirmButtonDisabled = () => {
        return (
            submitting ||
            validatingLocation ||
            !isAddressValid ||
            !selectedLocation ||
            !serviceDetails ||
            (showAddressForm && !postcode.trim())
        );
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
                    keyboardShouldPersistTaps="handled"
                >
                    <Text style={styles.title}>Booking Summary</Text>

                    {/* Location Info */}
                    {selectedLocation && (
                        <View style={styles.locationCard}>
                            <View style={styles.locationHeader}>
                                <Feather name="map-pin" size={16} color="#9A563A" />
                                <Text style={styles.locationTitle}>Service Location</Text>
                            </View>
                            <Text style={styles.locationName}>{selectedLocation.name}</Text>
                            <Text style={styles.serviceAreaNote}>
                                Service radius: {selectedLocation.service_radius_miles || 10} miles
                            </Text>
                        </View>
                    )}

                    {/* Service Details */}
                    <View style={styles.card}>
                        <Text style={styles.sectionTitle}>Service Details</Text>
                        <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>Service:</Text>
                            <Text style={styles.detailValue} numberOfLines={2} ellipsizeMode="tail">{serviceDetails.title || 'N/A'}</Text>
                        </View>
                        <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>Duration:</Text>
                            <Text style={styles.detailValue}>{serviceDetails.duration} min</Text>
                        </View>

                        {/* Price Display with Service Discount */}
                        <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>Price:</Text>
                            <View style={styles.priceContainer}>
                                {hasServiceDiscount() ? (
                                    <View style={styles.discountPriceContainer}>
                                        <Text style={styles.originalPrice}>£{serviceDetails.price.toFixed(2)}</Text>
                                        <Text style={styles.discountedPrice}>£{getBasePrice().toFixed(2)}</Text>
                                    </View>
                                ) : (
                                    <Text style={styles.detailValue}>£{serviceDetails.price.toFixed(2)}</Text>
                                )}
                            </View>
                        </View>

                        {/* Therapist information */}
                        <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>Therapist:</Text>
                            <Text style={styles.detailValue}>{therapistName}</Text>
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

                    {/* Payment Method Selection */}
                    <View style={styles.card}>
                        <PaymentMethodSelector />
                    </View>

                    {/* COUPON CODE SECTION */}
                    <View style={styles.card}>
                        <Text style={styles.sectionTitle}>Promo Code</Text>

                        {!appliedCoupon ? (
                            <View style={styles.couponInputContainer}>
                                <TextInput
                                    style={[styles.couponInput, couponError ? styles.inputError : null]}
                                    value={couponCode}
                                    onChangeText={(text) => {
                                        setCouponCode(text);
                                        setCouponError('');
                                    }}
                                    placeholder="Enter coupon code"
                                    autoCapitalize="characters"
                                    returnKeyType="done"
                                />
                                <TouchableOpacity
                                    style={[
                                        styles.applyCouponButton,
                                        (!couponCode.trim() || validatingCoupon) && styles.applyCouponButtonDisabled
                                    ]}
                                    onPress={validateCoupon}
                                    disabled={!couponCode.trim() || validatingCoupon}
                                >
                                    {validatingCoupon ? (
                                        <ActivityIndicator size="small" color="#fff" />
                                    ) : (
                                        <Text style={styles.applyCouponButtonText}>Apply</Text>
                                    )}
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <View style={styles.appliedCouponContainer}>
                                <View style={styles.appliedCouponInfo}>
                                    <Feather name="check-circle" size={20} color="#10B981" />
                                    <View style={styles.appliedCouponDetails}>
                                        <Text style={styles.appliedCouponCode}>{appliedCoupon.code}</Text>
                                        <Text style={styles.appliedCouponDescription}>
                                            {appliedCoupon.type === 'percentage'
                                                ? `${appliedCoupon.value}% off`
                                                : `£${appliedCoupon.value} off`}
                                        </Text>
                                    </View>
                                </View>
                                <TouchableOpacity
                                    style={styles.removeCouponButton}
                                    onPress={removeCoupon}
                                >
                                    <Feather name="x" size={20} color="#EF4444" />
                                </TouchableOpacity>
                            </View>
                        )}

                        {couponError && (
                            <Text style={styles.couponErrorText}>{couponError}</Text>
                        )}
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

                            <TouchableOpacity
                                style={styles.addAddressButton}
                                onPress={navigateToAddAddressScreen}
                            >
                                <Text style={styles.addAddressButtonText}>+ Add New Address</Text>
                            </TouchableOpacity>

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
                                    style={[
                                        styles.input,
                                        !isAddressValid && styles.inputError
                                    ]}
                                    value={postcode}
                                    onChangeText={setPostcode}
                                    placeholder="Postcode (e.g., DE1 3AH)"
                                    autoCapitalize="characters"
                                    returnKeyType="done"
                                />

                                {/* Address Validation Indicator */}
                                {validatingLocation && (
                                    <View style={styles.validationIndicator}>
                                        <ActivityIndicator size="small" color="#9A563A" />
                                        <Text style={styles.validationText}>Validating address...</Text>
                                    </View>
                                )}

                                {/* Address Validation Message */}
                                {addressValidationMessage && !validatingLocation && (
                                    <View style={[
                                        styles.validationMessage,
                                        isAddressValid ? styles.validationSuccess : styles.validationError
                                    ]}>
                                        <Feather
                                            name={isAddressValid ? "check-circle" : "x-circle"}
                                            size={16}
                                            color={isAddressValid ? "#10B981" : "#EF4444"}
                                        />
                                        <Text style={[
                                            styles.validationMessageText,
                                            isAddressValid ? styles.validationSuccessText : styles.validationErrorText
                                        ]}>
                                            {addressValidationMessage}
                                        </Text>
                                    </View>
                                )}
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

                    {/* Payment Summary with Coupon */}
                    <View style={styles.card}>
                        <Text style={styles.sectionTitle}>Payment Summary</Text>

                        {/* Original Price (if service has discount) */}
                        {hasServiceDiscount() && (
                            <>
                                <View style={styles.totalRow}>
                                    <Text style={styles.totalLabel}>Original Price:</Text>
                                    <Text style={styles.originalTotalPrice}>£{serviceDetails.price.toFixed(2)}</Text>
                                </View>
                                <View style={styles.totalRow}>
                                    <Text style={styles.discountLabel}>Service Discount ({getServiceDiscountPercentage()}% off):</Text>
                                    <Text style={styles.discountAmount}>-£{getServiceDiscountAmount().toFixed(2)}</Text>
                                </View>
                            </>
                        )}

                        {/* Base Price (after service discount) */}
                        {(hasServiceDiscount() || appliedCoupon) && (
                            <View style={styles.totalRow}>
                                <Text style={styles.totalLabel}>Subtotal:</Text>
                                <Text style={styles.totalValue}>£{getBasePrice().toFixed(2)}</Text>
                            </View>
                        )}

                        {/* Coupon Discount */}
                        {appliedCoupon && couponDiscount > 0 && (
                            <View style={styles.totalRow}>
                                <Text style={styles.discountLabel}>
                                    Coupon ({appliedCoupon.code}):
                                </Text>
                                <Text style={styles.discountAmount}>-£{couponDiscount.toFixed(2)}</Text>
                            </View>
                        )}

                        {(hasServiceDiscount() || appliedCoupon) && <View style={styles.divider} />}

                        {/* Final Total */}
                        <View style={styles.totalRow}>
                            <Text style={styles.totalLabel}>Total Amount:</Text>
                            <Text style={styles.totalValue}>£{finalPrice.toFixed(2)}</Text>
                        </View>

                        {/* Total Savings */}
                        {getTotalSavings() > 0 && (
                            <View style={styles.savingsSummary}>
                                <Text style={styles.savingsSummaryText}>
                                    🎉 You're saving £{getTotalSavings().toFixed(2)} on this booking!
                                </Text>
                            </View>
                        )}
                    </View>

                    <View style={{ height: Platform.OS === 'android' ? 100 : 20 }} />
                </ScrollView>

                <View style={styles.footer}>
                    <TouchableOpacity
                        style={[
                            styles.confirmButton,
                            isConfirmButtonDisabled() && styles.confirmButtonDisabled
                        ]}
                        onPress={handleSubmitBooking}
                        disabled={isConfirmButtonDisabled()}
                    >
                        {submitting ? (
                            <ActivityIndicator color="#fff" />
                        ) : validatingLocation ? (
                            <View style={styles.buttonContent}>
                                <ActivityIndicator color="#fff" size="small" />
                                <Text style={styles.confirmButtonText}>Validating Location...</Text>
                            </View>
                        ) : (
                            <Text style={styles.confirmButtonText}>
                                {!isAddressValid 
                                    ? 'Address Outside Service Area' 
                                    : paymentMethod === 'bank_transfer'
                                        ? `Submit Booking Request - £${finalPrice.toFixed(2)}`
                                        : `Pay Now - £${finalPrice.toFixed(2)}`
                                }
                            </Text>
                        )}
                    </TouchableOpacity>

                    {/* Additional validation info */}
                    {!isAddressValid && addressValidationMessage && (
                        <Text style={styles.footerValidationText}>
                            Please use an address within the service area to continue
                        </Text>
                    )}
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
    locationCard: {
        backgroundColor: '#E8F5E9',
        borderRadius: 8,
        padding: 12,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#81C784',
    },
    locationHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    locationTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#2E7D32',
        marginLeft: 6,
    },
    locationName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1B5E20',
        marginBottom: 4,
    },
    serviceAreaNote: {
        fontSize: 12,
        color: '#4CAF50',
        fontStyle: 'italic',
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
        flex: 2,
        flexWrap: 'wrap',
        textAlign: 'right',
    },
    priceContainer: {
        alignItems: 'flex-end',
        flex: 2,
    },
    discountPriceContainer: {
        alignItems: 'flex-end',
        position: 'relative',
    },
    originalPrice: {
        fontSize: 14,
        color: '#888',
        textDecorationLine: 'line-through',
        marginBottom: 2,
    },
    discountedPrice: {
        fontSize: 16,
        fontWeight: '600',
        color: '#E53E3E',
    },
    // COUPON STYLES
    couponInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    couponInput: {
        flex: 1,
        backgroundColor: '#f9f9f9',
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        marginRight: 8,
    },
    applyCouponButton: {
        backgroundColor: '#9A563A',
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 8,
        minWidth: 80,
        alignItems: 'center',
        justifyContent: 'center',
    },
    applyCouponButtonDisabled: {
        backgroundColor: '#cccccc',
    },
    applyCouponButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    appliedCouponContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#F0FFF4',
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#10B981',
    },
    appliedCouponInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    appliedCouponDetails: {
        marginLeft: 8,
        flex: 1,
    },
    appliedCouponCode: {
        fontSize: 16,
        fontWeight: '600',
        color: '#065F46',
    },
    appliedCouponDescription: {
        fontSize: 14,
        color: '#10B981',
        marginTop: 2,
    },
    removeCouponButton: {
        padding: 8,
    },
    couponErrorText: {
        color: '#EF4444',
        fontSize: 14,
        marginTop: 4,
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 8,
    },
    totalLabel: {
        fontSize: 16,
        fontWeight: '500',
        color: '#333',
    },
    originalTotalPrice: {
        fontSize: 16,
        color: '#888',
        textDecorationLine: 'line-through',
    },
    discountLabel: {
        fontSize: 16,
        fontWeight: '500',
        color: '#E53E3E',
    },
    discountAmount: {
        fontSize: 16,
        fontWeight: '600',
        color: '#E53E3E',
    },
    divider: {
        height: 1,
        backgroundColor: '#e0e0e0',
        marginVertical: 8,
    },
    totalValue: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#9A563A',
    },
    savingsSummary: {
        backgroundColor: '#FFF5F5',
        padding: 12,
        borderRadius: 6,
        marginTop: 12,
        borderWidth: 1,
        borderColor: '#FEB2B2',
    },
    savingsSummaryText: {
        fontSize: 14,
        color: '#C53030',
        fontWeight: '500',
        textAlign: 'center',
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
    inputError: {
        borderColor: '#EF4444',
        backgroundColor: '#FEF2F2',
    },
    textArea: {
        minHeight: 100,
        textAlignVertical: 'top',
    },
    validationIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 8,
        paddingHorizontal: 4,
    },
    validationText: {
        marginLeft: 8,
        fontSize: 14,
        color: '#9A563A',
    },
    validationMessage: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 8,
        padding: 8,
        borderRadius: 6,
    },
    validationSuccess: {
        backgroundColor: '#F0FDF4',
        borderWidth: 1,
        borderColor: '#BBF7D0',
    },
    validationError: {
        backgroundColor: '#FEF2F2',
        borderWidth: 1,
        borderColor: '#FECACA',
    },
    validationMessageText: {
        marginLeft: 8,
        fontSize: 14,
        flex: 1,
    },
    validationSuccessText: {
        color: '#166534',
    },
    validationErrorText: {
        color: '#DC2626',
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
    confirmButtonDisabled: {
        backgroundColor: '#cccccc',
    },
    confirmButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    buttonContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    footerValidationText: {
        fontSize: 12,
        color: '#DC2626',
        textAlign: 'center',
        marginTop: 8,
        fontStyle: 'italic',
    },
});

export default withAuthGuard(BookingCheckoutScreen);