import {
    View,
    Text,
    Dimensions,
    SafeAreaView,
    TextInput,
    TouchableOpacity,
    Image,
    Keyboard,
    TouchableWithoutFeedback,
    Platform,
    KeyboardAvoidingView,
    ScrollView,
    Alert,
    ActivityIndicator
} from 'react-native';
import React, {useEffect, useRef, useState} from 'react';
import {useRouter} from "expo-router";
import {SafeAreaProvider} from "react-native-safe-area-context";
import {Feather, FontAwesome} from "@expo/vector-icons";
import TopRightImage from "@/app/components/TopRightImage";
import BottomLeftImage from "@/app/components/BottomLeftImage";
import Logo from "@/app/components/Logo";
import {useNavigation} from '@react-navigation/native';
import OTPInputView from "@twotalltotems/react-native-otp-input/dist";
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {API_BASE_URL} from '@/config/api';

// Import the OTPInputView type from the library
type OTPRef = OTPInputView;

export default function Verify() {
    const router = useRouter();
    const navigation = useNavigation();

    // State variables
    const [email, setEmail] = useState('');
    const [code, setCode] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [resendLoading, setResendLoading] = useState(false);
    const [countdown, setCountdown] = useState(0);

    // Create ref with correct type
    const otpInputRef = useRef<OTPRef>(null);
    const [showOTP, setShowOTP] = useState(false);

    // Load email from storage
    useEffect(() => {
        const getEmail = async () => {
            try {
                const storedEmail = await AsyncStorage.getItem('user_email');
                if (storedEmail) {
                    setEmail(storedEmail);
                } else {
                    // If no email found, redirect to login
                    Alert.alert(
                        'Error',
                        'No email found for verification. Please try logging in again.',
                        [{ text: 'OK', onPress: () => router.replace('/login') }]
                    );
                }
            } catch (error) {
                console.error('Error fetching email:', error);
                Alert.alert('Error', 'Failed to retrieve account information');
            }
        };

        getEmail();

        // First, delay rendering the OTP component to ensure focus works
        setTimeout(() => {
            setShowOTP(true);
        }, 100);
    }, []);

    // Focus on OTP input
    useEffect(() => {
        setTimeout(() => {
            // Using any type as a workaround for TypeScript error
            // This won't affect functionality
            const input = otpInputRef.current as any;
            if (input && typeof input.focusField === 'function') {
                input.focusField(0);
            }
        }, 500);
    }, [showOTP]);

    // Countdown timer for resend function
    useEffect(() => {
        if (countdown > 0) {
            const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [countdown]);

    // Handle OTP verification
    const handleVerify = async () => {
        if (!code || code.length !== 6) {
            Alert.alert('Error', 'Please enter the 6-digit verification code');
            return;
        }

        if (!email) {
            Alert.alert('Error', 'Email not found. Please try logging in again.');
            return;
        }

        setIsLoading(true);

        try {
            const response = await axios.post(`${API_BASE_URL}/api/verify-email`, {
                email,
                code
            });

            console.log('Verification response:', response.data);

            // Store token if provided
            if (response.data.access_token) {
                await AsyncStorage.setItem('access_token', response.data.access_token);

                // Store user data if needed
                if (response.data.user) {
                    await AsyncStorage.setItem('user', JSON.stringify(response.data.user));
                }
            }

            // Show success message
            Alert.alert(
                'Success',
                'Email verified successfully!',
                [
                    {
                        text: 'Continue',
                        onPress: () => {
                            // Navigate to dashboard
                            router.replace('/(tabs)');
                        }
                    }
                ]
            );
        } catch (error) {
            console.error('Verification error:', error);

            if (axios.isAxiosError(error)) {
                if (error.response?.data?.message) {
                    Alert.alert('Error', error.response.data.message);
                } else {
                    Alert.alert('Error', 'Verification failed. Please check your code and try again.');
                }
            } else {
                Alert.alert('Error', 'An unexpected error occurred.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    // Resend verification code
    const handleResendCode = async () => {
        if (!email) {
            Alert.alert('Error', 'Email not found. Please try logging in again.');
            return;
        }

        setResendLoading(true);

        try {
            const response = await axios.post(`${API_BASE_URL}/api/resend-verification`, {
                email
            });

            console.log('Resend response:', response.data);
            Alert.alert('Success', 'A new verification code has been sent to your email');

            // Reset OTP input
            // Using any as a safe workaround
            const input = otpInputRef.current as any;
            if (input && typeof input.clearAllFields === 'function') {
                input.clearAllFields();
            }
            setCode('');

            // Start countdown for 60 seconds
            setCountdown(60);
        } catch (error) {
            console.error('Resend error:', error);

            if (axios.isAxiosError(error)) {
                if (error.response?.data?.message) {
                    Alert.alert('Error', error.response.data.message);
                } else {
                    Alert.alert('Error', 'Failed to resend verification code. Please try again.');
                }
            } else {
                Alert.alert('Error', 'An unexpected error occurred.');
            }
        } finally {
            setResendLoading(false);
        }
    };

    return (
        <TouchableWithoutFeedback
            onPress={Keyboard.dismiss}
            accessible={false}
        >
            <View className='flex-1 px-6 pt-10 bg-[#FAFAFA]'>
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
                                <View className='flex-1 justify-center items-center'>
                                    <View
                                        className='w-[52] rounded-[12px] h-[52] mb-10 bg-primary justify-center items-center'>
                                        <FontAwesome
                                            name="envelope"
                                            size={28}
                                            color={'#ffffff'}
                                        />
                                    </View>

                                    <Text className='text-2xl font-bold text-center text-black mt-[-10px]'>Verify
                                        Your Email</Text>
                                    <Text className='text-gray-500 text-center mt-3 mb-6'>To verify your account,
                                        enter the 6 digit OTP code that we sent to your email.</Text>

                                    {/* Display email being verified */}
                                    {email ? (
                                        <Text className='text-primary text-center font-semibold mb-6'>{email}</Text>
                                    ) : null}

                                    {/* OTP Input */}
                                    {showOTP && (
                                        <OTPInputView
                                            ref={otpInputRef}
                                            pinCount={6}
                                            autoFocusOnLoad={false}
                                            style={{width: "100%", height: 80}}
                                            codeInputFieldStyle={{
                                                width: 55,
                                                height: 55,
                                                borderWidth: 1,
                                                borderColor: "#E5E7EB",
                                                borderRadius: 10,
                                                fontSize: 20,
                                                textAlign: "center",
                                                color: "#1F2937",
                                            }}
                                            codeInputHighlightStyle={{
                                                borderColor: "#9A563A",
                                            }}
                                            onCodeFilled={(code) => {
                                                setCode(code);
                                            }}
                                        />
                                    )}

                                    {/* Resend code button */}
                                    <View className="w-full items-center my-4">
                                        {countdown > 0 ? (
                                            <Text className="text-gray-500">Resend code in {countdown}s</Text>
                                        ) : (
                                            <TouchableOpacity
                                                onPress={handleResendCode}
                                                disabled={resendLoading}
                                                className="py-2"
                                            >
                                                {resendLoading ? (
                                                    <ActivityIndicator size="small" color="#9A563A" />
                                                ) : (
                                                    <Text className="text-primary font-medium">Resend Code</Text>
                                                )}
                                            </TouchableOpacity>
                                        )}
                                    </View>

                                    <View className="absolute bottom-6 left-0 right-0 px-4 z-20">
                                        {/* Verify Button */}
                                        <TouchableOpacity
                                            className="bg-primary py-4 items-center rounded-[14px]"
                                            onPress={handleVerify}
                                            disabled={isLoading || !code || code.length !== 6}
                                        >
                                            {isLoading ? (
                                                <ActivityIndicator color="white" />
                                            ) : (
                                                <Text className="text-white text-lg font-semibold">Verify</Text>
                                            )}
                                        </TouchableOpacity>

                                        {/* Back Button */}
                                        <TouchableOpacity onPress={() => router.push('/login')}>
                                            <Text className='text-black text-center mt-4 mb-3'>Back to Login</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </ScrollView>
                        </KeyboardAvoidingView>
                    </SafeAreaView>
                </SafeAreaProvider>

                <BottomLeftImage/>
            </View>
        </TouchableWithoutFeedback>
    );
}