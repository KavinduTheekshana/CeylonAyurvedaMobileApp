// app/contexts/LocationContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Location {
    id: number;
    name: string;
    slug: string;
    city: string;
    address: string;
    image?: string;
}

interface LocationContextType {
    selectedLocation: Location | null;
    setSelectedLocation: (location: Location | null) => void;
    isLocationSelected: boolean;
    clearLocation: () => void;
    refreshLocation: () => Promise<void>;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export const LocationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [selectedLocation, setSelectedLocationState] = useState<Location | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);

    useEffect(() => {
        loadSelectedLocation();
    }, []);

    const loadSelectedLocation = async () => {
        try {
            setIsLoading(true);
            const locationData = await AsyncStorage.getItem('selected_location');
            if (locationData) {
                const parsedLocation = JSON.parse(locationData);
                setSelectedLocationState(parsedLocation);
                console.log('Loaded selected location:', parsedLocation.name);
            } else {
                console.log('No location selected yet');
            }
        } catch (error) {
            console.error('Error loading selected location:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const setSelectedLocation = async (location: Location | null) => {
        try {
            if (location) {
                await AsyncStorage.setItem('selected_location', JSON.stringify(location));
                console.log('Location saved:', location.name);
            } else {
                await AsyncStorage.removeItem('selected_location');
                console.log('Location cleared');
            }
            setSelectedLocationState(location);
        } catch (error) {
            console.error('Error saving selected location:', error);
        }
    };

    const clearLocation = async () => {
        await setSelectedLocation(null);
    };

    const refreshLocation = async () => {
        await loadSelectedLocation();
    };

    const contextValue: LocationContextType = {
        selectedLocation,
        setSelectedLocation,
        isLocationSelected: !!selectedLocation,
        clearLocation,
        refreshLocation,
    };

    return (
        <LocationContext.Provider value={contextValue}>
            {children}
        </LocationContext.Provider>
    );
};

export const useLocation = () => {
    const context = useContext(LocationContext);
    if (context === undefined) {
        throw new Error('useLocation must be used within a LocationProvider');
    }
    return context;
};

// Export types for use in other files
export type { Location, LocationContextType };

// Default export for the LocationProvider component
export default LocationProvider;