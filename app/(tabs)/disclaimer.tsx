import React, { useEffect } from "react";
import { View, Text, Image, ScrollView, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Header from "@/app/(tabs)/header2";

const disclaimer = () => {
  const router = useRouter();

  useEffect(() => {
  const checkAuth = async () => {
    const email = await AsyncStorage.getItem("userEmail");
    if (!email) {
      router.replace("/login");
    }
  };
  
  checkAuth();
}, []);

  return (
    <View style={{ flexGrow: 1, backgroundColor: "#fff" }}>
      <Header />

      <View
        style={{
          alignItems: "center",
          marginTop: 100,
          backgroundColor: "#f9f8f8ff",
          marginLeft: 10,
          marginRight: 10,
          padding: 20,
          borderRadius: 10,
        }}
      >
        <Text style={{ color: "#fc4444ff", fontSize: 20, paddingBottom: 10 }}>
          Disclaimer
        </Text>
        <Text style={{ color: "#555555ff", textAlign: "center" }}>
          All information in this application is provided solely to demonstrate
          how AI can be used in healthcare. This information is sourced from AI
          engines like ChatGPT. None of the information has been validated or
          approved by a healthcare professional. Please use this information
          only after consulting and upon the advice of a healthcare
          professional.
        </Text>
        <View style={{ flexDirection: "row", gap: 20, marginTop: 30 }}>
          <TouchableOpacity
            onPress={() => router.push("/dashboard")}
            style={{
              backgroundColor: "#3f9142",
              paddingVertical: 8,
              paddingHorizontal: 12,
              borderRadius: 4,
            }}
          >
            <Text style={{ color: "white" }}>Agree</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push("/")}
            style={{
              backgroundColor: "#cececeff",
              paddingVertical: 8,
              paddingHorizontal: 12,
              borderRadius: 4,
            }}
          >
            <Text>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};
export default disclaimer;
