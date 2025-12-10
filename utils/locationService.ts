import * as Location from 'expo-location';
import { Alert, Platform } from 'react-native';
import axios from 'axios';
import { API_BASE_URL } from '@/config/api';

interface LocationCoords {
  latitude: number;
  longitude: number;
}

interface NearestLocationResponse {
  success: boolean;
  data?: any;
  message?: string;
}

/**
 * Request location permissions from the user
 */
export const requestLocationPermission = async (): Promise<boolean> => {
  try {
    const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();

    if (foregroundStatus !== 'granted') {
      Alert.alert(
        'Location Permission Required',
        'Please enable location services to automatically select the nearest branch.',
        [{ text: 'OK' }]
      );
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error requesting location permission:', error);
    return false;
  }
};

/**
 * Get the current user location
 */
export const getCurrentLocation = async (): Promise<LocationCoords | null> => {
  try {
    const hasPermission = await requestLocationPermission();

    if (!hasPermission) {
      return null;
    }

    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });

    return {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
    };
  } catch (error) {
    console.error('Error getting current location:', error);
    Alert.alert(
      'Location Error',
      'Unable to get your current location. Please check your device settings.',
      [{ text: 'OK' }]
    );
    return null;
  }
};

/**
 * Fetch the nearest location/branch from the API
 */
export const fetchNearestLocation = async (
  latitude: number,
  longitude: number
): Promise<NearestLocationResponse> => {
  try {
    const response = await axios.post(`${API_BASE_URL}/api/locations/nearest`, {
      latitude,
      longitude,
    });

    return response.data;
  } catch (error) {
    console.error('Error fetching nearest location:', error);

    if (axios.isAxiosError(error)) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to find nearest location',
      };
    }

    return {
      success: false,
      message: 'An unexpected error occurred',
    };
  }
};

/**
 * Get and auto-select the nearest location
 * Returns the selected location or null if failed
 */
export const autoSelectNearestLocation = async (): Promise<any | null> => {
  try {
    // Get current location
    const coords = await getCurrentLocation();

    if (!coords) {
      console.log('Could not get user location');
      return null;
    }

    console.log('User coordinates:', coords);

    // Fetch nearest location from API
    const result = await fetchNearestLocation(coords.latitude, coords.longitude);

    if (result.success && result.data) {
      console.log('Nearest location found:', result.data.name);
      return result.data;
    } else {
      console.log('No nearest location found:', result.message);
      Alert.alert(
        'Location Not Found',
        result.message || 'Could not find a nearby branch. Please select manually.',
        [{ text: 'OK' }]
      );
      return null;
    }
  } catch (error) {
    console.error('Error in autoSelectNearestLocation:', error);
    return null;
  }
};
