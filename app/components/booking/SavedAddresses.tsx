// app/components/booking/SavedAddresses.tsx

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Address } from '../../types/booking';

interface SavedAddressesProps {
    savedAddresses: Address[];
    selectedAddressId: number | null;
    onSelectAddress: (addressId: number) => void;
    onAddNewAddress: () => void;
    onToggleAddressForm: () => void;
    showAddressForm: boolean;
    isAuthenticated: boolean;
}

export const SavedAddresses: React.FC<SavedAddressesProps> = ({
    savedAddresses,
    selectedAddressId,
    onSelectAddress,
    onAddNewAddress,
    onToggleAddressForm,
    showAddressForm,
    isAuthenticated
}) => {
    if (!isAuthenticated) return null;

    if (savedAddresses.length === 0) {
        return (
            <View>
                <Text style={styles.sectionTitle}>Your Addresses</Text>
                <Text style={styles.noAddressText}>You don't have any saved addresses.</Text>
                <TouchableOpacity
                    style={styles.addNewAddressButton}
                    onPress={onAddNewAddress}
                >
                    <Text style={styles.addNewAddressButtonText}>Add New Address</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View>
            <Text style={styles.sectionTitle}>Your Addresses</Text>

            {savedAddresses.map((address) => (
                <TouchableOpacity
                    key={address.id}
                    style={[
                        styles.addressOption,
                        selectedAddressId === address.id && styles.selectedAddressOption
                    ]}
                    onPress={() => onSelectAddress(address.id)}
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
                onPress={onAddNewAddress}
            >
                <Text style={styles.addAddressButtonText}>+ Add New Address</Text>
            </TouchableOpacity>

            <TouchableOpacity
                style={styles.useNewAddressButton}
                onPress={onToggleAddressForm}
            >
                <Text style={styles.useNewAddressButtonText}>
                    {showAddressForm ? 'Use Saved Address' : 'Use a Different Address'}
                </Text>
            </TouchableOpacity>
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
    addressOption: {
        padding: 12,
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        marginBottom: 12,
        position: 'relative',
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
});

export default SavedAddresses;