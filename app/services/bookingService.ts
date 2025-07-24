// app/services/bookingService.ts

import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from "@/config/api";
import { Service, Address, Coupon } from '../types/booking';

const SERVICE_API_URL = `${API_BASE_URL}/api/services`;
const ADDRESS_API_URL = `${API_BASE_URL}/api/addresses`;
const BOOKING_API_URL = `${API_BASE_URL}/api/bookings`;
const COUPON_API_URL = `${API_BASE_URL}/api/coupons`;

export const bookingService = {
    async checkAuthentication(): Promise<boolean> {
        try {
            const token = await AsyncStorage.getItem('access_token');
            return !!token;
        } catch (error) {
            console.error('Error checking authentication:', error);
            return false;
        }
    },

    async fetchServiceDetails(serviceId: number, serviceName: string, duration: number): Promise<Service> {
        try {
            const response = await fetch(`${SERVICE_API_URL}/detail/${serviceId}`);
            const data = await response.json();

            if (data.success && data.data) {
                return {
                    ...data.data,
                    price: parseFloat(data.data.price) || 0,
                    discount_price: data.data.discount_price ? parseFloat(data.data.discount_price) : undefined
                };
            } else {
                console.error('API error response:', data);
                // Return fallback service details
                return {
                    id: serviceId,
                    title: serviceName,
                    subtitle: 'Service details',
                    price: 75,
                    duration: duration,
                    benefits: '',
                    image: null,
                    offer: 0
                };
            }
        } catch (error) {
            console.error('Error fetching service details:', error);
            // Return fallback service details
            return {
                id: serviceId,
                title: serviceName,
                subtitle: 'Service details',
                price: 75,
                duration: duration,
                benefits: '',
                image: null,
                offer: 0
            };
        }
    },

    async fetchSavedAddresses(): Promise<Address[]> {
        try {
            const token = await AsyncStorage.getItem('access_token');
            
            if (!token) {
                return [];
            }

            const response = await fetch(ADDRESS_API_URL, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            });

            const data = await response.json();
            return data.success && Array.isArray(data.data) ? data.data : [];
        } catch (error) {
            console.error('Error fetching saved addresses:', error);
            return [];
        }
    },

    async validateCoupon(code: string, serviceId: number, amount: number): Promise<{
        valid: boolean;
        coupon?: Coupon;
        discount_amount?: number;
        message?: string;
    }> {
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
                    code: code.toUpperCase(),
                    service_id: serviceId,
                    amount: amount
                })
            });

            return await response.json();
        } catch (error) {
            console.error('Error validating coupon:', error);
            return {
                valid: false,
                message: 'Failed to validate coupon. Please try again.'
            };
        }
    },

    async createBooking(bookingData: any): Promise<any> {
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

            return await response.json();
        } catch (error) {
            console.error('Error creating booking:', error);
            throw error;
        }
    },

    async confirmPayment(paymentIntentId: string): Promise<any> {
        try {
            const token = await AsyncStorage.getItem('access_token');
            const headers: Record<string, string> = {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            };

            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            const response = await fetch(`${API_BASE_URL}/api/bookings/confirm-payment`, {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    payment_intent_id: paymentIntentId,
                }),
            });

            return await response.json();
        } catch (error) {
            console.error('Error confirming payment:', error);
            throw error;
        }
    }
};