import {
  View,
  Text,
  StyleSheet,
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
import React, { useEffect, useState } from "react";
import { useRouter } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Feather, FontAwesome } from "@expo/vector-icons";
import TopRightImage from "@/app/components/TopRightImage";
import BottomLeftImage from "@/app/components/BottomLeftImage";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_BASE_URL } from "@/config/api";

export default function NewPassword() {
  const router = useRouter();
  const [passwordFocus, setPasswordFocus] = useState(false);
  const [passwordConfirmationFocus, setPasswordConfirmationFocus] =
    useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [resetToken, setResetToken] = useState("");

  // Load email and reset token from storage
  useEffect(() => {
    const loadData = async () => {
      try {
        const storedEmail = await AsyncStorage.getItem("reset_email");
        const storedToken = await AsyncStorage.getItem("reset_token");

        if (storedEmail && storedToken) {
          setEmail(storedEmail);
          setResetToken(storedToken);
        } else {
          // If data is missing, redirect to forgot password
          Alert.alert("Error", "Missing reset information. Please try again.", [
            { text: "OK", onPress: () => router.replace("/forgot") },
          ]);
        }
      } catch (error) {
        console.error("Error loading data:", error);
        Alert.alert("Error", "Failed to load reset information");
      }
    };

    loadData();
  }, []);

  // Handle password reset
  const handleResetPassword = async () => {
    // Validate passwords
    if (!password) {
      Alert.alert("Error", "Please enter a new password");
      return;
    }

    if (password.length < 8) {
      Alert.alert("Error", "Password must be at least 8 characters");
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Error", "Passwords don't match");
      return;
    }

    if (!email || !resetToken) {
      Alert.alert("Error", "Missing reset information. Please try again.");
      return;
    }

    setIsLoading(true);

    try {
      const response = await axios.post(`${API_BASE_URL}/api/reset-password`, {
        email,
        reset_token: resetToken,
        password,
        password_confirmation: confirmPassword,
      });

      console.log("Reset password response:", response.data);

      // Show success message
      Alert.alert("Success", "Your password has been reset successfully!", [
        {
          text: "Continue to Login",
          onPress: async () => {
            // Clean up stored reset data
            await AsyncStorage.removeItem("reset_email");
            await AsyncStorage.removeItem("reset_token");

            // Redirect to login
            router.replace("/login");
          },
        },
      ]);
    } catch (error) {
      console.error("Reset password error:", error);

      if (axios.isAxiosError(error)) {
        if (error.response?.data?.message) {
          Alert.alert("Error", error.response.data.message);
        } else {
          Alert.alert("Error", "Failed to reset password. Please try again.");
        }
      } else {
        Alert.alert("Error", "An unexpected error occurred.");
      }
    } finally {
      setIsLoading(false);
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
                <View className="flex-1 justify-center items-center">
                  <View className="w-[52] rounded-[12px] h-[52] mb-10 bg-primary justify-center items-center">
                    <FontAwesome name="key" size={28} color={"#ffffff"} />
                  </View>

                  {/*text*/}
                  <Text className="text-2xl font-bold text-center text-black mt-[-10px]">
                    Create New Password
                  </Text>
                  <Text className="text-gray-500 text-center mt-3 mb-6">
                    Please make sure the password is not the same as the
                    previous password.
                  </Text>

                  {/*password */}
                  <View
                    className={`flex-row items-center bg-[#FFFFFF] mb-4 rounded-[14px] p-4 py-5 border ${
                      passwordFocus ? "border-primary" : "border-[#DFDFDF]"
                    }`}
                  >
                    <FontAwesome
                      name="key"
                      size={20}
                      color={passwordFocus ? "#9A563A" : "#DFDFDF"}
                      className="mr-3"
                    />
                    <TextInput
                      placeholder="Password"
                      secureTextEntry={!showPassword}
                      className="flex-1 text-black mb-0.5"
                      onFocus={() => setPasswordFocus(true)}
                      onBlur={() => setPasswordFocus(false)}
                      placeholderTextColor="gray"
                      value={password}
                      style={{
                        height: Platform.OS === "ios" ? 24 : "auto", // Fixed height for iOS
                        paddingVertical: Platform.OS === "ios" ? 0 : 2, // Remove padding on iOS
                        paddingBottom: Platform.OS === "ios" ? 2 : 2, // Add small bottom padding on iOS
                      }}
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

                  <View
                    className={`flex-row items-center bg-[#FFFFFF] mb-4 rounded-[14px] p-4 py-5 border ${
                      passwordConfirmationFocus
                        ? "border-primary"
                        : "border-[#DFDFDF]"
                    }`}
                  >
                    <FontAwesome
                      name="key"
                      size={20}
                      color={passwordConfirmationFocus ? "#9A563A" : "#DFDFDF"}
                      className="mr-3"
                    />
                    <TextInput
                      placeholder="Confirm password"
                      secureTextEntry={!showPassword}
                      className="flex-1 text-black mb-0.5"
                      onFocus={() => setPasswordConfirmationFocus(true)}
                      onBlur={() => setPasswordConfirmationFocus(false)}
                      placeholderTextColor="gray"
                      value={confirmPassword}
                      style={{
                        height: Platform.OS === "ios" ? 24 : "auto", // Fixed height for iOS
                        paddingVertical: Platform.OS === "ios" ? 0 : 2, // Remove padding on iOS
                        paddingBottom: Platform.OS === "ios" ? 2 : 2, // Add small bottom padding on iOS
                      }}
                      onChangeText={setConfirmPassword}
                    />
                  </View>

                  {/*button */}
                  <View className="absolute bottom-6 left-0 right-0 px-4 z-20">
                    {/* Confirm Button */}
                    <TouchableOpacity
                      className="bg-primary py-4 items-center rounded-[14px]"
                      onPress={handleResetPassword}
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <ActivityIndicator color="white" />
                      ) : (
                        <Text className="text-white text-lg font-semibold">
                          Confirm New Password
                        </Text>
                      )}
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
