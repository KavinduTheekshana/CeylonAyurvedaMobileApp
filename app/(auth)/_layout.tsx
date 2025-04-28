import { View, Text } from "react-native";
import React from "react";
import { Stack } from "expo-router";


export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen name="index"/>
        <Stack.Screen name="LoginScreen" options={{headerShown:false}}/>
        <Stack.Screen name="RegisterScreen" options={{headerShown:false}}/>
      <Stack.Screen name="VerifyScreen" options={{headerShown:false}}/>
      <Stack.Screen name="ForgotPasswordScreen" options={{headerShown:false}}/>
      <Stack.Screen name="ResetVerificationScreen" options={{headerShown:false}}/>
      <Stack.Screen name="NewPasswordScreen" options={{headerShown:false}}/>
    </Stack>
  );
}
