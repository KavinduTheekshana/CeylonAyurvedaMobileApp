import {View, Text, StyleSheet, Dimensions} from 'react-native';
import React, {useEffect} from 'react'
import {images} from "@/constants/Image";
import {useRouter} from "expo-router";
import TopRightImage from "@/app/components/TopRightImage";
import BottomLeftImage from "@/app/components/BottomLeftImage";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function splash() {
    const router = useRouter();
    const { width, height } = Dimensions.get("window");

    useEffect(() => {
        const checkLoginStatus = async () => {
            await new Promise(resolve => setTimeout(resolve, 2000)); // ⏳ wait 3 seconds

            try {
                const token = await AsyncStorage.getItem('access_token');
                const expiry = await AsyncStorage.getItem('session_expiry');

                console.log(token);
                console.log(expiry);

                if (token && expiry) {
                    const expiryDate = new Date(expiry);
                    const now = new Date();

                    if (expiryDate > now) {
                        router.replace('/(tabs)');
                        return;
                    }
                }

                router.replace('/(auth)');
            } catch (error) {
                console.log('Error checking login status:', error);
                router.replace('/(auth)');
            }
        };

        checkLoginStatus();
    }, []);

    return (
        <View className='flex-1 items-center justify-center'>
            {/* Top Right SVG */}
       <TopRightImage/>

            <images.splashLogo width={width * 0.5} height={height * 0.3} />

            {/* Bottom Left SVG */}
        <BottomLeftImage/>
        </View>
    )
}

