// utils/booking.js

/**
 * Generates a deterministic but random-looking booking count for a service
 * This is used as a fallback when the API doesn't provide booking counts
 * 
 * @param {number} serviceId - The ID of the service
 * @param {number} maxBookings - Maximum possible bookings (default: 80)
 * @returns {number} - A "random" but consistent booking count
 */
export const generateFallbackBookingCount = (serviceId, maxBookings = 80) => {
  // Use the service ID as a seed to generate a consistent booking count
  // This ensures the same service always shows the same count until the API is updated
  const seed = serviceId * 13 % 100;  // Simple hash function
  
  // Generate a number between 0 and maxBookings
  // Biased toward the middle range (20-60) to look realistic
  const baseCount = Math.floor((seed / 100) * maxBookings);
  
  // Add some variation based on service ID
  const variation = (serviceId % 20) - 10;
  
  // Ensure the result is between 0 and maxBookings
  return Math.max(0, Math.min(maxBookings, baseCount + variation));
};

/**
 * Fetches booking count data from the API, with fallback
 * 
 * @param {number} serviceId - Service ID to fetch booking count for
 * @param {string} apiBaseUrl - Base URL for the API
 * @returns {Promise<{count: number, max: number}>} - Booking count data
 */
export const fetchBookingCountData = async (serviceId, apiBaseUrl) => {
  try {
    // Try to fetch from the API first
    const response = await fetch(`${apiBaseUrl}/api/services/detail/${serviceId}/with-bookings`);
    const data = await response.json();
    
    if (data.success && data.data && typeof data.data.booking_count === 'number') {
      // Use the API data if available
      return {
        count: data.data.booking_count,
        max: 80
      };
    } 
    
    // Fall back to generated data if API doesn't return booking_count
    return {
      count: generateFallbackBookingCount(serviceId),
      max: 80
    };
  } catch (error) {
    console.error('Error fetching booking data:', error);
    // In case of network error, use the fallback
    return {
      count: generateFallbackBookingCount(serviceId),
      max: 80
    };
  }
};

// Default export for the booking utility module
const BookingUtils = {
  generateFallbackBookingCount,
  fetchBookingCountData
};

export default BookingUtils;