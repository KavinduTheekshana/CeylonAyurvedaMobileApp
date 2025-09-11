// app/utils/locationUtils.ts

/**
 * Calculate distance between two points using Haversine formula (in miles)
 */
export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 3959; // Earth's radius in miles
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

/**
 * Get coordinates for a UK postcode using postcodes.io API
 */
export async function getPostcodeCoordinates(postcode: string): Promise<{ lat: number, lng: number } | null> {
    try {
        const cleanPostcode = postcode.replace(/\s+/g, '').toUpperCase();
        const response = await fetch(`https://api.postcodes.io/postcodes/${cleanPostcode}`);

        if (!response.ok) {
            console.log('Postcode API response not OK:', response.status);
            return null;
        }

        const data = await response.json();

        if (data.status === 200 && data.result) {
            return {
                lat: data.result.latitude,
                lng: data.result.longitude
            };
        }

        return null;
    } catch (error) {
        console.error('Error geocoding postcode:', error);
        return null;
    }
}

/**
 * Validate if address is within location's service radius
 */
export async function validateAddressLocation(postcode: string, selectedLocation: any): Promise<{
    isValid: boolean;
    distance?: number;
    errorMessage?: string;
}> {
    if (!selectedLocation) {
        return {
            isValid: false,
            errorMessage: 'No location selected for validation.'
        };
    }

    // If no coordinates available for the location, be more permissive
    if (!selectedLocation.latitude || !selectedLocation.longitude) {
        console.log('Location coordinates not available, allowing address');
        return { isValid: true };
    }

    try {
        // Get coordinates for the input postcode
        const coordinates = await getPostcodeCoordinates(postcode);

        if (!coordinates) {
            console.log('Could not get coordinates for postcode, allowing address');
            return { isValid: true }; // Be permissive if we can't validate
        }

        console.log(`Postcode Coordinates: ${coordinates.lat}, ${coordinates.lng}`);
        console.log(`Location Coordinates: ${selectedLocation.latitude}, ${selectedLocation.longitude}`);

        // Calculate distance
        const distance = calculateDistance(
            selectedLocation.latitude,
            selectedLocation.longitude,
            coordinates.lat,
            coordinates.lng
        );

        const serviceRadius = selectedLocation.service_radius_miles || 10; // Default to 10 miles if not set

        console.log(`Calculated Distance: ${distance.toFixed(2)} miles`);
        console.log(`Service Radius: ${serviceRadius} miles`);
        console.log(`Is Valid: ${distance <= serviceRadius}`);

        if (distance <= serviceRadius) {
            return {
                isValid: true,
                distance: Math.round(distance * 10) / 10
            };
        } else {
            return {
                isValid: false,
                distance: Math.round(distance * 10) / 10,
                errorMessage: `This address is ${Math.round(distance * 10) / 10} miles from ${selectedLocation.name}. We only service addresses within ${serviceRadius} miles of this location.`
            };
        }

    } catch (error) {
        console.error('Error validating location distance:', error);
        // On error, allow the address to be saved
        return { isValid: true };
    }
}

const locationUtils = {
    calculateDistance,
    getPostcodeCoordinates,
    validateAddressLocation
};

export default locationUtils;