import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import Toast from "react-native-toast-message";
import Header from "@/app/(tabs)/header";
import { API_BASE } from "./config";

const signup = () => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const [isFormValid, setIsFormValid] = useState(false);

  useEffect(() => {
    const isUsernameValid = username.trim() !== "";
    const isEmailValid = isValidEmail(email);
    const isMobileValid = isValidMobile(mobile);

    setIsFormValid(isUsernameValid && isEmailValid && isMobileValid);
  }, [username, email, mobile]);

  const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const isValidMobile = (mobile) => /^\d{10,15}$/.test(mobile);

  const handleSignUp = async () => {
    if (!username.trim()) {
      Toast.show({
        type: "error",
        text1: "Please enter your username",
        position: "top",
        topOffset: 50,
      });
      return;
    }

    if (!isValidEmail(email)) {
      Toast.show({
        type: "error",
        text1: "Please enter a valid email address",
        position: "top",
        topOffset: 50,
      });
      return;
    }

    if (!isValidMobile(mobile)) {
      Toast.show({
        type: "error",
        text1: "Please enter a valid 10-digit mobile number",
        position: "top",
        topOffset: 50,
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE}/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username,
          email,
          mobile,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Check if the error is about existing user
        if (response.status === 409 || data.message?.toLowerCase().includes("already exists")) {
          throw new Error("Account already exists. Please log in.");
        } else if (response.status === 400 && data.message) {
          // Use the server's specific error message
          throw new Error(data.message);
        } else {
          throw new Error(data.message || "Signup failed. Please try again.");
        }
      }

      Toast.show({
        type: "success",
        text1: "Account created successfully!",
        text2: "Redirecting to login...",
        position: "top",
        topOffset: 50,
        onHide: () => router.push("/login"),
      });
    } catch (error) {
      Toast.show({
        type: "error",
        text1: error.message,
        position: "top",
        topOffset: 50,
      });
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
        {/* Header */}
        <Header />

        {/* Main Container */}
        <View
          style={{
            flexDirection: "column",
            alignItems: "center",
            paddingTop: 60,
          }}
        >
          {/* Form */}
          <View
            style={{
              width: "80%",
              borderWidth: 1,
              borderBlockColor: "#7f7e7eff",
              padding: 20,
              borderRadius: 8,
            }}
          >
            <Text style={{ fontSize: 22, fontWeight: 500, marginBottom: 20 }}>
              Sign Up to Medlife.ai
            </Text>

            <Text
              style={{
                color: "gray",
                fontSize: 14,
                fontWeight: 500,
                marginBottom: 5,
              }}
            >
              Username
            </Text>
            <TextInput
              style={{
                borderWidth: 1,
                borderColor: "#ccc",
                borderRadius: 6,
                padding: 10,
                marginBottom: 15,
              }}
              value={username}
              onChangeText={setUsername}
              placeholder="Enter your username"
            />

            <Text
              style={{
                color: "gray",
                fontSize: 14,
                fontWeight: 500,
                marginBottom: 5,
              }}
            >
              Email address
            </Text>
            <TextInput
              style={{
                borderWidth: 1,
                borderColor: "#ccc",
                borderRadius: 6,
                padding: 10,
                marginBottom: 15,
              }}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              placeholder="Enter your email"
            />

            <Text
              style={{
                color: "gray",
                fontSize: 14,
                marginBottom: 5,
                fontWeight: 500,
              }}
            >
              Mobile Number
            </Text>
            <TextInput
              style={{
                borderWidth: 1,
                borderColor: "#ccc",
                borderRadius: 6,
                padding: 10,
                marginBottom: 15,
              }}
              value={mobile}
              onChangeText={setMobile}
              keyboardType="phone-pad"
              maxLength={10}
              placeholder="Enter your mobile number"
            />

            <TouchableOpacity
              style={[
                {
                  backgroundColor: "#9c9a9aff",
                  padding: 12,
                  borderRadius: 8,
                  alignItems: "center",
                  marginTop: 10,
                  opacity: isLoading ? 0.7 : 1,
                },
                isFormValid && { backgroundColor: "#f4766f" }
              ]}
              onPress={handleSignUp}
              disabled={isLoading || !isFormValid}
            >
              <Text style={{ color: "white", fontWeight: "600" }}>
                {isLoading ? "Creating Account..." : "Sign Up"}
              </Text>
            </TouchableOpacity>

            <Text style={{ color: "gray", marginTop: 8 }}>
              Already have an account?{" "}
              <Text
                style={{ color: "blue", textDecorationLine: "underline" }}
                onPress={() => router.push("/login")}
              >
                Log In
              </Text>
            </Text>
          </View>
        </View>
      </ScrollView>
      <Toast />
    </>
  );
};

export default signup;