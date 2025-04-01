import React from 'react';
import {
    View,
    Text,
    Image,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    SafeAreaView
} from 'react-native';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import { HeaderBackButton } from '@react-navigation/elements';
import {StackNavigationProp} from "@react-navigation/stack";

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
    BookingScreen: { serviceId: number; serviceName: string };
    BookingDateScreen: { serviceId: number; serviceName: string; duration: number };
    BookingTimeScreen: {
        serviceId: number;
        serviceName: string;
        selectedDate: string;
        duration: number;
    };
};

// Type for the route
type ServiceDetailsRouteProp = RouteProp<RootStackParamList, 'ServiceDetails'>;

// Type for the navigation
type ServiceDetailsNavigationProp = StackNavigationProp<RootStackParamList>;

const ServiceDetailsScreen = () => {
    const route = useRoute<ServiceDetailsRouteProp>();
    const navigation = useNavigation<ServiceDetailsNavigationProp>();
    const { service } = route.params;

    React.useLayoutEffect(() => {
        navigation.setOptions({
            title: service.title,
            headerLeft: () => (
                <HeaderBackButton
                    onPress={() => navigation.goBack()}
                    tintColor="#000"
                />
            ),
        });
    }, [navigation, service]);

    const handleBookNow = () => {
        // Changed to navigate to BookingDateScreen instead of BookingScreen
        navigation.navigate('BookingDateScreen', {
            serviceId: service.id,
            serviceName: service.title,
            duration: service.duration
        });
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView>
                {service.image && (
                    <Image
                        source={{ uri: service.image }}
                        style={styles.image}
                        resizeMode="cover"
                    />
                )}

                <View style={styles.contentContainer}>
                    <Text style={styles.title}>{service.title}</Text>
                    {service.subtitle && (
                        <Text style={styles.subtitle}>{service.subtitle}</Text>
                    )}

                    <View style={styles.infoRow}>
                        <View style={styles.infoBox}>
                            <Text style={styles.infoLabel}>Price</Text>
                            <Text style={styles.infoValue}>£{service.price}</Text>
                        </View>

                        <View style={styles.infoBox}>
                            <Text style={styles.infoLabel}>Duration</Text>
                            <Text style={styles.infoValue}>{service.duration} min</Text>
                        </View>
                    </View>

                    {service.benefits && (
                        <View style={styles.descriptionContainer}>
                            <Text style={styles.descriptionTitle}>Benefits</Text>
                            <Text style={styles.description}>{service.benefits}</Text>
                        </View>
                    )}

                    {service.description && (
                        <View style={styles.descriptionContainer} className="mt-5">
                            <Text style={styles.descriptionTitle}>Description</Text>
                            <Text style={styles.description}>{service.description}</Text>
                        </View>
                    )}
                </View>
            </ScrollView>

            <View style={styles.footer}>
                <TouchableOpacity style={styles.bookButton} onPress={handleBookNow}>
                    <Text style={styles.bookButtonText}>Book Now</Text>
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
    image: {
        width: '100%',
        height: 250,
    },
    contentContainer: {
        padding: 16,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: '#555',
        marginBottom: 16,
    },
    infoRow: {
        flexDirection: 'row',
        marginBottom: 24,
    },
    infoBox: {
        flex: 1,
        backgroundColor: '#fff',
        padding: 12,
        borderRadius: 8,
        marginRight: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 1,
        elevation: 1,
    },
    infoLabel: {
        fontSize: 12,
        color: '#777',
        marginBottom: 4,
    },
    infoValue: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
    },
    descriptionContainer: {
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 1,
    },
    descriptionTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 12,
    },
    description: {
        fontSize: 14,
        lineHeight: 22,
        color: '#444',
    },
    footer: {
        padding: 16,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#eee',
    },
    bookButton: {
        backgroundColor: '#9A563A',
        padding: 16,
        borderRadius: 8,
        alignItems: 'center',
    },
    bookButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
});

export default ServiceDetailsScreen;