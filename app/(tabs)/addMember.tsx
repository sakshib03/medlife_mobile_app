import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ScrollView,
  Modal,
  Pressable,
} from "react-native";
import Toast from "react-native-toast-message";
import { useRouter, useLocalSearchParams } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Header from "@/app/(tabs)/header2";
import { Feather } from "@expo/vector-icons";
import { API_BASE } from "./config";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";

const AddMember = () => {
  const router = useRouter();
  const params = useLocalSearchParams();

  const initialFormData = {
    firstName: "",
    lastName: "",
    dob: "",
    race: "",
    gender: "",
    height: "",
    weight: "",
    a1c: "",
    bloodPressure: "",
    bmi: "",
    zip_code: "",
    prescription: "",
  };

  const [formData, setFormData] = useState(initialFormData);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isOpenOption, setIsOpenOption] = useState(false);

  const handlePrescription = () => {
    setIsOpenOption((prev) => !prev);
  };

  const handleTakePhoto=async()=>{
    try{
      const {status} =await ImagePicker.requestCameraPermissionsAsync();
      if(status !== "granted"){
        alert("Sorry, we need camera permissions to make this work!");
        return;
      }
      const result=await ImagePicker.launchCameraAsync({
        allowsEditing:true,
        aspect: [4,3],
        quality:1,
      });

      if(!result.canceled){
        handleChange("prescription", result.assets[0].uri);
      }
    }catch (error) {
    console.error(error);
    Toast.show({
      type: "error",
      text1: "Error",
      text2: error?.message || "Failed to open camera",
    });
  }
  }

  const handleChoosePhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
    });
    if (!result.canceled) {
      console.log("Selected Image:", result.assets[0].uri);
    }
    setIsOpenOption(false);
  };

  const handleAddFile = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: "*/*",
      copyToCacheDirectory: true,
    });
    if (result.type === "success") {
      console.log("Selected File:", result.uri);
    }
    setIsOpenOption(false);
  };

  useEffect(() => {
    if (params.member) {
      try {
        const memberData = JSON.parse(params.member);
        setFormData((prev) => ({ ...prev, ...memberData }));
        setIsEditMode(true);
      } catch (error) {
        console.error("Error parsing member data:", error);
      }
    }
  }, [params.member]);

  const handleChange = (key, value) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const safeNumberText = (v) => {
    if (!v) return "";
    const n = String(v).replace(/[^\d.]/g, "");
    return n;
  };

  const validateForm = () => {
    // Basic validation - you can expand this as needed
    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "First name and last name are required",
      });
      return false;
    }
    return true;
  };

  const buildMemberPayload = async () => {
    const email = (await AsyncStorage.getItem("userEmail")) || "";
    return {
      email,
      firstName: (formData.firstName || "").trim(),
      lastName: (formData.lastName || "").trim(),
      dob: (formData.dob || "").trim(),
      race: (formData.race || "").trim(),
      gender: (formData.gender || "").trim(),
      height: safeNumberText(formData.height),
      weight: safeNumberText(formData.weight),
      a1c: (formData.a1c || "").trim(),
      bloodPressure: (formData.bloodPressure || "").trim(),
      medicine: (formData.prescription || "").trim(),
      bmi: safeNumberText(formData.bmi),
      zip_code: (formData.zip_code || "").trim(),
    };
  };

  const addMember = async () => {
    if (!validateForm()) return;

    try {
      const memberData = await buildMemberPayload();
      const response = await fetch(`${API_BASE}/addmember`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(memberData),
      });

      const data = await response.json();

      if (response.ok) {
        Toast.show({
          type: "success",
          text1: "Member Added",
          text2: "The new member was added successfully!",
        });
        // Navigate back to dashboard which will refresh the data
        router.replace("/dashboard");
      } else {
        Toast.show({
          type: "error",
          text1: "Failed",
          text2: data.detail || "Something went wrong. Please try again.",
        });
      }
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: error.message,
      });
    }
  };

  const editMember = async () => {
    if (!validateForm()) return;

    try {
      const email = (await AsyncStorage.getItem("userEmail")) || "";
      const memberData = await buildMemberPayload();

      const response = await fetch(
        `${API_BASE}/editmember?email=${encodeURIComponent(
          email
        )}&member_name=${encodeURIComponent(
          (formData.firstName || "") + "," + (formData.lastName || "")
        )}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(memberData),
        }
      );

      const data = await response.json();

      if (response.ok) {
        Toast.show({
          type: "success",
          text1: "Member Updated",
          text2: "Member updated successfully!",
        });
        router.replace("/dashboard");
      } else {
        Toast.show({
          type: "error",
          text1: "Failed",
          text2: data.detail || "Failed to update member",
        });
      }
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: error.message,
      });
    }
  };

  const handleSubmit = () => {
    if (isEditMode) {
      editMember();
    } else {
      addMember();
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#cdd4e3ff" }}>
      <Header />

      <ScrollView contentContainerStyle={{ padding: 10 }}>
        {/* Instruction */}
        <View style={{ marginBottom: 18 }}>
          <Text
            style={{
              color: "#213e5dff",
              fontSize: 14,
              fontWeight: "500",
              textAlign: "center",
            }}
          >
            Begin by filling all the fields below and then press CONFIRM
          </Text>
        </View>

        {/* Two forms side by side */}
        <View
          style={{ flexDirection: "column", justifyContent: "space-between" }}
        >
          {/* Personal Info */}
          <View style={[styles.container, { marginBottom: 10 }]}>
            <Text style={styles.title}>Personal Information</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>First Name</Text>
              <TextInput
                style={styles.input}
                placeholderTextColor="gray"
                placeholder="John"
                value={formData.firstName}
                onChangeText={(text) => handleChange("firstName", text)}
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Last Name</Text>
              <TextInput
                style={styles.input}
                placeholder="Smith"
                value={formData.lastName}
                placeholderTextColor="gray"
                onChangeText={(text) => handleChange("lastName", text)}
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>DOB</Text>
              <TextInput
                style={styles.input}
                placeholder="YYYY/MM/DD"
                value={formData.dob}
                placeholderTextColor="gray"
                onChangeText={(text) => handleChange("dob", text)}
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Race</Text>
              <TextInput
                style={styles.input}
                placeholder="Asian Indian"
                value={formData.race}
                placeholderTextColor="gray"
                onChangeText={(text) => handleChange("race", text)}
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Gender</Text>
              <TextInput
                style={styles.input}
                placeholder="Male"
                value={formData.gender}
                placeholderTextColor="gray"
                onChangeText={(text) => handleChange("gender", text)}
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Zip Code</Text>
              <TextInput
                style={styles.input}
                placeholder="43001"
                value={formData.zip_code}
                placeholderTextColor="gray"
                onChangeText={(text) => handleChange("zip_code", text)}
                keyboardType="numeric"
              />
            </View>
          </View>

          {/* Medical Info */}
          <View style={styles.container}>
            <Text style={styles.title}>Medical Information</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Height</Text>
              <TextInput
                style={styles.input}
                placeholder="5.10ft"
                value={formData.height}
                placeholderTextColor="gray"
                onChangeText={(text) => handleChange("height", text)}
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Weight</Text>
              <TextInput
                style={styles.input}
                placeholder="200lbs"
                value={formData.weight}
                placeholderTextColor="gray"
                onChangeText={(text) => handleChange("weight", text)}
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>A1C</Text>
              <TextInput
                style={styles.input}
                placeholder="10.5"
                value={formData.a1c}
                placeholderTextColor="gray"
                onChangeText={(text) => handleChange("a1c", text)}
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Blood Pressure</Text>
              <TextInput
                style={styles.input}
                placeholder="150/90"
                value={formData.bloodPressure}
                placeholderTextColor="gray"
                onChangeText={(text) => handleChange("bloodPressure", text)}
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>BMI</Text>
              <TextInput
                style={styles.input}
                placeholder="29"
                value={formData.bmi}
                placeholderTextColor="gray"
                onChangeText={(text) => handleChange("bmi", text)}
              />
            </View>
          </View>
        </View>

        {/* Prescription */}
        <View style={{ width: "100%", marginVertical: 10 }}>
          <Text style={{ textAlign: "center", marginBottom: 5 }}>
            Prescription
          </Text>

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.textInput}
              placeholder="Metformin, Januvia, Aspirin, etc..."
              value={formData.prescription}
              placeholderTextColor="gray"
              onChangeText={(text) => handleChange("prescription", text)}
              multiline
            />
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => setIsOpenOption(true)}
            >
              <Feather name="plus" size={24} color="#5a5b5aff" />
            </TouchableOpacity>
          </View>

          {/* Modal for Options */}
          <Modal
            visible={isOpenOption}
            transparent
            animationType="fade"
            onRequestClose={() => setIsOpenOption(false)}
          >
            <View style={styles.modalBackground}>
              <View style={styles.modalBox}>
                <TouchableOpacity
                  style={styles.option}
                  onPress={handleTakePhoto}
                >
                  <Text style={styles.optionText}>Take Photo</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.option}
                  onPress={handleChoosePhoto}
                >
                  <Text style={styles.optionText}>Choose Photo</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.option} onPress={handleAddFile}>
                  <Text style={styles.optionText}>Add File</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.option,
                    { borderTopWidth: 1, borderColor: "#ddd" },
                  ]}
                  onPress={() => setIsOpenOption(false)}
                >
                  <Text style={[styles.optionText, { color: "red" }]}>
                    Cancel
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        </View>

        {/* Buttons */}
        <View style={{ flexDirection: "row", justifyContent: "center" }}>
          <TouchableOpacity
            onPress={handleSubmit}
            style={{
              backgroundColor: "#3f9142",
              paddingVertical: 10,
              paddingHorizontal: 16,
              borderRadius: 6,
              marginRight: 10,
            }}
          >
            <Text style={{ color: "white", fontWeight: "500" }}>
              {isEditMode ? "Update Member" : "Add Member"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push("/dashboard")}
            style={{
              backgroundColor: "#e63f3fff",
              paddingVertical: 10,
              paddingHorizontal: 16,
              borderRadius: 6,
            }}
          >
            <Text style={{ color: "white" }}>Cancel</Text>
          </TouchableOpacity>
        </View>
        <View style={{ marginTop: 20 }}>
          <Text style={{ textAlign: "center", color: "gray" }}>
            © Vikram Sethi Contact : vikram@vikramsethi.com
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#f4f6faff",
    width: "100%",
    borderRadius: 12,
    padding: 10,
  },
  title: {
    color: "#FF6B6B",
    textAlign: "center",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
  },
  inputGroup: {
    marginTop: 10,
  },
  label: {
    fontSize: 14,
    fontWeight: "400",
    marginBottom: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 6,
    padding: 6,
    marginBottom: 5,
  },
  inputContainer: {
    flexDirection: "row",
    backgroundColor: "#f4f6faff",
    borderRadius: 8,
    alignItems: "center",
  },
  textInput: {
    padding: 6,
    margin: 8,
    borderRadius: 6,
    minHeight: 80,
    width: "80%",
    textAlignVertical: "top",
  },
  addButton: {
    padding: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  modalBackground: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalBox: {
    backgroundColor: "white",
    width: "80%",
    borderRadius: 12,
    paddingVertical: 10,
    elevation: 5,
  },
  option: {
    padding: 15,
  },
  optionText: {
    fontSize: 16,
    color: "#333",
    textAlign: "center",
  },
});

export default AddMember;
