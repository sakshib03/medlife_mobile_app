import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import Toast from "react-native-toast-message";
import { useRouter } from "expo-router";
import Header from "@/app/(tabs)/header";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_BASE } from "./config";
import {useAuth} from '../context/AuthContext';

const Login = () => {
  const [login, setLogin] = useState("");
  const [otp, setOtp] = useState(Array(6).fill(""));
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const inputsRef = useRef([]);
  const [isFormValid, setIsFormValid] = useState(false);
  const [isOtpComplete, setIsOtpComplete] = useState(false);
  const [loginError, setLoginError] = useState("");

  useEffect(() => {
    validateLoginInput();
  }, [login]);

  useEffect(() => {
    setIsOtpComplete(otp.every(digit => digit !== "") && otp.length === 6);
  }, [otp]);

  const isValidEmail = (email) => {
    // Check if email contains any uppercase letters
    if (/[A-Z]/.test(email)) {
      setLoginError("Email should not contain capital letters");
      return false;
    }
    
    // Check basic email format
    const emailRegex = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/;
    const isValid = emailRegex.test(email);
    
    if (!isValid) {
      setLoginError("Please enter a valid email address");
    } else {
      setLoginError("");
    }
    
    return isValid;
  };

  const isValidPhone = (phone) => {
    const isValid = /^\d{10,15}$/.test(phone);
    
    // if (!isValid) {
    //   setLoginError("Please enter a valid phone number");
    // } else {
    //   setLoginError("");
    // }
    
    return isValid;
  };

  const getLoginChannel = () => {
    const trimmed = login.trim().toLowerCase(); // Convert to lowercase for consistency
    const isEmail = trimmed.includes("@");
    const type = isEmail ? "email" : "sms";
    const identifier = isEmail ? trimmed : trimmed;
    return { type, identifier, isEmail };
  };

  const validateLoginInput = () => {
    const trimmedLogin = login.trim();
    
    if (!trimmedLogin) {
      setIsFormValid(false);
      setLoginError("");
      return false;
    }
    
    const isEmail = trimmedLogin.includes("@");
    
    if (isEmail) {
      setIsFormValid(isValidEmail(trimmedLogin));
    } else {
      setIsFormValid(isValidPhone(trimmedLogin));
    }
    
    return isFormValid;
  };

  const handleLoginChange = (text) => {
    setLogin(text);
    
    // Clear error when user starts typing
    if (loginError && text) {
      setLoginError("");
    }
  };

  const startCountdown = (secs = 60) => {
    setCountdown(secs);
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleRequestOTP = async () => {
    if (!validateLoginInput()) {
      if (!login.trim()) {
        Toast.show({
          type: "error",
          text1: "Please enter your email or phone number.",
        });
      }
      return;
    }

    const { type, identifier, isEmail } = getLoginChannel();
    setIsLoading(true);

    try {
      const res = await fetch(`${API_BASE}/signin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, identifier }),
      });
      const data = await res.json();

      if (res.ok) {
        Toast.show({
          type: "success",
          text1: "OTP sent successfully!",
        });
        setOtpSent(true);
        setStep(2);
        startCountdown(60);
      } else {
        if (data.detail?.includes("not found")) {
          Toast.show({
            type: "error",
            text1: "Account not found. Please register first.",
          });
        } else {
          Toast.show({
            type: "error",
            text1: data.detail || "Failed to send OTP",
          });
        }
      }
    } catch (err) {
      Toast.show({
        type: "error",
        text1: "Network error. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    const code = otp.join("");
    if (!isOtpComplete) {
      Toast.show({
        type: "error",
        text1: "Please enter a valid 6-digit OTP",
      });
      return;
    }

    const { type, identifier } = getLoginChannel();
    setIsLoading(true);

    try {
      const res = await fetch(`${API_BASE}/verify-login-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          identifier,
          otp_code: code,
        }),
      });
      const data = await res.json();

      if (res.ok) {
        await AsyncStorage.setItem("userEmail", identifier);
        await AsyncStorage.setItem("accessToken", data.access_token);
      
        Toast.show({
          type: "success",
          text1: "Login successful!",
          visibilityTime: 2000,
          onHide: () => router.replace("/disclaimer"),
        });
      } else {
        Toast.show({
          type: "error",
          text1: data.detail || "OTP verification failed",
        });
      }
    } catch (err) {
      Toast.show({
        type: "error",
        text1: "Network error. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (value, index) => {
    if (/^\d*$/.test(value)) {
      const newOtp = [...otp];
      newOtp[index] = value;
      setOtp(newOtp);

      if (value && index < 5) {
        inputsRef.current[index + 1]?.focus();
      }
    }
  };

  const handleKeyPress = (e, index) => {
    if (e.nativeEvent.key === "Backspace" && !otp[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
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
              Login to Medlife.ai
            </Text>

            <View>
              {step === 1 ? (
                <View>
                  <Text
                    style={{
                      color: "gray",
                      fontSize: 14,
                      fontWeight: "400",
                      marginBottom: 5,
                      marginTop: 20,
                    }}
                  >
                    Enter email address
                  </Text>
                  <TextInput
                    style={{
                      borderWidth: 1,
                      borderColor: loginError ? "red" : "#ccc",
                      borderRadius: 6,
                      padding: 10,
                      marginBottom: 5,
                    }}
                    value={login}
                    onChangeText={handleLoginChange}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  {loginError ? (
                    <Text style={{ color: "red", fontSize: 12, marginBottom: 10 }}>
                      {loginError}
                    </Text>
                  ) : null}

                  <TouchableOpacity
                    style={[
                      {
                        backgroundColor: "#9c9a9aff",
                        padding: 12,
                        borderRadius: 8,
                        alignItems: "center",
                        marginTop: 10,
                      },
                      isFormValid && { backgroundColor: "#f4766f" },
                    ]}
                    onPress={handleRequestOTP}
                    disabled={!isFormValid || isLoading}
                  >
                    <Text style={{ color: "white", fontWeight: "600" }}>
                      {isLoading ? "Sending..." : "Request OTP"}
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View>
                  <Text style={{ fontSize: 14, marginBottom: 10 }}>
                    OTP sent to {login}. Please check your{" "}
                    {login.includes("@") ? "email" : "phone"}
                  </Text>

                  <Text style={{ color: "gray", fontSize: 14, marginTop: 20 }}>
                    Enter OTP
                  </Text>
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      marginBottom: 15,
                      marginTop: 10,
                    }}
                  >
                    {otp.map((digit, index) => (
                      <TextInput
                        key={index}
                        ref={(ref) => (inputsRef.current[index] = ref)}
                        style={{
                          width: 40,
                          height: 50,
                          textAlign: "center",
                          fontSize: 20,
                          borderWidth: 1,
                          borderColor: "#ccc",
                          borderRadius: 5,
                        }}
                        maxLength={1}
                        keyboardType="numeric"
                        value={digit}
                        onChangeText={(value) => handleChange(value, index)}
                        onKeyPress={(e) => handleKeyPress(e, index)}
                      />
                    ))}
                  </View>
                  {countdown > 0 && (
                    <Text style={{ fontSize: 12, color: "gray", marginBottom: 10 }}>
                      OTP expires in {Math.floor(countdown / 60)}:
                      {(countdown % 60).toString().padStart(2, "0")}
                    </Text>
                  )}

                  <TouchableOpacity
                    style={[
                      {
                        backgroundColor: "#9c9a9aff",
                        padding: 12,
                        borderRadius: 8,
                        alignItems: "center",
                        marginTop: 20,
                      },
                      isOtpComplete && { backgroundColor: "#f4766f" },
                    ]}
                    onPress={handleVerifyOTP}
                    disabled={!isOtpComplete || isLoading}
                  >
                    <Text style={{ color: "white", fontWeight: "bold" }}>
                      {isLoading ? "Verifying..." : "Verify OTP"}
                    </Text>
                  </TouchableOpacity>

                  {countdown <= 0 && (
                    <TouchableOpacity
                      style={{
                        marginTop: 15,
                        alignItems: "flex-start",
                      }}
                      onPress={handleRequestOTP}
                    >
                      <Text style={{ color: "blue", fontSize: 14 }}>
                        Resend OTP
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </View>
            <Text style={{ color: "gray", marginTop: 20 }}>
              Don't have an account?{" "}
              <Text
                style={{ color: "blue", textDecorationLine: "underline" }}
                onPress={() => router.push("/signup")}
              >
                Sign Up
              </Text>
            </Text>
          </View>
        </View>
      </ScrollView>
      <Toast />
    </>
  );
};

export default Login;