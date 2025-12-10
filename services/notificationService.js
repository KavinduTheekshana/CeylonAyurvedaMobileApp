// services/notificationService.js

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { API_BASE_URL } from '@/config/api';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

class NotificationService {
  constructor() {
    this.token = null;
    this.notificationListener = null;
    this.responseListener = null;
  }

  async initialize() {
    try {
      // Request permissions
      const { status } = await this.requestPermissions();
      if (status !== 'granted') {
        console.log('Notification permissions not granted');
        return false;
      }

      // Get FCM token
      const token = await this.getExpoPushToken();
      if (token) {
        this.token = token;
        await this.registerTokenWithServer(token);
      }

      // Set up notification listeners
      this.setupNotificationListeners();

      // Configure notification channel for Android
      if (Platform.OS === 'android') {
        await this.setupAndroidChannel();
      }

      return true;
    } catch (error) {
      console.error('Error initializing notifications:', error);
      return false;
    }
  }

  async requestPermissions() {
    if (Device.isDevice) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      return { status: finalStatus };
    } else {
      console.log('Push notifications require a physical device');
      return { status: 'denied' };
    }
  }

  async getExpoPushToken() {
    try {
      const projectId = Constants.expoConfig?.extra?.eas?.projectId || Constants.easConfig?.projectId;
      
      if (!projectId) {
        throw new Error('Project ID not found');
      }

      const token = await Notifications.getExpoPushTokenAsync({ projectId });
      console.log('Expo Push Token:', token.data);
      return token.data;
    } catch (error) {
      console.error('Error getting push token:', error);
      return null;
    }
  }

  async registerTokenWithServer(token) {
    try {
      const userToken = await AsyncStorage.getItem('access_token');
      if (!userToken) {
        console.log('User not authenticated, skipping token registration');
        return;
      }

      const deviceId = await this.getDeviceId();
      const deviceType = Platform.OS;

      const response = await fetch(`${API_BASE_URL}/api/fcm-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userToken}`,
        },
        body: JSON.stringify({
          fcm_token: token,
          device_type: deviceType,
          device_id: deviceId,
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        console.log('FCM token registered successfully');
        await AsyncStorage.setItem('fcmTokenRegistered', 'true');
      } else {
        console.error('Failed to register FCM token:', data.message);
      }
    } catch (error) {
      console.error('Error registering token with server:', error);
    }
  }

  async getDeviceId() {
    let deviceId = await AsyncStorage.getItem('deviceId');
    if (!deviceId) {
      deviceId = `${Platform.OS}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      await AsyncStorage.setItem('deviceId', deviceId);
    }
    return deviceId;
  }

  setupNotificationListeners() {
    // Listener for notifications received while app is foregrounded
    this.notificationListener = Notifications.addNotificationReceivedListener(notification => {
      console.log('Notification received in foreground:', notification);
      // You can handle foreground notifications here
    });

    // Listener for when user taps on notification
    this.responseListener = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Notification tapped:', response);
      this.handleNotificationTap(response.notification);
    });
  }

  handleNotificationTap(notification) {
    const data = notification.request.content.data;
    
    if (data && data.notification_id) {
      // Navigate to notifications screen or specific notification
      // You'll implement this based on your navigation setup
      console.log('Navigating to notification:', data.notification_id);
    }
  }

  async setupAndroidChannel() {
    await Notifications.setNotificationChannelAsync('ceylon-ayurveda-notifications', {
      name: 'Ceylon Ayurveda Notifications',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#9A563A',
      sound: 'default',
    });
  }

  async cleanup() {
    if (this.notificationListener) {
      Notifications.removeNotificationSubscription(this.notificationListener);
    }
    if (this.responseListener) {
      Notifications.removeNotificationSubscription(this.responseListener);
    }
  }

  async unregisterToken() {
    try {
      const userToken = await AsyncStorage.getItem('access_token');
      if (!userToken || !this.token) return;

      await fetch(`${API_BASE_URL}/api/fcm-token`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userToken}`,
        },
        body: JSON.stringify({
          fcm_token: this.token,
        }),
      });

      await AsyncStorage.removeItem('fcmTokenRegistered');
      console.log('FCM token unregistered');
    } catch (error) {
      console.error('Error unregistering token:', error);
    }
  }

  // Re-register token after login (when user wasn't authenticated during app start)
  async reRegisterToken() {
    try {
      const userToken = await AsyncStorage.getItem('access_token');
      if (!userToken) {
        console.log('No user token, skipping re-registration');
        return;
      }

      // If we already have a token, re-register it
      if (this.token) {
        await this.registerTokenWithServer(this.token);
        return;
      }

      // Otherwise, get a new token
      const token = await this.getExpoPushToken();
      if (token) {
        this.token = token;
        await this.registerTokenWithServer(token);
      }
    } catch (error) {
      console.error('Error re-registering token:', error);
    }
  }
}

export default new NotificationService();