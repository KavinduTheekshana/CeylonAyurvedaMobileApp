// In your existing code where you define routes/screens
// You need to add the ServiceDetails and BookingScreen components
// to the screens that React Navigation knows about

// This could be in your App.js, index.js, or wherever you set up navigation
import { createStackNavigator } from '@react-navigation/stack';

// Import your screens
import HomeScreen from '/app/(tabs)';
import ServicesScreen from './path/to/ServicesScreen';
import ServiceDetailsScreen from './path/to/ServiceDetailsScreen'; // New screen
import BookingScreen from './path/to/BookingScreen'; // New screen


const Stack = createStackNavigator();

// Include the new screens in your navigator
function AppNavigator() {
    return (
        <Stack.Navigator>
            {/* Your existing screens */}
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="Services" component={ServicesScreen} />

            {/* Add these new screens */}
            <Stack.Screen
                name="ServiceDetails"
                component={ServiceDetailsScreen}
                options={({ route }) => ({ title: route.params.service.title })}
            />
            <Stack.Screen
                name="BookingScreen"
                component={BookingScreen}
                options={{ title: 'Book Appointment' }}
            />
        </Stack.Navigator>
    );
}