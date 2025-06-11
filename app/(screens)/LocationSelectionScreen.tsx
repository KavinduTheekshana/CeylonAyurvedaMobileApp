// app/(screens)/LocationSelectionScreen.tsx
import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    SafeAreaView,
    ActivityIndicator,
    Image,
    Alert,
    StyleSheet,
    Dimensions,
    StatusBar
} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '@/config/api';
import { Feather } from '@expo/vector-icons';
import { useLocation } from '../contexts/LocationContext';

const { width } = Dimensions.get('window');

interface Location {
    id: number;
    name: string;
    slug: string;
    city: string;
    address: string;
    image?: string;
}

const LocationSelectionScreen = () => {
    const router = useRouter();
    const { setSelectedLocation } = useLocation();
    const [locations, setLocations] = useState<Location[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedLocationId, setSelectedLocationId] = useState<number | null>(null);

    useEffect(() => {
        fetchLocations();
    }, []);

    const fetchLocations = async () => {
        try {
            console.log('Fetching locations from:', `${API_BASE_URL}/api/locations`);
            const response = await fetch(`${API_BASE_URL}/api/locations`);
            const data = await response.json();

            console.log('Locations response:', data);

            if (data.success && Array.isArray(data.data)) {
                // Add full image URLs if needed
                const updatedLocations = data.data.map((location: Location) => ({
                    ...location,
                    image: location.image ? 
                        (location.image.startsWith('http') ? location.image : `${API_BASE_URL}/storage/${location.image}`) 
                        : null
                }));
                setLocations(updatedLocations);
            } else {
                // Fallback with mock data if API fails
                console.warn('API failed, using fallback locations');
                setLocations([
                    {
                        id: 1,
                        name: 'Derby City Centre',
                        slug: 'derby-city-centre',
                        city: 'Derby',
                        address: 'Market Place, Derby DE1 3AH',
                        image: null
                    },
                    {
                        id: 2,
                        name: 'Derby South',
                        slug: 'derby-south',
                        city: 'Derby',
                        address: 'Osmaston Road, Derby DE24 8AA',
                        image: null
                    }
                ]);
            }
        } catch (error) {
            console.error('Error fetching locations:', error);
            Alert.alert(
                'Connection Error', 
                'Unable to load locations. Using default options.',
                [{ text: 'OK' }]
            );
            
            // Fallback locations
            setLocations([
                {
                    id: 1,
                    name: 'Derby City Centre',
                    slug: 'derby-city-centre',
                    city: 'Derby',
                    address: 'Market Place, Derby DE1 3AH',
                    image: null
                },
                {
                    id: 2,
                    name: 'Derby South',
                    slug: 'derby-south',
                    city: 'Derby',
                    address: 'Osmaston Road, Derby DE24 8AA',
                    image: null
                }
            ]);
        } finally {
            setLoading(false);
        }
    };

    const handleLocationSelect = (location: Location) => {
        setSelectedLocationId(location.id);
    };

    const confirmLocationSelection = async () => {
        if (!selectedLocationId) {
            Alert.alert('Selection Required', 'Please select a location to continue');
            return;
        }

        const selectedLocation = locations.find(loc => loc.id === selectedLocationId);
        if (!selectedLocation) return;

        try {
            // Update context
            await setSelectedLocation(selectedLocation);
            
            console.log('Location selected:', selectedLocation.name);
            
            // Navigate to main app
            router.replace('/(tabs)');
        } catch (error) {
            console.error('Error saving location:', error);
            Alert.alert('Error', 'Failed to save location selection. Please try again.');
        }
    };

    const renderLocationItem = ({ item }: { item: Location }) => {
        const isSelected = selectedLocationId === item.id;
        
        return (
            <TouchableOpacity
                style={[
                    styles.locationCard,
                    isSelected && styles.selectedLocationCard
                ]}
                onPress={() => handleLocationSelect(item)}
                activeOpacity={0.7}
            >
                {/* Selection indicator */}
                {isSelected && (
                    <View style={styles.selectionIndicator}>
                        <Feather name="check" size={16} color="#fff" />
                    </View>
                )}

                {/* Location Image */}
                <View style={styles.imageContainer}>
                    {item.image ? (
                        <Image
                            source={{ uri: item.image }}
                            style={styles.locationImage}
                            resizeMode="cover"
                        />
                    ) : (
                        <View style={styles.placeholderImage}>
                            <Feather name="map-pin" size={40} color="#9A563A" />
                        </View>
                    )}
                </View>

                {/* Location Info */}
                <View style={styles.locationInfo}>
                    <Text style={styles.locationName}>{item.name}</Text>
                    <Text style={styles.locationCity}>{item.city}</Text>
                    <View style={styles.addressRow}>
                        <Feather name="map-pin" size={14} color="#9A563A" />
                        <Text style={styles.locationAddress} numberOfLines={2}>
                            {item.address}
                        </Text>
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <StatusBar barStyle="dark-content" backgroundColor="#f9fafb" />
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#9A563A" />
                    <Text style={styles.loadingText}>Loading locations...</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#f9fafb" />
            
            <View style={styles.content}>
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.title}>Choose Your Location</Text>
                    <Text style={styles.subtitle}>
                        Select a location to see available services and therapists in your area
                    </Text>
                </View>

                {/* Locations List */}
                <FlatList
                    data={locations}
                    renderItem={renderLocationItem}
                    keyExtractor={(item) => item.id.toString()}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.listContainer}
                    ItemSeparatorComponent={() => <View style={styles.separator} />}
                />

                {/* Continue Button */}
                <View style={styles.footer}>
                    <TouchableOpacity
                        style={[
                            styles.continueButton,
                            !selectedLocationId && styles.disabledButton
                        ]}
                        onPress={confirmLocationSelection}
                        disabled={!selectedLocationId}
                    >
                        <Text style={[
                            styles.continueButtonText,
                            !selectedLocationId && styles.disabledButtonText
                        ]}>
                            Continue
                        </Text>
                        <Feather 
                            name="arrow-right" 
                            size={20} 
                            color={selectedLocationId ? "#fff" : "#999"} 
                        />
                    </TouchableOpacity>
                </View>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f9fafb',
    },
    content: {
        flex: 1,
        paddingHorizontal: 16,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
        color: '#6b7280',
    },
    header: {
        paddingTop: 20,
        paddingBottom: 24,
        alignItems: 'center',
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#1f2937',
        marginBottom: 8,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 16,
        color: '#6b7280',
        textAlign: 'center',
        lineHeight: 24,
        paddingHorizontal: 20,
    },
    listContainer: {
        paddingBottom: 20,
    },
    separator: {
        height: 16,
    },
    locationCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
        borderWidth: 2,
        borderColor: 'transparent',
        position: 'relative',
    },
    selectedLocationCard: {
        borderColor: '#9A563A',
        backgroundColor: '#fef7f0',
    },
    selectionIndicator: {
        position: 'absolute',
        top: 12,
        right: 12,
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#9A563A',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10,
    },
    imageContainer: {
        width: '100%',
        height: 120,
        borderRadius: 12,
        overflow: 'hidden',
        marginBottom: 12,
    },
    locationImage: {
        width: '100%',
        height: '100%',
    },
    placeholderImage: {
        width: '100%',
        height: '100%',
        backgroundColor: '#f3f4f6',
        justifyContent: 'center',
        alignItems: 'center',
    },
    locationInfo: {
        flex: 1,
    },
    locationName: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1f2937',
        marginBottom: 4,
    },
    locationCity: {
        fontSize: 16,
        color: '#6b7280',
        marginBottom: 8,
    },
    addressRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    locationAddress: {
        fontSize: 14,
        color: '#6b7280',
        marginLeft: 6,
        flex: 1,
        lineHeight: 20,
    },
    footer: {
        paddingVertical: 20,
        paddingBottom: 40,
    },
    continueButton: {
        backgroundColor: '#9A563A',
        paddingVertical: 16,
        paddingHorizontal: 24,
        borderRadius: 12,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#9A563A',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    disabledButton: {
        backgroundColor: '#e5e7eb',
        shadowOpacity: 0,
        elevation: 0,
    },
    continueButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '600',
        marginRight: 8,
    },
    disabledButtonText: {
        color: '#9ca3af',
    },
});

export default LocationSelectionScreen;