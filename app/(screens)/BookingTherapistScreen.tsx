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
    Alert,
    ScrollView
} from 'react-native';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { HeaderBackButton } from '@react-navigation/elements';
import { API_BASE_URL } from "@/config/api";
import withAuthGuard from '../components/AuthGuard';
import { Feather, MaterialIcons } from '@expo/vector-icons';

// Define Therapist type with all availability data
type Therapist = {
    id: number;
    name: string;
    email: string;
    phone: string;
    image: string | null;
    bio: string | null;
    status: boolean;
    available_slots_count: number;
    available_dates_count: number;
    schedule: {
        day_of_week: string;
        start_time: string;
        end_time: string;
        is_active: boolean;
    }[];
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
            console.log(`API URL: ${API_URL}/${serviceId}/therapists`);
            
            const response = await fetch(`${API_URL}/${serviceId}/therapists`);
            const data = await response.json();

            console.log('=== FULL API RESPONSE ===');
            console.log(JSON.stringify(data, null, 2));

            if (data.success && Array.isArray(data.data)) {
                // Use the actual data from the API
                setTherapists(data.data);
                console.log('Therapists loaded successfully:', data.data.length);
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

    // Helper function to format available days
    const formatAvailableDays = (schedule: Therapist['schedule']) => {
        if (!schedule || schedule.length === 0) {
            return 'No availability';
        }

        const daysOrder = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
        const dayAbbreviations = {
            'monday': 'Mon',
            'tuesday': 'Tue', 
            'wednesday': 'Wed',
            'thursday': 'Thu',
            'friday': 'Fri',
            'saturday': 'Sat',
            'sunday': 'Sun'
        };

        const availableDays = schedule
            .filter(slot => slot.is_active)
            .map(slot => slot.day_of_week)
            .filter((day, index, self) => self.indexOf(day) === index) // Remove duplicates
            .sort((a, b) => daysOrder.indexOf(a) - daysOrder.indexOf(b))
            .map(day => dayAbbreviations[day as keyof typeof dayAbbreviations]);

        return availableDays.length > 0 ? availableDays.join(', ') : 'No availability';
    };

    // Helper function to get availability status color
    const getAvailabilityColor = (count: number) => {
        if (count === 0) return '#DC2626'; // Red
        if (count < 5) return '#F59E0B'; // Orange
        return '#10B981'; // Green
    };

    React.useLayoutEffect(() => {
        navigation.setOptions({
            title: `Select Therapist`,
            headerLeft: () => (
                <HeaderBackButton
                    onPress={() => navigation.goBack()}
                    tintColor="#000"
                />
            ),
        });
    }, [navigation]);

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

    const renderTherapistCard = ({ item }: { item: Therapist }) => {
        const isSelected = selectedTherapist?.id === item.id;
        const availabilityColor = getAvailabilityColor(item.available_slots_count);

        return (
            <TouchableOpacity
                style={[
                    styles.therapistCard,
                    isSelected && styles.selectedTherapistCard
                ]}
                onPress={() => handleTherapistSelect(item)}
                activeOpacity={0.7}
            >
                {/* Selection indicator */}
                {isSelected && (
                    <View style={styles.selectedBadge}>
                        <Feather name="check" size={16} color="#fff" />
                    </View>
                )}

                {/* Therapist Header */}
                <View style={styles.therapistHeader}>
                    {/* Profile Image */}
                    <View style={styles.imageContainer}>
                        {item.image ? (
                            <Image
                                source={{ uri: item.image }}
                                style={styles.therapistImage}
                                resizeMode="cover"
                            />
                        ) : (
                            <View style={styles.imagePlaceholder}>
                                <Text style={styles.initials}>
                                    {item.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                                </Text>
                            </View>
                        )}
                    </View>

                    {/* Therapist Info */}
                    <View style={styles.therapistInfo}>
                        <Text style={styles.therapistName}>{item.name}</Text>
                        <Text style={styles.therapistContact}>{item.email}</Text>
                        <Text style={styles.therapistContact}>{item.phone}</Text>
                    </View>
                </View>

                {/* Availability Summary */}
                <View style={styles.availabilitySummary}>
                    <View style={styles.availabilityRow}>
                        <View style={styles.availabilityItem}>
                            <MaterialIcons name="today" size={16} color="#9A563A" />
                            <Text style={styles.availabilityLabel}>Available Days</Text>
                            <Text style={styles.availabilityValue}>
                                {formatAvailableDays(item.schedule)}
                            </Text>
                        </View>
                    </View>

                    <View style={styles.availabilityRow}>
                        <View style={styles.availabilityItem}>
                            <MaterialIcons name="event-available" size={16} color={availabilityColor} />
                            <Text style={styles.availabilityLabel}>Next 3 Months</Text>
                            <Text style={[styles.availabilityValue, { color: availabilityColor }]}>
                                {item.available_dates_count} days available
                            </Text>
                        </View>
                    </View>

                    <View style={styles.availabilityRow}>
                        <View style={styles.availabilityItem}>
                            <MaterialIcons name="access-time" size={16} color={availabilityColor} />
                            <Text style={styles.availabilityLabel}>Today</Text>
                            <Text style={[styles.availabilityValue, { color: availabilityColor }]}>
                                {item.available_slots_count} slots available
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Bio */}
                {item.bio && (
                    <View style={styles.bioContainer}>
                        <Text style={styles.bioText} numberOfLines={3}>{item.bio}</Text>
                    </View>
                )}

                {/* Detailed Schedule */}
                {item.schedule && item.schedule.length > 0 && (
                    <View style={styles.scheduleContainer}>
                        <Text style={styles.scheduleTitle}>Weekly Schedule</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                            <View style={styles.scheduleItems}>
                                {item.schedule
                                    .filter(slot => slot.is_active)
                                    .map((slot, index) => (
                                        <View key={index} style={styles.scheduleItem}>
                                            <Text style={styles.scheduleDayText}>
                                                {slot.day_of_week.charAt(0).toUpperCase() + slot.day_of_week.slice(1, 3)}
                                            </Text>
                                            <Text style={styles.scheduleTimeText}>
                                                {slot.start_time} - {slot.end_time}
                                            </Text>
                                        </View>
                                    ))}
                            </View>
                        </ScrollView>
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
                <MaterialIcons name="error-outline" size={64} color="#DC2626" />
                <Text style={styles.errorTitle}>Oops! Something went wrong</Text>
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity
                    style={styles.retryButton}
                    onPress={fetchTherapists}
                >
                    <Text style={styles.retryButtonText}>Try Again</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.title}>Choose Your Therapist</Text>
                    <Text style={styles.subtitle}>
                        Select a therapist for your {serviceName} session
                    </Text>
                </View>

                {therapists.length > 0 ? (
                    <FlatList
                        data={therapists}
                        renderItem={renderTherapistCard}
                        keyExtractor={(item) => item.id.toString()}
                        contentContainerStyle={styles.therapistsList}
                        showsVerticalScrollIndicator={false}
                        ItemSeparatorComponent={() => <View style={styles.separator} />}
                    />
                ) : (
                    <View style={styles.noTherapistsContainer}>
                        <MaterialIcons name="person-off" size={64} color="#9CA3AF" />
                        <Text style={styles.noTherapistsTitle}>No Therapists Available</Text>
                        <Text style={styles.noTherapistsText}>
                            There are currently no therapists available for this service. 
                            Please try again later or contact support.
                        </Text>
                    </View>
                )}
            </View>

            {/* Continue Button */}
            <View style={styles.footer}>
                <TouchableOpacity
                    style={[
                        styles.continueButton,
                        !selectedTherapist && styles.continueButtonDisabled
                    ]}
                    disabled={!selectedTherapist}
                    onPress={handleContinue}
                >
                    <Text style={styles.continueButtonText}>
                        {selectedTherapist ? `Continue with ${selectedTherapist.name}` : 'Select a Therapist'}
                    </Text>
                    {selectedTherapist && (
                        <Feather name="arrow-right" size={20} color="#fff" style={styles.continueIcon} />
                    )}
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
    },
    content: {
        flex: 1,
        padding: 16,
    },
    header: {
        marginBottom: 24,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#1F2937',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: '#6B7280',
        lineHeight: 22,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 32,
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
        color: '#6B7280',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 32,
    },
    errorTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#DC2626',
        marginTop: 16,
        marginBottom: 8,
    },
    errorText: {
        fontSize: 16,
        color: '#6B7280',
        textAlign: 'center',
        marginBottom: 24,
        lineHeight: 22,
    },
    retryButton: {
        backgroundColor: '#9A563A',
        paddingVertical: 14,
        paddingHorizontal: 28,
        borderRadius: 12,
    },
    retryButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    therapistsList: {
        paddingBottom: 100, // Space for footer button
    },
    separator: {
        height: 16,
    },
    therapistCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
        borderWidth: 2,
        borderColor: 'transparent',
        position: 'relative',
    },
    selectedTherapistCard: {
        borderColor: '#9A563A',
        backgroundColor: '#FEF7F0',
    },
    selectedBadge: {
        position: 'absolute',
        top: 16,
        right: 16,
        backgroundColor: '#9A563A',
        width: 28,
        height: 28,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1,
    },
    therapistHeader: {
        flexDirection: 'row',
        marginBottom: 16,
    },
    imageContainer: {
        marginRight: 16,
    },
    therapistImage: {
        width: 80,
        height: 80,
        borderRadius: 40,
    },
    imagePlaceholder: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#9A563A',
        justifyContent: 'center',
        alignItems: 'center',
    },
    initials: {
        color: '#fff',
        fontSize: 24,
        fontWeight: 'bold',
    },
    therapistInfo: {
        flex: 1,
        justifyContent: 'center',
    },
    therapistName: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1F2937',
        marginBottom: 4,
    },
    therapistContact: {
        fontSize: 14,
        color: '#6B7280',
        marginBottom: 2,
    },
    availabilitySummary: {
        marginBottom: 16,
    },
    availabilityRow: {
        marginBottom: 8,
    },
    availabilityItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    availabilityLabel: {
        fontSize: 14,
        color: '#6B7280',
        marginLeft: 8,
        marginRight: 8,
        flex: 1,
    },
    availabilityValue: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1F2937',
    },
    bioContainer: {
        marginBottom: 16,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
    },
    bioText: {
        fontSize: 14,
        color: '#6B7280',
        lineHeight: 20,
    },
    scheduleContainer: {
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
    },
    scheduleTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1F2937',
        marginBottom: 12,
    },
    scheduleItems: {
        flexDirection: 'row',
    },
    scheduleItem: {
        backgroundColor: '#F3F4F6',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        marginRight: 8,
        alignItems: 'center',
        minWidth: 80,
    },
    scheduleDayText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#9A563A',
        marginBottom: 2,
    },
    scheduleTimeText: {
        fontSize: 10,
        color: '#6B7280',
    },
    noTherapistsContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 32,
    },
    noTherapistsTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1F2937',
        marginTop: 16,
        marginBottom: 8,
    },
    noTherapistsText: {
        fontSize: 16,
        color: '#6B7280',
        textAlign: 'center',
        lineHeight: 22,
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 16,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
    },
    continueButton: {
        backgroundColor: '#9A563A',
        paddingVertical: 16,
        paddingHorizontal: 24,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    continueButtonDisabled: {
        backgroundColor: '#D1D5DB',
    },
    continueButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    continueIcon: {
        marginLeft: 8,
    },
});

// Wrap the component with the AuthGuard
export default withAuthGuard(BookingTherapistScreen);