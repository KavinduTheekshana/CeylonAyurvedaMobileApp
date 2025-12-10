// Test notification utilities for development
import * as Notifications from 'expo-notifications';

/**
 * Send a test local notification (works on simulator)
 */
export const sendTestNotification = async () => {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Test Notification 🔔",
        body: "This is a test notification from CeylonAyurveda",
        data: {
          type: 'test',
          notification_id: 999
        },
      },
      trigger: null, // Send immediately
    });
    console.log('Test notification sent!');
  } catch (error) {
    console.error('Error sending test notification:', error);
  }
};

/**
 * Send a test booking notification (simulates backend)
 */
export const sendTestBookingNotification = async () => {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Booking Confirmed! ✅",
        body: "Your booking for Ayurvedic Massage on Dec 15 at 2:00 PM has been confirmed.",
        data: {
          type: 'booking_confirmed',
          booking_id: '123',
          booking_reference: 'ABC12345',
          service_name: 'Ayurvedic Massage',
          date: '2025-12-15',
        },
      },
      trigger: null,
    });
    console.log('Test booking notification sent!');
  } catch (error) {
    console.error('Error sending test booking notification:', error);
  }
};

/**
 * Check notification permissions
 */
export const checkNotificationPermissions = async () => {
  const { status } = await Notifications.getPermissionsAsync();
  console.log('Notification permission status:', status);
  return status;
};
