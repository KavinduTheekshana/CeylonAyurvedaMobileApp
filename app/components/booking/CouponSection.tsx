// app/components/booking/CouponSection.tsx

import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Coupon } from '../../types/booking';

interface CouponSectionProps {
    appliedCoupon: Coupon | null;
    onApplyCoupon: (code: string) => Promise<void>;
    onRemoveCoupon: () => void;
}

export const CouponSection: React.FC<CouponSectionProps> = ({
    appliedCoupon,
    onApplyCoupon,
    onRemoveCoupon
}) => {
    const [couponCode, setCouponCode] = useState('');
    const [validatingCoupon, setValidatingCoupon] = useState(false);
    const [couponError, setCouponError] = useState('');

    const handleApplyCoupon = async () => {
        if (!couponCode.trim()) {
            setCouponError('Please enter a coupon code');
            return;
        }

        setValidatingCoupon(true);
        setCouponError('');

        try {
            await onApplyCoupon(couponCode);
        } catch (error: any) {
            setCouponError(error.message || 'Failed to validate coupon');
        } finally {
            setValidatingCoupon(false);
        }
    };

    const handleRemoveCoupon = () => {
        onRemoveCoupon();
        setCouponCode('');
        setCouponError('');
    };

    return (
        <View>
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
                        onPress={handleApplyCoupon}
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
                        onPress={handleRemoveCoupon}
                    >
                        <Feather name="x" size={20} color="#EF4444" />
                    </TouchableOpacity>
                </View>
            )}

            {couponError && (
                <Text style={styles.couponErrorText}>{couponError}</Text>
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
    inputError: {
        borderColor: '#EF4444',
        backgroundColor: '#FEF2F2',
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
});