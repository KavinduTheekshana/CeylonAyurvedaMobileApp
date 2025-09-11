import { Stack } from "expo-router";
import "./globals.css";
import { StatusBar, View, ActivityIndicator,Platform } from "react-native";
import React, { useEffect, useState } from "react";
import * as SplashScreen from 'expo-splash-screen';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter, useSegments } from "expo-router";
import { LocationProvider } from './contexts/LocationContext';
import { StripeProvider } from '@stripe/stripe-react-native';
import notificationService from './services/notificationService';

// Keep splash visible while loading
SplashScreen.preventAutoHideAsync();

// Live 
const STRIPE_PUBLISHABLE_KEY = 'pk_live_51QAsolDy2cvEu4lhv0ke7wMzzIP09Or21JF3mUHDKeMpUbIeTnIT6N9epe5HqDecDAKF0ffUgMByn89Uy0I7OC2000LrWUnfKK';

// Test 
// const STRIPE_PUBLISHABLE_KEY = 'pk_test_51QAsolDy2cvEu4lhZ9cyTY3lCgpQQRboHfg6UihVxtbQLcXzPcOQjFZMFuQVQDRXA1R3lXLUaHTD3BZcDXvPJMwh00h2lAe1EY';

export default function RootLayout() {
  const router = useRouter();
  const segments = useSegments();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        // Check authentication state
        const token = await AsyncStorage.getItem('access_token');
        const expiry = await AsyncStorage.getItem('session_expiry');
        const userMode = await AsyncStorage.getItem('user_mode');
        const selectedLocation = await AsyncStorage.getItem('selected_location');

        // Wait for a short time to ensure splash is visible
        await new Promise(resolve => setTimeout(resolve, 1500));

        // Hide the splash screen
        await SplashScreen.hideAsync();
        setIsReady(true);

        setTimeout(() => {
          // Check if location is selected
          if (!selectedLocation) {
            router.replace('/(screens)/LocationSelectionScreen');
            return;
          }

          // Guest users are allowed to browse the app
          if (userMode === 'guest' && expiry) {
            const expiryDate = new Date(expiry);
            const now = new Date();

            if (expiryDate > now) {
              router.replace('/(tabs)');
              return;
            }
          }

          // Logged in users with valid tokens
          if (token && expiry) {
            const expiryDate = new Date(expiry);
            const now = new Date();

            if (expiryDate > now) {
              router.replace('/(tabs)');
              return;
            }
          }

          // Default: redirect to auth screen
          router.replace('/(auth)');
        }, 100);

      } catch (error) {
        console.error("Error during initialization:", error);
        await SplashScreen.hideAsync();
        setIsReady(true);

        setTimeout(() => {
          router.replace('/(auth)');
        }, 100);
      }
    }

    prepare();
  }, []);

  useEffect(() => {
    // Initialize notifications when app starts
    const initializeNotifications = async () => {
      if (Platform.OS !== 'web') {
        await notificationService.initialize();
      }
    };

    initializeNotifications();

    // Cleanup on unmount
    return () => {
      notificationService.cleanup();
    };
  }, []);

  if (!isReady) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FAFAFA' }}>
        <ActivityIndicator size="large" color="#9A563A" />
      </View>
    );
  }

  return (
    <StripeProvider publishableKey={STRIPE_PUBLISHABLE_KEY}>
      <LocationProvider>
        <StatusBar barStyle="dark-content" />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="(screens)" />
        </Stack>
      </LocationProvider>
    </StripeProvider>
  );
}