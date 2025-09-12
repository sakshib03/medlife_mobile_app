import Header from "@/app/(tabs)/header2";
import { Feather } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import Clipboard from "@react-native-clipboard/clipboard";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  TouchableWithoutFeedback,
  FlatList,
} from "react-native";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import Toast from "react-native-toast-message";
import { API_BASE } from "./config";

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
  const [ocrModalVisible, setOcrModalVisible] = useState(false);
  const [ocrData, setOcrData] = useState(null);
  const [ocrMedicine, setOcrMedicine] = useState("");
  const [ocrText, setOcrText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);

  const showDatePicker = () => setDatePickerVisibility(true);
  const hideDatePicker = () => setDatePickerVisibility(false);

  const handlePress = () => {
    Toast.show({
      type: "info",
      text1: "We are getting this information only for prediction purpose.",
      visibilityTime: 2000, 
    });
  };

  const handleConfirm = (date) => {
    const formattedDate = `${
      date.getMonth() + 1
    }/${date.getDate()}/${date.getFullYear()}`;
    setFormData({ ...formData, dob: formattedDate });
    hideDatePicker();
  };

  const genders = ["Male", "Female"];

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      "keyboardDidShow",
      () => {
        setKeyboardVisible(true);
      }
    );
    const keyboardDidHideListener = Keyboard.addListener(
      "keyboardDidHide",
      () => {
        setKeyboardVisible(false);
      }
    );
    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  const handlePrescription = () => {
    setIsOpenOption((prev) => !prev);
  };

  const uploadFile = async (uri, type) => {
    setIsLoading(true);
    try {
      const formData = new FormData();
      const fileType = type === "image" ? "image/jpeg" : "application/pdf";
      const fileName = uri.split("/").pop();

      formData.append("file", {
        uri,
        name: fileName,
        type: fileType,
      });

      console.log("Uploading file to:", `${API_BASE}/ocr`);
      console.log("File details:", { uri, fileName, fileType });

      const response = await fetch(`${API_BASE}/ocr`, {
        method: "POST",
        body: formData,
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      console.log("Response status:", response.status);

      const responseText = await response.text();
      console.log("Response text:", responseText);

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        console.error("Failed to parse response as JSON:", e);
        throw new Error("Invalid response format from server");
      }

      if (response.ok) {
        console.log("OCR data received:", data);
        setOcrData(data);
        // Extract medicines array as a comma-separated string
        const medicinesText = data.medicines ? data.medicines.join(", ") : "";
        setOcrMedicine(medicinesText);
        setOcrText(data.full_text || '');
        setOcrModalVisible(true);
      } else {
        // Handle different error response formats
        let errorMsg = `Server error: ${response.status}`;

        if (data.detail) {
          if (Array.isArray(data.detail)) {
            errorMsg = data.detail
              .map((err) => err.msg || JSON.stringify(err))
              .join(", ");
          } else if (typeof data.detail === "string") {
            errorMsg = data.detail;
          } else if (data.detail.message) {
            errorMsg = data.detail.message;
          }
        } else if (data.message) {
          errorMsg = data.message;
        }

        console.error("Server error:", errorMsg);
        Toast.show({
          type: "error",
          text1: "Error",
          text2: errorMsg,
        });
      }
    } catch (error) {
      console.error("Upload error:", error);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: error.message || "Failed to upload file",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTakePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        alert("Sorry, we need camera permissions to make this work!");
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.6,
      });

      if (!result.canceled) {
        setIsOpenOption(false);
        await uploadFile(result.assets[0].uri, "image");
      }
    } catch (error) {
      console.error(error);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: error?.message || "Failed to open camera",
      });
    }
  };

  const handleChoosePhoto = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.6,
      });

      if (!result.canceled) {
        setIsOpenOption(false);
        await uploadFile(result.assets[0].uri, "image");
      }
    } catch (error) {
      console.error(error);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: error?.message || "Failed to select image",
      });
    }
  };

  const handleAddFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "*/*",
        copyToCacheDirectory: true,
      });

      // New API (Expo SDK ≥ 48)
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        console.log("Picked file:", file);
        setIsOpenOption(false);
        await uploadFile(file.uri, "file");
        return;
      }

      // Old API (fallback)
      if (result.type === "success") {
        console.log("Picked file:", result);
        setIsOpenOption(false);
        await uploadFile(result.uri, "file");
      }
    } catch (error) {
      console.error("File picker error:", error);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: error?.message || "Failed to select file",
      });
    }
  };

  const handleAddOCRMedicine = () => {
    setFormData((prev) => ({
      ...prev,
      prescription: prev.prescription
        ? `${prev.prescription}, ${ocrMedicine}`
        : ocrMedicine,
    }));
    setOcrModalVisible(false);
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
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: "#ffffffff" }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={{ flex: 1, backgroundColor: "#dde6faff" }}>
        <Header />

        <ScrollView
          contentContainerStyle={{
            padding: 10,
            paddingBottom: keyboardVisible ? 300 : 20,
          }}
          keyboardShouldPersistTaps="handled"
        >
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
            style={{
              flexDirection: "column",
              justifyContent: "space-between",
            }}
          >
            {/* Personal Info */}
            <View style={[styles.container, { marginBottom: 10 }]}>
              <Text style={styles.title}>Personal Information</Text>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>
                  First Name
                </Text>
                <TextInput
                  style={styles.input}
                  placeholderTextColor="gray"
                  placeholder="John"
                  value={formData.firstName}
                  onChangeText={(text) => handleChange("firstName", text)}
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>
                  Last Name
                </Text>
                <TextInput
                  style={styles.input}
                  placeholder="Smith"
                  value={formData.lastName}
                  placeholderTextColor="gray"
                  onChangeText={(text) => handleChange("lastName", text)}
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>
                  DOB
                </Text>
                <TouchableOpacity onPress={showDatePicker} style={styles.input}>
                  <Text style={{ color: formData.dob ? "black" : "gray" }}>
                    {formData.dob || "MM/DD/YYYY"}
                  </Text>
                </TouchableOpacity>
                <DateTimePickerModal
                  isVisible={isDatePickerVisible}
                  mode="date"
                  onConfirm={handleConfirm}
                  onCancel={hideDatePicker}
                  maximumDate={new Date()}
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>
                  Race
                </Text>
                <TextInput
                  style={styles.input}
                  placeholder="Asian Indian"
                  value={formData.race}
                  placeholderTextColor="gray"
                  onChangeText={(text) => handleChange("race", text)}
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>
                  Gender
                </Text>
                <TouchableOpacity
                  style={styles.input}
                  onPress={() => setOpen(!open)}
                >
                  <Text style={{ color: formData.gender ? "black" : "gray" }}>
                    {formData.gender || "Select Gender"}
                  </Text>
                </TouchableOpacity>

                {open && (
                  <View style={styles.dropdown}>
                    <FlatList
                      data={genders}
                      keyExtractor={(item) => item}
                      renderItem={({ item }) => (
                        <TouchableOpacity
                          style={styles.dropdownItem}
                          onPress={() => {
                            handleChange("gender", item);
                            setOpen(false);
                          }}
                        >
                          <Text>{item}</Text>
                        </TouchableOpacity>
                      )}
                    />
                  </View>
                )}
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>
                  Zip Code
                </Text>
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
                {/* Label row */}
                <View style={styles.labelRow}>
                  <Text style={styles.label}>Height</Text>

                  <TouchableOpacity
                    onPress={handlePress}
                    style={styles.iconButton}
                  >
                    <Feather name="info" size={12} color="blue" />
                  </TouchableOpacity>
                </View>

                {/* Input */}
                <TextInput
                  style={styles.input}
                  placeholder="5.10ft"
                  value={formData.height}
                  placeholderTextColor="gray"
                  onChangeText={(text) => handleChange("height", text)}
                />
              </View>

              <View style={styles.inputGroup}>
                <View style={styles.labelRow}>
                  <Text style={styles.label}>Weight</Text>
                  <TouchableOpacity
                    onPress={handlePress}
                    style={styles.iconButton}
                  >
                    <Feather name="info" size={12} color="blue" />
                  </TouchableOpacity>
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="200lbs"
                  value={formData.weight}
                  placeholderTextColor="gray"
                  onChangeText={(text) => handleChange("weight", text)}
                />
              </View>

              <View style={styles.inputGroup}>
                <View style={styles.labelRow}>
                  <Text style={styles.label}>A1C</Text>
                  <TouchableOpacity
                    onPress={handlePress}
                    style={styles.iconButton}
                  >
                    <Feather name="info" size={12} color="blue" />
                  </TouchableOpacity>
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="10.5"
                  value={formData.a1c}
                  placeholderTextColor="gray"
                  onChangeText={(text) => handleChange("a1c", text)}
                />
              </View>

              <View style={styles.inputGroup}>
                <View style={styles.labelRow}>
                  <Text style={styles.label}>Blood Pressure</Text>
                  <TouchableOpacity
                    onPress={handlePress}
                    style={styles.iconButton}
                  >
                    <Feather name="info" size={12} color="blue" />
                  </TouchableOpacity>
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="150/90"
                  value={formData.bloodPressure}
                  placeholderTextColor="gray"
                  onChangeText={(text) => handleChange("bloodPressure", text)}
                />
              </View>

              <View style={styles.inputGroup}>
                <View style={styles.labelRow}>
                  <Text style={styles.label}>BMI</Text>
                  <TouchableOpacity
                    onPress={handlePress}
                    style={styles.iconButton}
                  >
                    <Feather name="info" size={12} color="blue" />
                  </TouchableOpacity>
                </View>
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
                  {/* <TouchableOpacity
                    style={styles.option}
                    onPress={handleAddFile}
                  >
                    <Text style={styles.optionText}>Add File</Text>
                  </TouchableOpacity> */}
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

            {/* OCR Result Modal */}
            <Modal
              visible={ocrModalVisible}
              transparent
              animationType="slide"
              onRequestClose={() => setOcrModalVisible(false)}
            >
              <View style={styles.modalBackground}>
                <View
                  style={[styles.modalBox, { width: "90%", maxHeight: "90%" }]}
                >
                  <Text style={styles.modalTitle}>OCR Results</Text>

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Medicines</Text>
                    <TextInput
                      style={[styles.input, { height: 60 }]}
                      value={ocrMedicine}
                      onChangeText={setOcrMedicine}
                      multiline
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <View
                      style={{
                        flexDirection: "row",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <Text style={styles.label}>Extracted Text</Text>
                      <TouchableOpacity
                        onPress={() => {
                          Clipboard.setString(ocrText);
                        }}
                        style={{
                          paddingHorizontal: 8,
                          paddingVertical: 4,
                          borderRadius: 4,
                        }}
                      >
                        <Feather name="copy" size={20} color="#555656ff" />
                      </TouchableOpacity>
                    </View>

                    <ScrollView style={{ maxHeight: 150 }}>
                      <TextInput
                        style={[styles.input, { height: 140 }]}
                        value={ocrText}
                        onChangeText={setOcrText}
                        multiline
                      />
                    </ScrollView>
                    <Text
                      style={{
                        fontSize: 14,
                        marginTop: 10,
                        marginBottom: 10,
                        textAlign: "left",
                        color: "#fc7878ff",
                      }}
                    >
                      Note: You can copy text from "Extracted Text" and paste it
                      into Medicines. (This will be added to your prescription)
                    </Text>
                  </View>

                  <View style={styles.modalButtons}>
                    <TouchableOpacity
                      style={[
                        styles.modalButton,
                        { backgroundColor: "#3f9142" },
                      ]}
                      onPress={handleAddOCRMedicine}
                    >
                      <Text style={styles.modalButtonText}>Add</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.modalButton,
                        { backgroundColor: "#e63f3fff" },
                      ]}
                      onPress={() => setOcrModalVisible(false)}
                    >
                      <Text style={styles.modalButtonText}>Cancel</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </Modal>
          </View>

          {/* Loading Indicator */}
          {isLoading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#3f9142" />
              <Text style={styles.loadingText}>Processing file...</Text>
            </View>
          )}

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
        <Toast />
      </View>
    </KeyboardAvoidingView>
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
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
    flexWrap: "wrap", // so tooltip goes to next line if long
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },
  iconButton: {
    marginLeft: 6,
    padding: 4,
  },
  infoText: {
    marginLeft: 8,
    fontSize: 12,
    fontWeight: "500",
    color: "gray",
    flexShrink: 1, // wrap text if long
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
    borderRadius: 12,
    padding: 20,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
    textAlign: "center",
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 20,
    marginTop: 15,
  },
  modalButton: {
    padding: 10,
    borderRadius: 6,
    minWidth: 100,
    alignItems: "center",
  },
  modalButtonText: {
    color: "white",
    fontWeight: "500",
  },
  option: {
    padding: 15,
  },
  optionText: {
    fontSize: 16,
    color: "#333",
    textAlign: "center",
  },
  loadingContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
    zIndex: 1000,
  },
  loadingText: {
    marginTop: 10,
    color: "white",
    fontSize: 16,
  },
  dropdown: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    marginTop: 5,
    backgroundColor: "#f3f6fcff",
  },
  dropdownItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
});

export default AddMember;
