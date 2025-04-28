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
import React, { useState } from "react";
import { useRouter } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { FontAwesome } from "@expo/vector-icons";
import TopRightImage from "@/app/components/TopRightImage";
import BottomLeftImage from "@/app/components/BottomLeftImage";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_BASE_URL } from "@/config/api";

export default function ForgotPassword() {
  const router = useRouter();
  const [emailFocus, setEmailFocus] = useState(false);
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Handle forgot password request
  const handleForgotPassword = async () => {
    if (!email) {
      Alert.alert("Error", "Please enter your email address");
      return;
    }

    setIsLoading(true);

    try {
      const response = await axios.post(`${API_BASE_URL}/api/forgot-password`, {
        email,
      });

      console.log("Forgot password response:", response.data);

      // Store email for verification screen
      await AsyncStorage.setItem("reset_email", email);

      // Show success message
      Alert.alert(
        "Success",
        "A verification code has been sent to your email",
        [
          {
            text: "Continue",
            onPress: () => {
              router.push("/ResetVerificationScreen");
            },
          },
        ]
      );
    } catch (error) {
      console.error("Forgot password error:", error);

      if (axios.isAxiosError(error)) {
        if (error.response?.data?.message) {
          Alert.alert("Error", error.response.data.message);
        } else {
          Alert.alert(
            "Error",
            "Failed to send verification code. Please try again."
          );
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
                    <FontAwesome name="lock" size={28} color={"#ffffff"} />
                  </View>

                  {/*text*/}
                  <Text className="text-2xl font-bold text-center text-black mt-[-10px]">
                    Forgot Your Password?
                  </Text>
                  <Text className="text-gray-500 text-center mt-3 mb-6">
                    Please enter your email address account to send the OTP
                    verification to reset your password
                  </Text>

                  <View
                    className={`flex-row items-center bg-[#FFFFFF] mb-4 rounded-[14px] p-4 py-5 border ${
                      emailFocus ? "border-primary" : "border-[#DFDFDF]"
                    }`}
                  >
                    <FontAwesome
                      name="envelope"
                      size={20}
                      color={emailFocus ? "#9A563A" : "#DFDFDF"}
                      className="mr-3"
                    />
                    <TextInput
                      placeholder="Email"
                      keyboardType="email-address"
                      className="flex-1 text-black mb-0.5"
                      onFocus={() => setEmailFocus(true)}
                      onBlur={() => setEmailFocus(false)}
                      placeholderTextColor="gray"
                      style={{
                        height: Platform.OS === "ios" ? 24 : "auto", // Fixed height for iOS
                        paddingVertical: Platform.OS === "ios" ? 0 : 2, // Remove padding on iOS
                        paddingBottom: Platform.OS === "ios" ? 2 : 2, // Add small bottom padding on iOS
                      }}
                      value={email}
                      onChangeText={setEmail}
                      autoCapitalize="none" // Ensures all lowercase
                      autoCorrect={false} // Prevents autocorrection
                    />
                  </View>

                  <View className="flex-row justify-center items-center mt-4">
                    <TouchableOpacity onPress={() => router.push("/help")}>
                      <Text className="text-brown-200 color-primary ml-1">
                        Need Help?
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {/*button */}
                  <View className="absolute bottom-6 left-0 right-0 px-4 z-20">
                    {/* Continue Button */}
                    <TouchableOpacity
                      className="bg-primary py-4 items-center rounded-[14px]"
                      onPress={handleForgotPassword}
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <ActivityIndicator color="white" />
                      ) : (
                        <Text className="text-white text-lg font-semibold">
                          Continue
                        </Text>
                      )}
                    </TouchableOpacity>

                    {/* Back Button */}
                    <TouchableOpacity onPress={() => router.back()}>
                      <Text className="text-black text-center mt-4 mb-3">
                        Back
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
