import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Modal,
  Alert,
} from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { Feather } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Header from "@/app/(tabs)/header2";
import { API_BASE } from "./config";

const Dashboard = () => {
  const router = useRouter();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState("");
  const [userName, setUserName] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useFocusEffect(
    React.useCallback(() => {
      fetchMembers();
    }, [])
  );

  useEffect(() => {
    const getUserInfo = async () => {
      const email = await AsyncStorage.getItem("userEmail");
      setUserEmail(email || "");

      if (email) {
        try {
          const response = await fetch(
            `${API_BASE}/get-username?email=${encodeURIComponent(email)}`
          );
          const result = await response.json();
          setUserName(result.username || "User");
        } catch (error) {
          setUserName("User");
        }
      }
    };

    getUserInfo();
  }, []);

  useEffect(() => {
    const checkAuth = async () => {
      const email = await AsyncStorage.getItem("userEmail");
      if (!email) {
        router.replace("/login");
        return;
      }
      fetchMembers();
    };
    checkAuth();
  }, []);

  const fetchMembers = async () => {
    const email = await AsyncStorage.getItem("userEmail");
    if (!email) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `${API_BASE}/getmember?email=${encodeURIComponent(email)}`
      );
      const result = await response.json();

      if (response.ok) {
        const members = (result.members || [])
          .map((member, index) => ({
            name: `${member.firstName} ${member.lastName}`.trim(),
            value: member.tokens || 0,
            memberIndex:
              typeof member.memberIndex === "number"
                ? member.memberIndex
                : index + 1,
            ...member,
          }))
          .filter((m) => m.firstName);
        setData(members);
      } else {
        console.error("Failed to fetch members:", result.detail);
        setData([]);
      }
    } catch (error) {
      console.error("Error fetching members:", error);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddMember = () => {
    if (data.length >= 4) {
      Alert.alert("Error", "Maximum of 4 members allowed per user");
      return;
    }
    router.push("/addMember");
  };

  const handleStartChat = async (member) => {
    const email = await AsyncStorage.getItem("userEmail");
    if (!email) {
      Alert.alert("Error", "User not logged in");
      return;
    }

    try {
      const response = await fetch(
        `${API_BASE}/member-details/${encodeURIComponent(
          email
        )}/${member.memberIndex}`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch member details");
      }
      const resp = await response.json();
      await AsyncStorage.setItem("currentMember", JSON.stringify(resp.member));
      router.push({
        pathname: "/prompt",
        params: { 
          member: JSON.stringify(resp.member),
          memberName: member.name 
        },
      });
    } catch (error) {
      Alert.alert("Error", "Failed to load member details. Please try again.");
    }
  };

  const handleEditMember = (member) => {
    router.push({
      pathname: "/editMember",
      params: { member: JSON.stringify(member) },
    });
  };

  const confirmDelete = (member) => {
    setMemberToDelete(member);
    setShowModal(true);
  };

  const handleDeleteMember = async () => {
    if (deleting || !memberToDelete) return;

    const email = await AsyncStorage.getItem("userEmail");
    if (!email) {
      Alert.alert("Error", "User not logged in");
      return;
    }

    setDeleting(true);
    try {
      const response = await fetch(
        `${API_BASE}/deletemember?email=${encodeURIComponent(
          email
        )}&member_index=${memberToDelete.memberIndex}`,
        { method: "DELETE" }
      );

      const respJson = await response.json().catch(() => ({}));

      if (!response.ok) {
        const msg =
          (respJson && (respJson.detail || respJson.message)) ||
          "Failed to delete member";
        Alert.alert("Error", msg);
        return;
      }

      Alert.alert("Success", "Member deleted successfully");
      setShowModal(false);
      setMemberToDelete(null);

      // Refresh to sync indices after backend shift
      await fetchMembers();
    } catch (error) {
      Alert.alert("Error", "Server error: " + error.message);
    } finally {
      setDeleting(false);
    }
  };

  const handleDownloadPDF = async (item) => {
    const email = await AsyncStorage.getItem("userEmail");
    if (!email) {
      Alert.alert("Error", "User not logged in");
      return;
    }

    try {
      const response = await fetch(
        `${API_BASE}/fetchChat/?email=${encodeURIComponent(
          email
        )}&member_name=${encodeURIComponent(
          item.firstName + "_" + item.lastName
        )}`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch chat data");
      }
      const resp = await response.json();
      const messages = resp.chat || [];

      if (messages.length === 0) {
        Alert.alert("Info", "Start chat first before downloading PDF");
        return;
      }

      // Here you would implement the PDF generation for React Native
      // This might require a different approach than the web version
      Alert.alert("Info", "PDF download functionality would be implemented here");
      
    } catch (error) {
      console.error("Error generating PDF:", error);
      Alert.alert("Error", "Error generating PDF. Please try again.");
    }
  };

  const UserBadge = ({ name, email }) => {
    return (
      <View style={styles.userBadge}>
        <Feather name="user" size={18} color="#333" />
        <View style={styles.userTextContainer}>
          <Text style={styles.userName}>{name}</Text>
          <Text style={styles.userEmail}>{email}</Text>
        </View>
      </View>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#cdd4e3ff" }}>
      <Header />

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>DASHBOARD</Text>
        </View>

        <View style={styles.tableContainer}>
          {/* Table Header */}
          <View style={[styles.row, styles.headerRow]}>
            <Text style={[styles.cell, styles.headerText]}>Name</Text>
            <Text style={[styles.cell, styles.headerText]}>Start Chat</Text>
            <Text style={[styles.cell, styles.headerText]}>Edit</Text>
            <Text style={[styles.cell, styles.headerText]}>PDF</Text>
            <Text style={[styles.cell, styles.headerText]}>Delete</Text>
          </View>

          {/* Table Body */}
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#4CAF50" />
              <Text style={styles.loadingText}>Loading…</Text>
            </View>
          ) : data.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                No members yet. Click "+ Add New Member" to begin.
              </Text>
            </View>
          ) : (
            data.map((item, index) => (
              <View
                key={`${item.firstName}-${item.lastName}-${index}`}
                style={styles.row}
              >
                <Text style={styles.cell}>{item.name}</Text>

                <TouchableOpacity 
                  style={styles.cell}
                  onPress={() => handleStartChat(item)}
                >
                  <Text style={styles.startButton}>Start</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.cell}
                  onPress={() => handleEditMember(item)}
                >
                  <Feather name="edit" size={20} color="#4CAF50" />
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.cell}
                  onPress={() => handleDownloadPDF(item)}
                >
                  <Feather name="download" size={20} color="#4CAF50" />
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.cell}
                  onPress={() => confirmDelete(item)}
                  disabled={deleting}
                >
                  <Feather name="trash" 
                    size={20} 
                    color={deleting ? "#cccccc" : "#ff6b6b"} 
                  />
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>

        <View style={styles.addButtonContainer}>
          <TouchableOpacity
            onPress={handleAddMember}
            style={styles.addButton}
          >
            <Text style={styles.addButtonText}>+ Add New Member</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.memberLimit}>
          You can add only up to four members.
        </Text>

        <View style={styles.noteSection}>
          <Text style={styles.noteTitle}>Note:</Text>
          <Text style={styles.noteText}>
            To download a PDF of your chat history, click on the Download icon
            in the chat box. You can also change the AI Engine from the dropdown
            menu at the top right of your chat interface.
          </Text>
        </View>

        {/* Delete Confirmation Modal */}
        <Modal
          visible={showModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => !deleting && setShowModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Confirm Delete</Text>
              <Text style={styles.modalText}>
                Are you sure you want to delete {memberToDelete?.name} record?
              </Text>
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.deleteButton, deleting && styles.disabledButton]}
                  onPress={handleDeleteMember}
                  disabled={deleting}
                >
                  <Text style={styles.buttonText}>
                    {deleting ? "Deleting…" : "Yes, Delete"}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton, deleting && styles.disabledButton]}
                  onPress={() => !deleting && setShowModal(false)}
                  disabled={deleting}
                >
                  <Text style={styles.buttonText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    padding: 10,
    paddingBottom: 30,
  },
  titleContainer: {
    alignItems: "center",
    marginBottom: 20,
    marginTop: 10,
  },
  title: {
    fontWeight: "bold",
    fontSize: 20,
    color: "#383737ff",
  },
  userBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f0f0f0",
    padding: 10,
    borderRadius: 20,
  },
  userTextContainer: {
    marginLeft: 8,
  },
  userName: {
    fontWeight: "bold",
    fontSize: 14,
  },
  userEmail: {
    fontSize: 12,
    color: "#666",
  },
  tableContainer: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    marginBottom: 20,
    backgroundColor: "#fff",
    marginTop: 20,
  },
  headerRow: {
    backgroundColor: "#f0f0f0",
  },
  row: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderColor: "#ccc",
    minHeight: 50,
  },
  cell: {
    flex: 1,
    padding: 10,
    alignItems: "center",
    justifyContent: "center",
    borderRightWidth: 1,
    borderColor: "#ccc",
  },
  headerText: {
    fontWeight: "bold",
    textAlign: "center",
  },
  startButton: {
    color: "white",
    padding: 8,
    borderRadius: 4,
    backgroundColor: "#4CAF50",
    textAlign: "center",
  },
  loadingContainer: {
    padding: 20,
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    color: "#666",
  },
  emptyContainer: {
    padding: 20,
    alignItems: "center",
  },
  emptyText: {
    color: "#999",
    textAlign: "center",
  },
  addButtonContainer: {
    alignItems: "center",
    marginBottom: 10,
  },
  addButton: {
    backgroundColor: "#70befdff",
    padding: 12,
    borderRadius: 4,
  },
  addButtonText: {
    color: "white",
    fontWeight: "500",
  },
  memberLimit: {
    textAlign: "center",
    color: "#666",
    marginBottom: 20,
    fontSize: 14,
  },
  noteSection: {
    marginBottom: 20,
    padding: 12,
    borderLeftWidth: 2,
    borderLeftColor: "#70befdff",
    backgroundColor: "#f9f9f9",
    borderRadius: 4,
  },
  noteTitle: {
    fontWeight: "bold",
    marginBottom: 5,
  },
  noteText: {
    color: "#5f5f5fff",
    fontSize: 14,
    lineHeight: 18,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "#fff",
    padding: 25,
    borderRadius: 8,
    width: "100%",
    maxWidth: 350,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#000",
    marginBottom: 10,
    textAlign: "center",
  },
  modalText: {
    color: "gray",
    fontSize: 15,
    textAlign: "center",
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 20,
  },
  modalButton: {
    padding: 12,
    borderRadius: 4,
    minWidth: 100,
    alignItems: "center",
  },
  deleteButton: {
    backgroundColor: "#fe786b",
  },
  cancelButton: {
    backgroundColor: "#ccc",
  },
  disabledButton: {
    opacity: 0.5,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "500",
  },
});

export default Dashboard;