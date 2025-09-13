import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import Toast from "react-native-toast-message";
import { useRouter } from "expo-router";
import Header from "@/app/(tabs)/header";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_BASE } from "./config";

const resetPassword = () => {
  const [email, setEmail] = useState("");
  const [loginError, setLoginError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const isValidEmail = (email) => {
    // Clear previous error
    setLoginError("");
    
    if (!email) {
      setLoginError("Please enter a valid email address");
      return false;
    }

    if (/[A-Z]/.test(email)) {
      setLoginError("Email should not contain capital letters");
      return false;
    }

    const emailRegex = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/;
    const isValid = emailRegex.test(email);

    if (!isValid) {
      setLoginError("Please enter a valid email address");
      return false;
    }
    
    return true;
  };

  const handleResetPassword = async () => {
    if (!isValidEmail(email)) return;

    setIsLoading(true);
    setLoginError("");

    try {
      const response = await fetch(`${API_BASE}/forgot-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        Toast.show({
          type: "success",
          text1: "Success",
          text2: "OTP sent to your email address",
        });
        
        // Store email for use in change password screen
        await AsyncStorage.setItem("resetEmail", email);
        
        // Navigate to change password page
        router.push("/changePassword");
      } else {
        setLoginError(data.message || "Failed to send OTP. Please try again.");
      }
    } catch (error) {
      console.error("Reset password error:", error);
      setLoginError("Network error. Please check your connection.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          backgroundColor: "#fff",
        }}
      >
        <Header />

        <View
          style={{
            flexDirection: "column",
            alignItems: "center",
            paddingTop: 60,
          }}
        >
          <View
            style={{
              width: "85%",
              minHeight: 360,
              borderWidth: 1,
              borderBlockColor: "#7f7e7eff",
              padding: 20,
              borderRadius: 8,
            }}
          >
            <Text
              style={{
                fontSize: 22,
                fontWeight: "500",
                marginBottom: 20,
              }}
            >
              Password Reset
            </Text>

            <View>
              <View
                style={{
                  borderWidth: 1,
                  borderColor: "#fde499ff",
                  padding: 10,
                  borderRadius: 4,
                  backgroundColor: "#f9f0d6ff",
                }}
              >
                <Text style={{ color: "#4c4c4cff" }}>
                  Forgotten your password? Enter your e-mail address below, and
                  we'll send you an e-mail allowing you to reset it.
                </Text>
              </View>
              <View>
                <Text
                  style={{
                    color: "gray",
                    fontSize: 14,
                    fontWeight: "500",
                    marginBottom: 5,
                    marginTop: 20,
                  }}
                >
                  Email Address
                </Text>
                <TextInput
                  style={{
                    borderWidth: 1,
                    borderRadius: 6,
                    borderColor: loginError ? "red" : "#ccc",
                    color: "black",
                    padding: 10,
                    marginBottom: 5,
                  }}
                  autoCapitalize="none"
                  autoCorrect={false}
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text);
                    // Clear error when user starts typing
                    if (loginError) setLoginError("");
                  }}
                  onSubmitEditing={handleResetPassword}
                  keyboardType="email-address"
                />
                {loginError ? (
                  <Text
                    style={{ color: "red", fontSize: 12, marginBottom: 10 }}
                  >
                    {loginError}
                  </Text>
                ) : null}

                <TouchableOpacity
                  style={{
                    backgroundColor: "#9c9a9aff",
                    padding: 12,
                    borderRadius: 8,
                    alignItems: "center",
                    marginTop: 20,
                    maxWidth: 200,
                    justifyContent: "center",
                    opacity: isLoading ? 0.7 : 1,
                  }}
                  onPress={handleResetPassword}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <Text style={{ color: "white", fontWeight: "bold" }}>
                      Request OTP
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
      <Toast />
    </>
  );
};

export default resetPassword;