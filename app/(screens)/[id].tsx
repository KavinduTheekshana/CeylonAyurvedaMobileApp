import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    FlatList,
    Image,
    ActivityIndicator,
    StyleSheet,
    Dimensions,
    TouchableOpacity,
    StatusBar
} from 'react-native';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { HeaderBackButton } from '@react-navigation/elements';
import ServiceDetailsScreen from './ServiceDetails';
import {API_BASE_URL} from "@/config/api"; // Import directly where needed

// API URL
const API_URL = 'https://app.ceylonayurvedahealth.co.uk/api/services/';
const { width } = Dimensions.get('window');
const itemWidth = (width - 45) / 2; // 45 accounts for container padding and space between items

// Define Service type outside the component
type Service = {
    id: number;
    title: string;
    subtitle: string;
    price: number;
    benefits: string;
    duration: number;
    image: string | null;
    description?: string;
};

// Define your navigation param list
type RootStackParamList = {
    Home: undefined;
    Services: { treatmentId: string; treatmentName: string };
    ServiceDetails: { service: Service };
    BookingScreen: { serviceId: number; serviceName: string };
};

// Type for the route
type ServicesScreenRouteProp = RouteProp<RootStackParamList, 'Services'>;

// Type for the navigation
type ServicesScreenNavigationProp = StackNavigationProp<RootStackParamList>;

const ServicesScreen = () => {
    const route = useRoute<ServicesScreenRouteProp>();
    const navigation = useNavigation<ServicesScreenNavigationProp>();
    const { treatmentId, treatmentName } = route.params; // Get treatmentId and treatmentName from navigation

    const [services, setServices] = useState<Service[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Set the header title using the treatmentName
        navigation.setOptions({
            title: treatmentName,
            headerLeft: () => (
                <HeaderBackButton
                    onPress={() => {
                        // console.log("Back button pressed");
                        if (navigation.canGoBack()) {
                            navigation.goBack();
                        } else {
                            navigation.goBack();
                            // console.log("ELSE");
                        }
                    }}
                    tintColor="#000"
                />
            ),
        });

        fetch(`${API_BASE_URL}/api/services/${treatmentId}`) // Fetch services based on treatment ID
            .then(response => response.json())
            .then(data => {
                if (data.success && Array.isArray(data.data)) {
                    const updatedData = data.data.map((item: { image: any; }) => ({
                        ...item,
                        image: item.image ? `${API_BASE_URL}/storage/${item.image}` : null
                    }));
                    setServices(updatedData);
                }
            })
            .catch(error => console.error('Error fetching services:', error))
            .finally(() => setLoading(false));
    }, [treatmentId, treatmentName, navigation]);

    const handleServicePress = (service: Service) => {
        // Navigate to service details screen with service data
        navigation.navigate('ServiceDetails', { service });
    };

    if (loading) {
        return <ActivityIndicator size="large" color="#9A563A" style={styles.loader} />;
    }

    const renderItem = ({ item }: { item: Service }) => (
        <TouchableOpacity
            style={[styles.itemContainer, { width: itemWidth }]}
            onPress={() => handleServicePress(item)}
        >


            {item.image && <Image source={{ uri: item.image }} style={styles.image} />}
            <Text style={styles.title} numberOfLines={1}>{item.title}</Text>
            <Text style={styles.price}>From: £{item.price}</Text>
            <Text style={styles.duration}>{item.duration} min</Text>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <FlatList
                data={services}
                keyExtractor={(item) => item.id.toString()}
                renderItem={renderItem}
                numColumns={2}
                columnWrapperStyle={styles.columnWrapper}
                ListEmptyComponent={<Text style={styles.noData}>No services available for this treatment</Text>}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 15,
        backgroundColor: '#f5f5f5',
    },
    columnWrapper: {
        justifyContent: 'space-between',
        marginBottom: 15,
    },
    itemContainer: {
        backgroundColor: '#fff',
        padding: 5,
        borderRadius: 4,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.22,
        shadowRadius: 2.22,
    },
    image: {
        width: '100%',
        height: 130,
        borderRadius: 4,
        marginBottom: 5,
    },
    title: {
        fontSize: 16,
        fontWeight: 'bold',
        marginTop: 5,
    },
    price: {
        fontSize: 12,
        color: '#444',
    },
    duration: {
        fontSize: 12,
        color: '#666',
        marginTop: 2,
    },
    loader: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    noData: {
        fontSize: 16,
        textAlign: 'center',
        marginTop: 20,
        color: '#888',
    },
});

export default ServicesScreen;