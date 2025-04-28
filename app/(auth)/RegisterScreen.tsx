import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  SafeAreaView,
  TextInput,
  TouchableOpacity,
  Image,
  Keyboard,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from "react-native";
import React, { useEffect, useState } from "react";
import { images } from "@/constants/Image";
import { useRouter } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Feather, FontAwesome } from "@expo/vector-icons";
import logo from "@/assets/images/logo.png";
import { useNavigation } from "@react-navigation/native";
import axios, { AxiosError } from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import TopRightImage from "@/app/components/TopRightImage";
import Logo from "@/app/components/Logo";
import BottomLeftImage from "@/app/components/BottomLeftImage";
import { API_BASE_URL } from "@/config/api";
import { StackNavigationProp } from "@react-navigation/stack";

const RegisterScreen = () => {
  const router = useRouter();
  const { width, height } = Dimensions.get("window");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [nameFocus, setNameFocus] = useState(false);
  const [emailFocus, setEmailFocus] = useState(false);
  const [passwordFocus, setPasswordFocus] = useState(false);
  const [passwordConfirmationFocus, setPasswordConfirmationFocus] =
    useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigation = useNavigation();

  const handleRegister = async () => {
    if (password !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match");
      return;
    }

    const userData = {
      name,
      email,
      password,
      password_confirmation: confirmPassword,
    };

    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/register`,
        userData
      );
      console.log("Registration successful:", response.data);

      // Store token
      if (response.data.access_token) {
        await AsyncStorage.setItem("access_token", response.data.access_token);
      }

      // Store email for verification screen
      await AsyncStorage.setItem("user_email", email);

      // Check if verification is required
      if (response.data.requires_verification === true) {
        // Store the verification code if it's in the response
        if (response.data.user && response.data.user.verification_code) {
          await AsyncStorage.setItem(
            "verification_code",
            response.data.user.verification_code
          );
        }

        // Use Alert with callback to ensure navigation happens after alert is dismissed
        Alert.alert(
          "Success",
          "Registration successful! Please verify your email.",
          [
            {
              text: "OK",
              onPress: () => {
                // Try multiple navigation methods to ensure it works
                try {
                  router.push("/VerifyScreen");
                } catch (e) {
                  console.log("Router push failed, trying navigation:", e);
                  // Fall back to navigation if router fails
                  // navigation.navigate('VerifyScreen');
                }
              },
            },
          ]
        );
      } else {
        Alert.alert("Success", "Registration successful!", [
          {
            text: "OK",
            onPress: () => {
              router.push("/login");
            },
          },
        ]);
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 422) {
          const errorMessages = Object.values(error.response.data.errors)
            .flat()
            .join("\n");
          Alert.alert("Error", errorMessages);
        } else if (error.response?.data?.message) {
          Alert.alert("Error", error.response.data.message);
        } else {
          Alert.alert("Error", "Registration failed. Please try again.");
        }
      } else if (error instanceof Error) {
        Alert.alert("Error", error.message);
      } else {
        Alert.alert("Error", "An unexpected error occurred.");
      }
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
                  {/*logo*/}
                  <Logo />
                  {/*text*/}
                  <Text className="text-2xl font-bold text-black  mt-[-10px]">
                    Registration Account
                  </Text>
                  <Text className="text-gray-500 mb-6">
                    Let's create your account first
                  </Text>

                  <View
                    className={`flex-row items-center bg-[#FFFFFF] mb-4 rounded-[14px] p-4 py-5 border ${
                      nameFocus ? "border-primary" : "border-[#DFDFDF]"
                    }`}
                  >
                    <FontAwesome
                      name="user"
                      size={20}
                      color={nameFocus ? "#9A563A" : "#DFDFDF"}
                      className="mr-3"
                    />
                    <TextInput
                      placeholder="Full Name"
                      keyboardType="default"
                      className="flex-1 text-black mb-0.5"
                      onFocus={() => setNameFocus(true)}
                      style={{
                        height: Platform.OS === "ios" ? 24 : "auto", // Fixed height for iOS
                        paddingVertical: Platform.OS === "ios" ? 0 : 2, // Remove padding on iOS
                        paddingBottom: Platform.OS === "ios" ? 2 : 2, // Add small bottom padding on iOS
                      }}
                      onBlur={() => setNameFocus(false)}
                      placeholderTextColor="gray"
                      value={name}
                      onChangeText={setName}
                    />
                  </View>

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
                      style={{
                        height: Platform.OS === "ios" ? 24 : "auto", // Fixed height for iOS
                        paddingVertical: Platform.OS === "ios" ? 0 : 2, // Remove padding on iOS
                        paddingBottom: Platform.OS === "ios" ? 2 : 2, // Add small bottom padding on iOS
                      }}
                      onBlur={() => setEmailFocus(false)}
                      placeholderTextColor="gray"
                      value={email}
                      onChangeText={setEmail}
                      autoCapitalize="none" // Ensures all lowercase
                      autoCorrect={false} // Prevents autocorrection
                    />
                  </View>

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
                      style={{
                        height: Platform.OS === "ios" ? 24 : "auto", // Fixed height for iOS
                        paddingVertical: Platform.OS === "ios" ? 0 : 2, // Remove padding on iOS
                        paddingBottom: Platform.OS === "ios" ? 2 : 2, // Add small bottom padding on iOS
                      }}
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
                      style={{
                        height: Platform.OS === "ios" ? 24 : "auto", // Fixed height for iOS
                        paddingVertical: Platform.OS === "ios" ? 0 : 2, // Remove padding on iOS
                        paddingBottom: Platform.OS === "ios" ? 2 : 2, // Add small bottom padding on iOS
                      }}
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                    />
                  </View>

                  <TouchableOpacity
                    className="bg-primary py-5 items-center rounded-[14px]"
                    onPress={handleRegister}
                  >
                    <Text className="text-white text-lg font-semibold">
                      Create Account
                    </Text>
                  </TouchableOpacity>

                  <View className="flex-row justify-center items-center mt-6">
                    <Text className="text-gray-400">
                      Already have an account?
                    </Text>
                    <TouchableOpacity
                      onPress={() => router.push("/LoginScreen")}
                    >
                      <Text className="text-brown-700 font-semibold color-primary ml-1">
                        Login Account
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
};

export default RegisterScreen;
