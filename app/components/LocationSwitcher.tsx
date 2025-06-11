import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useLocation } from '../contexts/LocationContext';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';

const LocationSwitcher = () => {
    const { selectedLocation } = useLocation();
    const router = useRouter();

    const handleLocationPress = () => {
        router.push('/(screens)/LocationSelectionScreen');
    };

    if (!selectedLocation) return null;

    return (
        <TouchableOpacity
            onPress={handleLocationPress}
            className="flex-row items-center bg-white rounded-lg p-3 mx-1 mb-4 shadow-sm"
        >
            <Feather name="map-pin" size={20} color="#9A563A" />
            <View className="flex-1 ml-3">
                <Text className="text-sm text-gray-500">Current Location</Text>
                <Text className="text-base font-semibold text-gray-800">
                    {selectedLocation.name}
                </Text>
            </View>
            <Feather name="chevron-down" size={20} color="#9A563A" />
        </TouchableOpacity>
    );
};

export default LocationSwitcher;