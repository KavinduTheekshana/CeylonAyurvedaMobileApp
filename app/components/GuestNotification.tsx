import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions
} from 'react-native';
import { Feather } from '@expo/vector-icons';

interface GuestNotificationProps {
  visible: boolean;
  onLogin: () => void;
  onDismiss: () => void;
  message?: string;
  autoDismissTime?: number; // Time in ms before auto-dismissing
}

const { width } = Dimensions.get('window');

const GuestNotification: React.FC<GuestNotificationProps> = ({
  visible,
  onLogin,
  onDismiss,
  message = 'Login or create an account to access all features',
  autoDismissTime = 5000 // 5 seconds default
}) => {
  const [slideAnim] = useState(new Animated.Value(-100));
  
  useEffect(() => {
    let dismissTimer: NodeJS.Timeout;
    
    if (visible) {
      // Slide in animation
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true
      }).start();
      
      // Set timer to auto-dismiss
      dismissTimer = setTimeout(() => {
        handleDismiss();
      }, autoDismissTime);
    } else {
      // Slide out animation
      Animated.timing(slideAnim, {
        toValue: -100,
        duration: 300,
        useNativeDriver: true
      }).start();
    }
    
    // Cleanup timer on unmount
    return () => {
      if (dismissTimer) clearTimeout(dismissTimer);
    };
  }, [visible]);
  
  const handleDismiss = () => {
    // Slide out animation
    Animated.timing(slideAnim, {
      toValue: -100,
      duration: 300,
      useNativeDriver: true
    }).start(() => {
      onDismiss();
    });
  };
  
  if (!visible) return null;
  
  return (
    <Animated.View 
      style={[
        styles.container, 
        { transform: [{ translateY: slideAnim }] }
      ]}
    >
      <View style={styles.content}>
        <Feather name="user" size={18} color="#9A563A" />
        <Text style={styles.message}>{message}</Text>
        
        <View style={styles.actions}>
          <TouchableOpacity style={styles.loginButton} onPress={onLogin}>
            <Text style={styles.loginText}>Login</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.dismissButton} onPress={handleDismiss}>
            <Feather name="x" size={16} color="#666" />
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 999,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    backgroundColor: '#fff'
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  message: {
    flex: 1,
    marginLeft: 10,
    fontSize: 14,
    color: '#333'
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  loginButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    backgroundColor: '#F5F0ED',
    marginRight: 8
  },
  loginText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9A563A'
  },
  dismissButton: {
    padding: 4
  }
});

export default GuestNotification;