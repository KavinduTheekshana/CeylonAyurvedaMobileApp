// app/components/booking/PaymentSummary.tsx

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Service, Coupon } from '../../types/booking';

interface PaymentSummaryProps {
    serviceDetails: Service | null;
    appliedCoupon: Coupon | null;
    couponDiscount: number;
    finalPrice: number;
    getBasePrice: () => number;
    hasServiceDiscount: () => boolean;
    getServiceDiscountAmount: () => number;
    getServiceDiscountPercentage: () => number;
    getTotalSavings: () => number;
}

export const PaymentSummary: React.FC<PaymentSummaryProps> = ({
    serviceDetails,
    appliedCoupon,
    couponDiscount,
    finalPrice,
    getBasePrice,
    hasServiceDiscount,
    getServiceDiscountAmount,
    getServiceDiscountPercentage,
    getTotalSavings
}) => {
    if (!serviceDetails) return null;

    return (
        <View>
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
    );
};

const styles = StyleSheet.create({
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 12,
        color: '#333',
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
});

export default PaymentSummary;