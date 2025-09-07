// app/(tabs)/_layout.tsx
import FontAwesome from '@expo/vector-icons/FontAwesome';
import {Tabs} from 'expo-router';
import TabBar from "@/constants/TabBar";
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import {StatusBar, View} from "react-native";
import React from "react";
import HeaderMessageButton from '../components/HeaderMessageButton';
import HeaderNotificationButton from '../components/HeaderNotificationButton'; // Add this import

export default function TabLayout() {
    return (
        <>
            <StatusBar barStyle="dark-content" hidden={false} />

        <Tabs
            tabBar={(props: BottomTabBarProps) => <TabBar {...props} />}
            screenOptions={{
                headerStyle: {
                    backgroundColor: '#ffffff',
                    elevation: 2,
                    shadowOpacity: 0.1,
                    shadowRadius: 3,
                    shadowOffset: { width: 0, height: 2 },
                },
                headerTitleStyle: {
                    fontWeight: 'bold',
                    fontSize: 18,
                    color: '#333',
                },
                headerTintColor: '#333',
                headerRight: () => (
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <HeaderNotificationButton />
                        <HeaderMessageButton
                            size={24}
                            color="#9A563A"
                        />
                    </View>
                ),
            }}
        >
            {/* Your existing tab screens */}
            <Tabs.Screen
                name="index"
                options={{
                    title: "Treatments",
                    headerShown: true,
                }}
            />
            <Tabs.Screen
                name="bookings"
                options={{
                    title: "My Bookings",
                    headerShown: true,
                }}
            />
            <Tabs.Screen
                name="search"
                options={{
                    title: "Search Services",
                    headerShown: true,
                }}
            />
            <Tabs.Screen
                name="profiles"
                options={{
                    title: "Profile",
                    headerShown: true,
                }}
            />
        </Tabs>
        </>
    );
}