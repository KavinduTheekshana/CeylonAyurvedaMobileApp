import { View, Text } from "react-native";
import React from "react";
import { Stack } from "expo-router";


export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen name="index"/>
        <Stack.Screen name="login" options={{headerShown:false}}/>
        <Stack.Screen name="register" options={{headerShown:false}}/>
      <Stack.Screen name="forgot" options={{headerShown:false}}/>
        <Stack.Screen name="verify" options={{headerShown:false}}/>
        <Stack.Screen name="newPassword" options={{headerShown:false}}/>
        <Stack.Screen name="LoginScreen" options={{headerShown:false}}/>
    </Stack>
  );
}
