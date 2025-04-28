// app/_layout.tsx
import { Stack } from "expo-router";
import "./globals.css";
import { StatusBar } from "react-native";
import React, { useEffect } from "react";
import * as SplashScreen from 'expo-splash-screen';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from "expo-router";

// Keep splash visible while loading
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const router = useRouter();

  useEffect(() => {
    // Function to prepare the app and hide splash screen
    async function prepare() {
      try {
        // Check authentication state
        const token = await AsyncStorage.getItem('access_token');
        const expiry = await AsyncStorage.getItem('session_expiry');

        // Wait for a short time to ensure splash is visible
        await new Promise(resolve => setTimeout(resolve, 1500));

        // Hide the splash screen
        await SplashScreen.hideAsync();

        // Navigate based on auth state
        if (token && expiry) {
          const expiryDate = new Date(expiry);
          const now = new Date();

          if (expiryDate > now) {
            router.replace('/(tabs)');
            return;
          }
        }

        router.replace('/(auth)');
      } catch (error) {
        console.error("Error during initialization:", error);
        await SplashScreen.hideAsync();
        router.replace('/(auth)');
      }
    }

    prepare();
  }, []);

  return (
    <Stack>
      <StatusBar barStyle="dark-content" hidden={false} />
      <Stack.Screen name="(screens)" options={{ headerShown: false }} />
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    </Stack>
  );
}