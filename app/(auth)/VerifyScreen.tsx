import {
    View,
    Text,
    TouchableOpacity,
    Keyboard,
    TouchableWithoutFeedback,
    Platform,
    KeyboardAvoidingView,
    ScrollView,
    Alert,
    ActivityIndicator,
    TextInput
} from 'react-native';
import React, {useEffect, useRef, useState} from 'react';
import {useRouter} from "expo-router";
import {SafeAreaProvider} from "react-native-safe-area-context";
import {FontAwesome} from "@expo/vector-icons";
import TopRightImage from "@/app/components/TopRightImage";
import BottomLeftImage from "@/app/components/BottomLeftImage";
import {useNavigation} from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {API_BASE_URL} from '@/config/api';
import axios from 'axios';
import { SafeAreaView } from 'react-native-safe-area-context';

// Interface for OTPInputRef
interface OTPInputRef {
    clearAllFields: () => void;
    focusField: (index: number) => void;
}

// Interface for OTPInput props
interface OTPInputProps {
    pinCount: number;
    onCodeFilled: (code: string) => void;
    autoFocus?: boolean;
}

// Custom OTP Input component
const OTPInput = React.forwardRef<OTPInputRef, OTPInputProps>(({
    pinCount = 6,
    onCodeFilled,
    autoFocus = false
}, ref) => {
    const [code, setCode] = useState<string[]>(Array(pinCount).fill(''));
    const inputRefs = useRef<Array<React.RefObject<TextInput>>>([]);

    // Initialize refs array
    useEffect(() => {
        inputRefs.current = Array(pinCount).fill(0).map((_, i) =>
            inputRefs.current[i] || React.createRef<TextInput>()
        );

        // Auto focus on first input if needed
        if (autoFocus && inputRefs.current[0]?.current) {
            setTimeout(() => {
                inputRefs.current[0].current?.focus();
            }, 500);
        }
    }, []);

    const handleChange = (text: string, index: number) => {
        // Update the code array
        const newCode = [...code];
        newCode[index] = text;
        setCode(newCode);

        // Callback when all digits are filled
        if (newCode.every(digit => digit !== '') && onCodeFilled) {
            onCodeFilled(newCode.join(''));
        }

        // Auto advance to next input
        if (text && index < pinCount - 1) {
            inputRefs.current[index + 1].current?.focus();
        }
    };

    const handleKeyPress = (e: any, index: number) => {
        // Handle backspace
        if (e.nativeEvent.key === 'Backspace' && !code[index] && index > 0) {
            inputRefs.current[index - 1].current?.focus();
        }
    };

    // Exposing methods similar to the original component
    React.useImperativeHandle(ref, () => ({
        clearAllFields: () => {
            setCode(Array(pinCount).fill(''));
            inputRefs.current[0].current?.focus();
        },
        focusField: (index: number) => {
            if (index >= 0 && index < pinCount) {
                inputRefs.current[index].current?.focus();
            }
        }
    }));

    return (
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginVertical: 10 }}>
            {Array(pinCount).fill(0).map((_, index) => (
                <TextInput
                    key={index}
                    ref={inputRefs.current[index]}
                    style={{
                        width: 45,
                        height: 55,
                        borderWidth: 1,
                        borderColor: code[index] ? "#9A563A" : "#E5E7EB",
                        borderRadius: 10,
                        fontSize: 20,
                        textAlign: "center",
                        color: "#1F2937",
                    }}
                    keyboardType="number-pad"
                    maxLength={1}
                    value={code[index]}
                    onChangeText={(text) => handleChange(text, index)}
                    onKeyPress={(e) => handleKeyPress(e, index)}
                    selectionColor="#9A563A"
                />
            ))}
        </View>
    );
});

export default function Verify() {
    const router = useRouter();
    const navigation = useNavigation();

    // State variables
    const [email, setEmail] = useState<string>('');
    const [code, setCode] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [resendLoading, setResendLoading] = useState<boolean>(false);
    const [countdown, setCountdown] = useState<number>(0);

    // Create ref for OTP input
    const otpInputRef = useRef<OTPInputRef>(null);
    const [showOTP, setShowOTP] = useState<boolean>(false);

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
        if (showOTP && otpInputRef.current) {
            setTimeout(() => {
                if (otpInputRef.current) {
                    otpInputRef.current.focusField(0);
                }
            }, 500);
        }
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
            if (otpInputRef.current) {
                otpInputRef.current.clearAllFields();
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
            <View style={{flex: 1, paddingHorizontal: 24, paddingTop: 40, backgroundColor: '#FAFAFA'}}>
                <TopRightImage/>
                <SafeAreaProvider>
                    <SafeAreaView style={{flex: 1, justifyContent: 'center', paddingHorizontal: 24, paddingTop: 40}}>
                        <KeyboardAvoidingView
                            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                            style={{flex: 1}}
                            keyboardVerticalOffset={Platform.OS === 'ios' ? 40 : 0}
                        >
                            <ScrollView
                                contentContainerStyle={{flexGrow: 1}}
                                keyboardShouldPersistTaps="handled"
                                showsVerticalScrollIndicator={false}
                                showsHorizontalScrollIndicator={false}
                            >
                                <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
                                    <View
                                        style={{
                                            width: 52,
                                            height: 52,
                                            borderRadius: 12,
                                            marginBottom: 40,
                                            backgroundColor: '#9A563A',
                                            justifyContent: 'center',
                                            alignItems: 'center'
                                        }}>
                                        <FontAwesome
                                            name="envelope"
                                            size={28}
                                            color={'#ffffff'}
                                        />
                                    </View>

                                    <Text style={{fontSize: 24, fontWeight: 'bold', textAlign: 'center', color: 'black', marginTop: -10}}>
                                        Verify Your Email
                                    </Text>
                                    <Text style={{color: '#6B7280', textAlign: 'center', marginTop: 12, marginBottom: 24}}>
                                        To verify your account, enter the 6 digit OTP code that we sent to your email.
                                    </Text>

                                    {/* Display email being verified */}
                                    {email ? (
                                        <Text style={{color: '#9A563A', textAlign: 'center', fontWeight: '600', marginBottom: 24}}>
                                            {email}
                                        </Text>
                                    ) : null}

                                    {/* Custom OTP Input */}
                                    {showOTP && (
                                        <OTPInput
                                            ref={otpInputRef}
                                            pinCount={6}
                                            autoFocus={true}
                                            onCodeFilled={(newCode) => {
                                                setCode(newCode);
                                            }}
                                        />
                                    )}

                                    {/* Resend code button */}
                                    <View style={{width: '100%', alignItems: 'center', marginVertical: 16}}>
                                        {countdown > 0 ? (
                                            <Text style={{color: '#6B7280'}}>
                                                Resend code in {countdown}s
                                            </Text>
                                        ) : (
                                            <TouchableOpacity
                                                onPress={handleResendCode}
                                                disabled={resendLoading}
                                                style={{paddingVertical: 8}}
                                            >
                                                {resendLoading ? (
                                                    <ActivityIndicator size="small" color="#9A563A" />
                                                ) : (
                                                    <Text style={{color: '#9A563A', fontWeight: '500'}}>
                                                        Resend Code
                                                    </Text>
                                                )}
                                            </TouchableOpacity>
                                        )}
                                    </View>

                                    <View style={{position: 'absolute', bottom: 24, left: 0, right: 0, paddingHorizontal: 16, zIndex: 20}}>
                                        {/* Verify Button */}
                                        <TouchableOpacity
                                            style={{
                                                backgroundColor: '#9A563A',
                                                paddingVertical: 16,
                                                alignItems: 'center',
                                                borderRadius: 14,
                                                opacity: isLoading || !code || code.length !== 6 ? 0.7 : 1
                                            }}
                                            onPress={handleVerify}
                                            disabled={isLoading || !code || code.length !== 6}
                                        >
                                            {isLoading ? (
                                                <ActivityIndicator color="white" />
                                            ) : (
                                                <Text style={{color: 'white', fontSize: 18, fontWeight: '600'}}>
                                                    Verify
                                                </Text>
                                            )}
                                        </TouchableOpacity>

                                        {/* Back Button */}
                                        <TouchableOpacity onPress={() => router.back()}>
                                            <Text style={{color: 'black', textAlign: 'center', marginTop: 16, marginBottom: 12}}>
                                                Back to Login
                                            </Text>
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