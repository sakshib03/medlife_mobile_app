import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import Toast from "react-native-toast-message";
import Header from "@/app/(tabs)/header";
import { API_BASE } from "./config";
import { Feather } from "@expo/vector-icons";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";

const Signup = () => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [mobile, setMobile] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const [isFormValid, setIsFormValid] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");
  const [mobileError, setMobileError] = useState("");
  const [secure, setSecure] = useState(true);
  const [secureConfirm, setSecureConfirm] = useState(true);

  useEffect(() => {
    validateForm();
  }, [username, email, password, confirmPassword, mobile]);

  const validateForm = () => {
    const isUsernameValid = username.trim() !== "";
    const isEmailValid = isValidEmail(email);
    const isPasswordValid = isValidPassword(password);
    const isConfirmPasswordValid = validateConfirmPassword();
    const isMobileValid = isValidMobile(mobile);

    setIsFormValid(isUsernameValid && isEmailValid && isPasswordValid && isConfirmPasswordValid && isMobileValid);
  };

  const isValidEmail = (email) => {
    if (!email) return false;

    // Check for uppercase letters
    if (/[A-Z]/.test(email)) {
      setEmailError("Email should not contain capital letters");
      return false;
    }

    // Check basic email format
    const emailRegex = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/;
    const isValid = emailRegex.test(email);

    if (!isValid) {
      setEmailError("Please enter a valid email address");
    } else {
      setEmailError("");
    }

    return isValid;
  };

  const isValidPassword = (password) => {
    if (!password) return false;
    
    // Password validation rules
    const hasMinLength = password.length >= 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    
    let errorMessage = "";
    
    if (!hasMinLength) {
      errorMessage = "Password must be at least 8 characters long";
    } else if (!hasUpperCase) {
      errorMessage = "Password must contain at least one uppercase letter";
    } else if (!hasLowerCase) {
      errorMessage = "Password must contain at least one lowercase letter";
    } else if (!hasNumber) {
      errorMessage = "Password must contain at least one number";
    } else if (!hasSpecialChar) {
      errorMessage = "Password must contain at least one special character";
    }
    
    setPasswordError(errorMessage);
    return errorMessage === "";
  };

  const validateConfirmPassword = () =>{
    if(!confirmPassword) return false;

    if(password !== confirmPassword){
      setConfirmPasswordError("Passwords do not match");
      return false;
    }
    setConfirmPasswordError("");
    return true;
  }

  const isValidMobile = (mobile) => {
    if (!mobile) return false;

    const isValid = /^\d{10,15}$/.test(mobile);

    if (!isValid) {
      setMobileError("Please enter a valid 10-digit mobile number");
    } else {
      setMobileError("");
    }

    return isValid;
  };

  const handleEmailChange = (text) => {
    setEmail(text);

    // Clear error when user starts typing
    if (emailError && text) {
      setEmailError("");
    }
  };

  const handlePasswordChange = (text) => {
    setPassword(text);

    // Clear error when user starts typing
    if (passwordError && text) {
      setPasswordError("");
    }
  };

  const handleConfirmPasswordChange = (text) => {
    setConfirmPassword(text);
    if (confirmPasswordError && text) setConfirmPasswordError("");
  };

  const handleMobileChange = (text) => {
    setMobile(text);

    // Clear error when user starts typing
    if (mobileError && text) {
      setMobileError("");
    }
  };

  const handleSignUp = async () => {
    // Validate all fields again before submission
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
      // Error message is already set by isValidEmail function
      Toast.show({
        type: "error",
        text1: emailError || "Please enter a valid email address",
        position: "top",
        topOffset: 50,
      });
      return;
    }

    if (!isValidPassword(password)) {
      // Error message is already set by isValidPassword function
      Toast.show({
        type: "error",
        text1: passwordError || "Please enter a valid password",
        position: "top",
        topOffset: 50,
      });
      return;
    }

    if (!validateConfirmPassword()) {
      Toast.show({
        type: "error",
        text1: confirmPasswordError || "Passwords do not match",
        position: "top",
        topOffset: 50,
      });
      return;
    }

    if (!isValidMobile(mobile)) {
      // Error message is already set by isValidMobile function
      Toast.show({
        type: "error",
        text1: mobileError || "Please enter a valid mobile number",
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
          email: email.toLowerCase(), 
          password,
          mobile,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Check if the error is about existing user
        if (
          response.status === 409 ||
          data.message?.toLowerCase().includes("already exists")
        ) {
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
        {/* Header */}
        <Header />

        {/* Main Container */}
        <View
          style={{
            flexDirection: "column",
            alignItems: "center",
            paddingTop: 30,
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
            <Text style={{ fontSize: 22, fontWeight: "500", marginBottom: 20 }}>
              Sign Up to Medlife.ai
            </Text>

            <Text
              style={{
                color: "gray",
                fontSize: 14,
                fontWeight: "500",
                marginBottom: 5,
              }}
            >
              Username<Text style={{ color: "red" }}>*</Text>
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
            />

            <Text
              style={{
                color: "gray",
                fontSize: 14,
                fontWeight: "500",
                marginBottom: 5,
              }}
            >
              Email address<Text style={{ color: "red" }}>*</Text>
            </Text>
            <TextInput
              style={{
                borderWidth: 1,
                borderColor: emailError ? "red" : "#ccc",
                borderRadius: 6,
                padding: 10,
                marginBottom: 5,
              }}
              value={email}
              onChangeText={handleEmailChange}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
            {emailError ? (
              <Text style={{ color: "red", fontSize: 12, marginBottom: 10 }}>
                {emailError}
              </Text>
            ) : null}

            <Text
              style={{
                color: "gray",
                fontSize: 14,
                fontWeight: "500",
                marginBottom: 5,
                marginTop: 10,
              }}
            >
              Password<Text style={{ color: "red" }}>*</Text>
            </Text>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                borderWidth: 1,
                borderColor: passwordError ? "red" : "#ccc",
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
                value={password}
                onChangeText={handlePasswordChange}
                secureTextEntry={secure}
                autoCapitalize="none"
              />
              <TouchableOpacity onPress={() => setSecure(!secure)}>
                <Feather
                  name={secure ? "eye-off" : "eye"}
                  size={16}
                  color="gray"
                />
              </TouchableOpacity>
            </View>
            {passwordError ? (
              <Text style={{ color: "red", fontSize: 12, marginBottom: 10 }}>
                {passwordError}
              </Text>
            ) : null}


            {/* Confirm Password */}
            <Text
              style={{
                color: "gray",
                fontSize: 14,
                fontWeight: "500",
                marginTop: 10,
              }}
            >
              Confirm Password<Text style={{ color: "red" }}>*</Text>
            </Text>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                borderWidth: 1,
                borderColor: confirmPasswordError ? "red" : "#ccc",
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
                value={confirmPassword}
                onChangeText={handleConfirmPasswordChange}
                secureTextEntry={secureConfirm}
                autoCapitalize="none"
              />
              <TouchableOpacity onPress={() => setSecureConfirm(!secureConfirm)}>
                <Feather
                  name={secureConfirm ? "eye-off" : "eye"}
                  size={16}
                  color="gray"
                />
              </TouchableOpacity>
            </View>
            {confirmPasswordError ? (
              <Text style={{ color: "red", fontSize: 12, marginBottom: 10 }}>
                {confirmPasswordError}
              </Text>
            ) : null}


            <Text
              style={{
                color: "gray",
                fontSize: 14,
                marginTop:10,
                marginBottom: 5,
                fontWeight: "500",
              }}
            >
              Mobile Number<Text style={{ color: "red" }}>*</Text>
            </Text>
            <TextInput
              style={{
                borderWidth: 1,
                borderColor: mobileError ? "red" : "#ccc",
                borderRadius: 6,
                padding: 10,
                marginBottom: 5,
              }}
              value={mobile}
              onChangeText={handleMobileChange}
              keyboardType="phone-pad"
              maxLength={10}
            />
            {mobileError ? (
              <Text style={{ color: "red", fontSize: 12, marginBottom: 10 }}>
                {mobileError}
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
                  opacity: isLoading ? 0.7 : 1,
                },
                isFormValid && { backgroundColor: "#f4766f" },
              ]}
              onPress={handleSignUp}
              disabled={isLoading || !isFormValid}
            >
              <Text style={{ color: "white", fontWeight: "600" }}>
                {isLoading ? "Creating Account..." : "Sign Up"}
              </Text>
            </TouchableOpacity>

            <Text style={{ color: "gray", marginTop: 15 }}>
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
      </KeyboardAwareScrollView>
      </KeyboardAvoidingView>
      <Toast />
    </>
  );
};

export default Signup;