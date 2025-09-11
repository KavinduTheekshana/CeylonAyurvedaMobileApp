// app/components/booking/CustomerInfoForm.tsx

import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';

interface CustomerInfoFormProps {
    name: string;
    setName: (value: string) => void;
    email: string;
    setEmail: (value: string) => void;
    phone: string;
    setPhone: (value: string) => void;
}

export const CustomerInfoForm: React.FC<CustomerInfoFormProps> = ({
    name,
    setName,
    email,
    setEmail,
    phone,
    setPhone
}) => {
    return (
        <View>
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
});

export default CustomerInfoForm;