// app/components/booking/PaymentMethodSelector.tsx

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { PaymentMethod } from '../../types/booking';

interface PaymentMethodSelectorProps {
    paymentMethod: PaymentMethod;
    setPaymentMethod: (method: PaymentMethod) => void;
}

export const PaymentMethodSelector: React.FC<PaymentMethodSelectorProps> = ({
    paymentMethod,
    setPaymentMethod
}) => {
    return (
        <View style={{ marginBottom: 20 }}>
            <Text style={{ fontSize: 14, fontWeight: '500', color: '#374151', marginBottom: 12 }}>
                Payment Method
            </Text>

            {/* Card Payment Option */}
            <TouchableOpacity
                style={[
                    {
                        flexDirection: 'row',
                        alignItems: 'center',
                        padding: 16,
                        marginBottom: 12,
                        borderWidth: 2,
                        borderRadius: 8,
                        backgroundColor: paymentMethod === 'card' ? '#FFF7ED' : '#ffffff'
                    },
                    { borderColor: paymentMethod === 'card' ? '#9A563A' : '#E5E7EB' }
                ]}
                onPress={() => setPaymentMethod('card')}
            >
                <View
                    style={[
                        {
                            width: 20,
                            height: 20,
                            borderRadius: 10,
                            borderWidth: 2,
                            marginRight: 12,
                            alignItems: 'center',
                            justifyContent: 'center'
                        },
                        {
                            borderColor: paymentMethod === 'card' ? '#9A563A' : '#9CA3AF',
                            backgroundColor: paymentMethod === 'card' ? '#9A563A' : 'transparent'
                        }
                    ]}
                >
                    {paymentMethod === 'card' && (
                        <View style={{
                            width: 8,
                            height: 8,
                            backgroundColor: '#ffffff',
                            borderRadius: 4
                        }} />
                    )}
                </View>
                <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                        <MaterialIcons name="credit-card" size={20} color="#9A563A" />
                        <Text style={{
                            fontSize: 16,
                            fontWeight: '600',
                            color: '#1F2937',
                            marginLeft: 8
                        }}>
                            Credit/Debit Card
                        </Text>
                    </View>
                    <Text style={{ fontSize: 14, color: '#6B7280' }}>
                        Pay securely with your card
                    </Text>
                </View>
            </TouchableOpacity>

            {/* Bank Transfer Option */}
            <TouchableOpacity
                style={[
                    {
                        flexDirection: 'row',
                        alignItems: 'center',
                        padding: 16,
                        borderWidth: 2,
                        borderRadius: 8,
                        backgroundColor: paymentMethod === 'bank_transfer' ? '#FFF7ED' : '#ffffff'
                    },
                    { borderColor: paymentMethod === 'bank_transfer' ? '#9A563A' : '#E5E7EB' }
                ]}
                onPress={() => setPaymentMethod('bank_transfer')}
            >
                <View
                    style={[
                        {
                            width: 20,
                            height: 20,
                            borderRadius: 10,
                            borderWidth: 2,
                            marginRight: 12,
                            alignItems: 'center',
                            justifyContent: 'center'
                        },
                        {
                            borderColor: paymentMethod === 'bank_transfer' ? '#9A563A' : '#9CA3AF',
                            backgroundColor: paymentMethod === 'bank_transfer' ? '#9A563A' : 'transparent'
                        }
                    ]}
                >
                    {paymentMethod === 'bank_transfer' && (
                        <View style={{
                            width: 8,
                            height: 8,
                            backgroundColor: '#ffffff',
                            borderRadius: 4
                        }} />
                    )}
                </View>
                <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                        <MaterialIcons name="account-balance" size={20} color="#9A563A" />
                        <Text style={{
                            fontSize: 16,
                            fontWeight: '600',
                            color: '#1F2937',
                            marginLeft: 8
                        }}>
                            Bank Transfer
                        </Text>
                    </View>
                    <Text style={{ fontSize: 14, color: '#6B7280' }}>
                        Our team will contact you with transfer details
                    </Text>
                </View>
            </TouchableOpacity>

            {/* Bank Transfer Notice */}
            {paymentMethod === 'bank_transfer' && (
                <View style={{
                    marginTop: 12,
                    padding: 12,
                    backgroundColor: '#FFF7ED',
                    borderWidth: 1,
                    borderColor: '#FED7AA',
                    borderRadius: 8
                }}>
                    <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                        <MaterialIcons name="info" size={16} color="#9A563A" />
                        <View style={{ flex: 1, marginLeft: 8 }}>
                            <Text style={{
                                fontSize: 14,
                                color: '#92400E',
                                fontWeight: '500',
                                marginBottom: 4
                            }}>
                                Bank Transfer Process:
                            </Text>
                            <Text style={{ fontSize: 12, color: '#B45309', lineHeight: 16 }}>
                                1. Submit your booking request{'\n'}
                                2. We'll email your booking reference and bank details.{'\n'}
                                3. Complete bank transfer using provided details{'\n'}
                                4. Booking confirmed after payment verification
                            </Text>
                        </View>
                    </View>
                </View>
            )}
        </View>
    );
};

export default PaymentMethodSelector;