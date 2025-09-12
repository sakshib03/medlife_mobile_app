import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useRef, useState } from "react";
import {
  Image,
  ImageBackground,
  Pressable,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const index = () => {
  const ScrollViewRef = useRef(null);
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [openIndex, setOpenIndex] = useState(null);

  const scrollToSection = (yPosition) => {
    if (ScrollViewRef.current) {
      ScrollViewRef.current?.scrollTo({ y: yPosition, animated: true });
      setMenuOpen(false);
    }
  };

  const faqs = [
    {
      question: "What is MedLife.ai?",
      answer:
        "MedLife.ai is an AI-powered medical companion that provides accurate medical insights and health information anytime, anywhere.",
    },
    {
      question: "How does the AI work?",
      answer:
        "Our system uses advanced machine learning models trained on medical literature to provide reliable health information.",
    },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: "white" , marginTop:35}}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: 16,
          paddingVertical: 4,
          backgroundColor: "white",
          borderBottomWidth: 1,
          borderBottomColor: "#e5e7eb",
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Image
            source={require("@/assets/images/v987-18a-removebg-preview.png")}
            style={{ width: 34, height: 34, marginRight: 6 }}
            resizeMode="contain"
          />
          <Text style={{ fontSize: 14, fontWeight: "bold", color: "#111827" }}>
            MedLife.ai
          </Text>
        </View>
        <View
          style={{
            paddingVertical: 8,
            flexDirection: "row",
            gap: 6,
            alignItems: "center",
          }}
        >
          <TouchableOpacity
            style={{
              backgroundColor: "#ff5659",
              paddingHorizontal: 14,
              paddingVertical: 6,
              borderRadius: 6,
              paddingBottom: 8,
            }}
            onPress={() => router.push("/login")}
          >
            <Text
              style={{
                color: "white",
                fontWeight: "600",
              }}
            >
              Login
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setMenuOpen(!menuOpen)}>
            <Feather name="menu" size={24} color="black" />
          </TouchableOpacity>
        </View>
      </View>

      {menuOpen && (
        <View
          style={{
            position: "absolute",
            top: 50,
            right: 16,
            backgroundColor: "white",
            paddingHorizontal: 20,
            paddingVertical: 8,
            shadowOffset: {
              width: 0,
              height: 2,
            },
            shadowOpacity: 0.25,
            shadowRadius: 3.84,
            elevation: 5,
            zIndex: 100,
            width: 200,
          }}
        >
          {[
            { label: "Home", pos: 0 },
            { label: "Features", pos: 500 },
            { label: "FAQs", pos: 1450 },
            { label: "Contact", pos: 2000 },
          ].map((item, index) => (
            <Pressable
              key={index}
              onPress={() => scrollToSection(item.pos)}
              style={({ pressed }) => ({
                backgroundColor: pressed ? "#f3f4f6" : "transparent",
                borderRadius: 4,
                paddingVertical: 8,
                paddingHorizontal: 8,
              })}
            >
              <Text
                style={{
                  color: "#1f2937",
                  fontWeight: "600",
                }}
              >
                {item.label}
              </Text>
            </Pressable>
          ))}
        </View>
      )}

      <ScrollView ref={ScrollViewRef} showsVerticalScrollIndicator={false}>
        <ImageBackground
          source={require("@/assets/images/images/image.png")}
          style={{
            height: 500,
            justifyContent: "center",
          }}
          imageStyle={{
            width: "100%",
            height: 500,
            resizeMode: "cover",
          }}
        >
          <Text
            style={{
              fontSize: 32,
              fontWeight: "bold",
              color: "#1f2937",
              lineHeight: 40,
              paddingHorizontal: 24,
            }}
          >
            Your Medical {"\n"}
            Companion, {"\n"}
            <Text style={{ color: "#ff5659" }}>Any</Text>time, {"\n"}
            <Text style={{ color: "#ff5659" }}>Any</Text>where...
          </Text>

          <Text
            style={{ marginTop: 12, color: "#6b7280", paddingHorizontal: 24 }}
          >
            Revolutionizing healthcare through cutting-edge AI, tailored to
            provide you with accurate medical insights.
          </Text>

          <TouchableOpacity style={{ paddingHorizontal: 24 }}>
            <View
              style={{
                backgroundColor: "#fe6164ff",
                alignItems: "center",
                height: 60,
                width: 220,
                marginTop: 20,
                padding: 10,
                paddingBottom: 8,
                borderRadius: 8,
              }}
            >
              <Text
                style={{
                  color: "white",
                  fontWeight: "600",
                }}
              >
                Choose Your Plan & Empower Your Health
              </Text>
            </View>
          </TouchableOpacity>
        </ImageBackground>

        <View
          style={{
            backgroundColor: "white",
            paddingVertical: 24,
            paddingHorizontal: 16,
          }}
        >
          <Text
            style={{
              fontSize: 20,
              fontWeight: "600",
              textAlign: "center",
              marginBottom: 16,
            }}
          >
            Features Highlights
          </Text>
          <View style={{ alignItems: "center", marginBottom: 16 }}>
            <Image
              source={require("@/assets/images/Group.png")}
              style={{
                width: 320,
                height: 240,
              }}
              resizeMode="contain"
            />
          </View>
          {[
            {
              icon: require("@/assets/images/welcome-assets/img12.png"),
              title: "Instant Feedback",
              desc: "Don't wait for appointments. Get your queries addressed immediately.",
            },
            {
              icon: require("@/assets/images/welcome-assets/img11.png"),
              title: "Powered by AI Engines",
              desc: "We leverage the most sophisticated AI platforms to deliver precise responses.",
            },
            {
              icon: require("@/assets/images/welcome-assets/img12.png"),
              title: "Data Security",
              desc: "Your health information is safe with us. We prioritize data privacy and ensure its encrypted storage and transfer.",
            },
            {
              icon: require("@/assets/images/welcome-assets/img13.png"),
              title: "Download & Share",
              desc: "Save your chat interactions like a medical journal at your fingertips.",
            },
            {
              icon: require("@/assets/images/welcome-assets/img14.png"),
              title: "User-Friendly Interface",
              desc: "Straightforward and efficient for all age groups.",
            },
            {
              icon: require("@/assets/images/welcome-assets/img11.png"),
              title: "Powered by AI Engines",
              desc: "We leverage the most sophisticated AI platforms to deliver precise responses.",
            },
          ].map((item, idx) => (
            <View
              key={idx}
              style={{
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: "#fceeeb",
                padding: 16,
                borderRadius: 12,
                marginBottom: 12,
              }}
            >
              <Image
                source={item.icon}
                style={{
                  width: 32, // w-8
                  height: 32, // h-8
                  marginRight: 12,
                  borderRadius: 50,
                }}
                resizeMode="contain"
              />
              <View style={{ flex: 1 }}>
                <Text style={{ fontWeight: "600" }}>{item.title}</Text>
                <Text style={{ color: "#6b7280", fontSize: 14 }}>
                  {item.desc}
                </Text>
              </View>
            </View>
          ))}
        </View>

        <View style={{ backgroundColor: "white", width: "100%", padding: 10 }}>
          <Text
            style={{
              textAlign: "center",
              fontSize: 20,
              marginBottom: 30,
              color: "#222",
              fontWeight: 600,
            }}
          >
            FAQs
          </Text>
          <View style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {faqs.map((faq, index) => (
              <View
                key={index}
                style={{
                  borderWidth: 1,
                  borderColor: openIndex === index ? "#ff5659" : "#e0e0e0",
                  borderRadius: 10,
                  backgroundColor: "#f4f9fa",
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.08,
                  shadowRadius: 6,
                  elevation: 3,
                }}
              >
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() =>
                    setOpenIndex(openIndex === index ? null : index)
                  }
                  style={{
                    padding: 18,
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Text
                    style={{
                      fontSize: 16,
                      fontWeight: "500",
                      color: "#333",
                      flex: 1,
                      paddingRight: 10,
                    }}
                  >
                    {faq.question}
                  </Text>
                  {openIndex === index ? (
                    <Feather name="chevron-up" size={22} color="#666" />
                  ) : (
                    <Feather name="chevron-down" size={22} color="#666" />
                  )}
                </TouchableOpacity>
                {openIndex === index && (
                  <View style={{ paddingHorizontal: 22, paddingBottom: 18 }}>
                    <Text
                      style={{ color: "#555", fontSize: 15, lineHeight: 22 }}
                    >
                      {faq.answer}
                    </Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        </View>

        {/* PRICING */}
        {/* <View style={{ backgroundColor: "#fff", paddingVertical: 24, paddingHorizontal: 16 }}>
  <Text style={{ fontSize: 20, fontWeight: "600", textAlign: "center", marginBottom: 8 }}>
    Plans and Pricing
  </Text>
  <Text style={{ color: "#6b7280", textAlign: "center", marginBottom: 20 }}>
    Simple, transparent pricing that scales with your usage
  </Text>

  {[
    {
      title: "Essential",
      price: "$0",
      features: ["5K free credits", "Pay as you go $0.004/credit"],
    },
    {
      title: "Growth",
      price: "$100",
      features: ["5K free credits", "Dedicated support"],
    },
    { title: "Enterprise", 
      price: "Contact us", 
      features: ["5K free credits", "5K free credits", "5K free credits"] },
  ].map((plan, idx) => (
    <View
      key={idx}
      style={{
        borderWidth: 1,
        borderColor: "#d1d5db",
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        backgroundColor: "#fff",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
      }}
    >
      <Text style={{ fontWeight: "bold", fontSize: 16, marginBottom: 4 }}>
        {plan.title}
      </Text>
      <Text style={{ fontSize: 18, fontWeight: "600", marginBottom: 8 }}>
        {plan.price}
      </Text>
      {plan.features.map((f, i) => (
        <Text key={i} style={{ fontSize: 14, color: "#4b5563", marginBottom: 4 }}>
          ✔ {f}
        </Text>
      ))}
    </View>
  ))}
</View>*/}

        <View
          style={{
            backgroundColor: "#3e495aff", // gray-800
            padding: 22,
            marginTop: 20,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginBottom: 12,
              borderBottomWidth: 1,
              borderBlockColor: "white",
              paddingBottom: 25,
            }}
          >
            <Image
              source={require("@/assets/images/v987-18a-removebg-preview.png")}
              style={{ width: 34, height: 34, marginRight: 6 }}
              resizeMode="contain"
            />
            <Text style={{ fontSize: 14, fontWeight: "bold", color: "white" }}>
              MedLife.ai
            </Text>
          </View>

          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginBottom: 8,
              paddingTop: 14,
            }}
          >
            <Feather name="map-pin" size={16} color="white" />
            <Text style={{ color: "white", marginLeft: 8 }}>
              1777 West Street, Canada, OR 97205
            </Text>
          </View>

          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginBottom: 8,
            }}
          >
            <Feather name="phone" size={16} color="white" />
            <Text style={{ color: "white", marginLeft: 8 }}>
              (+1) 123 456 7893
            </Text>
          </View>

          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginBottom: 8,
            }}
          >
            <Feather name="mail" size={16} color="white" />
            <Text style={{ color: "white", marginLeft: 8 }}>
              vikram@vikramsethi.com
            </Text>
          </View>

          <View
            style={{
              flexDirection: "row",
              marginTop: 16,
              marginBottom: 35,
              borderBottomWidth: 1,
              borderBlockColor: "white",
              paddingBottom: 30,
            }}
          >
            <View style={{ marginRight: 12 }}>
              <Feather name="facebook" size={22} color="white" />
            </View>
            <View style={{ marginRight: 12 }}>
              <Feather name="twitter" size={22} color="white" />
            </View>
            <View style={{ marginRight: 12 }}>
              <Feather name="linkedin" size={22} color="white" />
            </View>
            <Feather name="youtube" size={22} color="white" />
          </View>

          <View>
            <Text style={{ color: "white", fontSize: 20 }}>
              Would you like to talk about your Health?
            </Text>

            <TouchableOpacity>
              <View
                style={{
                  backgroundColor: "#eb3e41ff",
                  alignItems: "center",
                  height: 40,
                  width: 130,
                  marginTop: 24,
                  padding: 10,
                  borderRadius: 8,
                  marginBottom:20
                }}
              >
                <Text
                  style={{
                    color: "white",
                    fontWeight: "500",
                  }}
                >
                  Try Our AI Bot -
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

export default index;
