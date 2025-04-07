import { View, Text, StatusBar } from 'react-native'
import React from 'react'
import { Stack } from 'expo-router'

const Layout = () => {
    return (
        <>
            <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
            <Stack>
                <Stack.Screen name="EditProfileScreen" options={{headerShown:false}}/>
                <Stack.Screen name="SecurityScreen" options={{headerShown:false}}/>
                {/* <Stack.Screen name="index"/> */}
            </Stack>
        </>
    )
}

export default Layout