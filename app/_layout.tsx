import { Stack } from "expo-router";
import "./globals.css";
import {StatusBar} from "react-native";
import React from "react";

export default function RootLayout() {
  return (
    <Stack>
        <Stack.Screen name="(splash)" options={{ headerShown: false }} />
        <Stack.Screen name="(screens)" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    </Stack>
  );
}
