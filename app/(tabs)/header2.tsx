import React from "react";
import { View, Text, Image, TouchableOpacity } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";

const Header = () => {
  const router = useRouter();

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
          <Text style={{ color: "white" }}>Logout</Text>
          <Feather name="log-out" size={20} color="white" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default Header;
