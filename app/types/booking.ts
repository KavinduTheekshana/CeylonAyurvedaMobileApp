// app/types/booking.ts

export type Service = {
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

export type Address = {
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

export type Coupon = {
    id: number;
    code: string;
    type: 'percentage' | 'fixed';
    value: number;
    description?: string;
};

export type PaymentMethod = 'card' | 'bank_transfer';

export type RootStackParamList = {
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

export type BookingCheckoutScreenRouteProp = import('@react-navigation/native').RouteProp<RootStackParamList, 'BookingCheckoutScreen'>;
export type BookingCheckoutScreenNavigationProp = import('@react-navigation/stack').StackNavigationProp<RootStackParamList>;