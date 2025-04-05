import FontAwesome from '@expo/vector-icons/FontAwesome';
import {Tabs} from 'expo-router';
import TabBar from "@/constants/TabBar";

export default function TabLayout() {
    return (
        <Tabs
            tabBar={props=> <TabBar {...props} />}
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
                    title: "Bookings"
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
                    title: "Profiles"
                }}
            />
        </Tabs>
    );
}
