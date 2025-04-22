import { Stack } from "expo-router";
import "./globals.css";
import {StatusBar} from "react-native";
import React, { useEffect } from "react";
import * as SplashScreen from 'expo-splash-screen';

export default function RootLayout() {

  SplashScreen.preventAutoHideAsync();
  useEffect(() => {
    // Hide the splash screen after a short delay
    const hideSplash = async () => {
      await SplashScreen.hideAsync();
    };

    hideSplash();
  }, []);
  return (
    <Stack>
        <StatusBar barStyle="dark-content" hidden={false} />
        <Stack.Screen name="(splash)" options={{ headerShown: false }} />
        <Stack.Screen name="(screens)" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    </Stack>
  );
}
