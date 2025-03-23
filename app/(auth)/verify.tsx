import {
    View,
    Text,
    Dimensions,
    SafeAreaView,
    TextInput,
    TouchableOpacity,
    Image,
    Keyboard,
    TouchableWithoutFeedback, Platform, KeyboardAvoidingView, ScrollView
} from 'react-native';
import React, {useEffect, useRef, useState} from 'react'
import {images} from "@/constants/Image";
import {useRouter} from "expo-router";
import {SafeAreaProvider} from "react-native-safe-area-context";
import {Feather, FontAwesome} from "@expo/vector-icons";
import logo from '@/assets/images/logo.png';
import TopRightImage from "@/app/components/TopRightImage";
import BottomLeftImage from "@/app/components/BottomLeftImage";
import Logo from "@/app/components/Logo"; // Import the PNG file
import {useNavigation} from '@react-navigation/native';
import OTPInputView from "@twotalltotems/react-native-otp-input/dist";

export default function verify() {
    const router = useRouter();
    const [emailFocus, setEmailFocus] = useState(false);
    const navigation = useNavigation();
    const otpInputRef = useRef<OTPInputView | null>(null); // Ensure correct ref type
    const [showOTP, setShowOTP] = useState(false); // Control rendering

    useEffect(() => {
        // First, delay rendering the OTP component to ensure focus works
        setTimeout(() => {
            setShowOTP(true);
        }, 100);
    }, [showOTP]);

    useEffect(() => {
        setTimeout(() => {
            if (otpInputRef.current) {
                otpInputRef.current.focusField?.(0); // Focus first field
            }
        }, 500);
    }, [showOTP]);


    return (
        <TouchableWithoutFeedback
            onPress={Keyboard.dismiss}
            accessible={false}
        >
            <View className='flex-1 px-6 pt-10 bg-[#FAFAFA]'>
                {/* Top Right SVG */}
                {/*<images.topRight style={styles.topRight} className='absolute top-0 right-0' width={233} height={233}/>*/}
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
                                showsVerticalScrollIndicator={false} // Hide vertical scrollbar
                                showsHorizontalScrollIndicator={false} // Hide horizontal scrollbar (optional)
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

                                    {/*text*/}
                                    <Text className='text-2xl font-bold text-center text-black  mt-[-10px]'>Verify
                                        Your Email</Text>
                                    <Text className='text-gray-500 text-center mt-3 mb-6'>To verify your account,
                                        enter the 6 digit OTP code that we sent to your email.</Text>


                                    {/* OTP Input */}
                                    {showOTP && (
                                        <OTPInputView
                                            ref={otpInputRef}
                                            pinCount={6}
                                            autoFocusOnLoad={false} // Set false to manually focus
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
                                                borderColor: "#92400E",
                                            }}
                                        />
                                    )}


                                    {/*<View*/}
                                    {/*    className={`flex-row items-center bg-[#FFFFFF] mb-4 rounded-[14px] p-4 py-5 border ${*/}
                                    {/*        emailFocus ? 'border-primary' : 'border-[#DFDFDF]'*/}
                                    {/*    }`}>*/}
                                    {/*    <FontAwesome*/}
                                    {/*        name="envelope"*/}
                                    {/*        size={20}*/}
                                    {/*        color={emailFocus ? '#9A563A' : '#DFDFDF'} // Replace #primaryColor with your actual primary color*/}
                                    {/*        className='mr-3'*/}
                                    {/*    />*/}
                                    {/*    <TextInput*/}
                                    {/*        placeholder="Email"*/}
                                    {/*        keyboardType="email-address"*/}
                                    {/*        className='flex-1 text-base text-black mb-0.5'*/}
                                    {/*        onFocus={() => setEmailFocus(true)}*/}
                                    {/*        onBlur={() => setEmailFocus(false)}*/}
                                    {/*        placeholderTextColor="gray" // Ensures placeholder is visible*/}
                                    {/*    />*/}
                                    {/*</View>*/}


                                    {/*button */}
                                    <View className="absolute bottom-6 left-0 right-0 px-4 z-20">
                                        {/* Continue Button */}
                                        <TouchableOpacity className="bg-primary py-4 items-center rounded-[14px]">
                                            <Text className="text-white text-lg font-semibold">Verify</Text>
                                        </TouchableOpacity>

                                        {/* Back Button */}
                                        <TouchableOpacity onPress={() => router.back()}>
                                            <Text className='text-black text-center mt-4  mb-3'>Back</Text>
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

}


