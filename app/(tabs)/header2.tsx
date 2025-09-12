import React,{useState} from "react";
import { View, Text, Image, TouchableOpacity, Alert } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

const Header = () => {
  const router = useRouter();
  const [showLogoutConfirm, setShowLogoutConfirm]= useState(false);

  const handleLogout=async()=>{
    Alert.alert(
      "Confirm Logout",
      "Are you sure you want to logout:",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text:"Logout",
          onPress: async()=>{
            await AsyncStorage.multiRemove([
            "userEmail", 
            "accessToken", 
            "isLoggedIn",
            "currentMember"
          ]);
            router.dismissAll();
            router.replace("/login");
          },
          style: "destructive"
        }
      ]
    )
  }

  return (
    <View>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          backgroundColor: "#fe6164ff",
          padding: 10,
          justifyContent: "space-between",
          marginTop:40
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Image
            source={require("@/assets/images/v987-18a-removebg-preview.png")}
            style={{ width: 34, height: 34, marginRight: 6 }}
            resizeMode="contain"
          />
          <Text style={{ fontSize: 16, fontWeight: "bold", color: "white" }}>
            MedLife.ai
          </Text>
        </View>

        <TouchableOpacity
          onPress={() => router.push("/")}
          style={{
            flexDirection: "row",
            gap: 6,
            paddingVertical: 8,
            paddingHorizontal: 10,
            borderRadius: 8,
          }}
        >
          <Text style={{ color: "white" }} onPress={handleLogout}>Logout</Text>
          <Feather name="log-out" size={20} color="white" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default Header;
