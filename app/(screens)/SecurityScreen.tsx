// SecurityScreen.tsx
import React, { useState } from 'react';
import {
    View,
    Text,
    SafeAreaView,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    Alert,
    ActivityIndicator
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_BASE_URL } from '@/config/api';

export default function SecurityScreen() {
    const router = useRouter();

    // Form State
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    // UI State
    const [isLoading, setIsLoading] = useState(false);
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [errors, setErrors] = useState<{[key: string]: string}>({});

    // Handle password change
    const handleChangePassword = async () => {
        try {
            // Reset errors
            setErrors({});

            // Validate inputs
            const newErrors: {[key: string]: string} = {};

            if (!currentPassword) {
                newErrors.currentPassword = 'Current password is required';
            }

            if (!newPassword) {
                newErrors.newPassword = 'New password is required';
            } else if (newPassword.length < 8) {
                newErrors.newPassword = 'Password must be at least 8 characters';
            }

            if (!confirmPassword) {
                newErrors.confirmPassword = 'Please confirm your new password';
            } else if (newPassword !== confirmPassword) {
                newErrors.confirmPassword = 'Passwords do not match';
            }

            if (Object.keys(newErrors).length > 0) {
                setErrors(newErrors);
                return;
            }

            // Start loading
            setIsLoading(true);

            // Get auth token
            const token = await AsyncStorage.getItem('access_token');

            if (!token) {
                Alert.alert('Error', 'You are not logged in');
                router.replace('./(auth)');
                return;
            }

            // Make API request
            const response = await axios.post(
                `${API_BASE_URL}/api/password/update`,
                {
                    current_password: currentPassword,
                    password: newPassword,
                    password_confirmation: confirmPassword
                },
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (response.data.success) {
                Alert.alert(
                    'Success',
                    'Your password has been updated successfully',
                    [
                        {
                            text: 'OK',
                            onPress: () => router.back()
                        }
                    ]
                );

                // Clear form
                setCurrentPassword('');
                setNewPassword('');
                setConfirmPassword('');
            } else {
                Alert.alert('Error', response.data.message || 'Failed to update password');
            }
        } catch (error: any) {
            console.error('Error updating password:', error.response?.data || error);

            if (axios.isAxiosError(error)) {
                if (error.response?.status === 422) {
                    // Validation errors
                    if (error.response.data.errors) {
                        const validationErrors: {[key: string]: string} = {};

                        Object.entries(error.response.data.errors).forEach(([key, messages]) => {
                            const fieldKey = key === 'password' ? 'newPassword' : key === 'current_password' ? 'currentPassword' : key;
                            validationErrors[fieldKey] = Array.isArray(messages) ? messages[0] : messages as string;
                        });

                        setErrors(validationErrors);
                    }
                } else if (error.response?.status === 401) {
                    // Current password is incorrect
                    setErrors({
                        currentPassword: 'Current password is incorrect'
                    });
                } else {
                    Alert.alert('Error', error.response?.data?.message || 'Failed to update password');
                }
            } else {
                Alert.alert('Error', 'An unexpected error occurred');
            }
        } finally {
            setIsLoading(false);
        }
    };

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
                        <Text style={styles.title}>Account & Security</Text>
                        <View style={styles.placeholder} />
                    </View>

                    {/* Form Container */}
                    <View style={styles.formContainer}>
                        <Text style={styles.sectionTitle}>Change Password</Text>

                        {/* Current Password */}
                        <Text style={styles.inputLabel}>Current Password</Text>
                        <View style={[
                            styles.inputContainer,
                            errors.currentPassword && styles.inputError
                        ]}>
                            <TextInput
                                style={styles.input}
                                value={currentPassword}
                                onChangeText={setCurrentPassword}
                                secureTextEntry={!showCurrentPassword}
                                placeholder="Enter your current password"
                                placeholderTextColor="#999"
                            />
                            <TouchableOpacity onPress={() => setShowCurrentPassword(!showCurrentPassword)}>
                                <Feather
                                    name={showCurrentPassword ? "eye" : "eye-off"}
                                    size={20}
                                    color="gray"
                                />
                            </TouchableOpacity>
                        </View>
                        {errors.currentPassword && (
                            <Text style={styles.errorText}>{errors.currentPassword}</Text>
                        )}

                        {/* New Password */}
                        <Text style={styles.inputLabel}>New Password</Text>
                        <View style={[
                            styles.inputContainer,
                            errors.newPassword && styles.inputError
                        ]}>
                            <TextInput
                                style={styles.input}
                                value={newPassword}
                                onChangeText={setNewPassword}
                                secureTextEntry={!showNewPassword}
                                placeholder="Enter your new password"
                                placeholderTextColor="#999"
                            />
                            <TouchableOpacity onPress={() => setShowNewPassword(!showNewPassword)}>
                                <Feather
                                    name={showNewPassword ? "eye" : "eye-off"}
                                    size={20}
                                    color="gray"
                                />
                            </TouchableOpacity>
                        </View>
                        {errors.newPassword && (
                            <Text style={styles.errorText}>{errors.newPassword}</Text>
                        )}

                        {/* Confirm New Password */}
                        <Text style={styles.inputLabel}>Confirm New Password</Text>
                        <View style={[
                            styles.inputContainer,
                            errors.confirmPassword && styles.inputError
                        ]}>
                            <TextInput
                                style={styles.input}
                                value={confirmPassword}
                                onChangeText={setConfirmPassword}
                                secureTextEntry={!showConfirmPassword}
                                placeholder="Confirm your new password"
                                placeholderTextColor="#999"
                            />
                            <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                                <Feather
                                    name={showConfirmPassword ? "eye" : "eye-off"}
                                    size={20}
                                    color="gray"
                                />
                            </TouchableOpacity>
                        </View>
                        {errors.confirmPassword && (
                            <Text style={styles.errorText}>{errors.confirmPassword}</Text>
                        )}

                        {/* Submit Button */}
                        <TouchableOpacity
                            style={styles.submitButton}
                            onPress={handleChangePassword}
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <ActivityIndicator color="white" />
                            ) : (
                                <Text style={styles.submitButtonText}>Update Password</Text>
                            )}
                        </TouchableOpacity>
                    </View>
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
    formContainer: {
        backgroundColor: 'white',
        borderRadius: 10,
        padding: 20,
        marginVertical: 10,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 20,
    },
    inputLabel: {
        fontSize: 16,
        color: '#333',
        marginBottom: 5,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'white',
        borderRadius: 10,
        paddingHorizontal: 15,
        borderWidth: 1,
        borderColor: '#ddd',
        marginBottom: 15,
    },
    input: {
        flex: 1,
        fontSize: 16,
        paddingVertical: 12,
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
    submitButton: {
        backgroundColor: '#9A563A',
        borderRadius: 10,
        paddingVertical: 15,
        alignItems: 'center',
        marginTop: 10,
    },
    submitButtonText: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
    },
});