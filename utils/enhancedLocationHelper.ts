// utils/enhancedLocationHelper.ts

import { API_BASE_URL } from '@/config/api';
import type { Location } from '../app/contexts/LocationContext';

interface ValidationResult {
    isValid: boolean;
    errorMessage?: string;
    distance?: number;
    suggestedLocations?: Location[];
}

interface LocationWithDistance {
    location: Location;
    distance: number;
}

/**
 * Calculate distance between two points using Haversine formula
 */
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 3959; // Earth's radius in miles
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
        Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}

/**
 * Get coordinates for a UK postcode using a geocoding service
 */
async function getPostcodeCoordinates(postcode: string): Promise<{lat: number, lng: number} | null> {
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
 * Fetch all active locations from the database
 */
async function fetchAllLocations(): Promise<Location[]> {
    try {
        const response = await fetch(`${API_BASE_URL}/api/locations`);
        const data = await response.json();
        
        if (data.success && Array.isArray(data.data)) {
            return data.data.map((location: any) => ({
                id: location.id,
                name: location.name,
                slug: location.slug,
                city: location.city,
                address: location.address,
                postcode: location.postcode || '',
                latitude: location.latitude ? parseFloat(location.latitude) : null,
                longitude: location.longitude ? parseFloat(location.longitude) : null,
                phone: location.phone || null,
                email: location.email || null,
                description: location.description || null,
                operating_hours: location.operating_hours || null,
                image: location.image,
                status: location.status !== false,
                service_radius_miles: location.service_radius_miles || 5
            }));
        }
        
        return [];
    } catch (error) {
        console.error('Error fetching locations:', error);
        return [];
    }
}

/**
 * Find the closest locations to a given postcode
 */
async function findClosestLocations(postcode: string, limit = 3): Promise<LocationWithDistance[]> {
    try {
        const coordinates = await getPostcodeCoordinates(postcode);
        if (!coordinates) {
            return [];
        }
        
        const allLocations = await fetchAllLocations();
        const locationsWithDistance: LocationWithDistance[] = [];
        
        for (const location of allLocations) {
            if (location.latitude !== null && location.longitude !== null) {
                const distance = calculateDistance(
                    coordinates.lat,
                    coordinates.lng,
                    location.latitude,
                    location.longitude
                );
                
                locationsWithDistance.push({
                    location,
                    distance
                });
            }
        }
        
        // Sort by distance and return the closest ones
        return locationsWithDistance
            .sort((a, b) => a.distance - b.distance)
            .slice(0, limit);
            
    } catch (error) {
        console.error('Error finding closest locations:', error);
        return [];
    }
}

/**
 * Smart postcode validation that checks against all locations and suggests alternatives
 */
export async function validatePostcodeWithLocationSuggestions(
    postcode: string,
    selectedLocation: Location | null
): Promise<ValidationResult> {
    if (!selectedLocation) {
        return {
            isValid: false,
            errorMessage: 'No location selected. Please select a location first.'
        };
    }
    
    if (!selectedLocation.latitude || !selectedLocation.longitude) {
        return {
            isValid: false,
            errorMessage: `Location coordinates not available for ${selectedLocation.name}. Please contact support for assistance.`
        };
    }
    
    try {
        // Get coordinates for the input postcode
        const coordinates = await getPostcodeCoordinates(postcode);
        
        if (!coordinates) {
            return {
                isValid: false,
                errorMessage: 'Could not find the postcode. Please check if it\'s a valid UK postcode.'
            };
        }
        
        // Calculate distance to selected location
        const distanceToSelected = calculateDistance(
            selectedLocation.latitude,
            selectedLocation.longitude,
            coordinates.lat,
            coordinates.lng
        );
        
        const serviceRadius = selectedLocation.service_radius_miles || 5;
        
        // If within selected location's radius, approve
        if (distanceToSelected <= serviceRadius) {
            return {
                isValid: true,
                distance: Math.round(distanceToSelected * 10) / 10
            };
        }
        
        // If not within radius, find closest locations and suggest alternatives
        const closestLocations = await findClosestLocations(postcode, 3);
        const alternativeLocations = closestLocations
            .filter(item => item.distance <= item.location.service_radius_miles)
            .map(item => item.location);
        
        if (alternativeLocations.length > 0) {
            const closestAlternative = closestLocations[0];
            return {
                isValid: false,
                errorMessage: `This address is ${Math.round(distanceToSelected * 10) / 10} miles from ${selectedLocation.name} (outside our ${serviceRadius} mile service area). However, it's within the service area of ${closestAlternative.location.name} (${Math.round(closestAlternative.distance * 10) / 10} miles away).`,
                distance: Math.round(distanceToSelected * 10) / 10,
                suggestedLocations: alternativeLocations
            };
        } else {
            return {
                isValid: false,
                errorMessage: `This address is ${Math.round(distanceToSelected * 10) / 10} miles from ${selectedLocation.name}. We only service addresses within ${serviceRadius} miles of our ${selectedLocation.name} location. Unfortunately, this address is not within any of our service areas.`,
                distance: Math.round(distanceToSelected * 10) / 10
            };
        }
        
    } catch (error) {
        console.error('Error validating postcode with suggestions:', error);
        return {
            isValid: false,
            errorMessage: 'Unable to validate location. Please try again or contact support.'
        };
    }
}

/**
 * Quick check using database locations instead of hardcoded adjacent areas
 */
export async function smartQuickLocationCheck(postcode: string, selectedLocation: Location | null): Promise<boolean> {
    if (!selectedLocation || !postcode) return false;
    
    try {
        // Clean and normalize postcodes
        const cleanInputPostcode = postcode.replace(/\s+/g, '').toUpperCase();
        const cleanLocationPostcode = selectedLocation.postcode.replace(/\s+/g, '').toUpperCase();
        
        // Extract postcode area (first part before numbers)
        const inputArea = cleanInputPostcode.match(/^[A-Z]+/)?.[0] || '';
        const locationArea = cleanLocationPostcode.match(/^[A-Z]+/)?.[0] || '';
        
        // If same postcode area, likely to be close
        if (inputArea === locationArea) {
            return true;
        }
        
        // Get all locations from database to check their postcode areas
        const allLocations = await fetchAllLocations();
        const serviceAreas = new Set();
        
        // Collect all postcode areas from all locations
        for (const location of allLocations) {
            if (location.postcode) {
                const cleanPostcode = location.postcode.replace(/\s+/g, '').toUpperCase();
                const area = cleanPostcode.match(/^[A-Z]+/)?.[0];
                if (area) {
                    serviceAreas.add(area);
                }
            }
        }
        
        // If the input postcode area is in any of our service areas, allow it
        // This is more permissive than the exact location check
        return serviceAreas.has(inputArea);
        
    } catch (error) {
        console.error('Error in smart quick location check:', error);
        // On error, be permissive and let the full validation decide
        return true;
    }
}

/**
 * Get service coverage summary for all locations
 */
export async function getServiceCoverageSummary(): Promise<{
    totalLocations: number;
    postcodeAreas: string[];
    averageServiceRadius: number;
}> {
    try {
        const allLocations = await fetchAllLocations();
        const postcodeAreas = new Set<string>();
        let totalRadius = 0;
        let locationsWithRadius = 0;
        
        for (const location of allLocations) {
            if (location.postcode) {
                const area = location.postcode.replace(/\s+/g, '').toUpperCase().match(/^[A-Z]+/)?.[0];
                if (area) {
                    postcodeAreas.add(area);
                }
            }
            
            if (location.service_radius_miles) {
                totalRadius += location.service_radius_miles;
                locationsWithRadius++;
            }
        }
        
        return {
            totalLocations: allLocations.length,
            postcodeAreas: Array.from(postcodeAreas).sort(),
            averageServiceRadius: locationsWithRadius > 0 ? Math.round(totalRadius / locationsWithRadius) : 5
        };
        
    } catch (error) {
        console.error('Error getting service coverage summary:', error);
        return {
            totalLocations: 0,
            postcodeAreas: [],
            averageServiceRadius: 5
        };
    }
}