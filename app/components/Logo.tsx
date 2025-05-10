import React from 'react';
import { View, Image, StyleSheet, Dimensions } from 'react-native';
import { images } from "@/constants/Image";

const { width, height } = Dimensions.get("window");
const Logo = () => {
    return (
        <View style={styles.container}>
            <images.logo width={width * 0.6} height={height * 0.1} />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        justifyContent: 'center',
        alignItems: 'center',
        paddingBottom:10,
    },
    logo: {
        width: width * 0.6,
        height: height * 0.1,
    },
});

export default Logo;
