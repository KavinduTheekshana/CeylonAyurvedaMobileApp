// app/(screens)/_layout.tsx

import { StatusBar } from "react-native";
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
            title: "Online Therapist",
            headerBackVisible: false
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
            title: "Therapist Services",
            headerBackVisible: false
          }}
          />
          {/* Add Notification Screen */}
        <Stack.Screen
          name="NotificationsScreen"
          options={{
            headerShown: true,
            title: "Notifications",
            headerBackVisible: false
          }}
        />
        <Stack.Screen
          name="UserPreferencesScreen"
          options={{
            headerShown: true,
            title: "UserPreferences"
          }}
          />
          <Stack.Screen
            name="TreatmentHistoryDetailsScreen"
            options={{
              headerShown: false,
              title: "Treatment History"
            }}
          />
          <Stack.Screen
          name="TreatmentHistoryListScreen"
          options={{
            headerShown: false,
            title: "All Treatment History"
          }}
        />
              <Stack.Screen
        name="ChatScreen"
        options={{
          headerShown: true,
          headerBackVisible: false
        }}
      />
      <Stack.Screen
        name="LocationSelectionScreen"
        options={{
          headerShown: true,
          title: "Choose Branch",
          headerBackVisible: false
        }}
      />
      </Stack>
      
    </>
  );
};

export default Layout;