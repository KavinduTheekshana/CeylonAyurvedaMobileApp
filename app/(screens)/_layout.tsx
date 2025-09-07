// app/(screens)/_layout.tsx - Updated with Investment screens

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
          name="MessageAdminScreen"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="MessageHistoryScreen"
          options={{ headerShown: false }}
        />
        
        {/* Investment Screens */}
        <Stack.Screen
          name="InvestmentScreen"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="InvestmentDetailsScreen"
          options={{ headerShown: false }}
        />
        
        {/* Booking Screens */}
        <Stack.Screen
          name="BookingTherapistScreen"
          options={{ headerShown: true }}
        />
        <Stack.Screen
          name="BookingDateScreen"
          options={{ headerShown: true }}
        />
        <Stack.Screen
          name="TherapistDetailsScreen"
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
        <Stack.Screen
          name="OnlineTherapistScreen"
          options={{ 
            headerShown: true,
            title: "Online Therapist"
          }}
        />
        <Stack.Screen
          name="TherapistDetailScreen"
          options={{ 
            headerShown: true,
            title: "Therapist Details"
          }}
        />
        <Stack.Screen
          name="TherapistServicesScreen"
          options={{ 
            headerShown: true,
            title: "Therapist Services"
          }}
          />
          {/* Add Notification Screen */}
        <Stack.Screen
          name="NotificationsScreen"
          options={{ 
            headerShown: true,
            title: "Notifications"
          }}
        />
      </Stack>
    </>
  );
};

export default Layout;