import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    FlatList,
    Image,
    ActivityIndicator,
    SafeAreaView,
    Dimensions,
    Keyboard,
    TouchableWithoutFeedback
} from 'react-native';
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigation } from '@react-navigation/native';
import { Feather, FontAwesome, Ionicons } from "@expo/vector-icons";
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '@/config/api';
import { debounce } from 'lodash';

// Define TypeScript interfaces
interface Service {
    id: number;
    treatment_id: number;
    title: string;
    image: string;
    subtitle: string | null;
    price: number | null;
    duration: number | null;
    benefits: string | null;
    description: string | null;
    status: boolean;
    created_at: string;
    updated_at: string;
    treatment?: {
        id: number;
        name: string;
    };
}

export default function SearchScreen() {
    const navigation = useNavigation();
    const { width } = Dimensions.get("window");

    // State
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [services, setServices] = useState<Service[]>([]);
    const [filteredServices, setFilteredServices] = useState<Service[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [searchFocus, setSearchFocus] = useState<boolean>(false);

    // Function to fetch all services
    const fetchServices = async () => {
        setIsLoading(true);
        setError(null);

        try {
            const token = await AsyncStorage.getItem('access_token');
            if (!token) {
                navigation.reset({
                    index: 0,
                    routes: [{ name: 'Login' }],
                });
                return;
            }

            const response = await axios.get(`${API_BASE_URL}/api/services`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            if (response.data.success) {
                setServices(response.data.data);
                setFilteredServices(response.data.data);
            } else {
                setError('Failed to fetch services');
            }
        } catch (error) {
            console.error('Error fetching services:', error);
            setError('An error occurred while fetching services');
        } finally {
            setIsLoading(false);
        }
    };

    // Search function with debounce
    const handleSearch = useCallback(
        debounce((text: string) => {
            if (!text.trim()) {
                setFilteredServices(services);
                return;
            }

            const query = text.toLowerCase();
            const results = services.filter(service =>
                service.title.toLowerCase().includes(query) ||
                (service.subtitle && service.subtitle.toLowerCase().includes(query)) ||
                (service.description && service.description.toLowerCase().includes(query))
            );

            setFilteredServices(results);
        }, 300),
        [services]
    );

    // Update search query and trigger search
    const updateSearch = (text: string) => {
        setSearchQuery(text);
        handleSearch(text);
    };

    // Navigate to service detail
    const handleServicePress = (serviceId: number) => {
        // Using navigation.navigate instead of router.push
        navigation.navigate('ServiceDetails', { serviceId });
    };

    // Fetch services on component mount
    useEffect(() => {
        fetchServices();
    }, []);

    // Render service item
    const renderServiceItem = ({ item }: { item: Service }) => (
        <TouchableOpacity
            className="bg-white rounded-[14px] overflow-hidden mb-4 w-[48%] shadow-sm"
            onPress={() => handleServicePress(item.id)}
        >
            <Image
                source={{ uri: item.image.startsWith('http') ? item.image : `${API_BASE_URL}/storage/${item.image}` }}
                className="w-full h-[120px]"
                resizeMode="cover"
            />
            <View className="p-3">
                <Text className="text-base font-semibold text-black mb-1" numberOfLines={1}>{item.title}</Text>
                {item.subtitle && (
                    <Text className="text-sm text-gray-600 mb-2" numberOfLines={1}>{item.subtitle}</Text>
                )}
                <View className="flex-row items-center justify-between mt-1.5">
                    {item.price !== null && (
                        <Text className="text-base font-bold text-primary">${item.price}</Text>
                    )}
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

    return (
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <SafeAreaView className="flex-1 bg-[#FAFAFA]">
                <View className="flex-1 px-4 pt-6">
                    {/* Header */}
                    <View className="mb-5 pt-2.5">
                        <Text className="text-2xl font-bold text-black">Search Services</Text>
                    </View>

                    {/* Search Bar */}
                    <View
                        className={`flex-row items-center bg-white rounded-[14px] px-4 py-3.5 mb-5 border ${
                            searchFocus ? 'border-primary' : 'border-[#DFDFDF]'
                        }`}
                    >
                        <Feather name="search" size={20} color={searchFocus ? "#9A563A" : "#DFDFDF"} />
                        <TextInput
                            className="flex-1 text-base text-black ml-3"
                            placeholder="Search for services..."
                            value={searchQuery}
                            onChangeText={updateSearch}
                            onFocus={() => setSearchFocus(true)}
                            onBlur={() => setSearchFocus(false)}
                            returnKeyType="search"
                            placeholderTextColor="#999"
                        />
                        {searchQuery.length > 0 && (
                            <TouchableOpacity
                                onPress={() => {
                                    setSearchQuery('');
                                    setFilteredServices(services);
                                }}
                            >
                                <Feather name="x" size={20} color="#9A563A" />
                            </TouchableOpacity>
                        )}
                    </View>

                    {/* Loading State */}
                    {isLoading && (
                        <View className="flex-1 justify-center items-center px-5">
                            <ActivityIndicator size="large" color="#9A563A" />
                        </View>
                    )}

                    {/* Error State */}
                    {error && !isLoading && (
                        <View className="flex-1 justify-center items-center px-5">
                            <Text className="text-red-500 text-base text-center mb-4">{error}</Text>
                            <TouchableOpacity
                                className="bg-primary px-4 py-2 rounded-lg"
                                onPress={fetchServices}
                            >
                                <Text className="text-white font-semibold">Retry</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    {/* No Results */}
                    {!isLoading && !error && filteredServices.length === 0 && (
                        <View className="flex-1 justify-center items-center px-5">
                            <Ionicons name="search-outline" size={60} color="#DFDFDF" />
                            <Text className="mt-3 text-base text-gray-500 text-center">
                                {searchQuery.length > 0
                                    ? `No services found matching "${searchQuery}"`
                                    : "No services available"}
                            </Text>
                        </View>
                    )}

                    {/* Results List */}
                    {!isLoading && !error && filteredServices.length > 0 && (
                        <FlatList
                            data={filteredServices}
                            renderItem={renderServiceItem}
                            keyExtractor={(item) => item.id.toString()}
                            showsVerticalScrollIndicator={false}
                            contentContainerStyle={{ paddingBottom: 20 }}
                            numColumns={2}
                            columnWrapperStyle={{ justifyContent: 'space-between' }}
                        />
                    )}
                </View>
            </SafeAreaView>
        </TouchableWithoutFeedback>
    );
}