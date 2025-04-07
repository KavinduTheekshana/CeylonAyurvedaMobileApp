import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import HomeScreen from './(tabs)/index';
import ServicesScreen from './(screens)/[id]';
import ServiceDetailsScreen from './(screens)/ServiceDetails';
import {createStackNavigator} from "@react-navigation/native/src/__stubs__/createStackNavigator"; // Add this import
import BookingScreen from './(screens)/BookingScreen'; // Add this import

const Stack = createStackNavigator();


// Define the main App component
function App() {


    return (
        <NavigationContainer>
            <Stack.Navigator
                initialRouteName="Home"
                screenOptions={{
                    headerStyle: {
                        backgroundColor: '#fff',
                    },
                    headerTintColor: '#000',
                    headerTitleStyle: {
                        fontWeight: 'bold',
                    },
                }}
            >
                <Stack.Screen
                    name="Home"
                    component={HomeScreen}
                    options={{ title: 'Treatments' }}
                />
                <Stack.Screen
                    name="Services"
                    component={ServicesScreen}
                    // Title is set dynamically based on the treatment name
                />
                <Stack.Screen
                    name="ServiceDetails"
                    component={ServiceDetailsScreen}
                    // Title is set dynamically based on the service name
                />
                <Stack.Screen
                    name="BookingScreen"
                    component={BookingScreen}
                    options={{ title: 'Book Appointment' }}
                />
            </Stack.Navigator>
        </NavigationContainer>
    );
}

// Make sure to export the App component as default
export default App;