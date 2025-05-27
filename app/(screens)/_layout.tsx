// app/(screens)/_layout.tsx - Updated with therapist screen

import { View, Text, StatusBar } from "react-native";
import React from "react";
import { Stack } from "expo-router";

const Layout = () => {
  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <Stack>
        <Stack.Screen
          name="EditProfileScreen"
          options={{ headerShown: false }}
        />
        <Stack.Screen name="SecurityScreen" options={{ headerShown: false }} />
        <Stack.Screen
          name="BookingTherapistScreen"
          options={{ headerShown: true }}
        />
        <Stack.Screen
          name="BookingDateScreen"
          options={{ headerShown: true }}
        />
        <Stack.Screen
          name="BookingTimeScreen"
          options={{ headerShown: true }}
        />
        <Stack.Screen
          name="BookingCheckoutScreen"
          options={{ headerShown: true }}
        />
        <Stack.Screen
          name="BookingConfirmationScreen"
          options={{
            headerShown: true,
            title: "Booking Confirmation",
            headerLeft: () => null,
            gestureEnabled: false,
          }}
        />
      </Stack>
    </>
  );
};

export default Layout;