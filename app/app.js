import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack"; // Fix this import
import SplashScreen from "./(splash)/index";
import HomeScreen from "./(tabs)/index";
import ServicesScreen from "./(screens)/[id]";
import ServiceDetailsScreen from "./(screens)/ServiceDetails";
import BookingScreen from "./(screens)/BookingScreen";
import BookingDetailsScreen from "./(screens)/BookingDetailsScreen";
import BookingConfirmationScreen from "./(screens)/BookingConfirmationScreen";

const Stack = createStackNavigator();

// Define the main App component
function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Splash"
        screenOptions={{
          headerStyle: {
            backgroundColor: "#fff",
          },
          headerTintColor: "#000",
          headerTitleStyle: {
            fontWeight: "bold",
          },
        }}
      >
        <Stack.Screen
          name="Splash"
          component={SplashScreen}
          options={{ title: "Treatments" }}
        />
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{ title: "Treatments" }}
        />
        <Stack.Screen
          name="Services"
          component={ServicesScreen}
          // Title is set dynamically based on the treatment name
        />

        <Stack.Screen
          name="Booking Details"
          component={BookingDetailsScreen}
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
          options={{ title: "Book Appointment" }}
        />

        <Stack.Screen
          name="BookingConfirmationScreen"
          component={BookingConfirmationScreen}
          options={{ title: "Booking Confirmation Screen" }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default App;
