import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, Image, ActivityIndicator, StyleSheet } from 'react-native';
import { useRoute, RouteProp } from '@react-navigation/native';

// API URL
const API_URL = 'https://app.ceylonayurvedahealth.co.uk/api/services/';

const ServicesScreen = () => {
    type RouteParams = {
        params: {
            treatmentId: string;
            treatmentName: string;
        };
    };
    const route = useRoute<RouteProp<RouteParams, 'params'>>();
    const { treatmentId,treatmentName } = route.params; // Get treatmentId from navigation
    type Service = {
        id: number;
        title: string;
        subtitle: string;
        price: number;
        duration: number;
        image: string | null;
    };

    const [services, setServices] = useState<Service[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch(`${API_URL}${treatmentId}`) // Fetch services based on treatment ID
            .then(response => response.json())
            .then(data => {
                if (data.success && Array.isArray(data.data)) {
                    const updatedData = data.data.map((item: { image: any; }) => ({
                        ...item,
                        image: item.image ? `https://app.ceylonayurvedahealth.co.uk/storage/${item.image}` : null
                    }));
                    setServices(updatedData);
                }
            })
            .catch(error => console.error('Error fetching services:', error))
            .finally(() => setLoading(false));
    }, [treatmentId]);

    if (loading) {
        return <ActivityIndicator size="large" color="#0000ff" style={styles.loader} />;
    }

    return (
        <View style={styles.container}>
            <Text style={styles.header}>Services</Text>
            {services.length > 0 ? (
                <FlatList
                    data={services}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={({ item }) => (
                        <View style={styles.itemContainer}>
                            {item.image && <Image source={{ uri: item.image }} style={styles.image} />}
                            <Text style={styles.title}>{item.title}</Text>
                            <Text style={styles.subtitle}>{item.subtitle}</Text>
                            <Text style={styles.price}>Price: ${item.price}</Text>
                            <Text style={styles.duration}>Duration: {item.duration} mins</Text>
                        </View>
                    )}
                />
            ) : (
                <Text style={styles.noData}>No services available for this treatment</Text>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 15,
        backgroundColor: '#f5f5f5',
    },
    header: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    itemContainer: {
        backgroundColor: '#fff',
        padding: 10,
        borderRadius: 8,
        marginBottom: 10,
    },
    image: {
        width: '100%',
        height: 120,
        borderRadius: 10,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        marginTop: 5,
    },
    subtitle: {
        fontSize: 14,
        color: '#666',
    },
    price: {
        fontSize: 16,
        color: '#000',
        fontWeight: 'bold',
    },
    duration: {
        fontSize: 14,
        color: '#444',
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
