import {View, Text, StyleSheet, Dimensions} from 'react-native';
import React, {useEffect} from 'react'
import {images} from "@/constants/Image";
import {useRouter} from "expo-router";

export default function splash() {
    const router = useRouter();
    const { width, height } = Dimensions.get("window");

    useEffect(() => {
        const timeout = setTimeout(() => {
            router.replace("/(auth)"); // ✅ Use replace instead of push
        }, 2000);

        return () => clearTimeout(timeout);
    }, []);

    return (
        <View className='flex-1 items-center justify-center'>
            {/* Top Right SVG */}
            <images.topRight style={styles.topRight} className='absolute top-0 right-0' width={233} height={233}/>

            <images.splashLogo width={width * 0.5} height={height * 0.3} />

            {/* Bottom Left SVG */}
            <images.bottomLeft style={styles.bottomLeft} className='absolute bottom-0 left-0' width={233} height={233}/>
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
});