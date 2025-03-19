import {View, Text, StyleSheet, Dimensions, SafeAreaView, TextInput, TouchableOpacity, Image} from 'react-native';
import React, {useEffect, useState} from 'react'
import {images} from "@/constants/Image";
import {useRouter} from "expo-router";
import {SafeAreaProvider} from "react-native-safe-area-context";
import {Feather, FontAwesome} from "@expo/vector-icons";
import logo from '@/assets/images/logo.png'; // Import the PNG file

export default function splash() {
    const router = useRouter();
    const {width, height} = Dimensions.get("window");


    return (
        <View className='flex-1 px-6 pt-10 bg-[#FAFAFA]'>
            {/* Top Right SVG */}
            <images.topRight style={styles.topRight} className='absolute top-0 right-0' width={233} height={233}/>

            <SafeAreaProvider>
                <SafeAreaView className='flex-1 justify-center px-6 pt-10'>
                    {/*logo*/}Ï
                    <View className='mb-5'>Ï
                        <images.logo width={width * 0.6} height={height * 0.1}/>
                    </View>
                    {/*text*/}
                    <Text className='text-2xl font-bold text-black  mt-[-10px]'>Registration Account</Text>
                    <Text className='text-gray-500 mb-6'>Let’s create your account first</Text>


                    <View
                        className='flex-row items-center bg-[#FFFFFF] mb-4 rounded-[14px] p-4 py-5 border-[#DFDFDF] border'>
                        <FontAwesome name="user" size={20} color="gray" className='mr-3'/>
                        <TextInput
                            placeholder="Full Name"
                            keyboardType="default"
                            className='flex-1 text-base'

                            placeholderTextColor="gray" // Ensures placeholder is visible
                        />
                    </View>
                    {/*input*/}
                    <View
                        className='flex-row items-center bg-[#FFFFFF] mb-4 rounded-[14px] p-4 py-5 border-[#DFDFDF] border'>
                        <FontAwesome name="envelope" size={20} color="gray" className='mr-3'/>
                        <TextInput
                            placeholder="Email"
                            keyboardType="email-address"
                            className='flex-1 text-base'

                            placeholderTextColor="gray" // Ensures placeholder is visible
                        />
                    </View>

                    {/*password */}
                    <View
                        className='flex-row items-center bg-[#FFFFFF] mb-4 rounded-[14px] p-4 py-5  border border-primary'>
                        <FontAwesome name="key" size={20} color="brown" className='mr-3'/>
                        <TextInput
                            placeholder="Password"
                            secureTextEntry
                            className='flex-1 text-base text-black'
                            placeholderTextColor="gray"
                        />
                        <Feather name="eye-off" size={20} color="gray"/>
                    </View>
                    <View
                        className='flex-row items-center bg-[#FFFFFF] mb-4 rounded-[14px] p-4 py-5  border border-primary'>
                        <FontAwesome name="key" size={20} color="brown" className='mr-3'/>
                        <TextInput
                            placeholder="Confirm password"
                            secureTextEntry
                            className='flex-1 text-base text-black'
                            placeholderTextColor="gray"
                        />
                        <Feather name="eye-off" size={20} color="gray"/>
                    </View>

                    {/* Forgot Password */}


                    {/*button */}
                    <TouchableOpacity className='bg- py-4 items-center bg-primary rounded-[14px] py-5'>
                        <Text className='text-white text-lg font-semibold'>Login Account</Text>
                    </TouchableOpacity>

               

                    {/* Terms & Privacy */}
                    <Text className='text-gray-400 text-center mt-6'>
                        Already have an account?
                        <Text className='text-brown-700 font-semibold color-primary'> Login Account </Text>
                    </Text>
                </SafeAreaView>
            </SafeAreaProvider>


            {/* Bottom Left SVG */}
            <images.bottomLeft style={styles.bottomLeft} className='absolute bottom-0 left-0' width={233}
                               height={233}/>
        </View>
    )

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