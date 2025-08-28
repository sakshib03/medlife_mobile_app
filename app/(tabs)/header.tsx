import React from "react";
import { View, Text, Image } from "react-native";

const Header = () => {
  return (
    <View style={{ marginBottom: 20 , marginTop:40}}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          backgroundColor: "#fe6164ff",
          padding: 10,
        }}
      >
        <Image
          source={require("@/assets/images/v987-18a-removebg-preview.png")}
          style={{ width: 34, height: 34, marginRight: 6 }}
          resizeMode="contain"
        />
        <Text style={{ fontSize: 16, fontWeight: "bold", color: "white" }}>
          MedLife.ai
        </Text>
      </View>
    </View>
  );
};

export default Header;
