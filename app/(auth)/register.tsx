import {
    View,
    Text,
    StyleSheet,
    Dimensions,
    SafeAreaView,
    TextInput,
    TouchableOpacity,
    Image,
    Keyboard, TouchableWithoutFeedback, KeyboardAvoidingView, Platform, ScrollView
} from 'react-native';
import React, {useEffect, useState} from 'react';
import {images} from "@/constants/Image";
import {useRouter} from "expo-router";
import {SafeAreaProvider} from "react-native-safe-area-context";
import {Feather, FontAwesome} from "@expo/vector-icons";
import logo from '@/assets/images/logo.png';
import {useNavigation} from "@react-navigation/native"; // Import the PNG file

export default function splash() {
    const router = useRouter();
    const {width, height} = Dimensions.get("window");
    const [nameFocus, setNameFocus] = useState(false);
    const [emailFocus, setEmailFocus] = useState(false);
    const [passwordFocus, setPasswordFocus] = useState(false);
    const [passwordConfirmationFocus, setPasswordConfirmationFocus] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const navigation = useNavigation();


    return (
        <TouchableWithoutFeedback
            onPress={Keyboard.dismiss}
            accessible={false}>

            <View className='flex-1 px-6 pt-10 bg-[#FAFAFA]'>
                {/* Top Right SVG */}
                <images.topRight style={styles.topRight} className='absolute top-0 right-0' width={233} height={233}/>

                <SafeAreaProvider>
                    {/*<SafeAreaView className='flex-1 justify-center px-6 pt-10'>*/}
                        <SafeAreaView className='flex-1 justify-center px-6 pt-10'>
                            <KeyboardAvoidingView
                                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                                className='flex-1'
                                keyboardVerticalOffset={Platform.OS === 'ios' ? 40 : 0}
                            >
                                <ScrollView
                                    contentContainerStyle={{ flexGrow: 1 }}
                                    keyboardShouldPersistTaps="handled"
                                    showsVerticalScrollIndicator={false} // Hide vertical scrollbar
                                    showsHorizontalScrollIndicator={false} // Hide horizontal scrollbar (optional)
                                >
                                    <View className='flex-1 justify-center'>
                        {/*logo*/}
                        <View className='mb-5'>
                            <images.logo width={width * 0.6} height={height * 0.1}/>
                        </View>
                        {/*text*/}
                        <Text className='text-2xl font-bold text-black  mt-[-10px]'>Registration Account</Text>
                        <Text className='text-gray-500 mb-6'>Let’s create your account first</Text>


                        <View className={`flex-row items-center bg-[#FFFFFF] mb-4 rounded-[14px] p-4 py-5 border ${
                            nameFocus ? 'border-primary' : 'border-[#DFDFDF]'
                        }`}>
                            <FontAwesome
                                name="user"
                                size={20}
                                color={nameFocus ? '#9A563A' : '#DFDFDF'} // Replace #primaryColor with your actual primary color
                                className='mr-3'
                            />
                            <TextInput
                                placeholder="Full Name"
                                keyboardType="default"
                                className='flex-1 text-base text-black mb-0.5'
                                onFocus={() => setNameFocus(true)}
                                onBlur={() => setNameFocus(false)}
                                placeholderTextColor="gray" // Ensures placeholder is visible
                            />
                        </View>

                        {/*input*/}
                        <View className={`flex-row items-center bg-[#FFFFFF] mb-4 rounded-[14px] p-4 py-5 border ${
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

                        {/*password */}
                        <View className={`flex-row items-center bg-[#FFFFFF] mb-4 rounded-[14px] p-4 py-5 border ${
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
                                secureTextEntry={!showPassword}
                                className='flex-1 text-base text-black mb-0.5'
                                onFocus={() => setPasswordFocus(true)}
                                onBlur={() => setPasswordFocus(false)}
                                placeholderTextColor="gray"
                            />
                            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                                <Feather
                                    name={showPassword ? 'eye' : 'eye-off'}
                                    size={20}
                                    color={showPassword ? '#9A563A' : 'gray'}
                                />
                            </TouchableOpacity>
                        </View>

                        <View className={`flex-row items-center bg-[#FFFFFF] mb-4 rounded-[14px] p-4 py-5 border ${
                            passwordConfirmationFocus ? 'border-primary' : 'border-[#DFDFDF]'
                        }`}>
                            <FontAwesome
                                name="key"
                                size={20}
                                color={passwordConfirmationFocus ? '#9A563A' : '#DFDFDF'} // Replace #primaryColor with your actual primary color
                                className='mr-3'
                            />
                            <TextInput
                                placeholder="Confirm password"
                                secureTextEntry={!showPassword}
                                className='flex-1 text-base text-black mb-0.5'
                                onFocus={() => setPasswordConfirmationFocus(true)}
                                onBlur={() => setPasswordConfirmationFocus(false)}
                                placeholderTextColor="gray"
                            />

                        </View>

                        {/* Forgot Password */}


                        {/*button */}
                                        <TouchableOpacity
                                            className='bg-primary py-5 items-center rounded-[14px]'>
                                            <Text className='text-white text-lg font-semibold'>Create Account</Text>
                                        </TouchableOpacity>


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
                <images.bottomLeft style={styles.bottomLeft} className='absolute bottom-0 left-0' width={233}
                                   height={233}/>
            </View>
        {/*    </ScrollView>*/}
        {/*</KeyboardAvoidingView>*/}
        </TouchableWithoutFeedback>
    );

}

const styles = StyleSheet.create({

    topRight: {
        position: 'absolute',
        top: 0,
        right: 0,
    },
    bottomLeft: {
        position: 'absolute',
        bottom: 0,
        left: 0,
    },
    logo: {
        width: 100,
        height: 100,
    },
});