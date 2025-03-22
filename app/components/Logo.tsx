import React from 'react';
import {View, Image, StyleSheet, Dimensions} from 'react-native';
import {images} from "@/constants/Image";

const {width, height} = Dimensions.get("window");
const Logo = () => {
    return (
        <View className='mb-5'>
            <images.logo width={width * 0.6} height={height * 0.1}/>
        </View>
    );
};

const styles = StyleSheet.create({

    logo: {
        width: 100,
        height: 100,
    },
});

export default Logo;
