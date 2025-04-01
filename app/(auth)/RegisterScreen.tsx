import {
    View,
    Text,
    Dimensions,
    SafeAreaView,
    TextInput,
    TouchableOpacity,
    Keyboard,
    TouchableWithoutFeedback,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Alert,
    ActivityIndicator
} from 'react-native';
import React, { useState } from 'react';
import { useRouter } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Feather, FontAwesome } from "@expo/vector-icons";
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import TopRightImage from "@/app/components/TopRightImage";
import Logo from "@/app/components/Logo";
import BottomLeftImage from "@/app/components/BottomLeftImage";
import { API_BASE_URL } from '@/config/api'; // Create this config file for environment-specific URLs

// Define types for form data and fields
type FormField = 'name' | 'email' | 'password' | 'confirmPassword';
type FormData = {
    name: string;
    email: string;
    password: string;
    confirmPassword: string;
};
type FocusStates = {
    name: boolean;
    email: boolean;
    password: boolean;
    confirmPassword: boolean;
};
type PasswordVisibility = {
    password: boolean;
    confirmPassword: boolean;
};
type FormErrors = {
    [key in FormField]?: string;
};

// Custom hook for form management
const useRegistrationForm = () => {
    const [formData, setFormData] = useState<FormData>({
        name: '',
        email: '',
        password: '',
        confirmPassword: ''
    });
    const [focusStates, setFocusStates] = useState<FocusStates>({
        name: false,
        email: false,
        password: false,
        confirmPassword: false
    });
    const [passwordVisibility, setPasswordVisibility] = useState<PasswordVisibility>({
        password: false,
        confirmPassword: false
    });
    const [errors, setErrors] = useState<FormErrors>({});
    const [isLoading, setIsLoading] = useState(false);

    const updateFormData = (field: FormField, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        // Clear error when typing
        if (errors[field]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[field];
                return newErrors;
            });
        }
    };

    const updateFocus = (field: FormField, isFocused: boolean) => {
        setFocusStates(prev => ({ ...prev, [field]: isFocused }));
    };

    const togglePasswordVisibility = (field: 'password' | 'confirmPassword') => {
        setPasswordVisibility(prev => ({ ...prev, [field]: !prev[field] }));
    };

    const validateForm = (): boolean => {
        const newErrors: FormErrors = {};
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!formData.name.trim()) newErrors.name = 'Name is required';
        if (!formData.email.trim()) newErrors.email = 'Email is required';
        else if (!emailRegex.test(formData.email)) newErrors.email = 'Invalid email format';
        if (!formData.password) newErrors.password = 'Password is required';
        else if (formData.password.length < 8) newErrors.password = 'Password must be at least 8 characters';
        if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    return {
        formData,
        focusStates,
        passwordVisibility,
        errors,
        isLoading,
        setIsLoading,
        updateFormData,
        updateFocus,
        togglePasswordVisibility,
        validateForm
    };
};

// Define types for API
type UserData = {
    name: string;
    email: string;
    password: string;
    password_confirmation: string;
};

// API service
const apiService = {
    register: async (userData: UserData) => {
        try {
            return await axios.post(`${API_BASE_URL}/register`, userData);
        } catch (error) {
            throw error;
        }
    }
};

// Error handling utility
const handleApiError = (error: unknown): string => {
    if (axios.isAxiosError(error)) {
        const status = error.response?.status;

        switch (status) {
            case 422:
                // Validation errors
                if (error.response?.data?.errors) {
                    const errorMessages = Object.values(error.response.data.errors as Record<string, string[]>).flat().join('\n');
                    return errorMessages;
                }
                return 'Validation failed. Please check your input.';
            case 401:
                return 'Invalid credentials';
            case 429:
                return 'Too many attempts. Please try again later.';
            case 500:
                return 'Server error. Please try again later.';
            default:
                return error.response?.data?.message || 'Registration failed. Please try again.';
        }
    } else if (error instanceof Error) {
        return error.message;
    } else {
        return 'An unexpected error occurred.';
    }
};

const RegisterScreen = () => {
    const router = useRouter();
    const {
        formData,
        focusStates,
        passwordVisibility,
        errors,
        isLoading,
        setIsLoading,
        updateFormData,
        updateFocus,
        togglePasswordVisibility,
        validateForm
    } = useRegistrationForm();

    const handleRegister = async () => {
        if (!validateForm()) return;

        const userData = {
            name: formData.name,
            email: formData.email,
            password: formData.password,
            password_confirmation: formData.confirmPassword,
        };

        setIsLoading(true);
        try {
            const response = await apiService.register(userData);
            console.log('Registration successful:', response.data);

            if (response.data.access_token) {
                await AsyncStorage.setItem('access_token', response.data.access_token);
            }

            Alert.alert(
                'Success',
                'Registration successful!',
                [{ text: 'OK', onPress: () => router.push('/login') }]
            );
        } catch (error) {
            const errorMessage = handleApiError(error);
            Alert.alert('Error', errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <TouchableWithoutFeedback
            onPress={Keyboard.dismiss}
            accessible={false}>

            <View className='flex-1 px-6 pt-10 bg-[#FAFAFA]'>
                {/* Top Right SVG */}
                <TopRightImage/>

                <SafeAreaProvider>
                    <SafeAreaView className='flex-1 justify-center px-6 pt-10'>
                        <KeyboardAvoidingView
                            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                            className='flex-1'
                            keyboardVerticalOffset={Platform.OS === 'ios' ? 40 : 0}
                        >
                            <ScrollView
                                contentContainerStyle={{flexGrow: 1}}
                                keyboardShouldPersistTaps="handled"
                                showsVerticalScrollIndicator={false}
                                showsHorizontalScrollIndicator={false}
                            >
                                <View className='flex-1 justify-center'>
                                    {/* Logo */}
                                    <Logo/>
                                    {/* Header text */}
                                    <Text className='text-2xl font-bold text-black mt-[-10px]'>Registration Account</Text>
                                    <Text className='text-gray-500 mb-6'>Let's create your account first</Text>

                                    {/* Name Input */}
                                    <View
                                        className={`flex-row items-center bg-[#FFFFFF] mb-4 rounded-[14px] p-4 py-5 border ${
                                            focusStates.name ? 'border-primary' : errors.name ? 'border-red-500' : 'border-[#DFDFDF]'
                                        }`}>
                                        <FontAwesome
                                            name="user"
                                            size={20}
                                            color={focusStates.name ? '#9A563A' : errors.name ? 'red' : '#DFDFDF'}
                                            className='mr-3'
                                        />
                                        <TextInput
                                            placeholder="Full Name"
                                            keyboardType="default"
                                            className='flex-1 text-base text-black mb-0.5'
                                            onFocus={() => updateFocus('name', true)}
                                            onBlur={() => updateFocus('name', false)}
                                            placeholderTextColor="gray"
                                            value={formData.name}
                                            onChangeText={(text) => updateFormData('name', text)}
                                        />
                                    </View>
                                    {errors.name && <Text className="text-red-500 text-sm mb-2 ml-2">{errors.name}</Text>}

                                    {/* Email Input */}
                                    <View
                                        className={`flex-row items-center bg-[#FFFFFF] mb-4 rounded-[14px] p-4 py-5 border ${
                                            focusStates.email ? 'border-primary' : errors.email ? 'border-red-500' : 'border-[#DFDFDF]'
                                        }`}>
                                        <FontAwesome
                                            name="envelope"
                                            size={20}
                                            color={focusStates.email ? '#9A563A' : errors.email ? 'red' : '#DFDFDF'}
                                            className='mr-3'
                                        />
                                        <TextInput
                                            placeholder="Email"
                                            keyboardType="email-address"
                                            className='flex-1 text-base text-black mb-0.5'
                                            onFocus={() => updateFocus('email', true)}
                                            onBlur={() => updateFocus('email', false)}
                                            placeholderTextColor="gray"
                                            value={formData.email}
                                            onChangeText={(text) => updateFormData('email', text)}
                                            autoCapitalize="none"
                                        />
                                    </View>
                                    {errors.email && <Text className="text-red-500 text-sm mb-2 ml-2">{errors.email}</Text>}

                                    {/* Password Input */}
                                    <View
                                        className={`flex-row items-center bg-[#FFFFFF] mb-4 rounded-[14px] p-4 py-5 border ${
                                            focusStates.password ? 'border-primary' : errors.password ? 'border-red-500' : 'border-[#DFDFDF]'
                                        }`}>
                                        <FontAwesome
                                            name="key"
                                            size={20}
                                            color={focusStates.password ? '#9A563A' : errors.password ? 'red' : '#DFDFDF'}
                                            className='mr-3'
                                        />
                                        <TextInput
                                            placeholder="Password"
                                            secureTextEntry={!passwordVisibility.password}
                                            className='flex-1 text-base text-black mb-0.5'
                                            onFocus={() => updateFocus('password', true)}
                                            onBlur={() => updateFocus('password', false)}
                                            placeholderTextColor="gray"
                                            value={formData.password}
                                            onChangeText={(text) => updateFormData('password', text)}
                                        />
                                        <TouchableOpacity onPress={() => togglePasswordVisibility('password')}>
                                            <Feather
                                                name={passwordVisibility.password ? 'eye' : 'eye-off'}
                                                size={20}
                                                color={passwordVisibility.password ? '#9A563A' : 'gray'}
                                            />
                                        </TouchableOpacity>
                                    </View>
                                    {errors.password && <Text className="text-red-500 text-sm mb-2 ml-2">{errors.password}</Text>}

                                    {/* Confirm Password Input */}
                                    <View
                                        className={`flex-row items-center bg-[#FFFFFF] mb-4 rounded-[14px] p-4 py-5 border ${
                                            focusStates.confirmPassword ? 'border-primary' : errors.confirmPassword ? 'border-red-500' : 'border-[#DFDFDF]'
                                        }`}>
                                        <FontAwesome
                                            name="key"
                                            size={20}
                                            color={focusStates.confirmPassword ? '#9A563A' : errors.confirmPassword ? 'red' : '#DFDFDF'}
                                            className='mr-3'
                                        />
                                        <TextInput
                                            placeholder="Confirm password"
                                            secureTextEntry={!passwordVisibility.confirmPassword}
                                            className='flex-1 text-base text-black mb-0.5'
                                            onFocus={() => updateFocus('confirmPassword', true)}
                                            onBlur={() => updateFocus('confirmPassword', false)}
                                            placeholderTextColor="gray"
                                            value={formData.confirmPassword}
                                            onChangeText={(text) => updateFormData('confirmPassword', text)}
                                        />
                                        <TouchableOpacity onPress={() => togglePasswordVisibility('confirmPassword')}>
                                            <Feather
                                                name={passwordVisibility.confirmPassword ? 'eye' : 'eye-off'}
                                                size={20}
                                                color={passwordVisibility.confirmPassword ? '#9A563A' : 'gray'}
                                            />
                                        </TouchableOpacity>
                                    </View>
                                    {errors.confirmPassword && <Text className="text-red-500 text-sm mb-2 ml-2">{errors.confirmPassword}</Text>}

                                    {/* Register Button */}
                                    <TouchableOpacity
                                        className='bg-primary py-5 items-center rounded-[14px]'
                                        onPress={handleRegister}
                                        disabled={isLoading}>
                                        {isLoading ? (
                                            <ActivityIndicator color="white" />
                                        ) : (
                                            <Text className='text-white text-lg font-semibold'>Create Account</Text>
                                        )}
                                    </TouchableOpacity>

                                    {/* Login Link */}
                                    <View className='flex-row justify-center items-center mt-6'>
                                        <Text className='text-gray-400'>Already have an account?</Text>
                                        <TouchableOpacity onPress={() => router.push('/login')}>
                                            <Text className='text-brown-700 font-semibold color-primary ml-1'>Login Account</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </ScrollView>
                        </KeyboardAvoidingView>
                    </SafeAreaView>
                </SafeAreaProvider>

                {/* Bottom Left SVG */}
                <BottomLeftImage/>
            </View>
        </TouchableWithoutFeedback>
    );
};

export default RegisterScreen;