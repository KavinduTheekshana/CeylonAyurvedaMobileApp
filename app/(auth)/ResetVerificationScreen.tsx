import {
    View,
    Text,
    SafeAreaView,
    TouchableOpacity,
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
import {FontAwesome} from "@expo/vector-icons";
import TopRightImage from "@/app/components/TopRightImage";
import BottomLeftImage from "@/app/components/BottomLeftImage";
import OTPInputView from "@twotalltotems/react-native-otp-input/dist";
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {API_BASE_URL} from '@/config/api';

// Import the OTPInputView type from the library
type OTPRef = OTPInputView;

export default function ResetVerification() {
    const router = useRouter();

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
                const storedEmail = await AsyncStorage.getItem('reset_email');
                if (storedEmail) {
                    setEmail(storedEmail);
                } else {
                    // If no email found, redirect to forgot password
                    Alert.alert(
                        'Error',
                        'No email found for verification. Please try again.',
                        [{ text: 'OK', onPress: () => router.replace('/forgot') }]
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
            Alert.alert('Error', 'Email not found. Please try again.');
            return;
        }

        setIsLoading(true);

        try {
            const response = await axios.post(`${API_BASE_URL}/api/verify-reset-code`, {
                email,
                code
            });

            console.log('Verification response:', response.data);

            // Store reset token for the next step
            if (response.data.reset_token) {
                await AsyncStorage.setItem('reset_token', response.data.reset_token);

                // Navigate to new password screen
                router.push('/NewPasswordScreen');
            } else {
                throw new Error('Reset token not received');
            }
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
            Alert.alert('Error', 'Email not found. Please try again.');
            return;
        }

        setResendLoading(true);

        try {
            const response = await axios.post(`${API_BASE_URL}/api/resend-reset-code`, {
                email
            });

            console.log('Resend response:', response.data);
            Alert.alert('Success', 'A new verification code has been sent to your email');

            // Reset OTP input
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
                                            name="lock"
                                            size={28}
                                            color={'#ffffff'}
                                        />
                                    </View>

                                    <Text className='text-2xl font-bold text-center text-black mt-[-10px]'>
                                        Verify Reset Code
                                    </Text>
                                    <Text className='text-gray-500 text-center mt-3 mb-6'>
                                        Enter the 6 digit verification code that we sent to your email.
                                    </Text>

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
                                        <TouchableOpacity onPress={() => router.push('/forgot')}>
                                            <Text className='text-black text-center mt-4 mb-3'>Back</Text>
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