import React, { useState, useEffect, use } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import Toast from "react-native-toast-message";
import { useRouter } from "expo-router";
import Header from "@/app/(tabs)/header";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_BASE } from "./config";
import { Feather } from "@expo/vector-icons";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";

const changePassword = () => {
  const router = useRouter();
  const [securePassword, setSecurePassword] = useState(true);
  const [secureConfirmPassword, setSecureConfirmPassword] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const [errors, setErrors] = useState({
    email: "",
    otp: "",
    password: "",
    confirmPassword: "",
  });

  const [formData, setFormData] = useState({
    email: "",
    otp_code: "",
    new_password: "",
    confirm_password: "",
  });

  useEffect(() => {
    const getEmail = async () => {
      try {
        const savedEmail = await AsyncStorage.getItem("resetEmail");
        if (savedEmail) {
          setFormData((prev) => ({ ...prev, email: savedEmail }));
        }
      } catch (error) {
        console.error("Error fetching email from storage:", error);
      }
    };
    getEmail();
  }, []);

  const validateForm = () => {
    let valid = true;
    const newErrors = {
      email: "",
      otp: "",
      password: "",
      confirmPassword: "",
    };

    if (!formData.email) {
      newErrors.email = "Email is required";
      valid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
      valid = false;
    }

    if (!formData.otp_code) {
      newErrors.otp = "OTP is required";
      valid = false;
    } else if (formData.otp_code.length !== 6) {
      newErrors.otp = "OTP must be 6 digits";
      valid = false;
    }

    if (!formData.new_password) {
      newErrors.password = "Password is required";
      valid = false;
    } else if (formData.new_password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
      valid = false;
    }

    if (!formData.confirm_password) {
      newErrors.confirmPassword = "New Confirm Password is required";
      valid = false;
    } else if (formData.new_password !== formData.confirm_password) {
      newErrors.confirmPassword = "Passwords do not match";
      valid = false;
    }

    setErrors(newErrors);
    return valid;
  };

  const handleChangePassword = async () => {
    if (!validateForm()) return;

    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE}/reset-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: formData.email,
          otp_code: formData.otp_code,
          new_password: formData.new_password,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        Toast.show({
          type: "success",
          text1: "Success",
          text2: "Password changed successfully",
        });

        // Clear stored email
        await AsyncStorage.removeItem("resetEmail");
        setTimeout(() => {
          router.push("/login");
        }, 1500);
      } else {
        Toast.show({
          type: "error",
          text1: "Error",
          text2: data.message || "Failed to change password. Please try again.",
        });
      }
    } catch (error) {
      console.error("Change password error:", error);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Network error. Please check your connection.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  return (
    <>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <KeyboardAwareScrollView
          contentContainerStyle={{ flexGrow: 1, backgroundColor: "#fff" }}
          enableOnAndroid={true}
          extraScrollHeight={20} // adds little space when keyboard opens
          keyboardShouldPersistTaps="handled"
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
                Change Password
              </Text>

              <View>
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
                      borderColor: errors.email ? "red" : "#ccc",
                      color: "black",
                      padding: 10,
                      marginBottom: 5,
                    }}
                    autoCapitalize="none"
                    autoCorrect={false}
                    value={formData.email}
                    onChangeText={(text) => handleInputChange("email", text)}
                    editable={false}
                  />
                  {errors.email ? (
                    <Text
                      style={{ color: "red", fontSize: 12, marginBottom: 10 }}
                    >
                      {errors.email}
                    </Text>
                  ) : null}

                  <Text
                    style={{
                      color: "gray",
                      fontSize: 14,
                      fontWeight: "500",
                      marginBottom: 5,
                      marginTop: 20,
                    }}
                  >
                    Enter OTP
                  </Text>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      borderWidth: 1,
                      borderColor: errors.otp ? "red" : "#ccc",
                      borderRadius: 6,
                      paddingHorizontal: 10,
                      marginBottom: 5,
                    }}
                  >
                    <TextInput
                      style={{
                        flex: 1,
                        paddingVertical: 10,
                        color: "black",
                      }}
                      autoCapitalize="none"
                      autoCorrect={false}
                      keyboardType="number-pad"
                      value={formData.otp_code}
                      onChangeText={(text) =>
                        handleInputChange("otp_code", text)
                      }
                      maxLength={6}
                    />
                  </View>
                  {errors.otp ? (
                    <Text
                      style={{ color: "red", fontSize: 12, marginBottom: 10 }}
                    >
                      {errors.otp}
                    </Text>
                  ) : null}

                  <Text
                    style={{
                      color: "gray",
                      fontSize: 14,
                      fontWeight: "500",
                      marginBottom: 5,
                      marginTop: 20,
                    }}
                  >
                    New Password
                  </Text>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      borderWidth: 1,
                      borderColor: errors.password ? "red" : "#ccc",
                      borderRadius: 6,
                      paddingHorizontal: 10,
                      marginBottom: 5,
                    }}
                  >
                    <TextInput
                      style={{
                        flex: 1,
                        paddingVertical: 10,
                        color: "black",
                      }}
                      secureTextEntry={securePassword}
                      autoCapitalize="none"
                      value={formData.new_password}
                      onChangeText={(text) =>
                        handleInputChange("new_password", text)
                      }
                    />
                    <TouchableOpacity
                      onPress={() => setSecurePassword(!securePassword)}
                    >
                      <Feather
                        name={securePassword ? "eye-off" : "eye"}
                        size={16}
                        color="gray"
                      />
                    </TouchableOpacity>
                  </View>
                  {errors.password ? (
                    <Text
                      style={{ color: "red", fontSize: 12, marginBottom: 10 }}
                    >
                      {errors.password}
                    </Text>
                  ) : null}

                  <Text
                    style={{
                      color: "gray",
                      fontSize: 14,
                      fontWeight: "500",
                      marginBottom: 5,
                      marginTop: 20,
                    }}
                  >
                    New Password (Confirm)
                  </Text>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      borderWidth: 1,
                      borderColor: errors.confirmPassword ? "red" : "#ccc",
                      borderRadius: 6,
                      paddingHorizontal: 10,
                      marginBottom: 5,
                    }}
                  >
                    <TextInput
                      style={{ flex: 1, paddingVertical: 10, color: "black" }}
                      secureTextEntry={secureConfirmPassword}
                      autoCapitalize="none"
                      value={formData.confirm_password}
                      onChangeText={(text) =>
                        handleInputChange("confirm_password", text)
                      }
                    />
                    <TouchableOpacity
                      onPress={() =>
                        setSecureConfirmPassword(!secureConfirmPassword)
                      }
                    >
                      <Feather
                        name={secureConfirmPassword ? "eye-off" : "eye"}
                        size={16}
                        color="gray"
                      />
                    </TouchableOpacity>
                  </View>
                  {errors.confirmPassword ? (
                    <Text
                      style={{ color: "red", fontSize: 12, marginBottom: 10 }}
                    >
                      {errors.confirmPassword}
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
                    }}
                    onPress={handleChangePassword}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <ActivityIndicator color="white" />
                    ) : (
                      <Text style={{ color: "white", fontWeight: "bold" }}>
                        Change Password
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        </KeyboardAwareScrollView>
      </KeyboardAvoidingView>
      <Toast />
    </>
  );
};

export default changePassword;
