// ProfileScreen.tsx - With useFocusEffect and pull-to-refresh
import React, { useState, useCallback, useRef } from 'react';
import {
    SafeAreaView,
    StyleSheet,
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
import axios from 'axios'; // Make sure axios is installed
import { API_BASE_URL } from '@/config/api';

// Define TypeScript interfaces
interface UserData {
    id: string;
    name: string;
    email: string;
    profile_photo_path?: string; // Updated to match database schema
}

interface MenuItem {
    icon: React.ReactNode;
    label: string;
    rightIcon: React.ReactNode;
    isBold?: boolean;
    color?: string;
    onPress?: () => void;
}

interface MenuSection {
    title: string;
    items: MenuItem[];
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
    // Define default avatar as a number (the way require works in RN)
    const defaultAvatar = require('../../assets/images/default-avatar.jpg');

    // States for delete account modal
    const [deleteModalVisible, setDeleteModalVisible] = useState<boolean>(false);
    const [password, setPassword] = useState<string>('');
    const [isDeleting, setIsDeleting] = useState<boolean>(false);
    const [passwordError, setPasswordError] = useState<string>('');

    // API URL from environment variables or hardcoded for now
    // const API_URL = process.env.API_URL || 'https://your-api-url.com/api';

    // Function to load user data
    const loadUserData = async (): Promise<void> => {
        try {
            setIsLoading(true);

            // Get individual user data items
            const userId = await AsyncStorage.getItem('user_id') || '';
            const userName = await AsyncStorage.getItem('user_name') || '';
            const userEmail = await AsyncStorage.getItem('user_email') || '';
            const userProfilePhoto = await AsyncStorage.getItem('user_profile_photo_path') || ''; // Updated key
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
        } catch (error) {
            console.error('Error loading user data:', error);
            Alert.alert('Error', 'Failed to load profile data');
        } finally {
            setIsLoading(false);
            setRefreshing(false);
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

            // Optional cleanup function
            return () => {
                // Any cleanup if needed
            };
        }, []) // Empty dependency array means this effect runs only when the screen focuses
    );

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
                'user_profile_photo_path', // Updated key
                'user_phone',
                'user_data',
                'session_expiry'
            ]);

            // Navigate to login screen
            router.replace('/(auth)');
        } catch (error) {
            console.error('Error during logout:', error);
            Alert.alert('Error', 'Failed to logout. Please try again.');
        }
    };

    // Handle Delete Account
    const handleDeleteAccount = (): void => {
        setDeleteModalVisible(true);
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
            console.log('Token:', token);
            console.log('Password:', password);

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

    // Menu sections
    const menuItems: MenuSection[] = [
        {
            title: 'Activity',
            items: [
                {
                    icon: <Feather name="bookmark" size={24} color="#ccc"/>,
                    label: 'Archive Goals',
                    color: "#ccc",
                    rightIcon: <MaterialIcons name="keyboard-arrow-right" size={24} color="#ccc"/>
                },
                {
                    icon: <Feather name="repeat" size={24} color="#ccc"/>,
                    label: 'Link Bank Account',
                    color: "#ccc",
                    rightIcon: <MaterialIcons name="keyboard-arrow-right" size={24} color="#ccc"/>
                },
                {
                    icon: <FontAwesome name="circle-o" size={24} color="#ccc"/>,
                    label: 'Billing & Subscriptions',
                    color: "#ccc",
                    rightIcon: <MaterialIcons name="keyboard-arrow-right" size={24} color="#ccc"/>
                },
                {
                    icon: <FontAwesome name="credit-card" size={24} color="#ccc"/>,
                    label: 'Payment Methods',
                    color: "#ccc",
                    rightIcon: <MaterialIcons name="keyboard-arrow-right" size={24} color="#ccc"/>
                },
                {
                    icon: <Feather name="shield" size={24} color="black"/>,
                    label: 'Account & Security',
                    color: "black",
                    rightIcon: <MaterialIcons name="keyboard-arrow-right" size={24} color="#ccc"/>,
                    onPress: () => router.push('/SecurityScreen') // Navigate to security screen
                },
            ]
        },
        {
            title: 'General',
            items: [
                {
                    icon: <Ionicons name="settings-outline" size={24} color="#ccc"/>,
                    label: 'Preferences',
                    color: "#ccc",
                    rightIcon: <MaterialIcons name="keyboard-arrow-right" size={24} color="#ccc"/>
                },
                {
                    icon: <Ionicons name="eye-outline" size={24} color="#ccc"/>,
                    label: 'App Appearance',
                    color: "#ccc",
                    rightIcon: <MaterialIcons name="keyboard-arrow-right" size={24} color="#ccc"/>
                },
                {
                    icon: <Feather name="help-circle" size={24} color="#ccc"/>,
                    label: 'Help & Support',
                    color: "#ccc",
                    rightIcon: <MaterialIcons name="keyboard-arrow-right" size={24} color="#ccc"/>
                },
                {
                    icon: <AntDesign name="like2" size={24} color="#ccc"/>,
                    label: 'Rate Us',
                    color: "#ccc",
                    rightIcon: <MaterialIcons name="keyboard-arrow-right" size={24} color="#ccc"/>
                },
            ]
        }
    ];

    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#9A563A" />
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView
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
                {/* Profile Header */}
                <View style={styles.profileHeader}>
                    <View style={styles.avatarContainer}>
                        {userData.profile_photo_path ? (
                            <Image
                                source={{ uri: userData.profile_photo_path }}
                                style={styles.avatar}
                            />
                        ) : (
                            <View style={styles.avatar}>
                                <Feather name="user" size={40} color="black"/>
                            </View>
                        )}
                    </View>

                    {/* PRO Badge */}
                    <View style={styles.proBadgeContainer}>
                        <View style={styles.proBadge}>
                            <Feather name="award" size={18} color="white"/>
                            <Text style={styles.proBadgeText}>Regular</Text>
                        </View>
                    </View>

                    <Text style={styles.userName}>{userData.name || 'User'}</Text>
                    <Text style={styles.userEmail}>{userData.email || 'email@example.com'}</Text>

                    <TouchableOpacity style={styles.infoButton} onPress={() => router.push('/EditProfileScreen')}>
                        <Text style={styles.infoButtonText}>Edit Profile</Text>
                    </TouchableOpacity>
                </View>

                {/* Menu Sections */}
                {menuItems.map((section, sectionIndex) => (
                    <View key={sectionIndex} style={styles.section}>
                        <Text style={styles.sectionTitle}>{section.title}</Text>

                        {section.items.map((item, itemIndex) => (
                            <TouchableOpacity
                                key={itemIndex}
                                style={[
                                    styles.menuItem,
                                    itemIndex === section.items.length - 1 && styles.lastMenuItem
                                ]}
                                onPress={item.onPress} // Add this line to handle the press event
                            >
                                <View style={styles.menuItemLeft}>
                                    {item.icon}
                                    <Text style={[
                                        styles.menuItemText,
                                        item.isBold && styles.boldText,
                                        item.color && {color: item.color}
                                    ]}>
                                        {item.label}
                                    </Text>
                                </View>
                                {item.rightIcon}
                            </TouchableOpacity>
                        ))}
                    </View>
                ))}

                {/* Logout and Delete Account Buttons */}
                <View style={styles.accountActionsContainer}>
                    {/* Logout Button */}
                    <TouchableOpacity
                        style={styles.logoutButton}
                        onPress={handleLogout}
                    >
                        <Text style={styles.logoutText}>Logout</Text>
                        <Feather name="log-out" size={20} color="#9A563A"/>
                    </TouchableOpacity>

                    {/* Delete Account Button */}
                    <TouchableOpacity
                        style={styles.deleteAccountButton}
                        onPress={handleDeleteAccount}
                    >
                        <Text style={styles.deleteAccountText}>Delete Account</Text>
                        <Feather name="trash-2" size={20} color="#FF3B30"/>
                    </TouchableOpacity>
                </View>
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
                <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Delete Account</Text>
                        <Text style={styles.modalMessage}>
                            This action cannot be undone. All your data including addresses and bookings will be permanently deleted.
                        </Text>
                        <Text style={styles.modalMessage}>
                            Please enter your password to confirm:
                        </Text>

                        <TextInput
                            style={[
                                styles.passwordInput,
                                passwordError ? styles.inputError : null
                            ]}
                            placeholder="Enter your password"
                            secureTextEntry
                            value={password}
                            onChangeText={setPassword}
                            editable={!isDeleting}
                        />

                        {passwordError ? (
                            <Text style={styles.errorText}>{passwordError}</Text>
                        ) : null}

                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={styles.cancelButton}
                                onPress={() => {
                                    setDeleteModalVisible(false);
                                    setPassword('');
                                    setPasswordError('');
                                }}
                                disabled={isDeleting}
                            >
                                <Text style={styles.cancelButtonText}>Cancel</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.confirmDeleteButton}
                                onPress={performDeleteAccount}
                                disabled={isDeleting}
                            >
                                {isDeleting ? (
                                    <ActivityIndicator size="small" color="#fff" />
                                ) : (
                                    <Text style={styles.confirmDeleteText}>Delete</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
    },
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
        margin: 20,
        paddingBottom: 50,
        marginBottom: 50,
    },
    profileHeader: {
        marginTop: 20,
        borderRadius: 10,
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    avatarContainer: {
        marginBottom: 10,
    },
    avatar: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#f0f0f0',
        justifyContent: 'center',
        alignItems: 'center',
    },
    proBadgeContainer: {
        marginBottom: 10,
    },
    proBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#9e9e9e',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    proBadgeText: {
        color: 'white',
        marginLeft: 5,
        fontWeight: 'bold',
    },
    userName: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 5,
    },
    userEmail: {
        fontSize: 16,
        color: '#666',
        marginBottom: 15,
    },
    boldText: {
        fontWeight: 'bold',
    },
    infoButton: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 20,
        paddingVertical: 8,
        paddingHorizontal: 24,
        marginTop: 10,
    },
    infoButtonText: {
        fontSize: 16,
    },
    section: {
        marginVertical: 15,
        paddingHorizontal: 10,
        paddingVertical: 20,
        backgroundColor: '#fff',
        borderRadius: 10,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginLeft: 15,
        marginBottom: 10,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#fff',
        paddingVertical: 15,
        paddingHorizontal: 15,
        borderBottomColor: '#f0f0f0',
    },
    lastMenuItem: {
        borderBottomWidth: 0,
    },
    menuItemLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    menuItemText: {
        fontSize: 16,
        marginLeft: 15,
    },
    accountActionsContainer: {
        marginBottom: 30,
        paddingBottom: 40,
        gap: 15,
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 15,
        backgroundColor: '#fff',
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#f0f0f0',
    },
    logoutText: {
        color: '#9A563A',
        fontSize: 16,
        fontWeight: 'bold',
        marginRight: 8,
    },
    deleteAccountButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 15,
        backgroundColor: '#fff',
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#f0f0f0',
    },
    deleteAccountText: {
        color: '#FF3B30',
        fontSize: 16,
        fontWeight: 'bold',
        marginRight: 8,
    },
    // Modal styles
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContent: {
        width: '85%',
        backgroundColor: 'white',
        borderRadius: 10,
        padding: 20,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2
        },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 15,
        color: '#FF3B30'
    },
    modalMessage: {
        fontSize: 16,
        marginBottom: 20,
        textAlign: 'center',
        lineHeight: 22,
    },
    passwordInput: {
        width: '100%',
        height: 45,
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 5,
        marginBottom: 10,
        paddingHorizontal: 10,
    },
    inputError: {
        borderColor: '#FF3B30',
    },
    errorText: {
        color: '#FF3B30',
        marginBottom: 10,
        fontSize: 14,
        alignSelf: 'flex-start',
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
        marginTop: 20,
    },
    cancelButton: {
        flex: 1,
        padding: 12,
        borderRadius: 5,
        alignItems: 'center',
        backgroundColor: '#f0f0f0',
        marginRight: 10,
    },
    cancelButtonText: {
        fontSize: 16,
        color: '#333',
    },
    confirmDeleteButton: {
        flex: 1,
        padding: 12,
        borderRadius: 5,
        alignItems: 'center',
        backgroundColor: '#FF3B30',
    },
    confirmDeleteText: {
        fontSize: 16,
        color: 'white',
        fontWeight: 'bold',
    },
});