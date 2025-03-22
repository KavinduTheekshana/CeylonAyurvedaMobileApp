import {
    View,
    Text,
    StyleSheet,
    Dimensions,
    SafeAreaView,
    TextInput,
    TouchableOpacity,
    Image,
    Keyboard,
    TouchableWithoutFeedback, Platform, KeyboardAvoidingView, ScrollView
} from 'react-native';
import React, {useEffect, useState} from 'react'
import {images} from "@/constants/Image";
import {useRouter} from "expo-router";
import {SafeAreaProvider} from "react-native-safe-area-context";
import {Feather, FontAwesome} from "@expo/vector-icons";
import logo from '@/assets/images/logo.png';
import TopRightImage from "@/app/components/TopRightImage";
import Logo from "@/app/components/Logo";
import BottomLeftImage from "@/app/components/BottomLeftImage"; // Import the PNG file

export default function splash() {
    const router = useRouter();
    const {width, height} = Dimensions.get("window");
    const [emailFocus, setEmailFocus] = useState(false);
    const [passwordFocus, setPasswordFocus] = useState(false);


    return (
        <TouchableWithoutFeedback
            onPress={Keyboard.dismiss}
            accessible={false}
        >
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
                                showsVerticalScrollIndicator={false} // Hide vertical scrollbar
                                showsHorizontalScrollIndicator={false} // Hide horizontal scrollbar (optional)
                            >
                                <View className='flex-1 justify-center'>
                                    {/*logo*/}
                                 <Logo/>
                                    {/*text*/}
                                    <Text className='text-2xl font-bold text-black  mt-[-10px]'>Login Account</Text>
                                    <Text className='text-gray-500 mb-6'>Please login into your account</Text>


                                    <View
                                        className={`flex-row items-center bg-[#FFFFFF] mb-4 rounded-[14px] p-4 py-5 border ${
                                            emailFocus ? 'border-primary' : 'border-[#DFDFDF]'
                                        }`}>
                                        <FontAwesome
                                            name="envelope"
                                            size={20}
                                            color={emailFocus ? '#9A563A' : '#DFDFDF'} // Replace #primaryColor with your actual primary color
                                            className='mr-3'
                                        />
                                        <TextInput
                                            placeholder="Email"
                                            keyboardType="email-address"
                                            className='flex-1 text-base text-black mb-0.5'
                                            onFocus={() => setEmailFocus(true)}
                                            onBlur={() => setEmailFocus(false)}
                                            placeholderTextColor="gray" // Ensures placeholder is visible
                                        />
                                    </View>

                                    {/* Password Input */}
                                    <View
                                        className={`flex-row items-center bg-[#FFFFFF] mb-4 rounded-[14px] p-4 py-5 border ${
                                            passwordFocus ? 'border-primary' : 'border-[#DFDFDF]'
                                        }`}>
                                        <FontAwesome
                                            name="key"
                                            size={20}
                                            color={passwordFocus ? '#9A563A' : '#DFDFDF'} // Replace #primaryColor with your actual primary color
                                            className='mr-3'
                                        />
                                        <TextInput
                                            placeholder="Password"
                                            secureTextEntry
                                            className='flex-1 text-base text-black mb-0.5'
                                            onFocus={() => setPasswordFocus(true)}
                                            onBlur={() => setPasswordFocus(false)}
                                            placeholderTextColor="gray" // Ensures placeholder is visible
                                        />
                                        <Feather name="eye-off" size={20} color="gray"/>
                                    </View>

                                    {/* Forgot Password */}
                                    <TouchableOpacity onPress={() => router.push('/forgot')}>
                                        <Text className='text-right mb-6 py-1 color-primary'>Forgot Password?</Text>
                                    </TouchableOpacity>

                                    {/*button */}
                                    <TouchableOpacity className='bg- py-4 items-center bg-primary rounded-[14px] py-5'>
                                        <Text className='text-white text-lg font-semibold'>Login Account</Text>
                                    </TouchableOpacity>


                                    <View className='flex-row justify-center items-center mt-6'>
                                        <Text className='text-gray-400'>Don't have an account?</Text>
                                        <TouchableOpacity onPress={() => router.push('/register')}>
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
               <BottomLeftImage/>
            </View>
        </TouchableWithoutFeedback>
    );

}

