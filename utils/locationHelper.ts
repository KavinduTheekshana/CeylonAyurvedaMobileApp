// utils/locationHelper.ts (place this in the root utils folder, not in app folder)
import axios from 'axios';

interface Location {
    lat: number;
    lng: number;
}

// Derby center coordinates
const DERBY_CENTER = {
    lat: 52.9225,
    lng: -1.4746
};

// Radius in miles
const MAX_RADIUS_MILES = 5;

// Convert miles to kilometers for calculation
const MILES_TO_KM = 1.60934;

/**
 * Calculate the distance between two points using the Haversine formula
 * @param lat1 Latitude of point 1
 * @param lon1 Longitude of point 1
 * @param lat2 Latitude of point 2
 * @param lon2 Longitude of point 2
 * @returns Distance in miles
 */
export const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 3959; // Radius of the Earth in miles
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
};

/**
 * Get coordinates from UK postcode using a free API
 * @param postcode UK postcode
 * @returns Location coordinates
 */
export const getCoordinatesFromPostcode = async (postcode: string): Promise<Location | null> => {
    try {
        // Clean the postcode (remove spaces)
        const cleanPostcode = postcode.replace(/\s/g, '');
        
        // Using postcodes.io - a free UK postcode API
        const response = await axios.get(`https://api.postcodes.io/postcodes/${cleanPostcode}`);
        
        if (response.data.status === 200 && response.data.result) {
            return {
                lat: response.data.result.latitude,
                lng: response.data.result.longitude
            };
        }
        
        return null;
    } catch (error) {
        console.error('Error geocoding postcode:', error);
        return null;
    }
};

/**
 * Check if a postcode is within the Derby service area
 * @param postcode UK postcode to check
 * @returns Object with validation result and distance
 */
export const validateDerbyServiceArea = async (postcode: string): Promise<{
    isValid: boolean;
    distance?: number;
    errorMessage?: string;
}> => {
    try {
        const location = await getCoordinatesFromPostcode(postcode);
        
        if (!location) {
            return {
                isValid: false,
                errorMessage: 'Invalid postcode or unable to find location'
            };
        }
        
        const distance = calculateDistance(
            DERBY_CENTER.lat,
            DERBY_CENTER.lng,
            location.lat,
            location.lng
        );
        
        const isValid = distance <= MAX_RADIUS_MILES;
        
        return {
            isValid,
            distance,
            errorMessage: isValid ? undefined : `Location is ${distance.toFixed(1)} miles from Derby. Service area is limited to ${MAX_RADIUS_MILES} miles.`
        };
    } catch (error) {
        console.error('Error validating service area:', error);
        return {
            isValid: false,
            errorMessage: 'Unable to validate location. Please check the postcode.'
        };
    }
};

/**
 * Get list of Derby area postcodes (first part only)
 * This is a simplified list - you may want to expand this
 */
export const DERBY_AREA_POSTCODES = [
    'DE1', 'DE3', 'DE21', 'DE22', 'DE23', 'DE24', 'DE65', 'DE73', 'DE74',
    // Parts of these postcodes may be within 5 miles
    'DE56', 'DE72', 'DE55', 'DE15', 'DE13', 'DE11'
];

/**
 * Quick check if postcode might be in Derby area
 * This is a preliminary check - full validation still needed
 */
export const quickDerbyAreaCheck = (postcode: string): boolean => {
    const postcodePrefix = postcode.trim().toUpperCase().split(' ')[0];
    return DERBY_AREA_POSTCODES.some(prefix => postcodePrefix.startsWith(prefix));
};