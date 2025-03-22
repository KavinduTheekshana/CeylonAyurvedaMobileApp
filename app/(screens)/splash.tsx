import {View, Text, StyleSheet, Dimensions} from 'react-native';
import React, {useEffect} from 'react'
import {images} from "@/constants/Image";
import {useRouter} from "expo-router";
import TopRightImage from "@/app/components/TopRightImage";
import BottomLeftImage from "@/app/components/BottomLeftImage";

export default function splash() {
    const router = useRouter();
    const { width, height } = Dimensions.get("window");

    useEffect(() => {
        const timeout = setTimeout(() => {
            router.replace("/(auth)"); // ✅ Use replace instead of push
        }, 200);

        return () => clearTimeout(timeout);
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

