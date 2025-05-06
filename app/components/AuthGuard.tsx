import React, { useEffect, useState } from 'react';
import { 
  View, 
  ActivityIndicator, 
  Text, 
  StyleSheet, 
  TouchableOpacity,
  Alert
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';

/**
 * A higher-order component that checks if the user is authenticated
 * and redirects to login if they are not
 */
const withAuthGuard = (WrappedComponent: React.ComponentType<any>) => {
  return (props: any) => {
    const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
    const [isGuest, setIsGuest] = useState<boolean>(false);
    const router = useRouter();
    
    useEffect(() => {
      const checkAuth = async () => {
        try {
          // Check if user is logged in (not a guest)
          const userMode = await AsyncStorage.getItem('user_mode');
          const token = await AsyncStorage.getItem('access_token');
          
          if (userMode === 'guest' || !token) {
            setIsGuest(true);
            setIsAuthenticated(false);
            
            // Show a message before redirecting
            Alert.alert(
              "Authentication Required",
              "You need to login or create an account to access booking features",
              [
                {
                  text: "Login",
                  onPress: () => router.replace('/(auth)/LoginScreen')
                },
                {
                  text: "Register",
                  onPress: () => router.replace('/(auth)/RegisterScreen')
                }
              ],
              { cancelable: false }
            );
            
            return;
          }
          
          setIsAuthenticated(true);
        } catch (error) {
          console.error('Auth check error:', error);
          // On error, safest to redirect to login
          setIsAuthenticated(false);
          
          Alert.alert(
            "Authentication Error",
            "Please sign in to continue",
            [
              {
                text: "OK",
                onPress: () => router.replace('/(auth)/LoginScreen')
              }
            ]
          );
        }
      };
      
      checkAuth();
    }, []);
    
    // Show loading indicator while checking authentication
    if (isAuthenticated === null) {
      return (
        <View style={styles.container}>
          <ActivityIndicator size="large" color="#9A563A" />
        </View>
      );
    }
    
    // If not authenticated, show message screen
    // if (isAuthenticated === false) {
    //   return (
    //     <View style={styles.container}>
    //       <View style={styles.messageBox}>
    //         <View style={styles.iconContainer}>
    //           <Feather name="user-check" size={48} color="#9A563A" />
    //         </View>
    //         <Text style={styles.title}>Authentication Required</Text>
    //         <Text style={styles.message}>
    //           You need to login or create an account to access booking features
    //         </Text>
            
    //         <TouchableOpacity
    //           style={styles.loginButton}
    //           onPress={() => router.replace('/(auth)/LoginScreen')}
    //         >
    //           <Text style={styles.loginButtonText}>Login</Text>
    //         </TouchableOpacity>
            
    //         <TouchableOpacity
    //           style={styles.registerButton}
    //           onPress={() => router.replace('/(auth)/RegisterScreen')}
    //         >
    //           <Text style={styles.registerButtonText}>Create Account</Text>
    //         </TouchableOpacity>
            
    //         <TouchableOpacity
    //           style={styles.cancelButton}
    //           onPress={() => router.back()}
    //         >
    //           <Text style={styles.cancelButtonText}>Go Back</Text>
    //         </TouchableOpacity>
    //       </View>
    //     </View>
    //   );
    // }
    
    // User is authenticated, render the protected component
    return <WrappedComponent {...props} />;
  };
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 20
  },
  messageBox: {
    width: '100%',
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F5F0ED',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: '#555',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  loginButton: {
    backgroundColor: '#9A563A',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
    marginBottom: 12,
  },
  loginButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  registerButton: {
    backgroundColor: 'white',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#9A563A',
    width: '100%',
    alignItems: 'center',
    marginBottom: 12,
  },
  registerButtonText: {
    color: '#9A563A',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    paddingVertical: 12,
  },
  cancelButtonText: {
    color: '#555',
    fontSize: 14,
  }
});

export default withAuthGuard;