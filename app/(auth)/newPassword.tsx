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
import BottomLeftImage from "@/app/components/BottomLeftImage";
import Logo from "@/app/components/Logo"; // Import the PNG file
import { useNavigation } from '@react-navigation/native';

export default function NewPassword() {
    const router = useRouter();
    const [passwordFocus, setPasswordFocus] = useState(false);
    const [passwordConfirmationFocus, setPasswordConfirmationFocus] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const navigation = useNavigation();


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
                                    <View className='w-[52] rounded-[12px] h-[52] mb-10 bg-primary justify-center items-center'>
                                        <FontAwesome
                                            name="key"
                                            size={28}
                                            color={'#ffffff'}

                                        />
                                    </View>

                                    {/*text*/}
                                    <Text className='text-2xl font-bold text-center text-black  mt-[-10px]'>Create New Password</Text>
                                    <Text className='text-gray-500 text-center mt-3 mb-6'>Please make sure the password is not the same as the previous password.</Text>


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

                                        />

                                    </View>





                                    {/*button */}
                                    <View className="absolute bottom-6 left-0 right-0 px-4 z-20">
                                        {/* Continue Button */}
                                        <TouchableOpacity className="bg-primary py-4 items-center rounded-[14px]" onPress={() => router.push('/verify')}>
                                            <Text className="text-white text-lg font-semibold">Confirm New Password</Text>
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

const styles = StyleSheet.create({});