import { useEffect } from "react";
import { useRouter } from "expo-router";
import { API_BASE } from "../(tabs)/config";
import AsyncStorage from "@react-native-async-storage/async-storage";

const AuthCheck = () => {
  const router = useRouter();

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      // small delay to avoid race condition
      await new Promise((res) => setTimeout(res, 150));

      const isLoggedIn = await AsyncStorage.getItem("isLoggedIn");
      const accessToken = await AsyncStorage.getItem("accessToken");
      const loginTime = await AsyncStorage.getItem("loginTime");
      const userEmail = await AsyncStorage.getItem("userEmail");

      const isTokenValid =
        loginTime &&
        new Date().getTime() - parseInt(loginTime) < 30 * 24 * 60 * 60 * 1000;

      if (isLoggedIn === "true" && accessToken && isTokenValid) {
        
        try {
          const response = await fetch(
            `${API_BASE}/getmember?email=${encodeURIComponent(userEmail)}`
          );
          
          if (response.ok) {
            const result = await response.json();
            const members = result.members || [];
            
            if (members.length > 0) {
              // Redirect to chat with the first member
              const firstMember = members[0];
              const memberResponse = await fetch(
                `${API_BASE}/member-details/${encodeURIComponent(
                  userEmail
                )}/${firstMember.memberIndex || 1}`
              );
              
              if (memberResponse.ok) {
                const memberData = await memberResponse.json();
                await AsyncStorage.setItem("currentMember", JSON.stringify(memberData.member));
                
                router.replace({
                  pathname: "/chatInterface",
                  params: { 
                    member: JSON.stringify(memberData.member),
                    memberName: `${firstMember.firstName} ${firstMember.lastName}`.trim()
                  },
                });
                return;
              }
            }
          }
        } catch (error) {
          console.error("Error checking members:", error);
        }

        router.replace("/dashboard");
      } else {
        await AsyncStorage.clear(); 
        router.dismissAll();
        router.replace("/");
      }
    } catch (error) {
      console.error("Error checking auth status:", error);
      router.replace("/");
    }
  };

  return null;
};

export default AuthCheck;
