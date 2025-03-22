import {
    View,
    Text,
    StyleSheet,
    Dimensions,
    SafeAreaView,
    TextInput,
    TouchableOpacity,
    Image,
    Keyboard, TouchableWithoutFeedback, KeyboardAvoidingView, Platform, ScrollView, Alert
} from 'react-native';
import React, {useEffect, useState} from 'react';
import {images} from "@/constants/Image";
import {useRouter} from "expo-router";
import {SafeAreaProvider} from "react-native-safe-area-context";
import {Feather, FontAwesome} from "@expo/vector-icons";
import logo from '@/assets/images/logo.png';
import {useNavigation} from "@react-navigation/native";
import axios, {AxiosError} from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import TopRightImage from "@/app/components/TopRightImage";
import Logo from "@/app/components/Logo";
import BottomLeftImage from "@/app/components/BottomLeftImage";


const RegisterScreen = () => {
    const router = useRouter();
    const {width, height} = Dimensions.get("window");
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [nameFocus, setNameFocus] = useState(false);
    const [emailFocus, setEmailFocus] = useState(false);
    const [passwordFocus, setPasswordFocus] = useState(false);
    const [passwordConfirmationFocus, setPasswordConfirmationFocus] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const navigation = useNavigation();

    const handleRegister = async () => {
        if (password !== confirmPassword) {
            Alert.alert('Error', 'Passwords do not match');
            return;
        }

        const userData = {
            name,
            email,
            password,
            password_confirmation: confirmPassword,
        };

        try {
            const response = await axios.post('https://app.ceylonayurvedahealth.co.uk/api/register', userData);
            console.log('Registration successful:', response.data);
            Alert.alert('Success', 'Registration successful!');
            if (response.data.access_token) {
                await AsyncStorage.setItem('access_token', response.data.access_token);
            }
            router.push('/login');
            // navigation.navigate('login');
        } catch (error: unknown) {
            if (axios.isAxiosError(error)) {
                // Now TypeScript knows `error` is of type AxiosError
                // console.error('Registration failed:', error.response?.data || error.message);

                if (error.response?.status === 422) {
                    const errorMessages = Object.values(error.response.data.errors).flat().join('\n');
                    Alert.alert('Error', errorMessages);
                } else if (error.response?.data?.message) {
                    Alert.alert('Error', error.response.data.message);
                } else {
                    Alert.alert('Error', 'Registration failed. Please try again.');
                }
            } else if (error instanceof Error) {
                // Handle generic errors
                Alert.alert('Error', error.message);
            } else {
                // Handle unknown errors
                Alert.alert('Error', 'An unexpected error occurred.');
            }
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
                    {/*<SafeAreaView className='flex-1 justify-center px-6 pt-10'>*/}
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
                                    <Text className='text-2xl font-bold text-black  mt-[-10px]'>Registration
                                        Account</Text>
                                    <Text className='text-gray-500 mb-6'>Let’s create your account first</Text>


                                    <View
                                        className={`flex-row items-center bg-[#FFFFFF] mb-4 rounded-[14px] p-4 py-5 border ${
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
                                            value={name}
                                            onChangeText={setName}
                                        />
                                    </View>

                                    {/*input*/}
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
                                            value={email}
                                            onChangeText={setEmail}
                                        />
                                    </View>

                                    {/*password */}
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
                                                name={showPassword ? 'eye' : 'eye-off'}
                                                size={20}
                                                color={showPassword ? '#9A563A' : 'gray'}
                                            />
                                        </TouchableOpacity>
                                    </View>

                                    <View
                                        className={`flex-row items-center bg-[#FFFFFF] mb-4 rounded-[14px] p-4 py-5 border ${
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
                                            value={confirmPassword}
                                            onChangeText={setConfirmPassword}
                                        />

                                    </View>

                                    {/* Forgot Password */}


                                    {/*button */}
                                    <TouchableOpacity
                                        className='bg-primary py-5 items-center rounded-[14px]'
                                        onPress={handleRegister}>
                                        <Text className='text-white text-lg font-semibold'>Create Account</Text>
                                    </TouchableOpacity>


                                    <View className='flex-row justify-center items-center mt-6'>
                                        <Text className='text-gray-400'>Already have an account?</Text>
                                        <TouchableOpacity onPress={() => router.push('/login')}>
                                            <Text className='text-brown-700 font-semibold color-primary ml-1'>Login
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
            {/*    </ScrollView>*/}
            {/*</KeyboardAvoidingView>*/}
        </TouchableWithoutFeedback>
    );

}
export default RegisterScreen;

