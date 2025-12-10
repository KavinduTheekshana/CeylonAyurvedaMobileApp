// Updated BookingValidation.ts to use server-provided booking status info
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Function to check if a user has already booked a specific free service
 * @param serviceId - The ID of the service being booked
 * @param API_BASE_URL - The base URL for the API
 * @returns Promise<{canBook: boolean, message: string}>
 */
export const checkFreeServiceBookingEligibility = async (
  serviceId: number,
  API_BASE_URL: string
): Promise<{ canBook: boolean; message: string }> => {
  try {
    // Get the authentication token
    const token = await AsyncStorage.getItem('access_token');
    if (!token) {
      // If not authenticated, they need to log in first
      return {
        canBook: false,
        message: "Please log in to book this service."
      };
    }

    // First, check if the service is a free service (price === 0)
    // And also check if the user has already booked it in one API call
    const serviceResponse = await fetch(
      `${API_BASE_URL}/api/services/detail/${serviceId}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const serviceData = await serviceResponse.json();

    // If service is not free or service data couldn't be fetched, allow booking
    if (
      !serviceData.success ||
      !serviceData.data
    ) {
      return { canBook: true, message: "" };
    }

    // Check if service is free
    const isFreeService = (
      (serviceData.data.discount_price !== undefined && serviceData.data.discount_price === 0) ||
      serviceData.data.price === 0
    );

    if (!isFreeService) {
      // This is not a free service, so allow booking
      return { canBook: true, message: "" };
    }

    // If the API has provided booking status in the response, use it
    if (serviceData.data.user_has_booked !== undefined) {
      if (serviceData.data.user_has_booked) {
        return {
          canBook: false,
          message: "You have already booked this free service. Each user is limited to one booking for free services."
        };
      } else {
        // User hasn't booked this free service yet
        return { canBook: true, message: "" };
      }
    }

    // If the API doesn't provide booking status, fall back to our second method
    // Since this is a free service, check if the user has already booked it
    const bookingsResponse = await fetch(
      `${API_BASE_URL}/api/auth/bookings/list`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const bookingsData = await bookingsResponse.json();

    if (bookingsData.success && bookingsData.data) {
      // Filter bookings to find if this free service was already booked
      // and the booking is not cancelled
      const existingBookings = bookingsData.data.filter(
        (booking: any) =>
          booking.service_id === serviceId &&
          booking.status !== 'cancelled'
      );

      if (existingBookings.length > 0) {
        return {
          canBook: false,
          message: "You have already booked this free service. Each user is limited to one booking for free services."
        };
      }
    }

    // If no existing bookings for this free service, allow booking
    return { canBook: true, message: "" };
  } catch (error) {
    console.error('Error checking free service eligibility:', error);
    // On error, default to allowing the booking, but log the error
    return {
      canBook: true,
      message: ""
    };
  }
};

// Add default export to satisfy bundler requirements
export default {
  checkFreeServiceBookingEligibility
};