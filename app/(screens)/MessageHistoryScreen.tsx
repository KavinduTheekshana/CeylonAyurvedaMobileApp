// app/(screens)/MessageHistoryScreen.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    SafeAreaView,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    RefreshControl,
    Alert,
    Modal,
    ScrollView,
} from 'react-native';
import { Feather, MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_BASE_URL } from '@/config/api';

// Define the message interface based on your Laravel model
interface ContactMessage {
    id: number;
    subject: string;
    message: string;
    name: string;
    email: string;
    branch_id: number;
    branch_name: string;
    is_guest: boolean;
    user_id: number | null;
    status: 'pending' | 'in_progress' | 'resolved' | 'closed';
    admin_response: string | null;
    responded_at: string | null;
    responded_by: number | null;
    created_at: string;
    updated_at: string;
    // Laravel relationships
    branch?: {
        id: number;
        name: string;
        city: string;
        address: string;
    };
    responded_by_user?: {
        id: number;
        name: string;
        email: string;
    };
    // Computed attributes from your model
    status_color?: string;
    status_badge?: string;
    user_type?: string;
}

export default function MessageHistoryScreen() {
    const router = useRouter();
    const [messages, setMessages] = useState<ContactMessage[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null);
    const [modalVisible, setModalVisible] = useState(false);
    const [isGuest, setIsGuest] = useState(false);

    useEffect(() => {
        checkUserStatus();
        fetchMessages();
    }, []);

    const checkUserStatus = async () => {
        try {
            const userMode = await AsyncStorage.getItem('user_mode');
            setIsGuest(userMode === 'guest');
        } catch (error) {
            console.error('Error checking user status:', error);
        }
    };

    const fetchMessages = useCallback(async () => {
        try {
            setLoading(true);

            const token = await AsyncStorage.getItem('access_token');

            // For guests, show message that they need to login
            if (isGuest || !token) {
                Alert.alert(
                    'Authentication Required',
                    'Please login to view your message history.',
                    [
                        { text: 'Cancel', style: 'cancel' },
                        { text: 'Login', onPress: () => router.replace('/(auth)/LoginScreen') }
                    ]
                );
                setLoading(false);
                return;
            }

            const headers: Record<string, string> = {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Authorization': `Bearer ${token}`
            };
            console.log('Fetching messages with headers:', headers);
            // Use your existing API endpoint for logged-in users
            const response = await axios.get(`${API_BASE_URL}/api/contact/messages`, { headers });

            if (response.data.success) {
                setMessages(response.data.data || []);
            } else {
                Alert.alert('Error', response.data.message || 'Failed to fetch messages');
            }
        } catch (error: any) {
            console.error('Error fetching messages:', error);

            if (axios.isAxiosError(error) && error.response?.status === 401) {
                Alert.alert('Authentication Error', 'Please login again to view your messages.');
                router.replace('/(auth)/LoginScreen');
            } else {
                Alert.alert('Error', 'Failed to fetch messages. Please try again.');
            }
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [isGuest]);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchMessages();
    }, [fetchMessages]);

    const handleMessagePress = (message: ContactMessage) => {
        setSelectedMessage(message);
        setModalVisible(true);
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pending':
                return '#FFC107'; // Amber
            case 'in_progress':
                return '#2196F3'; // Blue
            case 'resolved':
                return '#4CAF50'; // Green
            case 'closed':
                return '#9E9E9E'; // Gray
            default:
                return '#9E9E9E';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'pending':
                return 'clock';
            case 'in_progress':
                return 'play-circle';
            case 'resolved':
                return 'check-circle';
            case 'closed':
                return 'x-circle';
            default:
                return 'circle';
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const stripHtmlTags = (html: string) => {
        if (!html) return '';
        return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').trim();
    };

    const renderMessageItem = ({ item }: { item: ContactMessage }) => (
        <TouchableOpacity
            className="bg-white rounded-xl p-4 mb-3 shadow-sm"
            style={{
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
                elevation: 3,
            }}
            onPress={() => handleMessagePress(item)}
        >
            <View className="flex-row justify-between items-center mb-2">
                <Text className="text-base font-semibold text-gray-800 flex-1 mr-2" numberOfLines={1}>
                    {item.subject}
                </Text>
                <View className="flex-row items-center px-2 py-1 rounded-xl" style={{ backgroundColor: getStatusColor(item.status) }}>
                    <Feather
                        name={getStatusIcon(item.status) as any}
                        size={12}
                        color="white"
                    />
                    <Text className="text-white text-xs font-semibold ml-1">
                        {item.status.replace('_', ' ').toUpperCase()}
                    </Text>
                </View>
            </View>

            <Text className="text-sm text-gray-600 leading-5 mb-3" numberOfLines={2}>
                {item.message}
            </Text>

            <View className="flex-row justify-between items-center">
                <View className="flex-row items-center">
                    <Feather name="map-pin" size={12} color="#9A563A" />
                    <Text className="text-xs text-[#9A563A] ml-1 font-medium">
                        {item.branch?.name || item.branch_name}
                    </Text>
                </View>
                <Text className="text-xs text-gray-400">
                    {formatDate(item.created_at)}
                </Text>
            </View>

            {item.admin_response && (
                <View className="flex-row items-center mt-2 pt-2 border-t border-gray-100">
                    <Feather name="message-circle" size={14} color="#4CAF50" />
                    <Text className="text-xs text-green-500 ml-1 font-medium">Admin responded</Text>
                </View>
            )}
        </TouchableOpacity>
    );

    const renderEmptyState = () => (
        <View className="flex-1 justify-center items-center px-10">
            <MaterialIcons name="mail-outline" size={64} color="#ccc" />
            <Text className="text-xl font-bold text-gray-800 mt-4 mb-2">
                {isGuest ? 'Login Required' : 'No Messages Yet'}
            </Text>
            <Text className="text-sm text-gray-600 text-center leading-5 mb-6">
                {isGuest
                    ? 'Please login to view your message history and track responses from our admin team.'
                    : 'You haven\'t sent any messages to the admin team yet.'
                }
            </Text>
            <TouchableOpacity
                className="flex-row items-center bg-[#9A563A] px-5 py-3 rounded-lg"
                onPress={() => isGuest
                    ? router.push('/(auth)/LoginScreen')
                    : router.push('/(screens)/MessageAdminScreen')
                }
            >
                <Feather name={isGuest ? "log-in" : "plus"} size={18} color="white" />
                <Text className="text-white text-base font-semibold ml-2">
                    {isGuest ? 'Login' : 'Send Message'}
                </Text>
            </TouchableOpacity>
        </View>
    );

    if (loading) {
        return (
            <SafeAreaView className="flex-1 bg-gray-50">
                <View className="flex-1 justify-center items-center">
                    <ActivityIndicator size="large" color="#9A563A" />
                    <Text className="mt-4 text-base text-gray-600">Loading messages...</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-gray-50">
            {/* Header */}
            <View className="flex-row items-center justify-between px-5 py-4 border-b border-gray-100">
                <TouchableOpacity
                    className="p-2"
                    onPress={() => router.back()}
                >
                    <Feather name="arrow-left" size={24} color="black" />
                </TouchableOpacity>
                <Text className="text-xl font-bold text-gray-800">Message History</Text>
                <TouchableOpacity
                    className="p-2"
                    onPress={() => router.push('/(screens)/MessageAdminScreen')}
                >
                    <Feather name="plus" size={24} color="#9A563A" />
                </TouchableOpacity>
            </View>

            {/* Messages List */}
            <FlatList
                data={messages}
                renderItem={renderMessageItem}
                keyExtractor={(item) => item.id.toString()}
                contentContainerStyle={{ padding: 16, flexGrow: 1 }}
                ListEmptyComponent={renderEmptyState}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={["#9A563A"]}
                        tintColor="#9A563A"
                    />
                }
                showsVerticalScrollIndicator={false}
            />

            {/* Message Detail Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <View className="flex-1 bg-black/50 justify-end">
                    <View className="bg-white rounded-t-2xl max-h-[90%] min-h-[60%]">
                        <View className="flex-row justify-between items-center p-5 border-b border-gray-100">
                            <Text className="text-lg font-bold text-gray-800">Message Details</Text>
                            <TouchableOpacity
                                onPress={() => setModalVisible(false)}
                                className="p-1"
                            >
                                <Feather name="x" size={24} color="#333" />
                            </TouchableOpacity>
                        </View>

                        {selectedMessage && (
                            <ScrollView className="flex-1 p-5" showsVerticalScrollIndicator={false}>
                                {/* Message Status */}
                                <View className="items-center mb-5">
                                    <View className="flex-row items-center px-4 py-2 rounded-2xl" style={{ backgroundColor: getStatusColor(selectedMessage.status) }}>
                                        <Feather
                                            name={getStatusIcon(selectedMessage.status) as any}
                                            size={16}
                                            color="white"
                                        />
                                        <Text className="text-white text-xs font-semibold ml-1.5">
                                            {selectedMessage.status.replace('_', ' ').toUpperCase()}
                                        </Text>
                                    </View>
                                </View>
                                {/* Original Message */}
                                <View className="mb-6">
                                    <Text className="text-lg font-bold text-gray-800 mb-4">Your Message</Text>

                                    <View className="mb-3">
                                        <Text className="text-sm font-semibold text-gray-600 mb-1">Subject:</Text>
                                        <Text className="text-sm text-gray-800">{selectedMessage.subject}</Text>
                                    </View>

                                    <View className="mb-3">
                                        <Text className="text-sm font-semibold text-gray-600 mb-1">Branch:</Text>
                                        <Text className="text-sm text-gray-800">
                                            {selectedMessage.branch?.name || selectedMessage.branch_name}
                                        </Text>
                                    </View>

                                    <View className="mb-3">
                                        <Text className="text-sm font-semibold text-gray-600 mb-1">Sent:</Text>
                                        <Text className="text-sm text-gray-800">
                                            {formatDate(selectedMessage.created_at)}
                                        </Text>
                                    </View>

                                    <View className="mt-2">
                                        <Text className="text-sm font-semibold text-gray-600 mb-1">Message:</Text>
                                        <Text className="text-sm text-gray-800 leading-5 bg-gray-50 p-3 rounded-lg mt-1">
                                            {selectedMessage.message}
                                        </Text>
                                    </View>
                                </View>
                                {/* Admin Response */}
                                {selectedMessage.admin_response ? (
                                    <View className="bg-green-50 rounded-xl mb-16 p-4 border border-green-200">
                                        <Text className="text-lg font-bold text-gray-800 mb-4">Admin Response</Text>

                                        {selectedMessage.responded_at && (
                                            <View className="mb-3">
                                                <Text className="text-sm font-semibold text-gray-600 mb-1">Responded:</Text>
                                                <Text className="text-sm text-gray-800">
                                                    {formatDate(selectedMessage.responded_at)}
                                                </Text>
                                            </View>
                                        )}

                                        <View className="mt-2">
                                            <Text className="text-sm text-gray-800 leading-5">
                                                {stripHtmlTags(selectedMessage.admin_response)}
                                            </Text>
                                        </View>
                                    </View>
                                ) : (
                                    <View className="items-center p-6 mb-16 bg-amber-50 rounded-xl border border-orange-200">
                                        <Feather name="clock" size={24} color="#FFC107" />
                                        <Text className="text-base font-semibold text-[#9A563A] mt-3 mb-2">
                                            Waiting for Response
                                        </Text>
                                        <Text className="text-sm text-[#9A563A] text-center leading-5">
                                            Our admin team will respond to your message within 24 hours.
                                        </Text>
                                    </View>
                                )}
                            </ScrollView>
                        )}
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}