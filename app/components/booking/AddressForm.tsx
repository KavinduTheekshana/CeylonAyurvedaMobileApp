// app/components/booking/AddressForm.tsx

import React from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';

interface AddressFormProps {
    addressLine1: string;
    setAddressLine1: (value: string) => void;
    addressLine2: string;
    setAddressLine2: (value: string) => void;
    city: string;
    setCity: (value: string) => void;
    postcode: string;
    setPostcode: (value: string) => void;
    saveAddress: boolean;
    setSaveAddress: (value: boolean) => void;
    isAuthenticated: boolean;
    isAddressValid: boolean;
    addressValidationMessage: string;
    validatingLocation: boolean;
}

export const AddressForm: React.FC<AddressFormProps> = ({
    addressLine1,
    setAddressLine1,
    addressLine2,
    setAddressLine2,
    city,
    setCity,
    postcode,
    setPostcode,
    saveAddress,
    setSaveAddress,
    isAuthenticated,
    isAddressValid,
    addressValidationMessage,
    validatingLocation
}) => {
    return (
        <View>
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
    );
};

const styles = StyleSheet.create({
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
    inputError: {
        borderColor: '#EF4444',
        backgroundColor: '#FEF2F2',
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
});