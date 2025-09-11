// app/hooks/usePricing.ts

import { useState, useEffect } from 'react';
import { Service, Coupon } from '../types/booking';

export const usePricing = (serviceDetails: Service | null) => {
    const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
    const [couponDiscount, setCouponDiscount] = useState<number>(0);
    const [finalPrice, setFinalPrice] = useState<number>(0);

    const getBasePrice = (): number => {
        if (!serviceDetails) return 0;

        // Check if discount_price is a number and >= 0
        if (typeof serviceDetails.discount_price === 'number' && serviceDetails.discount_price >= 0) {
            return serviceDetails.discount_price;
        }

        // Otherwise use regular price
        return serviceDetails.price;
    };

    const calculateFinalPrice = (): number => {
        const basePrice = getBasePrice();
        return Math.max(0, basePrice - couponDiscount);
    };

    const hasServiceDiscount = (): boolean => {
        if (!serviceDetails) return false;
        return typeof serviceDetails.discount_price === 'number' && serviceDetails.discount_price >= 0;
    };

    const getServiceDiscountAmount = (): number => {
        if (!hasServiceDiscount() || !serviceDetails) return 0;
        return serviceDetails.price - (serviceDetails.discount_price || 0);
    };

    const getServiceDiscountPercentage = (): number => {
        if (!hasServiceDiscount() || !serviceDetails) return 0;
        const discountAmount = getServiceDiscountAmount();
        return Math.round((discountAmount / serviceDetails.price) * 100);
    };

    const getTotalSavings = (): number => {
        return getServiceDiscountAmount() + couponDiscount;
    };

    // Update final price whenever base price or coupon discount changes
    useEffect(() => {
        setFinalPrice(calculateFinalPrice());
    }, [serviceDetails, couponDiscount]);

    return {
        appliedCoupon,
        setAppliedCoupon,
        couponDiscount,
        setCouponDiscount,
        finalPrice,
        getBasePrice,
        hasServiceDiscount,
        getServiceDiscountAmount,
        getServiceDiscountPercentage,
        getTotalSavings
    };
};

export default usePricing;