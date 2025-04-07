// EditProfileScreen.tsx
import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    SafeAreaView,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    Image,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    Alert,
    ActivityIndicator
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import axios from 'axios';

// You should create this file to store your API URLs
import { API_BASE_URL } from '@/config/api';

interface UserData {
    id: string;
    name: string;
    email: string;
    profile_photo_path?: string;
}

export default function EditProfileScreen() {
    const router = useRouter();
    const [userData, setUserData] = useState<UserData>({
        id: '',
        name: '',
        email: '',
        profile_photo_path: '',
    });

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
    const [newProfilePhoto, setNewProfilePhoto] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [errors, setErrors] = useState<{[key: string]: string}>({});

    // Load user data
    useEffect(() => {
        const loadUserData = async () => {
            try {
                setIsLoading(true);

                // Get data from AsyncStorage
                const userDataString = await AsyncStorage.getItem('user_data');
                const storedName = await AsyncStorage.getItem('user_name');
                const storedEmail = await AsyncStorage.getItem('user_email');
                const storedProfilePhoto = await AsyncStorage.getItem('user_profile_photo_path');

                let parsedUserData = {};
                if (userDataString) {
                    parsedUserData = JSON.parse(userDataString);
                }

                const userData = {
                    ...parsedUserData,
                    name: storedName || '',
                    email: storedEmail || '',
                    profile_photo_path: storedProfilePhoto || '',
                };

                setUserData(userData as UserData);
                setName(userData.name || '');
                setEmail(userData.email || '');
                setProfilePhoto(userData.profile_photo_path || null);

            } catch (error) {
                console.error('Error loading user data:', error);
                Alert.alert('Error', 'Failed to load profile data');
            } finally {
                setIsLoading(false);
            }
        };

        loadUserData();
    }, []);

    // Select image from gallery
    // Update this function in your EditProfileScreen.tsx
    const pickImage = async () => {
        try {
            // Request permissions first
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

            if (status !== 'granted') {
                Alert.alert('Permission Denied', 'We need camera roll permissions to change your profile photo');
                return;
            }

            // Use the new API without deprecated MediaTypeOptions
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: "images", // Just use the string "images" instead of the enum
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.8,
            });

            if (!result.canceled && result.assets && result.assets.length > 0) {
                setNewProfilePhoto(result.assets[0]);
                setProfilePhoto(result.assets[0].uri);
            }
        } catch (error) {
            console.error('Error picking image:', error);
            Alert.alert('Error', 'Failed to pick image');
        }
    };

    // Save profile data
    const saveProfile = async () => {
        try {
            setIsSaving(true);
            setErrors({});

            // Basic validation
            const newErrors: {[key: string]: string} = {};

            if (!name.trim()) {
                newErrors.name = 'Name is required';
            }

            if (Object.keys(newErrors).length > 0) {
                setErrors(newErrors);
                setIsSaving(false);
                return;
            }

            // Get the auth token
            const token = await AsyncStorage.getItem('access_token');

            if (!token) {
                Alert.alert('Error', 'You are not logged in');
                router.replace('/Login');
                return;
            }

            // Create form data for multipart request (needed for file upload)
            const formData = new FormData();
            formData.append('name', name);
            formData.append('email', email); // Still send the email, even though user can't change it

            // Add profile photo if a new one was selected
            if (newProfilePhoto) {
                const fileUri = newProfilePhoto.uri;
                const filename = fileUri.split('/').pop() || 'photo.jpg';
                const match = /\.(\w+)$/.exec(filename);
                const type = match ? `image/${match[1]}` : 'image/jpeg';

                formData.append('profile_photo', {
                    uri: fileUri,
                    name: filename,
                    type,
                } as any);
            }

            // Make API request
            const response = await axios.post(
                `${API_BASE_URL}/api/profile/update`,
                formData,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                        'Authorization': `Bearer ${token}`,
                    },
                }
            );

            if (response.data.success) {
                // Update local storage with new data
                await AsyncStorage.setItem('user_name', name);

                if (response.data.profile_photo_path) {
                    await AsyncStorage.setItem('user_profile_photo_path', response.data.profile_photo_path);
                }

                // Update the user_data object as well
                const userData = {
                    ...JSON.parse(await AsyncStorage.getItem('user_data') || '{}'),
                    name,
                    profile_photo_path: response.data.profile_photo_path || profilePhoto,
                };

                await AsyncStorage.setItem('user_data', JSON.stringify(userData));

                Alert.alert('Success', 'Profile updated successfully', [
                    {
                        text: 'OK',
                        onPress: () => router.back(),
                    },
                ]);
            } else {
                Alert.alert('Error', response.data.message || 'Failed to update profile');
            }
        } catch (error: any) {
            console.error('Error updating profile:', error.response?.data || error);

            if (axios.isAxiosError(error) && error.response?.status === 422) {
                // Validation errors from Laravel
                if (error.response.data.errors) {
                    const validationErrors: {[key: string]: string} = {};

                    Object.entries(error.response.data.errors).forEach(([key, messages]) => {
                        validationErrors[key] = Array.isArray(messages) ? messages[0] : messages as string;
                    });

                    setErrors(validationErrors);
                } else {
                    Alert.alert('Error', 'Validation failed. Please check your input.');
                }
            } else {
                Alert.alert('Error', 'Failed to update profile. Please try again.');
            }
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#9A563A" />
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardContainer}
            >
                <ScrollView contentContainerStyle={styles.scrollContainer}>
                    {/* Header */}
                    <View style={styles.header}>
                        <TouchableOpacity
                            style={styles.backButton}
                            onPress={() => router.back()}
                        >
                            <Feather name="arrow-left" size={24} color="black" />
                        </TouchableOpacity>
                        <Text style={styles.title}>Edit Profile</Text>
                        <View style={styles.placeholder} />
                    </View>

                    {/* Profile Image */}
                    <View style={styles.profileImageContainer}>
                        <TouchableOpacity onPress={pickImage}>
                            {profilePhoto ? (
                                <Image
                                    source={{ uri: profilePhoto }}
                                    style={styles.profileImage}
                                />
                            ) : (
                                <View style={styles.profileImagePlaceholder}>
                                    <Feather name="user" size={50} color="#888" />
                                </View>
                            )}
                            <View style={styles.editIconContainer}>
                                <Feather name="camera" size={18} color="white" />
                            </View>
                        </TouchableOpacity>
                    </View>

                    {/* Form Fields */}
                    <View style={styles.formContainer}>
                        {/* Name Field */}
                        <Text style={styles.inputLabel}>Name</Text>
                        <TextInput
                            style={[
                                styles.input,
                                errors.name && styles.inputError
                            ]}
                            value={name}
                            onChangeText={setName}
                            placeholder="Your name"
                            placeholderTextColor="#999"
                        />
                        {errors.name && (
                            <Text style={styles.errorText}>{errors.name}</Text>
                        )}

                        {/* Email Field (Read-only) */}
                        <Text style={styles.inputLabel}>Email</Text>
                        <View style={styles.readonlyInputContainer}>
                            <Text style={styles.readonlyInput}>{email}</Text>
                        </View>
                    </View>

                    {/* Save Button */}
                    <TouchableOpacity
                        style={styles.saveButton}
                        onPress={saveProfile}
                        disabled={isSaving}
                    >
                        {isSaving ? (
                            <ActivityIndicator color="white" />
                        ) : (
                            <Text style={styles.saveButtonText}>Save Changes</Text>
                        )}
                    </TouchableOpacity>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    keyboardContainer: {
        flex: 1,
    },
    scrollContainer: {
        flexGrow: 1,
        padding: 20,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    backButton: {
        padding: 10,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    placeholder: {
        width: 44, // Same width as back button for alignment
    },
    profileImageContainer: {
        alignItems: 'center',
        marginVertical: 20,
    },
    profileImage: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: '#e0e0e0',
    },
    profileImagePlaceholder: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: '#e0e0e0',
        justifyContent: 'center',
        alignItems: 'center',
    },
    editIconContainer: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: '#9A563A',
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: 'white',
    },
    formContainer: {
        marginVertical: 20,
    },
    inputLabel: {
        fontSize: 16,
        color: '#333',
        marginBottom: 5,
        marginLeft: 5,
    },
    input: {
        backgroundColor: 'white',
        borderRadius: 10,
        paddingHorizontal: 15,
        paddingVertical: 12,
        fontSize: 16,
        borderWidth: 1,
        borderColor: '#ddd',
        marginBottom: 15,
    },
    readonlyInputContainer: {
        backgroundColor: '#f0f0f0',
        borderRadius: 10,
        paddingHorizontal: 15,
        paddingVertical: 12,
        borderWidth: 1,
        borderColor: '#ddd',
        marginBottom: 15,
    },
    readonlyInput: {
        fontSize: 16,
        color: '#666',
    },
    inputError: {
        borderColor: 'red',
    },
    errorText: {
        color: 'red',
        fontSize: 14,
        marginTop: -10,
        marginBottom: 15,
        marginLeft: 5,
    },
    saveButton: {
        backgroundColor: '#9A563A',
        borderRadius: 10,
        paddingVertical: 15,
        alignItems: 'center',
        marginTop: 10,
    },
    saveButtonText: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
    },
});