import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    FlatList,
    Image,
    ActivityIndicator,
    Dimensions,
    TouchableOpacity,
    StatusBar
} from 'react-native';
import ServiceDetailsScreen from './ServiceDetails';
import {API_BASE_URL} from "@/config/api";
import {Feather} from "@expo/vector-icons";
import {RouteProp, useNavigation, useRoute} from "@react-navigation/native";
import {StackNavigationProp} from "@react-navigation/stack";
import { useRouter } from 'expo-router';
import {HeaderBackButton} from "@react-navigation/elements";

// API URL
const API_URL = `${API_BASE_URL}/api/services/`;
const { width } = Dimensions.get('window');
const itemWidth = (width - 45) / 2; // 45 accounts for container padding and space between items

// Define Service type outside the component
type Service = {
    id: number;
    title: string;
    subtitle: string;
    price: number;
    discount_price?: number | null;
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
    const router = useRouter();

    useEffect(() => {
        // Set the header title using the treatmentName
        navigation.setOptions({
            title: treatmentName,
            headerLeft: () => (
                <HeaderBackButton
                    onPress={() => {
                        if (navigation.canGoBack()) {
                            navigation.goBack();
                        } else {
                            navigation.goBack();
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
        // Use ONLY router.push (removing the navigation.navigate call entirely)
        router.push({
            pathname: "/(screens)/ServiceDetails",
            params: {
                service: JSON.stringify({
                    id: service.id,
                    title: service.title,
                    subtitle: service.subtitle || '',
                    price: service.price || 0,
                    discount_price: service.discount_price || null,
                    duration: service.duration || 0,
                    benefits: service.benefits || '',
                    image: service.image ?
                        (service.image.startsWith('http') ? service.image : `${API_BASE_URL}/storage/${service.image}`)
                        : null,
                    description: service.description || ''
                })
            }
        });
    };

    if (loading) {
        return <ActivityIndicator size="large" color="#9A563A" className="flex-1 justify-center items-center" />;
    }

    const renderItem = ({ item }: { item: Service }) => {
        // Check if discount price is zero (accounting for decimal values like 0.00)
        const isFreeSevice = item.discount_price !== null && 
                            item.discount_price !== undefined && 
                            parseFloat(String(item.discount_price)) === 0;
                            
        return (
        <TouchableOpacity
            className={`bg-white rounded-[14px] overflow-hidden mb-4 w-[48%] shadow-sm m-1 ${
                isFreeSevice ? 'bg-green-50 border border-green-200' : ''
            }`}
            onPress={() => handleServicePress(item)}
        >
            {item.image && <Image source={{ uri: item.image }}   className="w-full h-[120px]" />}

            <View className="p-3">
                <Text className="text-base font-semibold text-black mb-1" numberOfLines={1}>{item.title}</Text>
                {item.subtitle && (
                    <Text className="text-sm text-gray-600 mb-2" numberOfLines={1}>{item.subtitle}</Text>
                )}
                <View className="flex-row items-center justify-between mt-1.5">
                    {/* Price display with discount handling */}
                    <View className="flex-row items-center">
                        {item.discount_price !== null && item.discount_price !== undefined ? (
                            isFreeSevice ? (
                                <Text className="text-base font-bold text-green-600">FREE</Text>
                            ) : (
                                <>
                                    <Text className="text-base font-bold text-primary">£{item.discount_price}</Text>
                                    <Text className="text-xs text-gray-500 line-through ml-1">£{item.price}</Text>
                                </>
                            )
                        ) : (
                            <Text className="text-base font-bold text-primary">£{item.price}</Text>
                        )}
                    </View>
                    {item.duration !== null && (
                        <View className="flex-row items-center">
                            <Feather name="clock" size={14} color="#9A563A" />
                            <Text className="text-sm text-gray-600 ml-1">{item.duration} min</Text>
                        </View>
                    )}
                </View>
            </View>
        </TouchableOpacity>
    );
    };

    return (
        <View className="flex-1 p-4 bg-gray-100">
            <FlatList
                data={services}
                keyExtractor={(item) => item.id.toString()}
                renderItem={renderItem}
                numColumns={2}
                columnWrapperStyle={{ justifyContent: 'space-between', marginBottom: 15 }}
                ListEmptyComponent={<Text className="text-base text-center mt-5 text-gray-500">No services available for this treatment</Text>}
            />
        </View>
    );
};

export default ServicesScreen;