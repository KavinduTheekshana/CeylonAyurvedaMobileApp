// app/(investment)/_layout.tsx
import { Stack } from 'expo-router';
import { StatusBar } from 'react-native';

export default function InvestmentLayout() {
  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <Stack
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
        }}
      >
        <Stack.Screen
          name="index"
          options={{
            title: "Investments",
            headerShown: false, // We'll handle header in the component
          }}
        />
        <Stack.Screen
          name="[locationId]"
          options={{
            title: "Investment Details",
            headerShown: false, // We'll handle header in the component
          }}
        />
      </Stack>
    </>
  );
}