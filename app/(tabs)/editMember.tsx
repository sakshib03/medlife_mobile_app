import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
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

const EditMember = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
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
  });
  const [memberIndex, setMemberIndex] = useState(1);
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
        setFormData({
          firstName: memberData.firstName || "",
          lastName: memberData.lastName || "",
          dob: memberData.dob || "",
          race: memberData.race || "",
          gender: memberData.gender || "",
          height: memberData.height || "",
          weight: memberData.weight || "",
          a1c: memberData.a1c || "",
          bloodPressure: memberData.bloodPressure || "",
          bmi: memberData.bmi || "",
          zip_code: memberData.zip_code || "",
          prescription: memberData.medicine || memberData.prescription || "",
        });

        // Set the member index for API call
        setMemberIndex(memberData.memberIndex || 1);
      } catch (error) {
        console.error("Error parsing member data:", error);
        Toast.show({
          type: "error",
          text1: "Error",
          text2: "Failed to load member data",
        });
      }
    }
  }, [params.member]);

  const handleChange = (key, value) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const validateForm = () => {
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

  const editMember = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);
      const email = (await AsyncStorage.getItem("userEmail")) || "";

      // Build the payload according to your API requirements
      const payload = {
        email: email,
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        dob: formData.dob.trim(),
        race: formData.race.trim(),
        gender: formData.gender.trim(),
        height: formData.height,
        weight: formData.weight,
        a1c: formData.a1c.trim(),
        bloodPressure: formData.bloodPressure.trim(),
        medicine: formData.prescription.trim(),
        bmi: formData.bmi,
        zip_code: formData.zip_code.trim(),
      };

      console.log("Sending payload:", payload);
      console.log("Member index:", memberIndex);

      const response = await fetch(
        `${API_BASE}/editmember?member_index=${memberIndex}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      const data = await response.json();
      console.log("API Response:", data);

      if (response.ok) {
        Toast.show({
          type: "success",
          text1: "Member Updated",
          text2: "Member updated successfully!",
        });
        setTimeout(() => {
          router.replace("/dashboard");
        }, 2000);
      } else {
        Toast.show({
          type: "error",
          text1: "Failed",
          text2: data.detail || data.message || "Failed to update member",
        });
      }
    } catch (error) {
      console.error("Edit member error:", error);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: error.message || "Network error occurred",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = () => {
    editMember();
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
            Update the member information below and then press UPDATE at the
            bottom of the screen
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
                value={formData.firstName}
                onChangeText={(text) => handleChange("firstName", text)}
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Last Name</Text>
              <TextInput
                style={styles.input}
                value={formData.lastName}
                onChangeText={(text) => handleChange("lastName", text)}
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>DOB</Text>
              <TextInput
                style={styles.input}
                value={formData.dob}
                onChangeText={(text) => handleChange("dob", text)}
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Race</Text>
              <TextInput
                style={styles.input}
                value={formData.race}
                onChangeText={(text) => handleChange("race", text)}
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Gender</Text>
              <TextInput
                style={styles.input}
                value={formData.gender}
                onChangeText={(text) => handleChange("gender", text)}
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Zip Code</Text>
              <TextInput
                style={styles.input}
                value={formData.zip_code}
                onChangeText={(text) => handleChange("zip_code", text)}
                keyboardType="numeric"
              />
            </View>
          </View>

          {/* Medical Info */}
          <View style={[styles.container]}>
            <Text style={styles.title}>Medical Information</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Height</Text>
              <TextInput
                style={styles.input}
                value={formData.height}
                onChangeText={(text) => handleChange("height", text)}
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Weight</Text>
              <TextInput
                style={styles.input}
                value={formData.weight}
                onChangeText={(text) => handleChange("weight", text)}
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>A1C</Text>
              <TextInput
                style={styles.input}
                value={formData.a1c}
                onChangeText={(text) => handleChange("a1c", text)}
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Blood Pressure</Text>
              <TextInput
                style={styles.input}
                value={formData.bloodPressure}
                onChangeText={(text) => handleChange("bloodPressure", text)}
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>BMI</Text>
              <TextInput
                style={styles.input}
                value={formData.bmi}
                onChangeText={(text) => handleChange("bmi", text)}
              />
            </View>
          </View>
        </View>

        {/* Prescription */}
        <View style={{ width: "100%", marginVertical: 10 }}>
          <Text
            style={{ textAlign: "center", marginBottom: 5, fontWeight: "500" }}
          >
            Prescription
          </Text>

          <View
            style={{
              display: "flex",
              flexDirection: "row",
              backgroundColor: "#f4f6faff",
              borderRadius: 8,
            }}
          >
            <TextInput
              style={{
                padding: 6,
                margin: 8,
                borderRadius: 6,
                minHeight: 80,
                width: "80%",
                textAlignVertical: "top",
              }}
              value={formData.prescription}
              onChangeText={(text) => handleChange("prescription", text)}
              multiline
            />
            <TouchableOpacity
              style={{
                padding: 8,
                justifyContent: "center",
                alignItems: "center",
              }}
              onPress={() => setIsOpenOption(true)}
            >
              <Feather name="plus"e={24} color="#5a5b5aff" />
            </TouchableOpacity>
          </View>

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
        <View
          style={{
            flexDirection: "row",
            justifyContent: "center",
            marginTop: 20,
          }}
        >
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={loading}
            style={{
              backgroundColor: "#3f9142",
              paddingVertical: 12,
              paddingHorizontal: 24,
              borderRadius: 6,
              marginRight: 15,
              opacity: loading ? 0.7 : 1,
              minWidth: 100,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={{ color: "white", fontWeight: "500" }}>Update</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push("/dashboard")}
            disabled={loading}
            style={{
              backgroundColor: "#e63f3fff",
              paddingVertical: 12,
              paddingHorizontal: 24,
              borderRadius: 6,
              opacity: loading ? 0.7 : 1,
              minWidth: 100,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text style={{ color: "white" }}>Cancel</Text>
          </TouchableOpacity>
        </View>

        <View style={{ marginTop: 30 }}>
          <Text style={{ textAlign: "center", color: "gray", fontSize: 12 }}>
            © Vikram Sethi Contact : vikram@vikramsethi.com
          </Text>
        </View>
      </ScrollView>
      <Toast />
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
    marginBottom: 12,
  },
  inputGroup: {
    marginBottom: 10,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 5,
    color: "#333",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 6,
    padding: 8,
    backgroundColor: "white",
    fontSize: 14,
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

export default EditMember;
