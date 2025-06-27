// app/(tabs)/profiles.tsx - Updated with Investment Progress
import React, { useState, useCallback } from 'react';
import {
    SafeAreaView,
    View,
    Text,
    Image,
    TouchableOpacity,
    ScrollView,
    Alert,
    ActivityIndicator,
    RefreshControl,
    Modal,
    TextInput,
} from 'react-native';
import {
    Feather,
    MaterialIcons,
    Ionicons,
    FontAwesome,
    AntDesign
} from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useRouter } from 'expo-router';
import axios from 'axios';
import { API_BASE_URL } from '@/config/api';
import GuestProfileHeader from '../components/GuestProfileHeader';
import InvestmentProgress from '../components/InvestmentProgress';
import investmentService from '../services/investmentService';

// Define TypeScript interfaces
interface UserData {
    id: string;
    name: string;
    email: string;
    profile_photo_path?: string;
}

interface MenuItem {
    icon: React.ReactNode;
    label: string;
    rightIcon: React.ReactNode;
    isBold?: boolean;
    color?: string;
    onPress?: () => void;
    visibleForGuest?: boolean;
}

interface MenuSection {
    title: string;
    items: MenuItem[];
    visibleForGuest?: boolean;
}

interface InvestmentSummary {
    total_invested: number;
    total_investments: number;
    pending_investments: number;
    investments_by_location: Array<{
        location: {
            id: number;
            name: string;
            city: string;
        };
        total_amount: number;
        investment_count: number;
    }>;
}

export default function ProfileScreen() {
    const router = useRouter();
    const [userData, setUserData] = useState<UserData>({
        id: '',
        name: '',
        email: '',
        profile_photo_path: '',
    });
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [refreshing, setRefreshing] = useState<boolean>(false);
    const [isGuest, setIsGuest] = useState<boolean>(false);
    const [investmentSummary, setInvestmentSummary] = useState<InvestmentSummary | null>(null);
    const [loadingInvestments, setLoadingInvestments] = useState<boolean>(false);

    // States for delete account modal
    const [deleteModalVisible, setDeleteModalVisible] = useState<boolean>(false);
    const [password, setPassword] = useState<string>('');
    const [isDeleting, setIsDeleting] = useState<boolean>(false);
    const [passwordError, setPasswordError] = useState<string>('');

    // Function to load user data
    const loadUserData = async (): Promise<void> => {
        try {
            setIsLoading(true);

            // Check if user is in guest mode
            const userMode = await AsyncStorage.getItem('user_mode');
            setIsGuest(userMode === 'guest');

            if (userMode === 'guest') {
                // No need to load user data for guest
                setIsLoading(false);
                setRefreshing(false);
                return;
            }

            // Get individual user data items
            const userId = await AsyncStorage.getItem('user_id') || '';
            const userName = await AsyncStorage.getItem('user_name') || '';
            const userEmail = await AsyncStorage.getItem('user_email') || '';
            const userProfilePhoto = await AsyncStorage.getItem('user_profile_photo_path') || '';
            console.log('Profile photo path:', userProfilePhoto);

            // Try to get complete user data as fallback
            let completeUserData: Partial<UserData> = {};
            const userDataString = await AsyncStorage.getItem('user_data');
            if (userDataString) {
                completeUserData = JSON.parse(userDataString);
            }

            setUserData({
                id: userId || completeUserData.id || '',
                name: userName || completeUserData.name || '',
                email: userEmail || completeUserData.email || '',
                profile_photo_path: userProfilePhoto || completeUserData.profile_photo_path,
            });

            // Load investment data for logged-in users
            await loadInvestmentData();
        } catch (error) {
            console.error('Error loading user data:', error);
            Alert.alert('Error', 'Failed to load profile data');
        } finally {
            setIsLoading(false);
            setRefreshing(false);
        }
    };

    // Function to load investment data
    const loadInvestmentData = async (): Promise<void> => {
        try {
            setLoadingInvestments(true);
            const response = await investmentService.getUserInvestmentSummary();

            if (response.success) {
                setInvestmentSummary(response.data);
            }
        } catch (error) {
            console.error('Error loading investment data:', error);
            // Don't show alert for investment errors, just log them
        } finally {
            setLoadingInvestments(false);
        }
    };

    // Handle pull-to-refresh
    const onRefresh = useCallback(() => {
        setRefreshing(true);
        loadUserData();
    }, []);

    // Fetch user data whenever the screen comes into focus
    useFocusEffect(
        useCallback(() => {
            loadUserData();
            return () => {
                // Any cleanup if needed
            };
        }, [])
    );

    // Handle login
    const handleLogin = (): void => {
        router.push('/(auth)/LoginScreen');
    };

    // Handle register
    const handleRegister = (): void => {
        router.push('/(auth)/RegisterScreen');
    };

    // Handle logout
    const handleLogout = (): void => {
        Alert.alert(
            "Logout",
            "Are you sure you want to logout?",
            [
                {
                    text: "Cancel",
                    style: "cancel"
                },
                {
                    text: "Logout",
                    onPress: () => performLogout(),
                    style: "destructive"
                }
            ]
        );
    };

    // Perform the actual logout
    const performLogout = async (): Promise<void> => {
        try {
            // Clear all user data from AsyncStorage
            await AsyncStorage.multiRemove([
                'access_token',
                'user_id',
                'user_name',
                'user_email',
                'user_profile_photo_path',
                'user_phone',
                'user_data',
                'session_expiry',
                'user_mode'
            ]);

            // Navigate to login screen
            router.replace('/(auth)');
        } catch (error) {
            console.error('Error during logout:', error);
            Alert.alert('Error', 'Failed to logout. Please try again.');
        }
    };

    // For guests, switch to login screen
    const handleGuestToLogin = () => {
        router.push('/(auth)/LoginScreen');
    };

    // For guests, switch to register screen
    const handleGuestToRegister = () => {
        router.push('/(auth)/RegisterScreen');
    };

    // Handle Delete Account
    const handleDeleteAccount = (): void => {
        setDeleteModalVisible(true);
    };

    // Navigate to Investment Screen
    const handleInvestmentPress = (): void => {
        if (isGuest) {
            Alert.alert(
                'Login Required',
                'Please login to view your investments',
                [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Login', onPress: () => router.push('/(auth)/LoginScreen') }
                ]
            );
            return;
        }
        router.push('/(investment)');
    };

    // Perform account deletion
    const performDeleteAccount = async (): Promise<void> => {
        // Validate password
        if (!password) {
            setPasswordError('Password is required');
            return;
        }

        setPasswordError('');
        setIsDeleting(true);

        try {
            // Get token
            const token = await AsyncStorage.getItem('access_token');

            if (!token) {
                throw new Error('Authentication token not found');
            }

            // Make API call to delete account
            const response = await axios.post(
                `${API_BASE_URL}/api/account/delete`,
                { password },
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    }
                }
            );

            // If deletion was successful
            if (response.data.success) {
                // Clear local storage
                await AsyncStorage.clear();

                // Close modal
                setDeleteModalVisible(false);

                // Show success message
                Alert.alert(
                    'Account Deleted',
                    'Your account has been successfully deleted.',
                    [
                        {
                            text: 'OK',
                            onPress: () => router.replace('/(auth)'),
                        }
                    ]
                );
            }
        } catch (error: any) {
            console.error('Error deleting account:', error);

            // Handle specific error cases
            if (error.response) {
                // Server responded with an error status
                if (error.response.status === 401) {
                    setPasswordError('Incorrect password');
                } else {
                    Alert.alert('Error', error.response.data.message || 'Failed to delete account');
                }
            } else {
                Alert.alert('Error', 'Network error. Please check your connection and try again.');
            }
        } finally {
            setIsDeleting(false);
        }
    };

    // Menu sections - Updated with Investment option
    const menuItems: MenuSection[] = [
        {
            title: 'Investment',
            items: [
                {
                    icon: <MaterialIcons name="trending-up" size={24} color="#9A563A" />,
                    label: 'My Investments',
                    color: "#9A563A",
                    rightIcon: <MaterialIcons name="keyboard-arrow-right" size={24} color="#ccc" />,
                    onPress: handleInvestmentPress,
                    visibleForGuest: true
                },
                {
                    icon: <MaterialIcons name="pie-chart" size={24} color="#ccc" />,
                    label: 'Investment Analytics',
                    color: "#ccc",
                    rightIcon: <MaterialIcons name="keyboard-arrow-right" size={24} color="#ccc" />,
                    visibleForGuest: false
                },
                {
                    icon: <MaterialIcons name="history" size={24} color="#ccc" />,
                    label: 'Transaction History',
                    color: "#ccc",
                    rightIcon: <MaterialIcons name="keyboard-arrow-right" size={24} color="#ccc" />,
                    visibleForGuest: false
                },
            ],
            visibleForGuest: true
        },
        {
            title: 'Activity',
            items: [
                {
                    icon: <Feather name="bookmark" size={24} color="#ccc" />,
                    label: 'Archive Goals',
                    color: "#ccc",
                    rightIcon: <MaterialIcons name="keyboard-arrow-right" size={24} color="#ccc" />,
                    visibleForGuest: false
                },
                {
                    icon: <Feather name="repeat" size={24} color="#ccc" />,
                    label: 'Link Bank Account',
                    color: "#ccc",
                    rightIcon: <MaterialIcons name="keyboard-arrow-right" size={24} color="#ccc" />,
                    visibleForGuest: false
                },
                {
                    icon: <FontAwesome name="circle-o" size={24} color="#ccc" />,
                    label: 'Billing & Subscriptions',
                    color: "#ccc",
                    rightIcon: <MaterialIcons name="keyboard-arrow-right" size={24} color="#ccc" />,
                    visibleForGuest: false
                },
                {
                    icon: <FontAwesome name="credit-card" size={24} color="#ccc" />,
                    label: 'Payment Methods',
                    color: "#ccc",
                    rightIcon: <MaterialIcons name="keyboard-arrow-right" size={24} color="#ccc" />,
                    visibleForGuest: false
                },
                {
                    icon: <Feather name="shield" size={24} color="black" />,
                    label: 'Account & Security',
                    color: "black",
                    rightIcon: <MaterialIcons name="keyboard-arrow-right" size={24} color="#ccc" />,
                    onPress: () => router.push('/SecurityScreen'),
                    visibleForGuest: false
                },
            ],
            visibleForGuest: false
        },
        {
            title: 'General',
            items: [
                {
                    icon: <Ionicons name="settings-outline" size={24} color="#ccc" />,
                    label: 'Preferences',
                    color: "#ccc",
                    rightIcon: <MaterialIcons name="keyboard-arrow-right" size={24} color="#ccc" />,
                    visibleForGuest: true
                },
                {
                    icon: <Ionicons name="eye-outline" size={24} color="#ccc" />,
                    label: 'App Appearance',
                    color: "#ccc",
                    rightIcon: <MaterialIcons name="keyboard-arrow-right" size={24} color="#ccc" />,
                    visibleForGuest: true
                },
                {
                    icon: <Feather name="help-circle" size={24} color="#ccc" />,
                    label: 'Help & Support',
                    color: "#ccc",
                    rightIcon: <MaterialIcons name="keyboard-arrow-right" size={24} color="#ccc" />,
                    visibleForGuest: true
                },
                {
                    icon: <AntDesign name="like2" size={24} color="#ccc" />,
                    label: 'Rate Us',
                    color: "#ccc",
                    rightIcon: <MaterialIcons name="keyboard-arrow-right" size={24} color="#ccc" />,
                    visibleForGuest: true
                },
            ],
            visibleForGuest: true
        }
    ];

    if (isLoading) {
        return (
            <View className="flex-1 justify-center items-center bg-gray-100">
                <ActivityIndicator size="large" color="#9A563A" />
            </View>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-gray-100 mx-5 pb-12 mb-12">
            <ScrollView
                className="flex-1"
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={["#9A563A"]} // Android
                        tintColor="#9A563A" // iOS
                        title="Refreshing..." // iOS
                        titleColor="#9A563A" // iOS
                    />
                }
            >
                {/* Profile Header - Different for guests and logged in users */}
                {isGuest ? (
                    // Guest profile header
                    <GuestProfileHeader
                        onLogin={handleGuestToLogin}
                        onRegister={handleGuestToRegister}
                    />
                ) : (
                    // Logged in user profile header
                    <View className="mt-5 rounded-xl items-center p-5 bg-white border-b border-gray-200">
                        <View className="mb-2.5">
                            {userData.profile_photo_path ? (
                                <Image
                                    source={{ uri: userData.profile_photo_path }}
                                    className="w-20 h-20 rounded-full bg-gray-200"
                                />
                            ) : (
                                <View className="w-20 h-20 rounded-full bg-gray-200 justify-center items-center">
                                    <Feather name="user" size={40} color="black" />
                                </View>
                            )}
                        </View>

                        {/* PRO Badge */}
                        <View className="mb-2.5">
                            <View className="flex-row items-center bg-gray-500 px-3 py-1.5 rounded-full">
                                <Feather name="award" size={18} color="white" />
                                <Text className="text-white ml-1.5 font-bold">Regular</Text>
                            </View>
                        </View>

                        <Text className="text-2xl font-bold mb-1.5">{userData.name || 'User'}</Text>
                        <Text className="text-base text-gray-600 mb-4">{userData.email || 'email@example.com'}</Text>

                        <TouchableOpacity
                            className="border border-gray-300 rounded-full py-2 px-6 mt-2.5"
                            onPress={() => router.push('/EditProfileScreen')}
                        >
                            <Text className="text-base">Edit Profile</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* Investment Progress Section - Show for both guest and logged-in users */}
                <TouchableOpacity onPress={handleInvestmentPress} className="mt-4">
                    {loadingInvestments ? (
                        <View className="bg-white rounded-xl p-5 mb-4 items-center">
                            <ActivityIndicator size="small" color="#9A563A" />
                            <Text className="mt-2 text-gray-500">Loading investments...</Text>
                        </View>
                    ) : (
                        <InvestmentProgress
                            totalInvested={investmentSummary?.total_invested || 0}
                            totalInvestments={investmentSummary?.total_investments || 0}
                            investmentsByLocation={investmentSummary?.investments_by_location || []}
                            isGuest={isGuest}
                        />
                    )}
                </TouchableOpacity>

                {/* Menu Sections - Filter based on user type */}
                {menuItems
                    .filter(section => !isGuest || section.visibleForGuest)
                    .map((section, sectionIndex) => (
                        <View key={sectionIndex} className="my-4 px-2.5 py-5 bg-white rounded-xl">
                            <Text className="text-xl font-bold ml-4 mb-2.5">{section.title}</Text>

                            {section.items
                                .filter(item => !isGuest || item.visibleForGuest)
                                .map((item, itemIndex) => {
                                    const isLastItem = itemIndex === section.items.filter(it => !isGuest || it.visibleForGuest).length - 1;
                                    return (
                                        <TouchableOpacity
                                            key={itemIndex}
                                            className={`flex-row items-center justify-between bg-white py-4 px-4 ${!isLastItem ? 'border-b border-gray-200' : ''}`}
                                            onPress={item.onPress}
                                        >
                                            <View className="flex-row items-center">
                                                {item.icon}
                                                <Text
                                                    className={`text-base ml-4 ${item.isBold ? 'font-bold' : ''}`}
                                                    style={item.color ? { color: item.color } : {}}
                                                >
                                                    {item.label}
                                                </Text>
                                            </View>
                                            {item.rightIcon}
                                        </TouchableOpacity>
                                    );
                                })}
                        </View>
                    ))}

                {/* Logout and Delete Account Buttons for logged in users */}
                {!isGuest && (
                    <View className="mb-8 pb-10 gap-4">
                        {/* Logout Button */}
                        <TouchableOpacity
                            className="flex-row items-center justify-center p-4 bg-white rounded-xl border border-gray-200"
                            onPress={handleLogout}
                        >
                            <Text className="text-primary text-base font-bold mr-2">Logout</Text>
                            <Feather name="log-out" size={20} color="#9A563A" />
                        </TouchableOpacity>

                        {/* Delete Account Button */}
                        <TouchableOpacity
                            className="flex-row items-center justify-center p-4 bg-white rounded-xl border border-gray-200"
                            onPress={handleDeleteAccount}
                        >
                            <Text className="text-red-500 text-base font-bold mr-2">Delete Account</Text>
                            <Feather name="trash-2" size={20} color="#FF3B30" />
                        </TouchableOpacity>
                    </View>
                )}

                {/* "Exit Guest Mode" Button for guests */}
                {isGuest && (
                    <View className="mb-8 pb-10 gap-4">
                        <TouchableOpacity
                            className="flex-row items-center justify-center p-4 bg-white rounded-xl border border-gray-200"
                            onPress={handleLogout}
                        >
                            <Text className="text-primary text-base font-bold mr-2">Exit Guest Mode</Text>
                            <Feather name="log-out" size={20} color="#9A563A" />
                        </TouchableOpacity>
                    </View>
                )}
            </ScrollView>

            {/* Delete Account Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={deleteModalVisible}
                onRequestClose={() => {
                    setDeleteModalVisible(false);
                    setPassword('');
                    setPasswordError('');
                }}
            >
                <View className="flex-1 justify-center items-center bg-black/50">
                    <View className="w-4/5 bg-white rounded-xl p-5 items-center shadow-lg">
                        <Text className="text-xl font-bold mb-4 text-red-500">Delete Account</Text>
                        <Text className="text-base mb-5 text-center leading-6">
                            This action cannot be undone. All your data including addresses and bookings will be permanently deleted.
                        </Text>
                        <Text className="text-base mb-5 text-center leading-6">
                            Please enter your password to confirm:
                        </Text>

                        <TextInput
                            className={`w-full h-11 border rounded-md mb-2.5 px-2.5 ${passwordError ? 'border-red-500' : 'border-gray-300'}`}
                            placeholder="Enter your password"
                            secureTextEntry
                            value={password}
                            onChangeText={setPassword}
                            editable={!isDeleting}
                        />

                        {passwordError ? (
                            <Text className="text-red-500 mb-2.5 text-sm self-start">{passwordError}</Text>
                        ) : null}

                        <View className="flex-row justify-between w-full mt-5">
                            <TouchableOpacity
                                className="flex-1 p-3 rounded-md items-center bg-gray-200 mr-2.5"
                                onPress={() => {
                                    setDeleteModalVisible(false);
                                    setPassword('');
                                    setPasswordError('');
                                }}
                                disabled={isDeleting}
                            >
                                <Text className="text-base text-gray-800">Cancel</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                className="flex-1 p-3 rounded-md items-center bg-red-500"
                                onPress={performDeleteAccount}
                                disabled={isDeleting}
                            >
                                {isDeleting ? (
                                    <ActivityIndicator size="small" color="#fff" />
                                ) : (
                                    <Text className="text-base text-white font-bold">Delete</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}