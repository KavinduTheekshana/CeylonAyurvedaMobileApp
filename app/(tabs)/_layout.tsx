import FontAwesome from '@expo/vector-icons/FontAwesome';
import {Tabs} from 'expo-router';
import TabBar from "@/constants/TabBar";
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import {StatusBar} from "react-native";
import React from "react";

export default function TabLayout() {
    return (
        <>
            <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

        <Tabs
            tabBar={(props: BottomTabBarProps) => <TabBar {...props} />}
        >
            <Tabs.Screen
                name="index"
                options={{
                    title: "Home"
                }}
            />
            <Tabs.Screen
                name="bookings"
                options={{
                    title: "Bookings",
                }}
            />
            <Tabs.Screen
                name="search"
                options={{
                    title: "Search"
                }}
            />
            <Tabs.Screen
                name="profiles"
                options={{
                    title: "Profile Info",
                    headerShown:false,
                }}
            />
        </Tabs>
        </>
    );
}