import React, { useState } from 'react';
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
    Platform
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { HeaderBackButton } from '@react-navigation/elements';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from "@/config/api";
import { validatePostcodeWithLocationSuggestions, smartQuickLocationCheck } from '@/utils/enhancedLocationHelper';
import { useLocation } from '../contexts/LocationContext'; // Import location context
import { Feather } from '@expo/vector-icons';

// Type for the navigation
type RootStackParamList = {
    BookingCheckoutScreen: {
        serviceId: number;
        serviceName: string;
        selectedDate: string;
        selectedTime: string;
        duration: number;
    };
    // Other screens...
};

type AddAddressScreenNavigationProp = StackNavigationProp<RootStackParamList>;

const ADDRESS_API_URL = `${API_BASE_URL}/api/addresses`;

const AddAddressScreen = () => {
    const navigation = useNavigation<AddAddressScreenNavigationProp>();
    // Add setSelectedLocation function from context
    const { selectedLocation, setSelectedLocation } = useLocation(); // Get selected location and setter

    // Form states
    const [name, setName] = useState<string>('');
    const [email, setEmail] = useState<string>('');
    const [phone, setPhone] = useState<string>('');
    const [addressLine1, setAddressLine1] = useState<string>('');
    const [addressLine2, setAddressLine2] = useState<string>('');
    const [city, setCity] = useState<string>('');
    const [postcode, setPostcode] = useState<string>('');
    const [isDefault, setIsDefault] = useState<boolean>(true);
    const [submitting, setSubmitting] = useState<boolean>(false);
    const [validatingLocation, setValidatingLocation] = useState<boolean>(false);

    React.useLayoutEffect(() => {
        navigation.setOptions({
            title: 'Add New Address',
            headerLeft: () => (
                <HeaderBackButton
                    onPress={() => navigation.goBack()}
                    tintColor="#000"
                />
            ),
        });
    }, [navigation]);

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

    const handleSaveAddress = async () => {
        if (!validateForm()) return;

        // Check if location is selected
        if (!selectedLocation) {
            Alert.alert(
                'Location Required',
                'Please select a location first to validate your address.',
                [
                    {
                        text: 'OK',
                        style: 'default'
                    }
                ]
            );
            return;
        }

        // First, smart quick check using database locations
        const quickCheckResult = await smartQuickLocationCheck(postcode, selectedLocation);
        
        if (!quickCheckResult) {
            Alert.alert(
                'Service Area Notice',
                `This postcode may be outside our service areas. Would you like to continue with validation?`,
                [
                    {
                        text: 'Cancel',
                        style: 'cancel'
                    },
                    {
                        text: 'Continue',
                        onPress: () => performLocationValidation()
                    }
                ]
            );
            return;
        }

        // If quick check passes, do full validation
        performLocationValidation();
    };

    const performLocationValidation = async () => {
        if (!selectedLocation) {
            Alert.alert('Error', 'No location selected for validation.');
            return;
        }

        setValidatingLocation(true);

        try {
            // Use enhanced validation with location suggestions
            const validationResult = await validatePostcodeWithLocationSuggestions(postcode, selectedLocation);

            if (!validationResult.isValid) {
                // Check if there are suggested alternative locations
                if (validationResult.suggestedLocations && validationResult.suggestedLocations.length > 0) {
                    const suggestedLocation = validationResult.suggestedLocations[0];
                    
                    Alert.alert(
                        'Alternative Location Available',
                        `${validationResult.errorMessage}\n\nWould you like to switch to ${suggestedLocation.name} instead?`,
                        [
                            {
                                text: 'Cancel',
                                style: 'cancel'
                            },
                            {
                                text: `Switch to ${suggestedLocation.name}`,
                                onPress: async () => {
                                    // Switch to the suggested location
                                    await setSelectedLocation(suggestedLocation);
                                    // Then save the address
                                    await saveAddressToServer();
                                }
                            },
                            {
                                text: 'Save Anyway',
                                onPress: () => saveAddressToServer()
                            }
                        ]
                    );
                } else {
                    Alert.alert(
                        'Outside Service Area',
                        validationResult.errorMessage || `This address is outside our service area for ${selectedLocation.name}.`,
                        [
                            {
                                text: 'OK',
                                style: 'default'
                            }
                        ]
                    );
                }
                setValidatingLocation(false);
                return;
            }

            // If validation passes, save the address
            await saveAddressToServer();
        } catch (error) {
            console.error('Location validation error:', error);
            // If validation fails, give option to continue anyway
            Alert.alert(
                'Location Validation Error',
                'We could not validate the location. Would you like to save the address anyway?',
                [
                    {
                        text: 'Cancel',
                        style: 'cancel'
                    },
                    {
                        text: 'Save Anyway',
                        onPress: () => saveAddressToServer()
                    }
                ]
            );
        } finally {
            setValidatingLocation(false);
        }
    };

    const saveAddressToServer = async () => {
        setSubmitting(true);

        // Prepare the address data
        const addressData = {
            name,
            email,
            phone,
            address_line1: addressLine1,
            address_line2: addressLine2,
            city,
            postcode,
            is_default: isDefault,
            location_id: selectedLocation?.id // Include location ID
        };

        try {
            // Get the authentication token
            const token = await AsyncStorage.getItem('access_token');

            if (!token) {
                Alert.alert('Error', 'You must be logged in to save addresses');
                setSubmitting(false);
                return;
            }

            // Send address data to the API
            const response = await fetch(ADDRESS_API_URL, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(addressData),
            });

            const data = await response.json();

            if (data.success && data.data) {
                Alert.alert(
                    'Success',
                    'Address saved successfully',
                    [
                        {
                            text: 'OK',
                            onPress: () => navigation.goBack()
                        }
                    ]
                );
            } else {
                Alert.alert('Error', data.message || 'Failed to save address. Please try again.');
            }
        } catch (error) {
            console.error('Error saving address:', error);
            Alert.alert('Error', 'There was an error saving your address. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    const getServiceAreaText = () => {
        if (!selectedLocation) {
            return 'Please select a location first';
        }
        
        const radius = selectedLocation.service_radius_miles || 5;
        return `We currently service addresses within ${radius} miles of ${selectedLocation.name}`;
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
        >
            <SafeAreaView style={styles.container}>
                <ScrollView style={styles.content}>
                    <Text style={styles.title}>Add New Address</Text>
                    
                    {/* Selected Location Display */}
                    {selectedLocation ? (
                        <View style={styles.locationCard}>
                            <View style={styles.locationHeader}>
                                <Feather name="map-pin" size={16} color="#9A563A" />
                                <Text style={styles.locationTitle}>Selected Location</Text>
                            </View>
                            <Text style={styles.locationName}>{selectedLocation.name}</Text>
                            <Text style={styles.serviceAreaNote}>{getServiceAreaText()}</Text>
                        </View>
                    ) : (
                        <View style={styles.warningCard}>
                            <Feather name="alert-triangle" size={16} color="#F59E0B" />
                            <Text style={styles.warningText}>
                                No location selected. Please select a location to validate your address.
                            </Text>
                        </View>
                    )}

                    <View style={styles.card}>
                        <Text style={styles.sectionTitle}>Personal Information</Text>

                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Full Name *</Text>
                            <TextInput
                                style={styles.input}
                                value={name}
                                onChangeText={setName}
                                placeholder="Enter your full name"
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
                            />
                        </View>
                    </View>

                    <View style={styles.card}>
                        <Text style={styles.sectionTitle}>Address Details</Text>

                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Address Line 1 *</Text>
                            <TextInput
                                style={styles.input}
                                value={addressLine1}
                                onChangeText={setAddressLine1}
                                placeholder="Street address, house number"
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Address Line 2</Text>
                            <TextInput
                                style={styles.input}
                                value={addressLine2}
                                onChangeText={setAddressLine2}
                                placeholder="Apartment, suite, unit, etc. (optional)"
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>City *</Text>
                            <TextInput
                                style={styles.input}
                                value={city}
                                onChangeText={setCity}
                                placeholder="City"
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>
                                Postcode * {selectedLocation ? `(${selectedLocation.name} area only)` : ''}
                            </Text>
                            <TextInput
                                style={styles.input}
                                value={postcode}
                                onChangeText={setPostcode}
                                placeholder="Postcode"
                                autoCapitalize="characters"
                            />
                        </View>

                        <View style={styles.checkboxRow}>
                            <TouchableOpacity
                                style={[styles.checkbox, isDefault && styles.checkboxChecked]}
                                onPress={() => setIsDefault(!isDefault)}
                            >
                                {isDefault && <Text style={styles.checkmark}>✓</Text>}
                            </TouchableOpacity>
                            <Text style={styles.checkboxLabel}>Set as default address</Text>
                        </View>
                    </View>
                </ScrollView>

                <View style={styles.footer}>
                    <TouchableOpacity
                        style={[
                            styles.saveButton,
                            (!selectedLocation || submitting || validatingLocation) && styles.saveButtonDisabled
                        ]}
                        onPress={handleSaveAddress}
                        disabled={!selectedLocation || submitting || validatingLocation}
                    >
                        {submitting || validatingLocation ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.saveButtonText}>
                                {validatingLocation ? 'Validating Location...' : 'Save Address'}
                            </Text>
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
    warningCard: {
        backgroundColor: '#FFF8E1',
        borderRadius: 8,
        padding: 12,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#FFB74D',
        flexDirection: 'row',
        alignItems: 'center',
    },
    warningText: {
        fontSize: 14,
        color: '#E65100',
        marginLeft: 8,
        flex: 1,
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
    saveButton: {
        backgroundColor: '#9A563A',
        padding: 16,
        borderRadius: 8,
        alignItems: 'center',
    },
    saveButtonDisabled: {
        backgroundColor: '#cccccc',
    },
    saveButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
});

export default AddAddressScreen;