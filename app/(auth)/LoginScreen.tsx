import {
    View,
    Text,
    Dimensions,
    SafeAreaView,
    TextInput,
    TouchableOpacity,
    Keyboard,
    TouchableWithoutFeedback,
    Platform,
    KeyboardAvoidingView,
    ScrollView,
    Alert,
    ActivityIndicator
} from 'react-native';
import React, { useState } from 'react';
import { useRouter } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Feather, FontAwesome } from "@expo/vector-icons";
import TopRightImage from "@/app/components/TopRightImage";
import Logo from "@/app/components/Logo";
import BottomLeftImage from "@/app/components/BottomLeftImage";
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// You should create this file to store your API URLs
import { API_BASE_URL } from '@/config/api';

export default function Login() {
    const router = useRouter();
    const { width, height } = Dimensions.get("window");

    // Form state
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    // UI state
    const [emailFocus, setEmailFocus] = useState(false);
    const [passwordFocus, setPasswordFocus] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [errors, setErrors] = useState({ email: '', password: '' });

    // Handle login
    const handleLogin = async () => {
        // Reset errors
        setErrors({ email: '', password: '' });

        // Basic validation
        let hasError = false;
        const newErrors = { email: '', password: '' };

        if (!email.trim()) {
            newErrors.email = 'Email is required';
            hasError = true;
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            newErrors.email = 'Invalid email format';
            hasError = true;
        }

        if (!password) {
            newErrors.password = 'Password is required';
            hasError = true;
        }

        if (hasError) {
            setErrors(newErrors);
            return;
        }

        // Perform login
        setIsLoading(true);
        try {
            console.log(`${API_BASE_URL}`);
            const response = await axios.post(`${API_BASE_URL}/api/login`, {
                email,
                password
            });

            // Check if email verification is required
            if (response.data.requires_verification) {
                // Store email for verification screen
                await AsyncStorage.setItem('user_email', email);

                // Show alert about verification
                Alert.alert(
                    'Verification Required',
                    'Please verify your email to continue. A new verification code has been sent to your email.',
                    [
                        {
                            text: 'OK',
                            onPress: () => {
                                // Navigate to verification screen
                                router.push('/VerifyScreen');
                            }
                        }
                    ]
                );
                return;
            }

            // Normal login flow
            if (response.data.access_token) {
                // Store token
                await AsyncStorage.setItem('access_token', response.data.access_token);

                // Store user data if needed
                if (response.data.user) {
                    await AsyncStorage.setItem('user', JSON.stringify(response.data.user));
                }

                // Set session expiration (90 days from now)
                const expirationDate = new Date();
                expirationDate.setDate(expirationDate.getDate() + 90);
                await AsyncStorage.setItem('session_expiry', expirationDate.toISOString());

                // Navigate to home or dashboard
                router.replace("/(tabs)");
            } else {
                Alert.alert('Error', 'Login failed. Please try again.');
            }
        } catch (error) {
            if (axios.isAxiosError(error)) {
                if (error.response?.status === 401) {
                    Alert.alert('Error', 'Invalid email or password');
                } else if (error.response?.status === 422) {
                    if (error.response?.data?.errors) {
                        const validationErrors = error.response.data.errors;
                        const newErrors = { email: '', password: '' };

                        if (validationErrors.email) {
                            newErrors.email = validationErrors.email[0];
                        }
                        if (validationErrors.password) {
                            newErrors.password = validationErrors.password[0];
                        }

                        setErrors(newErrors);
                    } else {
                        Alert.alert('Error', 'Validation failed. Please check your input.');
                    }
                } else {
                    Alert.alert('Error', error.response?.data?.message || 'Login failed. Please try again.');
                }
            } else {
                Alert.alert('Error', 'An unexpected error occurred. Please try again.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <TouchableWithoutFeedback
            onPress={Keyboard.dismiss}
            accessible={false}
        >
            <View className='flex-1 px-6 pt-10 bg-[#FAFAFA]'>
                {/* Top Right SVG */}
                <TopRightImage />

                <SafeAreaProvider>
                    <SafeAreaView className='flex-1 justify-center px-6 pt-10'>
                        <KeyboardAvoidingView
                            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                            className='flex-1'
                            keyboardVerticalOffset={Platform.OS === 'ios' ? 40 : 0}
                        >
                            <ScrollView
                                contentContainerStyle={{ flexGrow: 1 }}
                                keyboardShouldPersistTaps="handled"
                                showsVerticalScrollIndicator={false}
                                showsHorizontalScrollIndicator={false}
                            >
                                <View className='flex-1 justify-center'>
                                    {/* Logo */}
                                    <Logo />
                                    {/* Header text */}
                                    <Text className='text-2xl font-bold text-black mt-[-10px]'>Login Account</Text>
                                    <Text className='text-gray-500 mb-6'>Please login into your account</Text>

                                    {/* Email Input */}
                                    <View
                                        className={`flex-row items-center bg-[#FFFFFF] mb-4 rounded-[14px] p-4 py-5 border ${
                                            emailFocus ? 'border-primary' : errors.email ? 'border-red-500' : 'border-[#DFDFDF]'
                                        }`}>
                                        <FontAwesome
                                            name="envelope"
                                            size={20}
                                            color={emailFocus ? '#9A563A' : errors.email ? 'red' : '#DFDFDF'}
                                            className='mr-3'
                                        />
                                        <TextInput
                                            placeholder="Email"
                                            keyboardType="email-address"
                                            className='flex-1 text-base text-black mb-0.5'
                                            onFocus={() => setEmailFocus(true)}
                                            onBlur={() => setEmailFocus(false)}
                                            placeholderTextColor="gray"
                                            value={email}
                                            onChangeText={setEmail}
                                            autoCapitalize="none"
                                        />
                                    </View>
                                    {errors.email ? (
                                        <Text className="text-red-500 text-sm mb-2 ml-2">{errors.email}</Text>
                                    ) : null}

                                    {/* Password Input */}
                                    <View
                                        className={`flex-row items-center bg-[#FFFFFF] mb-4 rounded-[14px] p-4 py-5 border ${
                                            passwordFocus ? 'border-primary' : errors.password ? 'border-red-500' : 'border-[#DFDFDF]'
                                        }`}>
                                        <FontAwesome
                                            name="key"
                                            size={20}
                                            color={passwordFocus ? '#9A563A' : errors.password ? 'red' : '#DFDFDF'}
                                            className='mr-3'
                                        />
                                        <TextInput
                                            placeholder="Password"
                                            secureTextEntry={!showPassword}
                                            className='flex-1 text-base text-black mb-0.5'
                                            onFocus={() => setPasswordFocus(true)}
                                            onBlur={() => setPasswordFocus(false)}
                                            placeholderTextColor="gray"
                                            value={password}
                                            onChangeText={setPassword}
                                        />
                                        <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                                            <Feather
                                                name={showPassword ? "eye" : "eye-off"}
                                                size={20}
                                                color={showPassword ? '#9A563A' : 'gray'}
                                            />
                                        </TouchableOpacity>
                                    </View>
                                    {errors.password ? (
                                        <Text className="text-red-500 text-sm mb-2 ml-2">{errors.password}</Text>
                                    ) : null}

                                    {/* Forgot Password */}
                                    <TouchableOpacity onPress={() => router.push('/ForgotPasswordScreen')}>
                                        <Text className='text-right mb-6 py-1 color-primary'>Forgot Password?</Text>
                                    </TouchableOpacity>

                                    {/* Login Button */}
                                    <TouchableOpacity
                                        className='bg-primary py-5 items-center rounded-[14px]'
                                        onPress={handleLogin}
                                        disabled={isLoading}
                                    >
                                        {isLoading ? (
                                            <ActivityIndicator color="white" />
                                        ) : (
                                            <Text className='text-white text-lg font-semibold'>Login Account</Text>
                                        )}
                                    </TouchableOpacity>

                                    {/* Register Link */}
                                    <View className='flex-row justify-center items-center mt-6'>
                                        <Text className='text-gray-400'>Don't have an account?</Text>
                                        <TouchableOpacity onPress={() => router.push('/RegisterScreen')}>
                                            <Text className='text-brown-700 font-semibold color-primary ml-1'>Create
                                                Account</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </ScrollView>
                        </KeyboardAvoidingView>
                    </SafeAreaView>
                </SafeAreaProvider>

                {/* Bottom Left SVG */}
                <BottomLeftImage />
            </View>
        </TouchableWithoutFeedback>
    );
}