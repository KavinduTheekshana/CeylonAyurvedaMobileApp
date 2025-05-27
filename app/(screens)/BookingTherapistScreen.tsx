import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    SafeAreaView,
    ActivityIndicator,
    FlatList,
    Image,
    Alert
} from 'react-native';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { HeaderBackButton } from '@react-navigation/elements';
import { API_BASE_URL } from "@/config/api";
import withAuthGuard from '../components/AuthGuard';

// Define Therapist type
type Therapist = {
    id: number;
    name: string;
    email: string;
    phone: string;
    image: string | null;
    bio: string | null;
    status: boolean;
};

// Define your Service type
type Service = {
    id: number;
    title: string;
    subtitle: string;
    price: number;
    duration: number;
    benefits: string;
    image: string | null;
    description?: string;
};

// Define your navigation param list for all screens
type RootStackParamList = {
    Home: undefined;
    Services: { treatmentId: string; treatmentName: string };
    ServiceDetails: { service: Service };
    BookingDateScreen: { serviceId: number; serviceName: string; duration: number };
    BookingTherapistScreen: {
        serviceId: number;
        serviceName: string;
        duration: number;
    };
    BookingTimeScreen: {
        serviceId: number;
        serviceName: string;
        selectedDate: string;
        duration: number;
        therapistId: number;
        therapistName: string;
    };
    BookingCheckoutScreen: {
        serviceId: number;
        serviceName: string;
        selectedDate: string;
        selectedTime: string;
        duration: number;
        therapistId: number;
        therapistName: string;
    };
};

// Type for the route
type BookingTherapistScreenRouteProp = RouteProp<RootStackParamList, 'BookingTherapistScreen'>;

// Type for the navigation
type BookingTherapistScreenNavigationProp = StackNavigationProp<RootStackParamList>;

// API URL for fetching therapists
const API_URL = `${API_BASE_URL}/api/services`;

const BookingTherapistScreen = () => {
    const route = useRoute<BookingTherapistScreenRouteProp>();
    const navigation = useNavigation<BookingTherapistScreenNavigationProp>();
    const { serviceId, serviceName, duration } = route.params;

    const [selectedTherapist, setSelectedTherapist] = useState<Therapist | null>(null);
    const [therapists, setTherapists] = useState<Therapist[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // Fetch available therapists for the service from the API
        fetchTherapists();
    }, [serviceId]);

    const fetchTherapists = async () => {
        setLoading(true);
        setError(null);

        try {

            console.log(`Fetching therapists for service ${serviceId}`);
            console.log(`${API_URL}/${serviceId}/therapists`);
            const response = await fetch(`${API_URL}/${serviceId}/therapists`);
            const data = await response.json();

            if (data.success && Array.isArray(data.data)) {
                // The backend already returns full image URLs, so we don't need to process them
                setTherapists(data.data);
            } else {
                throw new Error(data.message || 'Failed to fetch therapists');
            }
        } catch (error) {
            console.error('Error fetching therapists:', error);
            setError('Failed to load therapists. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    React.useLayoutEffect(() => {
        navigation.setOptions({
            title: `Select Therapist - ${serviceName}`,
            headerLeft: () => (
                <HeaderBackButton
                    onPress={() => navigation.goBack()}
                    tintColor="#000"
                />
            ),
        });
    }, [navigation, serviceName]);

    const handleTherapistSelect = (therapist: Therapist) => {
        setSelectedTherapist(therapist);
    };

    const handleContinue = () => {
        if (!selectedTherapist) {
            Alert.alert('Error', 'Please select a therapist to continue');
            return;
        }

        // Navigate to date selection screen with therapist info
        navigation.navigate('BookingDateScreen', {
            serviceId,
            serviceName,
            duration,
            therapistId: selectedTherapist.id,
            therapistName: selectedTherapist.name
        });
    };

    const renderTherapist = ({ item }: { item: Therapist }) => {
        const isSelected = selectedTherapist?.id === item.id;

        return (
            <TouchableOpacity
                style={[
                    styles.therapistCard,
                    isSelected && styles.selectedTherapistCard
                ]}
                onPress={() => handleTherapistSelect(item)}
            >
                <View style={styles.therapistHeader}>
                    <View style={styles.therapistImageContainer}>
                        {item.image ? (
                            <Image
                                source={{ uri: item.image }}
                                style={styles.therapistImage}
                                resizeMode="cover"
                            />
                        ) : (
                            <View style={styles.therapistImagePlaceholder}>
                                <Text style={styles.therapistInitials}>
                                    {item.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                                </Text>
                            </View>
                        )}
                    </View>

                    <View style={styles.therapistInfo}>
                        <Text style={styles.therapistName}>{item.name}</Text>
                        <Text style={styles.therapistEmail}>{item.email}</Text>
                        <Text style={styles.therapistPhone}>{item.phone}</Text>
                    </View>

                    {isSelected && (
                        <View style={styles.selectedIndicator}>
                            <Text style={styles.selectedIcon}>✓</Text>
                        </View>
                    )}
                </View>

                {item.bio && (
                    <View style={styles.therapistBioContainer}>
                        <Text style={styles.therapistBio}>{item.bio}</Text>
                    </View>
                )}
            </TouchableOpacity>
        );
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#9A563A" />
                <Text style={styles.loadingText}>Loading therapists...</Text>
            </View>
        );
    }

    if (error) {
        return (
            <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity
                    style={styles.retryButton}
                    onPress={fetchTherapists}
                >
                    <Text style={styles.retryButtonText}>Retry</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                <Text style={styles.title}>Select a Therapist</Text>
                <Text style={styles.subtitle}>
                    Choose your preferred therapist for {serviceName}
                </Text>

                {therapists.length > 0 ? (
                    <FlatList
                        data={therapists}
                        renderItem={renderTherapist}
                        keyExtractor={(item) => item.id.toString()}
                        contentContainerStyle={styles.therapistsList}
                        showsVerticalScrollIndicator={false}
                    />
                ) : (
                    <View style={styles.noTherapistsContainer}>
                        <Text style={styles.noTherapistsText}>
                            No therapists available for this service at the moment.
                        </Text>
                    </View>
                )}
            </View>

            <View style={styles.footer}>
                <TouchableOpacity
                    style={[
                        styles.continueButton,
                        !selectedTherapist ? styles.continueButtonDisabled : null
                    ]}
                    disabled={!selectedTherapist}
                    onPress={handleContinue}
                >
                    <Text style={styles.continueButtonText}>Continue</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    content: {
        flex: 1,
        padding: 16,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
        color: '#555',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 16,
    },
    errorText: {
        fontSize: 16,
        color: '#d32f2f',
        textAlign: 'center',
        marginBottom: 24,
    },
    retryButton: {
        backgroundColor: '#9A563A',
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 8,
    },
    retryButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: '#555',
        marginBottom: 24,
    },
    therapistsList: {
        paddingBottom: 20,
    },
    therapistCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
        borderWidth: 1,
        borderColor: '#e0e0e0',
    },
    selectedTherapistCard: {
        borderColor: '#9A563A',
        borderWidth: 2,
        backgroundColor: '#FFF9F7',
    },
    therapistHeader: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    therapistImageContainer: {
        marginRight: 12,
    },
    therapistImage: {
        width: 60,
        height: 60,
        borderRadius: 30,
    },
    therapistImagePlaceholder: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#9A563A',
        justifyContent: 'center',
        alignItems: 'center',
    },
    therapistInitials: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    therapistInfo: {
        flex: 1,
    },
    therapistName: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    therapistEmail: {
        fontSize: 14,
        color: '#666',
        marginBottom: 2,
    },
    therapistPhone: {
        fontSize: 14,
        color: '#666',
    },
    selectedIndicator: {
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: '#9A563A',
        justifyContent: 'center',
        alignItems: 'center',
    },
    selectedIcon: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    therapistBioContainer: {
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
    },
    therapistBio: {
        fontSize: 14,
        color: '#555',
        lineHeight: 20,
    },
    noTherapistsContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 16,
    },
    noTherapistsText: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
    },
    footer: {
        padding: 16,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#eee',
    },
    continueButton: {
        backgroundColor: '#9A563A',
        padding: 16,
        borderRadius: 8,
        alignItems: 'center',
    },
    continueButtonDisabled: {
        backgroundColor: '#cccccc',
    },
    continueButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
});

// Wrap the component with the AuthGuard
export default withAuthGuard(BookingTherapistScreen);