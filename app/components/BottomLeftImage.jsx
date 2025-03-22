import React from 'react';
import { View, Image, StyleSheet } from 'react-native';
import {images} from "../../constants/Image";

const BottomLeftImage = () => {
    return (

    <images.bottomLeft style={styles.bottomLeft} className='absolute bottom-0 left-0 z-[-1]' width={233}
                       height={233}/>
    );
};

const styles = StyleSheet.create({

    bottomLeft: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        zIndex: -1, // Pushes it to the background
    },
});

export default BottomLeftImage;
