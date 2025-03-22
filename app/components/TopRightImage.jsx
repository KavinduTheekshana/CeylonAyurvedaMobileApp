import React from 'react';
import { View, Image, StyleSheet } from 'react-native';
import {images} from "@/constants/Image";

const TopRightImage = () => {
    return (
            <images.topRight style={styles.topRight} className='absolute top-0 right-0' width={233} height={233}/>
    );
};

const styles = StyleSheet.create({

    topRight: {
        position: 'absolute',
        top: 0,
        right: 0,
    },
});

export default TopRightImage;
