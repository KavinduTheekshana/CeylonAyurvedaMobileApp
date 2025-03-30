import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, ActivityIndicator } from 'react-native';
import { useRoute } from '@react-navigation/native';

// Define API endpoint
const API_URL = 'https://app.ceylonayurvedahealth.co.uk/api/services';

const ServicesScreen = () => {
    const route = useRoute();
    const { treatmentId } = route.params; // ✅ Get treatmentId from navigation
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch(`${API_URL}?treatment_id=${treatmentId}`)
            .then(response => response.json())
            .then(data => setServices(data.data))
            .catch(error => console.error('Error fetching services:', error))
            .finally(() => setLoading(false));
    }, [treatmentId]);

    if (loading) {
        return <ActivityIndicator size="large" color="#0000ff" />;
    }

    return (
        <View>
            <Text>Services for Treatment {treatmentId}</Text>
            <FlatList
                data={services}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => (
                    <View>
                        <Text>{item.title}</Text>
                    </View>
                )}
            />
        </View>
    );
};

export default ServicesScreen;
