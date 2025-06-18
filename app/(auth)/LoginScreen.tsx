import {
  View,
  Text,
  Dimensions,
  SafeAreaView,
  TextInput,
  TouchableOpacity,
  Keyboard,
  TouchableWithoutFeedback,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import React, { useState } from "react";
import { useRouter } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Feather, FontAwesome } from "@expo/vector-icons";
import TopRightImage from "@/app/components/TopRightImage";
import Logo from "@/app/components/Logo";
import BottomLeftImage from "@/app/components/BottomLeftImage";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Google from 'expo-auth-session/providers/google';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';

// You should create this file to store your API URLs
import { API_BASE_URL } from "@/config/api";

// Complete the auth session for Google
WebBrowser.maybeCompleteAuthSession();

// Define TypeScript interfaces
interface UserData {
  id: number;
  name: string;
  email: string;
  profile_photo_path?: string;
  phone?: string;
  [key: string]: any; // Allow for additional properties
}
interface LoginErrors {
  email: string;
  password: string;
}

interface LoginResponse {
  access_token: string;
  user: UserData;
  requires_verification?: boolean;
  [key: string]: any;
}

interface SocialAuthData {
  token?: string;
  email: string;
  name: string;
  provider: 'google' | 'apple';
  provider_id: string;
  avatar_url?: string;
}

export default function Login() {
  const router = useRouter();
  const { width, height } = Dimensions.get("window");

  // Form state
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");

  // UI state
  const [emailFocus, setEmailFocus] = useState<boolean>(false);
  const [passwordFocus, setPasswordFocus] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [socialLoading, setSocialLoading] = useState<'google' | 'apple' | null>(null);
  const [errors, setErrors] = useState<LoginErrors>({
    email: "",
    password: "",
  });

  // Google OAuth configuration
  const [googleRequest, googleResponse, googlePromptAsync] = Google.useAuthRequest({
    // Android client ID from Google Cloud Console
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID || 'your-android-client-id.apps.googleusercontent.com',
    // iOS client ID from Google Cloud Console
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || '754805117963-f8japisp2qr7nukjb2b77nm385h0gofm.apps.googleusercontent.com',
    // Web client ID for Expo Go
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || '754805117963-dt9ttk8idoisn63i0dhubstriq91nos9.apps.googleusercontent.com',
    scopes: ['profile', 'email'],
  });

  // Handle Google OAuth response
  React.useEffect(() => {
    if (googleResponse?.type === 'success') {
      handleGoogleSignIn(googleResponse.authentication?.accessToken);
    }
  }, [googleResponse]);

  // Store all user data function
  const storeUserData = async (userData: UserData): Promise<void> => {
    try {
      // Store each piece of user data separately for easier access
      await AsyncStorage.setItem("user_id", userData.id.toString());
      await AsyncStorage.setItem("user_name", userData.name || "");
      await AsyncStorage.setItem("user_email", userData.email || "");

      // Optional fields - check if they exist
      // Updated to use profile_photo_path instead of profile_image
      if (userData.profile_photo_path) {
        await AsyncStorage.setItem(
          "user_profile_photo_path",
          `${API_BASE_URL}/storage/${userData.profile_photo_path}`
        );
      }

      if (userData.phone) {
        await AsyncStorage.setItem("user_phone", userData.phone);
      }

      // Also store the complete user object for any additional fields
      await AsyncStorage.setItem("user_data", JSON.stringify(userData));

      console.log("All user data stored successfully");
    } catch (error) {
      console.error("Error storing user data:", error);
    }
  };

  // Handle social login success
  const handleSocialLoginSuccess = async (response: LoginResponse) => {
    try {
      if (response.access_token) {
        // Store token
        await AsyncStorage.setItem("access_token", response.access_token);

        // Store user data
        if (response.user) {
          await storeUserData(response.user);
        }

        // Set session expiration (90 days from now)
        const expirationDate = new Date();
        expirationDate.setDate(expirationDate.getDate() + 90);
        await AsyncStorage.setItem(
          "session_expiry",
          expirationDate.toISOString()
        );

        // Set user mode to logged in
        await AsyncStorage.setItem("user_mode", "logged_in");

        // Navigate to home
        router.replace("/(tabs)");
      }
    } catch (error) {
      console.error("Error handling social login success:", error);
      Alert.alert("Error", "Failed to complete login. Please try again.");
    }
  };

  // Google Sign In
  const handleGoogleSignIn = async (token?: string) => {
    if (!token) {
      Alert.alert("Error", "Failed to get Google authentication token");
      setSocialLoading(null);
      return;
    }

    try {
      setSocialLoading('google');

      // Get user info from Google
      const userInfoResponse = await fetch(
        `https://www.googleapis.com/oauth2/v2/userinfo?access_token=${token}`
      );
      const userInfo = await userInfoResponse.json();

      if (!userInfo.email) {
        throw new Error("Failed to get user email from Google");
      }

      // Prepare data for your backend
      const socialAuthData: SocialAuthData = {
        token,
        email: userInfo.email,
        name: userInfo.name || userInfo.email,
        provider: 'google',
        provider_id: userInfo.id,
        avatar_url: userInfo.picture,
      };

      // Send to your backend
      const response = await axios.post<LoginResponse>(
        `${API_BASE_URL}/api/auth/social/login`,
        socialAuthData
      );

      if (response.data.access_token) {
        await handleSocialLoginSuccess(response.data);
      } else {
        throw new Error("No access token received from server");
      }
    } catch (error) {
      console.error("Google sign in error:", error);
      let errorMessage = "Google sign in failed. Please try again.";

      if (axios.isAxiosError(error)) {
        errorMessage = error.response?.data?.message || errorMessage;
      }

      Alert.alert("Google Sign In Error", errorMessage);
    } finally {
      setSocialLoading(null);
    }
  };

  // Apple Sign In
  const handleAppleSignIn = async () => {
    try {
      setSocialLoading('apple');

      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      if (!credential.user) {
        throw new Error("Failed to get user data from Apple");
      }

      // Prepare data for your backend
      const socialAuthData: SocialAuthData = {
        email: credential.email || `${credential.user}@privaterelay.appleid.com`,
        name: credential.fullName ?
          `${credential.fullName.givenName || ''} ${credential.fullName.familyName || ''}`.trim() :
          credential.email || 'Apple User',
        provider: 'apple',
        provider_id: credential.user,
      };

      // Send to your backend
      const response = await axios.post<LoginResponse>(
        `${API_BASE_URL}/api/auth/social/login`,
        socialAuthData
      );

      if (response.data.access_token) {
        await handleSocialLoginSuccess(response.data);
      } else {
        throw new Error("No access token received from server");
      }
    } catch (error) {
      console.error("Apple sign in error:", error);

      if (error.code === 'ERR_CANCELED') {
        // User canceled the sign-in flow
        return;
      }

      let errorMessage = "Apple sign in failed. Please try again.";

      if (axios.isAxiosError(error)) {
        errorMessage = error.response?.data?.message || errorMessage;
      }

      Alert.alert("Apple Sign In Error", errorMessage);
    } finally {
      setSocialLoading(null);
    }
  };

  // Handle regular login
  const handleLogin = async (): Promise<void> => {
    // Reset errors
    setErrors({ email: "", password: "" });

    // Basic validation
    let hasError = false;
    const newErrors: LoginErrors = { email: "", password: "" };

    if (!email.trim()) {
      newErrors.email = "Email is required";
      hasError = true;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "Invalid email format";
      hasError = true;
    }

    if (!password) {
      newErrors.password = "Password is required";
      hasError = true;
    }

    if (hasError) {
      setErrors(newErrors);
      return;
    }

    // Perform login
    setIsLoading(true);
    try {
      console.log(`${API_BASE_URL}`);
      const response = await axios.post<LoginResponse>(
        `${API_BASE_URL}/api/login`,
        {
          email,
          password,
        }
      );

      // Check if email verification is required
      if (response.data.requires_verification) {
        // Store email for verification screen
        await AsyncStorage.setItem("user_email", email);

        // Show alert about verification
        Alert.alert(
          "Verification Required",
          "Please verify your email to continue. A new verification code has been sent to your email.",
          [
            {
              text: "OK",
              onPress: () => {
                // Navigate to verification screen
                router.push("/VerifyScreen");
              },
            },
          ]
        );
        return;
      }

      // Normal login flow
      if (response.data.access_token) {
        await handleSocialLoginSuccess(response.data);
      } else {
        Alert.alert("Error", "Login failed. Please try again.");
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          Alert.alert("Error", "Invalid email or password");
        } else if (error.response?.status === 422) {
          if (error.response?.data?.errors) {
            const validationErrors = error.response.data.errors;
            const newErrors: LoginErrors = { email: "", password: "" };

            if (validationErrors.email) {
              newErrors.email = validationErrors.email[0];
            }
            if (validationErrors.password) {
              newErrors.password = validationErrors.password[0];
            }

            setErrors(newErrors);
          } else {
            Alert.alert("Error", "Validation failed. Please check your input.");
          }
        } else {
          Alert.alert(
            "Error",
            error.response?.data?.message || "Login failed. Please try again."
          );
        }
      } else {
        Alert.alert("Error", "An unexpected error occurred. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Handle continue as guest
  const handleContinueAsGuest = async (): Promise<void> => {
    try {
      // Clear any existing user data just to be safe
      await AsyncStorage.removeItem("access_token");
      await AsyncStorage.removeItem("user_id");
      await AsyncStorage.removeItem("user_name");
      await AsyncStorage.removeItem("user_email");

      // Set user mode to guest
      await AsyncStorage.setItem("user_mode", "guest");

      // Set a temporary guest session (1 day)
      const expirationDate = new Date();
      expirationDate.setDate(expirationDate.getDate() + 1);
      await AsyncStorage.setItem("session_expiry", expirationDate.toISOString());

      // Navigate to home
      router.replace("/(tabs)");
    } catch (error) {
      console.error("Error continuing as guest:", error);
      Alert.alert("Error", "Failed to continue as guest. Please try again.");
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <View className="flex-1 px-6 pt-10 bg-[#FAFAFA]">
        {/* Top Right SVG */}
        <TopRightImage />

        <SafeAreaProvider>
          <SafeAreaView className="flex-1 justify-center px-6 pt-10">
            <KeyboardAvoidingView
              behavior={Platform.OS === "ios" ? "padding" : "height"}
              className="flex-1"
              keyboardVerticalOffset={Platform.OS === "ios" ? 40 : 0}
            >
              <ScrollView
                contentContainerStyle={{ flexGrow: 1 }}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
                showsHorizontalScrollIndicator={false}
              >
                <View className="flex-1 justify-center">
                  {/* Logo */}
                  <Logo />
                  {/* Header text */}
                  <Text className="text-2xl font-bold text-black mt-[-10px] text-center">
                    Login Account
                  </Text>
                  <Text className="text-gray-500 mb-6 text-center">
                    Please login into your account
                  </Text>



                  {/* Email Input */}
                  <View
                    className={`flex-row items-center bg-[#FFFFFF] mb-4 rounded-[14px] p-4 py-5 border ${emailFocus
                      ? "border-primary"
                      : errors.email
                        ? "border-red-500"
                        : "border-[#DFDFDF]"
                      }`}
                  >
                    <FontAwesome
                      name="envelope"
                      size={20}
                      color={
                        emailFocus
                          ? "#9A563A"
                          : errors.email
                            ? "red"
                            : "#DFDFDF"
                      }
                      className="mr-3"
                    />
                    <TextInput
                      placeholder="Email"
                      keyboardType="email-address"
                      className="flex-1 text-black mb-0.5"
                      onFocus={() => setEmailFocus(true)}
                      onBlur={() => setEmailFocus(false)}
                      placeholderTextColor="gray"
                      value={email}
                      style={{
                        height: Platform.OS === "ios" ? 24 : "auto", // Fixed height for iOS
                        paddingVertical: Platform.OS === "ios" ? 0 : 2, // Remove padding on iOS
                        paddingBottom: Platform.OS === "ios" ? 2 : 2, // Add small bottom padding on iOS
                      }}
                      onChangeText={setEmail}
                      autoCapitalize="none" // Ensures all lowercase
                      autoCorrect={false} // Prevents autocorrection
                    />
                  </View>
                  {errors.email ? (
                    <Text className="text-red-500 text-sm mb-2 ml-2">
                      {errors.email}
                    </Text>
                  ) : null}

                  {/* Password Input */}
                  <View
                    className={`flex-row items-center bg-[#FFFFFF] mb-4 rounded-[14px] p-4 py-5 border ${passwordFocus
                      ? "border-primary"
                      : errors.password
                        ? "border-red-500"
                        : "border-[#DFDFDF]"
                      }`}
                  >
                    <FontAwesome
                      name="key"
                      size={20}
                      color={
                        passwordFocus
                          ? "#9A563A"
                          : errors.password
                            ? "red"
                            : "#DFDFDF"
                      }
                      className="mr-3"
                    />
                    <TextInput
                      placeholder="Password"
                      secureTextEntry={!showPassword}
                      className="flex-1 text-black mb-0.5"
                      style={{
                        height: Platform.OS === "ios" ? 24 : "auto", // Fixed height for iOS
                        paddingVertical: Platform.OS === "ios" ? 0 : 2, // Remove padding on iOS
                        paddingBottom: Platform.OS === "ios" ? 2 : 2, // Add small bottom padding on iOS
                      }}
                      onFocus={() => setPasswordFocus(true)}
                      onBlur={() => setPasswordFocus(false)}
                      placeholderTextColor="gray"
                      value={password}
                      onChangeText={setPassword}
                    />
                    <TouchableOpacity
                      onPress={() => setShowPassword(!showPassword)}
                    >
                      <Feather
                        name={showPassword ? "eye" : "eye-off"}
                        size={20}
                        color={showPassword ? "#9A563A" : "gray"}
                      />
                    </TouchableOpacity>
                  </View>
                  {errors.password ? (
                    <Text className="text-red-500 text-sm mb-2 ml-2">
                      {errors.password}
                    </Text>
                  ) : null}

                  {/* Forgot Password */}
                  <TouchableOpacity
                    onPress={() => router.push("/ForgotPasswordScreen")}
                  >
                    <Text className="text-right mb-6 py-1 color-primary">
                      Forgot Password?
                    </Text>
                  </TouchableOpacity>

                  {/* Login Button */}
                  <TouchableOpacity
                    className="bg-primary py-5 items-center rounded-[14px]"
                    onPress={handleLogin}
                    disabled={isLoading || socialLoading !== null}
                  >
                    {isLoading ? (
                      <ActivityIndicator color="white" />
                    ) : (
                      <Text className="text-white text-lg font-semibold">
                        Login Account
                      </Text>
                    )}
                  </TouchableOpacity>

                  {/* Divider */}
                  <View className="flex-row items-center mb-4 mt-6">
                    <View className="flex-1 h-px bg-gray-300" />
                    <Text className="mx-4 text-gray-500 text-sm">or sign in with</Text>
                    <View className="flex-1 h-px bg-gray-300" />
                  </View>

                  {/* Social Login Buttons */}
                  <View className="mb-6">
                    <View className="flex-row space-x-3 gap-3">
                      {/* Google Sign In Button */}
                      <TouchableOpacity
                        className="flex-1 flex-row items-center justify-center bg-white border border-gray-300 py-4 px-3 rounded-[14px]"
                        onPress={() => googlePromptAsync()}
                        disabled={socialLoading !== null}
                      >
                        {socialLoading === 'google' ? (
                          <ActivityIndicator size="small" color="#DB4437" />
                        ) : (
                          <>
                            <FontAwesome name="google" size={18} color="#DB4437" />
                            <Text className="text-gray-700 font-medium ml-2 text-sm">
                              Google
                            </Text>
                          </>
                        )}
                      </TouchableOpacity>

                      {/* Apple Sign In Button - Only show on iOS */}
                      {Platform.OS === 'ios' ? (
                        <TouchableOpacity
                          className="flex-1 flex-row items-center justify-center bg-black py-3 px-3 rounded-[14px]"
                          onPress={handleAppleSignIn}
                          disabled={socialLoading !== null}
                        >
                          {socialLoading === 'apple' ? (
                            <ActivityIndicator size="small" color="#FFFFFF" />
                          ) : (
                            <>
                              <FontAwesome name="apple" size={18} color="#FFFFFF" />
                              <Text className="text-white font-medium ml-2 text-sm">
                                Apple
                              </Text>
                            </>
                          )}
                        </TouchableOpacity>
                      ) : (
                        /* Placeholder for Android to keep Google button centered */
                        <View className="flex-1" />
                      )}
                    </View>
                  </View>



                  {/* Continue as guest */}
                  {/* <TouchableOpacity
                    className="bg-white border border-[#9A563A] mt-4 py-5 items-center rounded-[14px]"
                    onPress={handleContinueAsGuest}
                    disabled={socialLoading !== null}
                  >
                    <Text className="text-[#9A563A] text-lg font-semibold">
                      Continue as Guest
                    </Text>
                  </TouchableOpacity> */}

                  {/* Register Link */}
                  <View className="flex-row justify-center items-center mt-6">
                    <Text className="text-gray-400">
                      Don't have an account?
                    </Text>
                    <TouchableOpacity
                      onPress={() => router.push("/RegisterScreen")}
                    >
                      <Text className="text-brown-700 font-semibold color-primary ml-1">
                        Create Account
                      </Text>
                    </TouchableOpacity>
                  </View>

                  <View className="flex-row items-center mt-3">
                    <View className="flex-1 h-px bg-gray-300" />
                    <Text className="mx-4 text-gray-500 text-sm">OR</Text>
                    <View className="flex-1 h-px bg-gray-300" />
                  </View>


                  <View className="flex-row justify-center items-center mt-3">

                    <TouchableOpacity
                      onPress={handleContinueAsGuest}
                    >
                      <Text className="text-brown-700 font-semibold color-primary ml-1">
                        Continue as Guest
                      </Text>
                    </TouchableOpacity>
                  </View>


                </View>
              </ScrollView>
            </KeyboardAvoidingView>
          </SafeAreaView>
        </SafeAreaProvider>

        {/* Bottom Left SVG */}
        <BottomLeftImage />
      </View>
    </TouchableWithoutFeedback>
  );
}