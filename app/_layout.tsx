// app/_layout.tsx
import { Stack } from "expo-router";
import "./globals.css";
import { StatusBar, View, ActivityIndicator } from "react-native";
import React, { useEffect, useState } from "react";
import * as SplashScreen from 'expo-splash-screen';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from "expo-router";

// Keep splash visible while loading
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const router = useRouter();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Function to prepare the app and hide splash screen
    async function prepare() {
      try {
        // Check authentication state
        const token = await AsyncStorage.getItem('access_token');
        const expiry = await AsyncStorage.getItem('session_expiry');
        const userMode = await AsyncStorage.getItem('user_mode');

        // Wait for a short time to ensure splash is visible
        await new Promise(resolve => setTimeout(resolve, 1500));

        // Hide the splash screen
        await SplashScreen.hideAsync();

        // Guest users are allowed to browse the app
        if (userMode === 'guest' && expiry) {
          const expiryDate = new Date(expiry);
          const now = new Date();

          if (expiryDate > now) {
            setIsReady(true);
            router.replace('/(tabs)');
            return;
          }
        }

        // Logged in users with valid tokens
        if (token && expiry) {
          const expiryDate = new Date(expiry);
          const now = new Date();

          if (expiryDate > now) {
            setIsReady(true);
            router.replace('/(tabs)');
            return;
          }
        }

        // Default: redirect to auth screen
        setIsReady(true);
        router.replace('/(auth)');
      } catch (error) {
        console.error("Error during initialization:", error);
        await SplashScreen.hideAsync();
        setIsReady(true);
        router.replace('/(auth)');
      }
    }

    prepare();
  }, []);

  // Show loading screen while preparing
  if (!isReady) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FAFAFA' }}>
        <ActivityIndicator size="large" color="#9A563A" />
      </View>
    );
  }

  return (
    <>
      <StatusBar barStyle="dark-content" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="(screens)" />
      </Stack>
    </>
  );
}