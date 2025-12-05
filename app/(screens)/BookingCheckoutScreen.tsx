// BookingCheckoutScreen.tsx - Refactored

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
import { useRoute, useNavigation } from '@react-navigation/native';
import withAuthGuard from '../components/AuthGuard';
import { HeaderBackButton } from '@react-navigation/elements';
import { useLocation } from '../contexts/LocationContext';
import { Feather } from '@expo/vector-icons';
import { useStripe } from '@stripe/stripe-react-native';

// Import types
import {
    Service,
    Address,
    PaymentMethod,
    BookingCheckoutScreenRouteProp,
    BookingCheckoutScreenNavigationProp
} from '../types/booking';

// Import utilities and services
import { validateAddressLocation } from '../utils/locationUtils';
import { bookingService } from '../services/bookingService';
import { usePricing } from '../hooks/usePricing';

// Import components
import { PaymentMethodSelector } from '../components/booking/PaymentMethodSelector';
import { CouponSection } from '../components/booking/CouponSection';
import { SavedAddresses } from '../components/booking/SavedAddresses';
import { CustomerInfoForm } from '../components/booking/CustomerInfoForm';
import { AddressForm } from '../components/booking/AddressForm';
import { PaymentSummary } from '../components/booking/PaymentSummary';

const HOME_VISIT_FEE = 19.99;

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
        therapistName,
        visitType
    } = route.params;

    // Main states
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

    // Payment method state
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('card');

    const getHomeVisitFee = () => {
    return visitType === 'home' ? HOME_VISIT_FEE : 0;
    };

    const {
        appliedCoupon,
        setAppliedCoupon,
        couponDiscount,
        setCouponDiscount,
        finalPrice: baseFinalPrice,
        getBasePrice,
        hasServiceDiscount,
        getServiceDiscountAmount,
        getServiceDiscountPercentage,
        getTotalSavings
    } = usePricing(serviceDetails);

    const finalPrice = baseFinalPrice + getHomeVisitFee();

    // Initialize data
    useEffect(() => {
        const initializeCheckout = async () => {
            try {
                setLoading(true);
                
                // Check authentication
                const authenticated = await bookingService.checkAuthentication();
                setIsAuthenticated(authenticated);

                // Fetch service details and saved addresses in parallel
                const [service, addresses] = await Promise.all([
                    bookingService.fetchServiceDetails(serviceId, serviceName, duration),
                    authenticated ? bookingService.fetchSavedAddresses() : Promise.resolve([])
                ]);

                setServiceDetails(service);
                setSavedAddresses(addresses);

                // Handle address selection
                if (addresses.length > 0) {
                    const defaultAddress = addresses.find(addr => addr.is_default);
                    const addressToSelect = defaultAddress || addresses[0];
                    setSelectedAddressId(addressToSelect.id);
                    prefillAddressForm(addressToSelect);
                } else {
                    setShowAddressForm(true);
                }

            } catch (error) {
                console.error('Error initializing checkout:', error);
                setError('Failed to load checkout data. Please try again.');
            } finally {
                setLoading(false);
            }
        };

        initializeCheckout();
    }, [serviceId]);

    // Refresh addresses when screen comes into focus
    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', async () => {
            if (isAuthenticated) {
                const addresses = await bookingService.fetchSavedAddresses();
                setSavedAddresses(addresses);
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
            setIsAddressValid(true);
            setAddressValidationMessage('');
        } finally {
            setValidatingLocation(false);
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

    // Coupon handlers
    const handleApplyCoupon = async (code: string) => {
        const result = await bookingService.validateCoupon(code, serviceId, getBasePrice());
        
        if (result.valid && result.coupon && result.discount_amount !== undefined) {
            setAppliedCoupon(result.coupon);
            setCouponDiscount(result.discount_amount);
            Alert.alert(
                'Success!',
                `Coupon applied! You saved £${result.discount_amount.toFixed(2)}`
            );
        } else {
            throw new Error(result.message || 'Invalid coupon code');
        }
    };

    const handleRemoveCoupon = () => {
        setAppliedCoupon(null);
        setCouponDiscount(0);
    };

    // Form validation
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

        if (visitType === 'home' && (!addressLine1.trim() || !city.trim() || !postcode.trim())) {
            Alert.alert('Error', 'Please enter your complete address for home visit');
            return false;
        }

        return true;
    };

    // Handle bank transfer booking
    const handleBankTransferBooking = async () => {
        if (!validateForm()) return;
        if (!serviceDetails) return;

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
            coupon_code: appliedCoupon ? appliedCoupon.code : null,
            visit_type: visitType
        };

        console.log('==========================================');
        console.log('BANK TRANSFER BOOKING DATA BEING SUBMITTED:');
        console.log('==========================================');
        console.log(JSON.stringify(bookingData, null, 2));
        console.log('==========================================');

        try {
            const data = await bookingService.createBooking(bookingData);

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
                coupon_code: appliedCoupon ? appliedCoupon.code : null,
                visit_type: visitType
            };

            console.log('==========================================');
            console.log('CARD PAYMENT BOOKING DATA BEING SUBMITTED:');
            console.log('==========================================');
            console.log(JSON.stringify(bookingData, null, 2));
            console.log('==========================================');

            // Create booking and get payment intent
            const data = await bookingService.createBooking(bookingData);

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
                return;
            }

            // Payment successful - confirm with backend
            const confirmData = await bookingService.confirmPayment(payment_intent.payment_intent_id);

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

    // Navigation header setup
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

    // Utility functions
    const formatDate = (dateString: string) => {
        const options: Intl.DateTimeFormatOptions = {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        };
        return new Date(dateString).toLocaleDateString(undefined, options);
    };

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

    // Loading state
    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#9A563A" />
                <Text style={styles.loadingText}>Loading booking details...</Text>
            </View>
        );
    }

    // Error state
    if (error || !serviceDetails) {
        return (
            <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error || 'An unexpected error occurred.'}</Text>
                <TouchableOpacity
                    style={styles.retryButton}
                    onPress={() => {
                        setLoading(true);
                        setError(null);
                        // Reinitialize
                        bookingService.fetchServiceDetails(serviceId, serviceName, duration)
                            .then(setServiceDetails)
                            .finally(() => setLoading(false));
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
                            <Text style={styles.detailValue} numberOfLines={2} ellipsizeMode="tail">
                                {serviceDetails.title || 'N/A'}
                            </Text>
                        </View>
                        <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>Duration:</Text>
                            <Text style={styles.detailValue}>{serviceDetails.duration} min</Text>
                        </View>

                        {/* Price Display */}
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
                        <PaymentMethodSelector
                            paymentMethod={paymentMethod}
                            setPaymentMethod={setPaymentMethod}
                        />
                    </View>

                    {/* Coupon Section */}
                    <View style={styles.card}>
                        <CouponSection
                            appliedCoupon={appliedCoupon}
                            onApplyCoupon={handleApplyCoupon}
                            onRemoveCoupon={handleRemoveCoupon}
                        />
                    </View>

                    {/* Saved Addresses */}
                    {/* <View style={styles.card}>
                        <SavedAddresses
                            savedAddresses={savedAddresses}
                            selectedAddressId={selectedAddressId}
                            onSelectAddress={selectAddress}
                            onAddNewAddress={navigateToAddAddressScreen}
                            onToggleAddressForm={() => setShowAddressForm(!showAddressForm)}
                            showAddressForm={showAddressForm}
                            isAuthenticated={isAuthenticated}
                        />
                    </View> */}

                    {/* Customer Information Form */}
                    <View style={styles.card}>
                        <CustomerInfoForm
                            name={name}
                            setName={setName}
                            email={email}
                            setEmail={setEmail}
                            phone={phone}
                            setPhone={setPhone}
                        />
                    </View>

                    {/* Address Form */}
                    {/* Address Section - Conditional based on visit type */}
                    {visitType === 'home' ? (
                        <>
                            {/* Saved Addresses */}
                            <View style={styles.card}>
                                <SavedAddresses
                                    savedAddresses={savedAddresses}
                                    selectedAddressId={selectedAddressId}
                                    onSelectAddress={selectAddress}
                                    onAddNewAddress={navigateToAddAddressScreen}
                                    onToggleAddressForm={() => setShowAddressForm(!showAddressForm)}
                                    showAddressForm={showAddressForm}
                                    isAuthenticated={isAuthenticated}
                                />
                            </View>

                            {/* Customer Information Form */}
                            <View style={styles.card}>
                                <CustomerInfoForm
                                    name={name}
                                    setName={setName}
                                    email={email}
                                    setEmail={setEmail}
                                    phone={phone}
                                    setPhone={setPhone}
                                />
                            </View>

                            {/* Address Form */}
                            {(showAddressForm || savedAddresses.length === 0) && (
                                <View style={styles.card}>
                                    <AddressForm
                                        addressLine1={addressLine1}
                                        setAddressLine1={setAddressLine1}
                                        addressLine2={addressLine2}
                                        setAddressLine2={setAddressLine2}
                                        city={city}
                                        setCity={setCity}
                                        postcode={postcode}
                                        setPostcode={setPostcode}
                                        saveAddress={saveAddress}
                                        setSaveAddress={setSaveAddress}
                                        isAuthenticated={isAuthenticated}
                                        isAddressValid={isAddressValid}
                                        addressValidationMessage={addressValidationMessage}
                                        validatingLocation={validatingLocation}
                                    />
                                </View>
                            )}
                        </>
                    ) : (
                        <>
                            {/* Branch Visit - Show Location */}
                            <View style={styles.card}>
                                <Text style={styles.sectionTitle}>Visit Location</Text>
                                <View style={styles.locationDisplay}>
                                    {selectedLocation ? (
                                        <>
                                            <Feather name="map-pin" size={20} color="#9A563A" />
                                            <View style={styles.locationDetails}>
                                                <Text style={styles.locationName}>{selectedLocation.name}</Text>
                                                <Text style={styles.locationAddress}>
                                                    {selectedLocation.address}, {selectedLocation.city}
                                                </Text>
                                            </View>
                                        </>
                                    ) : (
                                        <Text style={styles.noLocationText}>No location selected</Text>
                                    )}
                                </View>
                            </View>

                            {/* Customer Information Form */}
                            <View style={styles.card}>
                                <CustomerInfoForm
                                    name={name}
                                    setName={setName}
                                    email={email}
                                    setEmail={setEmail}
                                    phone={phone}
                                    setPhone={setPhone}
                                />
                            </View>
                        </>
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

                    {/* Payment Summary */}
                    <View style={styles.card}>
                        <PaymentSummary
                            serviceDetails={serviceDetails}
                            appliedCoupon={appliedCoupon}
                            couponDiscount={couponDiscount}
                            finalPrice={finalPrice}
                            getBasePrice={getBasePrice}
                            hasServiceDiscount={hasServiceDiscount}
                            getServiceDiscountAmount={getServiceDiscountAmount}
                            getServiceDiscountPercentage={getServiceDiscountPercentage}
                            getTotalSavings={getTotalSavings}
                            visitType={visitType}
                            homeVisitFee={HOME_VISIT_FEE}
                        />
                    </View>

                    <View style={{ height: Platform.OS === 'android' ? 100 : 20 }} />
                </ScrollView>

                {/* Footer */}
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
        textAlign: 'right',
    },
    priceContainer: {
        alignItems: 'flex-end',
        flex: 2,
    },
    discountPriceContainer: {
        alignItems: 'flex-end',
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
    locationDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    },
    locationDetails: {
        marginLeft: 12,
        flex: 1,
    },
    noLocationText: {
        fontSize: 14,
        color: '#9CA3AF',
        fontStyle: 'italic',
    },
    locationAddress: {
        fontSize: 14,
        color: '#6B7280',
        lineHeight: 20,
    },
});

export default withAuthGuard(BookingCheckoutScreen);