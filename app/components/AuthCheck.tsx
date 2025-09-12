import { useEffect } from "react";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

const AuthCheck = () => {
  const router = useRouter();

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const isLoggedIn = await AsyncStorage.getItem("isLoggedIn");
      const accessToken = await AsyncStorage.getItem("accessToken");
      const loginTime = await AsyncStorage.getItem("loginTime");

      const isTokenValid =
        loginTime &&
        new Date().getTime() - parseInt(loginTime) < 2 * 24 * 60 * 60 * 1000;

      if (isLoggedIn === "true" && accessToken && isTokenValid) {
        router.replace("/dashboard");
      } else {
        await AsyncStorage.multiRemove([
          "userEmail",
          "accessToken",
          "isLoggedIn",
          "loginTime",
        ]);
        router.dismissAll();
        router.replace("/");
      }
    } catch (error) {
      console.error("Error checking auth status:", error);
      router.replace("/login");
    }
  };
  return null;
};
export default AuthCheck;
