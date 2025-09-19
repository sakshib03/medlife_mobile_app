import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Modal,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  FlatList,
  ActivityIndicator,
  Keyboard,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Feather } from "@expo/vector-icons";
import { Ionicons } from "@expo/vector-icons";
import RNHTMLtoPDF from "react-native-html-to-pdf";
import RNPrint from "react-native-print";
import { API_BASE } from "./config";

const PROVIDERS = ["openai", "gemini", "claude", "mistral"];
const properName = (p) => p.charAt(0).toUpperCase() + p.slice(1);

const makeId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

const ChatInterface = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [email, setEmail] = useState("");
  const keyFor = (k) => `${k}_${email}`;

  // Chat state
  const [userInput, setUserInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [selectedMember, setSelectedMember] = useState(null);
  const [chatHistory, setChatHistory] = useState([]);
  const [selectedChatId, setSelectedChatId] = useState(null);
  const [isRenamingChatId, setIsRenamingChatId] = useState(null);
  const [renameInput, setRenameInput] = useState("");
  const [showScrollDown, setShowScrollDown] = useState(false);
  const [data, setData] = useState([]);
  const [isSettings, setIsSettings] = useState(false);
  const [showApiKeyPopup, setShowApiKeyPopup] = useState(false);
  const [popupClosedWithoutKey, setPopupClosedWithoutKey] = useState(false);
  const loadingMessageId = "loading-message";
  const [openMenu, setOpenMenu] = useState(false);
  const [showProviderDropdown, setShowProviderDropdown] = useState(false);
  const [showMemberDropdown, setShowMemberDropdown] = useState(false);

  const [apiKeys, setApiKeys] = useState({});
  const [editMode, setEditMode] = useState({});
  const [selectedAPI, setSelectedAPI] = useState("");
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  useEffect(() => {
    const loadEmail = async () => {
      try {
        const userEmail = await AsyncStorage.getItem("userEmail");
        if (userEmail) {
          setEmail(userEmail);
        }
      } catch (error) {
        console.error("Error loading email:", error);
      }
    };

    loadEmail();
  }, []);

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

  const maskKey = (key = "") => {
    if (key.length <= 6) return "*".repeat(key.length);
    return `${key.slice(0, 3)}${"*".repeat(key.length - 6)}${key.slice(-3)}`;
  };

  const availableProviders = Object.keys(apiKeys).filter(
    (p) => (apiKeys[p] || "").trim() !== ""
  );

  const scrollViewRef = useRef();
  const flatListRef = useRef();

  const handleMenu = () => {
    setOpenMenu((prev) => !prev);
  };

  // Load user email and API keys
  useEffect(() => {
    const loadUserData = async () => {
      if (!email) return;
      try {
        // Load existing chat history first
        const storedChatHistory = await AsyncStorage.getItem(
          keyFor("chatHistory")
        );
        if (storedChatHistory) {
          const parsedChatHistory = JSON.parse(storedChatHistory);
          setChatHistory(parsedChatHistory);

          // Set selected chat and messages if available
          if (parsedChatHistory.length > 0) {
            setSelectedChatId(parsedChatHistory[0].id);
            setMessages(parsedChatHistory[0].messages || []);
          }
        }

        // Load API keys for all providers
        const keys = {};
        for (const p of PROVIDERS) {
          const key = await AsyncStorage.getItem(keyFor(`api_key_${p}`));
          keys[p] = key || "";
        }
        setApiKeys(keys);

        // Load selected API
        const selected = await AsyncStorage.getItem(keyFor("selectedAPI"));
        const hasShownPopup = await AsyncStorage.getItem(
          keyFor("hasShownApiKeyPopup")
        );
        const hasClosedWithoutKey = await AsyncStorage.getItem(
          keyFor("popupClosedWithoutKey")
        );

        // Check if we have any valid API keys
        const hasValidKeys = PROVIDERS.some(
          (p) => (keys[p] || "").trim() !== ""
        );

        // Set selected API if valid, otherwise show popup
        if (selected && (keys[selected] || "").trim() !== "") {
          setSelectedAPI(selected);
          setShowApiKeyPopup(false);
          setPopupClosedWithoutKey(false);
        } else if (hasValidKeys) {
          // Select the first available provider
          const firstValid = PROVIDERS.find(
            (p) => (keys[p] || "").trim() !== ""
          );
          setSelectedAPI(firstValid);
          await AsyncStorage.setItem(keyFor("selectedAPI"), firstValid);
          setShowApiKeyPopup(false);
          setPopupClosedWithoutKey(false);
        }

        // Show API key popup if no keys are set and popup hasn't been shown/closed
        setShowApiKeyPopup(!hasValidKeys && hasShownPopup !== "true");
        setPopupClosedWithoutKey(hasClosedWithoutKey === "true");
      } catch (error) {
        console.error("Error loading user data:", error);
      }
    };

    loadUserData();
  }, [email]);

  useEffect(() => {
    const persistSelectedAPI = async () => {
      const valid = selectedAPI && (apiKeys[selectedAPI] || "").trim() !== "";
      const availableProviders = PROVIDERS.filter(
        (p) => (apiKeys[p] || "").trim() !== ""
      );

      if (valid) {
        await AsyncStorage.setItem(keyFor("selectedAPI"), selectedAPI);
      } else if (availableProviders.length) {
        const first = availableProviders[0];
        setSelectedAPI(first);
        await AsyncStorage.setItem(keyFor("selectedAPI"), first);
      } else {
        setSelectedAPI("");
        await AsyncStorage.removeItem(keyFor("selectedAPI"));
      }
    };

    if (email) {
      persistSelectedAPI();
    }
  }, [selectedAPI, apiKeys, email]);

  useEffect(() => {
    const checkApiKeys = async () => {
      try {
        const hasShown = await AsyncStorage.getItem(
          keyFor("hasShownApiKeyPopup")
        );

        // Check if any API key exists
        let anyKey = false;
        for (const p of PROVIDERS) {
          const key = await AsyncStorage.getItem(keyFor(`api_key_${p}`));
          if ((key || "").trim() !== "") {
            anyKey = true;
            break;
          }
        }

        setShowApiKeyPopup(!anyKey && hasShown !== "true");
      } catch (error) {
        console.error("Error checking API keys:", error);
      }
    };

    if (email) {
      checkApiKeys();
    }
  }, [email]);

  // Load member from params
  useEffect(() => {
    const loadMember = async () => {
      if (params.member) {
        try {
          const member = JSON.parse(params.member);
          setSelectedMember(member);
          await AsyncStorage.setItem(
            keyFor("currentMember"),
            JSON.stringify(member)
          );
        } catch (error) {
          console.error("Error parsing member:", error);
        }
      } else {
        const storedMember = await AsyncStorage.getItem(
          keyFor("currentMember")
        );
        if (storedMember) {
          setSelectedMember(JSON.parse(storedMember));
        }
      }
    };

    loadMember();
  }, [params.member]);

  // Load chats
  useEffect(() => {
    if (!email) return;

    const loadChats = async () => {
      try {
        // Try to load from server first
        const response = await fetch(
          `${API_BASE}/chats?email=${encodeURIComponent(email)}`
        );
        if (response.ok) {
          const data = await response.json();
          const remoteChats = Array.isArray(data?.chats) ? data.chats : [];
          const normalized = remoteChats.map((c, idx) => ({
            id: c.id || makeId(),
            name: c.name || `Chat ${idx + 1}`,
            messages: Array.isArray(c.messages) ? c.messages : [],
          }));

          setChatHistory(normalized);
          await AsyncStorage.setItem(
            keyFor("chatHistory"),
            JSON.stringify(normalized)
          );

          if (normalized.length > 0) {
            setSelectedChatId(normalized[0].id);
            setMessages(normalized[0].messages || []);
          } else {
            await createNewChat([]);
          }
        } else {
          // Fallback to local storage
          await loadLocalChats();
        }
      } catch (error) {
        console.error("Error loading chats:", error);
        await loadLocalChats();
      }
    };

    const loadLocalChats = async () => {
      const stored = await AsyncStorage.getItem(keyFor("chatHistory"));
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          setChatHistory(parsed);
          if (parsed.length > 0) {
            setSelectedChatId(parsed[0].id);
            setMessages(parsed[0].messages || []);
          } else {
            await createNewChat([]);
          }
        } catch (error) {
          console.error("Error parsing local chats:", error);
          await createNewChat([]);
        }
      } else {
        await createNewChat([]);
      }
    };

    const createNewChat = async (existingChats) => {
      const freshId = makeId();
      const fresh = {
        id: freshId,
        name: `Chat ${existingChats.length + 1}`,
        messages: [],
      };
      const next = [fresh, ...existingChats];
      setChatHistory(next);
      setSelectedChatId(freshId);
      setMessages([]);
      await AsyncStorage.setItem(keyFor("chatHistory"), JSON.stringify(next));
    };

    loadChats();
  }, [email]);

  // Load members
  useEffect(() => {
    const loadMembers = async () => {
      const em = await AsyncStorage.getItem("userEmail");
      if (!em) return;

      try {
        const response = await fetch(
          `${API_BASE}/getmember?email=${encodeURIComponent(em)}`
        );
        const result = await response.json();
        if (result?.members) {
          const members = result.members
            .map((member, index) => ({
              name: `${member.firstName} ${member.lastName}`.trim(),
              memberIndex: index + 1,
              ...member,
            }))
            .filter((m) => m.firstName);
          setData(members);
          await AsyncStorage.setItem(
            keyFor("membersList"),
            JSON.stringify(members)
          );
        }
      } catch (error) {
        console.error("Error loading members:", error);
        const cached = await AsyncStorage.getItem(keyFor("membersList"));
        if (cached) {
          try {
            setData(JSON.parse(cached));
          } catch {
            setData([]);
          }
        }
      }
    };

    loadMembers();
  }, []);

  const appendMessage = (sender, name, text) => {
    setMessages((prev) => [
      ...prev,
      {
        sender,
        name,
        text: String(text).replace(/\\n/g, "\n").replace(/\n/g, "<br>"),
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      },
    ]);
  };

  const stripHtml = (s) =>
    String(s || "")
      .replace(/<br\s*\/?>/gi, " ")
      .replace(/<[^>]*>/g, "")
      .trim();

  const deriveChatName = (msgs, fallbackIndex) => {
    const firstUser = msgs.find((m) => m.sender === "user");
    const base = stripHtml(firstUser?.text || msgs[0]?.text || "");
    const title = base.length ? base.slice(0, 40) : `Chat ${fallbackIndex}`;
    return title;
  };

  const persistChats = async (next) => {
    setChatHistory(next);
    await AsyncStorage.setItem(keyFor("chatHistory"), JSON.stringify(next));
    try {
      await fetch(`${API_BASE}/chats?email=${encodeURIComponent(email)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chats: next }),
      });
    } catch (error) {
      console.error("Error syncing chats:", error);
    }
  };

  const handleNewChat = async () => {
    let next = [...chatHistory];

    if (messages.length > 0) {
      if (selectedChatId) {
        next = next.map((c, idx) => {
          if (c.id !== selectedChatId) return c;
          const defaultLike = /^Chat\s+\d+$/i.test(c.name || "");
          return {
            ...c,
            name: defaultLike ? deriveChatName(messages, idx + 1) : c.name,
            messages: [...messages],
          };
        });
      } else {
        const archivedId = makeId();
        const name = deriveChatName(messages, next.length + 1);
        next = [{ id: archivedId, name, messages: [...messages] }, ...next];
      }
    }

    const freshId = makeId();
    const fresh = {
      id: freshId,
      name: `Chat ${next.length + 1}`,
      messages: [],
    };
    next = [fresh, ...next];

    setSelectedChatId(freshId);
    setMessages([]);
    setUserInput("");

    if (selectedMember) {
      const historyKey = `${email}_${selectedMember.firstName}_${selectedMember.lastName}`;
      const newHistory = {
        id: freshId,
        name: `Chat ${next.length}`,
        messages: [],
        member: selectedMember,
        createdAt: new Date().toISOString(),
      };

      await AsyncStorage.setItem(
        `history_${historyKey}_${freshId}`,
        JSON.stringify(newHistory)
      );
    }

    persistChats(next);
    setIsRenamingChatId(null);
    setRenameInput("");
  };

  const handleRenameChat = async (chatId, newName) => {
    const name = newName.trim();
    if (!name) {
      setIsRenamingChatId(null);
      setRenameInput("");
      return;
    }
    const next = chatHistory.map((c) => (c.id === chatId ? { ...c, name } : c));
    setIsRenamingChatId(null);
    setRenameInput("");
    persistChats(next);
  };

  const handleDeleteChat = async (chatId) => {
    const next = chatHistory.filter((c) => c.id !== chatId);
    try {
      await fetch(
        `${API_BASE}/chats/${encodeURIComponent(
          chatId
        )}?email=${encodeURIComponent(email)}`,
        {
          method: "DELETE",
        }
      );
    } catch (error) {
      console.error("Error deleting chat:", error);
    }
    persistChats(next);

    if (selectedChatId === chatId) {
      if (next.length > 0) {
        setSelectedChatId(next[0].id);
        setMessages(next[0].messages || []);
      } else {
        setSelectedChatId(null);
        setMessages([]);
      }
    }
  };

  const handleSelectChat = (chatId) => {
    const chat = chatHistory.find((c) => c.id === chatId);
    if (!chat) return;
    setSelectedChatId(chatId);
    setMessages(chat.messages || []);
    setUserInput("");
    setIsRenamingChatId(null);
    setRenameInput("");
  };

  const handleSendMessage = async () => {
    const message = userInput.trim();
    if (!message || !selectedMember) return;

    if (!selectedAPI || !(apiKeys[selectedAPI] || "").trim()) {
      if (popupClosedWithoutKey) {
        Alert.alert(
          "Warning",
          "Please enter an API key in settings, then choose a provider."
        );
        setIsSettings(true);
      } else {
        setShowApiKeyPopup(true);
      }
      return;
    }

    if (!selectedChatId) {
      const freshId = makeId();
      const fresh = {
        id: freshId,
        name: `Chat ${chatHistory.length + 1}`,
        messages: [],
      };
      const next = [fresh, ...chatHistory];
      setSelectedChatId(freshId);
      persistChats(next);
    }

    appendMessage("user", "You", message);
    setUserInput("");
    setMessages((prev) => [
      ...prev,
      {
        sender: "ai",
        name: "Medlife.ai",
        text: "Analyzing<span class='dot'>.</span><span class='dot'>.</span><span class='dot'>.</span>",
        id: loadingMessageId,
      },
    ]);

    try {
      const memberData = selectedMember ? JSON.stringify(selectedMember) : "";
      const res = await fetch(
        `${API_BASE}/ask_ai/?query=${encodeURIComponent(
          message
        )}&api_key=${encodeURIComponent(
          apiKeys[selectedAPI]
        )}&provider=${encodeURIComponent(
          selectedAPI
        )}&email=${encodeURIComponent(email)}&member_data=${encodeURIComponent(
          memberData
        )}`
      );

      if (!res.ok) {
        const errorData = await res.text();
        setMessages((prev) => prev.filter((m) => m.id !== loadingMessageId));

        const lower = errorData.toLowerCase();
        if (lower.includes("api key")) {
          appendMessage(
            "ai",
            "Medlife.ai",
            "Please provide a valid API key to continue."
          );
          setShowApiKeyPopup(true);
        } else if (lower.includes("quota")) {
          appendMessage(
            "ai",
            "Medlife.ai",
            "Your API key has exceeded its quota."
          );
        } else {
          appendMessage("ai", "Medlife.ai", `Error from backend: ${errorData}`);
        }
        return;
      }

      const aiResponse = await res.text();
      setMessages((prev) => prev.filter((m) => m.id !== loadingMessageId));
      appendMessage("ai", "Medlife.ai", aiResponse);
    } catch (err) {
      setMessages((prev) => prev.filter((m) => m.id !== loadingMessageId));
      appendMessage(
        "ai",
        "Medlife.ai",
        "Sorry, I couldn't get a response. Please try again."
      );
    }
  };

  const handleApiPopupClose = async () => {
    setShowApiKeyPopup(false);
    setPopupClosedWithoutKey(true);
    await AsyncStorage.setItem(keyFor("popupClosedWithoutKey"), "true");
  };

  const handleSaveChat = async () => {
    if (!email || !selectedMember) {
      Alert.alert("Warning", "No member selected or user email missing.");
      return;
    }
    try {
      const url = `${API_BASE}/saveChat/?email=${encodeURIComponent(
        email
      )}&member_name=${encodeURIComponent(
        `${selectedMember.firstName}_${selectedMember.lastName}`
      )}`;
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat: messages }),
      });
      if (!response.ok) throw new Error("Failed to save chat data");

      Alert.alert("Success", "Chat saved to server successfully!");
    } catch (err) {
      console.error("Error saving chat:", err);
      Alert.alert("Error", "Error saving chat data. Please try again.");
    }
  };

  const handleDownloadChat = async () => {
    console.log("Download clicked - selectedMember:", selectedMember);
    console.log("Download clicked - email:", email);

    // Check if we have the necessary data
    if (!email) {
      // Try to load email from storage if not in state
      const storedEmail = await AsyncStorage.getItem("userEmail");
      if (storedEmail) {
        setEmail(storedEmail);
      } else {
        Alert.alert("Warning", "User email not found. Please log in again.");
        return;
      }
    }

    if (!selectedMember) {
      // Try to load member from storage if not in state
      const storedMember = await AsyncStorage.getItem(keyFor("currentMember"));
      if (storedMember) {
        setSelectedMember(JSON.parse(storedMember));
      } else {
        Alert.alert("Warning", "Please select a family member first.");
        return;
      }
    }

    try {
      const htmlContent = generateHTMLFromMessages(messages);
      const pdfFile = await generatePDF(htmlContent);
      await sharePDF(pdfFile);

      Alert.alert("Success", "Chat PDF downloaded successfully!");
    } catch (error) {
      console.error("Error generating PDF:", error);
      Alert.alert("Error", "Failed to generate PDF. Please try again.");
    }
  };

  const generateHTMLFromMessages = (messages) => {
    const currentDate = new Date().toLocaleDateString();
    const memberName = selectedMember
      ? `${selectedMember.firstName} ${selectedMember.lastName}`
      : "Unknown Member";

    let html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Chat History - ${memberName}</title>
      <style>
        body { 
          font-family: Arial, sans-serif; 
          padding: 20px; 
          line-height: 1.6;
        }
        .header { 
          text-align: center; 
          margin-bottom: 30px; 
          border-bottom: 2px solid #fe786b;
          padding-bottom: 20px;
        }
        .message { 
          margin-bottom: 15px; 
          padding: 12px; 
          border-radius: 8px;
          max-width: 80%;
        }
        .user-message { 
          background-color: #e3f2fd; 
          margin-left: 20%; 
          text-align: right;
        }
        .ai-message { 
          background-color: #f8f9fa; 
          margin-right: 20%; 
        }
        .message-header { 
          font-weight: bold; 
          margin-bottom: 5px; 
          color: #333;
        }
        .message-content {
          color: #555;
        }
        .timestamp { 
          font-size: 12px; 
          color: #666; 
          margin-top: 5px;
        }
        .medlife-logo {
          text-align: center;
          margin-bottom: 15px;
        }
      </style>
    </head>
    <body>
      <div class="medlife-logo">
        <h1>MedLife.AI - Chat History</h1>
      </div>
      <div class="header">
        <p><strong>Generated on:</strong> ${currentDate}</p>
        <p><strong>Member:</strong> ${memberName}</p>
      </div>
  `;
    messages.forEach((msg) => {
      const messageClass =
        msg.sender === "user" ? "user-message" : "ai-message";
      const senderName = msg.sender === "user" ? "You" : "Medlife.ai";
      const messageText = msg.text
        .replace(/<br\s*\/?>/gi, "\n")
        .replace(/<[^>]*>/g, "");

      html += `
      <div class="message ${messageClass}">
        <div class="message-header">${senderName}</div>
        <div class="message-content">${messageText}</div>
      </div>
    `;
    });

    html += `</body></html>`;
    return html;
  };

  const generatePDF = async (htmlContent) => {
    try {
      const options = {
        html: htmlContent,
        fileName: `Chat_History_${selectedMember.firstName}_${selectedMember.lastName}`,
        directory: "Documents",
        base64: false,
      };
      const file = await RNHTMLtoPDF.convert(options);
      return file.filePath;
    } catch (error) {
      console.error("PDF generation error:", error);
      throw error;
    }
  };

  const sharePDF = async (filePath) => {
    try {
      await RNPrint.print({ filePath });
    } catch (error) {
      console.error("Print/share error:", error);
      throw error;
    }
  };

  // Alert.alert(
  //   "Info",
  //   "PDF download functionality would be implemented here with a native library"
  // );

  const handleLogout = async () => {
    Alert.alert("Confirm Logout", "Are you sure you want to logout?", [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Logout",
        onPress: async () => {
          await AsyncStorage.removeItem("userEmail");
          await AsyncStorage.removeItem(keyFor("selectedAPI"));
          await AsyncStorage.removeItem(keyFor("currentMember"));

          router.dismissAll();
          router.replace("/login");
        },
        style: "destructive",
      },
    ]);
  };

  const handleQuestionSelect = (q) => {
    setUserInput(q);
  };

  const saveKeys = async () => {
    try {
      const newKeys = { ...apiKeys };

      // Save all API keys
      for (const p of PROVIDERS) {
        await AsyncStorage.setItem(keyFor(`api_key_${p}`), newKeys[p] || "");
      }

      // Mark that the user has seen the API key popup
      await AsyncStorage.setItem(keyFor("hasShownApiKeyPopup"), "true");
      await AsyncStorage.removeItem(keyFor("popupClosedWithoutKey"));

      // Find the first valid provider if none is selected
      let validProvider = selectedAPI;
      if (!validProvider || (newKeys[validProvider] || "").trim() === "") {
        validProvider =
          PROVIDERS.find((p) => (newKeys[p] || "").trim() !== "") || "";
        setSelectedAPI(validProvider);
      }

      // Save the selected provider if valid
      if (validProvider) {
        await AsyncStorage.setItem(keyFor("selectedAPI"), validProvider);
      } else {
        await AsyncStorage.removeItem(keyFor("selectedAPI"));
      }

      Alert.alert("Success", "API keys saved successfully!");
      setIsSettings(false);
      setShowApiKeyPopup(false);
      setPopupClosedWithoutKey(false);
    } catch (error) {
      console.error("Error saving API keys:", error);
      Alert.alert("Error", "Failed to save API keys. Please try again.");
    }
  };

  const renderMessage = ({ item }) => (
    <View
      style={[
        styles.message,
        item.sender === "user" ? styles.userMessage : styles.aiMessage,
      ]}
    >
      <View style={styles.messageHeader}>
        <Text style={styles.messageName}>{item.name}:</Text>
      </View>
      <Text style={styles.messageText}>
        {item.text.replace(/<br\s*\/?>/gi, "\n").replace(/<[^>]*>/g, "")}
      </Text>
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: "#fdfdfdff" }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Feather name="menu" size={20} onPress={handleMenu} />
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity onPress={() => setIsSettings(true)}>
              <Feather name="settings" size={24} color="#000" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleLogout}
              style={styles.logoutButton}
            >
              <Feather name="log-out" size={24} color="#000" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.chatContainer}>
          {openMenu && (
            <>
              <TouchableOpacity
                style={styles.backdrop}
                activeOpacity={1}
                onPress={() => setOpenMenu(false)}
              />
              <View style={styles.sidebar}>
                <View style={styles.sidebarSection}>
                  <Text style={styles.sidebarTitle}>
                    Recommended Health Questions
                  </Text>
                  <TouchableOpacity
                    onPress={() =>
                      handleQuestionSelect(
                        "Are there any drug interactions I should be aware of?"
                      )
                    }
                  >
                    <Text style={styles.questionItem}>
                      Are there any drug interactions I should be aware of?
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() =>
                      handleQuestionSelect(
                        "Is there any prescriptions I should be particularly concerned about if added to my list?"
                      )
                    }
                  >
                    <Text style={styles.questionItem}>
                      Is there any prescriptions I should be particularly
                      concerned about if added to my list?
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() =>
                      handleQuestionSelect(
                        "Are there any medical symptoms I should monitor for when taking my prescriptions?"
                      )
                    }
                  >
                    <Text style={styles.questionItem}>
                      Are there any medical symptoms I should monitor for when
                      taking my prescriptions?
                    </Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.sidebarSection}>
                  <TouchableOpacity
                    onPress={handleNewChat}
                    style={styles.newChatButton}
                  >
                    <Text style={styles.newChatText}>Recent Chats</Text>
                    <Feather name="plus" size={18} color="#000" />
                  </TouchableOpacity>

                  <ScrollView style={styles.chatList}>
                    {chatHistory.map((chat) => (
                      <View
                        key={chat.id}
                        style={[
                          styles.chatItem,
                          chat.id === selectedChatId && styles.selectedChatItem,
                        ]}
                      >
                        {isRenamingChatId === chat.id ? (
                          <TextInput
                            value={renameInput}
                            onChangeText={setRenameInput}
                            onSubmitEditing={() =>
                              handleRenameChat(chat.id, renameInput)
                            }
                            onBlur={() =>
                              handleRenameChat(chat.id, renameInput)
                            }
                            autoFocus
                            style={styles.renameInput}
                          />
                        ) : (
                          <TouchableOpacity
                            onPress={() => handleSelectChat(chat.id)}
                            style={styles.chatNameContainer}
                          >
                            <Text
                              style={[
                                styles.chatName,
                                chat.id === selectedChatId &&
                                  styles.selectedChatName,
                              ]}
                              numberOfLines={1}
                            >
                              {chat.name}
                            </Text>
                          </TouchableOpacity>
                        )}
                        <View style={styles.chatActions}>
                          <TouchableOpacity
                            onPress={() => {
                              setIsRenamingChatId(chat.id);
                              setRenameInput(chat.name);
                            }}
                          >
                            <Feather name="edit-2" size={16} color="#666" />
                          </TouchableOpacity>
                          <TouchableOpacity
                            onPress={() => handleDeleteChat(chat.id)}
                          >
                            <Feather name="trash-2" size={16} color="#666" />
                          </TouchableOpacity>
                        </View>
                      </View>
                    ))}
                  </ScrollView>
                </View>
              </View>
            </>
          )}

          <View style={styles.mainContent}>
            <View style={styles.chatHeader}>
              
              <TouchableOpacity onPress={()=>router.push("/dashboard")}>
                <Feather name="arrow-left" size={20} marginBottom={8} color="#0a0a0aff" />
              </TouchableOpacity>
              
              <View>
                <Text style={styles.chatTitle}>Medlife Assist</Text>
                <Text style={styles.chatSubtitle}>
                  Would like to talk about your Health?
                </Text>
              </View>

              <View style={styles.selectionContainer}>
                <View style={[styles.selectionItem]}>
                  <Text style={styles.selectionLabel}>Select member</Text>
                  <TouchableOpacity
                    style={styles.selectWrapper}
                    onPress={() => {
                      setShowMemberDropdown(!showMemberDropdown);
                      setShowProviderDropdown(false); // Close AI dropdown
                    }}
                  >
                    <Text style={styles.selectValue} numberOfLines={1}>
                      {selectedMember
                        ? `${selectedMember.firstName} ${selectedMember.lastName}`.trim()
                        : "Select Member"}
                    </Text>
                    <Feather
                      name={showMemberDropdown ? "chevron-up" : "chevron-down"}
                      size={16}
                      color="#666"
                    />
                  </TouchableOpacity>

                  {showMemberDropdown && (
                    <>
                      <TouchableOpacity
                        style={styles.dropdownBackdrop}
                        activeOpacity={1}
                        onPress={() => setShowMemberDropdown(false)}
                      />
                      <View style={styles.dropdown}>
                        {data.length > 0 ? (
                          <>
                            {data.map((member) => (
                              <TouchableOpacity
                                key={`${member.firstName}-${member.lastName}-${member.memberIndex}`}
                                style={[
                                  styles.dropdownItem,
                                  selectedMember &&
                                    selectedMember.firstName ===
                                      member.firstName &&
                                    selectedMember.lastName ===
                                      member.lastName &&
                                    styles.dropdownItemSelected,
                                ]}
                                onPress={() => {
                                  setSelectedMember(member);
                                  setShowMemberDropdown(false);
                                  AsyncStorage.setItem(
                                    keyFor("currentMember"),
                                    JSON.stringify(member)
                                  );
                                }}
                              >
                                <Text
                                  style={styles.dropdownItemText}
                                  numberOfLines={1}
                                >
                                  {`${member.firstName} ${member.lastName}`.trim()}
                                </Text>
                                {selectedMember &&
                                  selectedMember.firstName ===
                                    member.firstName &&
                                  selectedMember.lastName ===
                                    member.lastName && (
                                    <Feather
                                      name="check"
                                      size={16}
                                      color="#007bff"
                                    />
                                  )}
                              </TouchableOpacity>
                            ))}

                            {data.length < 4 && (
                              <TouchableOpacity
                                style={styles.dropdownItem}
                                onPress={() => {
                                  setShowMemberDropdown(false);
                                  router.push("/addMember");
                                  console.log("Add new member clicked");
                                }}
                              >
                                <View
                                  style={{
                                    color: "#fe786b",
                                    borderColor: "#fe786b",
                                    padding: 8,
                                    borderWidth: 2,
                                    display: "flex",
                                    flexDirection: "row",
                                    alignItems: "center",
                                  }}
                                >
                                  <Text
                                    style={[
                                      styles.dropdownItemText,
                                      { width: 110 , color: "#fe786b",},
                                    ]}
                                  >
                                    Add Member
                                  </Text>
                                  <Feather
                                    name="plus"
                                    size={16}
                                    marginLeft={4}
                                    color="#007bff"
                                  />
                                </View>
                              </TouchableOpacity>
                            )}
                          </>
                        ) : (
                          <View style={styles.dropdownItem}>
                            <Text style={styles.dropdownItemText}>
                              No members found
                            </Text>
                          </View>
                        )}
                      </View>
                    </>
                  )}
                </View>

                <View style={styles.selectionItem}>
                  <Text style={styles.selectionLabel}>AI Engine</Text>
                  <TouchableOpacity
                    style={styles.selectWrapper}
                    onPress={() =>
                      setShowProviderDropdown(!showProviderDropdown)
                    }
                  >
                    <Text style={styles.selectValue}>
                      {selectedAPI
                        ? properName(selectedAPI)
                        : "Select AI Provider"}
                    </Text>
                    <Feather
                      name={
                        showProviderDropdown ? "chevron-up" : "chevron-down"
                      }
                      size={16}
                      color="#666"
                    />
                  </TouchableOpacity>

                  {showProviderDropdown && (
                    <View style={styles.dropdown}>
                      {availableProviders.length > 0 ? (
                        availableProviders.map((provider) => (
                          <TouchableOpacity
                            key={provider}
                            style={[
                              styles.dropdownItem,
                              selectedAPI === provider &&
                                styles.dropdownItemSelected,
                            ]}
                            onPress={() => {
                              setSelectedAPI(provider);
                              setShowProviderDropdown(false);
                            }}
                          >
                            <Text style={styles.dropdownItemText}>
                              {properName(provider)}
                            </Text>
                            {selectedAPI === provider && (
                              <Feather name="check" size={16} color="#007bff" />
                            )}
                          </TouchableOpacity>
                        ))
                      ) : (
                        <View style={styles.dropdownItem}>
                          <Text style={styles.dropdownItemText}>
                            No providers available. Add API keys first.
                          </Text>
                        </View>
                      )}
                    </View>
                  )}
                </View>
              </View>
            </View>

            <FlatList
              ref={flatListRef}
              data={messages}
              renderItem={renderMessage}
              keyExtractor={(item) => item.id}
              style={styles.chatMessages}
              onContentSizeChange={() => {
                flatListRef.current?.scrollToEnd({ animated: true });
              }}
            />

            <View style={styles.inputArea}>
              <TextInput
                value={userInput}
                onChangeText={setUserInput}
                placeholder={
                  selectedAPI && (apiKeys[selectedAPI] || "").trim()
                    ? "Type your question here..."
                    : "Add API keys in settings, then choose a provider to start chat..."
                }
                editable={
                  !!selectedAPI && !!(apiKeys[selectedAPI] || "").trim()
                }
                style={styles.textInput}
                multiline
              />
              <TouchableOpacity
                onPress={handleSendMessage}
                style={styles.sendButton}
              >
                <Feather name="send" size={20} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleDownloadChat}
                style={styles.downloadButton}
              >
                <Feather name="download" size={20} color="#fff" />
              </TouchableOpacity>
            </View>

            <View style={styles.note}>
              <Text style={styles.noteText}>
                <Text style={styles.noteBold}>Note:</Text> medlife.ai can make
                mistakes. Consider checking important information.
              </Text>
            </View>
          </View>
        </View>

        {/* Settings Modal */}
        <Modal visible={isSettings} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => setIsSettings(false)}
              >
                <Text style={styles.modalCloseText}>✖</Text>
              </TouchableOpacity>

              <Text style={styles.modalTitle}>
                Current AI Providers and API Keys
              </Text>

              <ScrollView style={styles.apiProvidersList}>
                {PROVIDERS.map((provider) => {
                  const key = apiKeys[provider] || "";
                  const isEditing = editMode[provider];

                  return (
                    <View
                      key={provider}
                      style={[
                        styles.apiProvider,
                        key && styles.apiProviderWithKey,
                      ]}
                    >
                      <Text style={styles.apiProviderLabel}>
                        {properName(provider)} Key
                      </Text>

                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          justifyContent: "space-between",
                          flex: 2,
                        }}
                      >
                        {isEditing ? (
                          <TextInput
                            value={key}
                            onChangeText={(text) =>
                              setApiKeys({ ...apiKeys, [provider]: text })
                            }
                            placeholder={`Enter your ${properName(
                              provider
                            )} API key`}
                            style={styles.apiKeyInput}
                            secureTextEntry
                          />
                        ) : (
                          <Text style={styles.apiKeyMasked}>
                            {key ? maskKey(key) : "No key saved"}
                          </Text>
                        )}

                        <TouchableOpacity
                          onPress={() =>
                            setEditMode({ ...editMode, [provider]: !isEditing })
                          }
                        >
                          <Ionicons name="pencil" size={18} color="green" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })}
              </ScrollView>

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={() => setIsSettings(false)}
                >
                  <Text style={styles.buttonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.submitBtn}
                  onPress={saveKeys}
                  disabled={PROVIDERS.every(
                    (p) => (apiKeys[p] || "").trim() === ""
                  )}
                >
                  <Text style={styles.buttonText}>Submit</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* API Key Popup Modal */}
        <Modal visible={showApiKeyPopup} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => {
                  setShowApiKeyPopup(false);
                  setPopupClosedWithoutKey(true);
                }}
              >
                <Text style={styles.modalCloseText}>✖</Text>
              </TouchableOpacity>

              <Text style={styles.modalTitle}>Enter Your AI API Keys</Text>

              <Text style={styles.modalSubtitle}>
                To get started, please enter at least one API key for your
                preferred AI provider.
              </Text>

              <ScrollView style={styles.apiProvidersList}>
                {PROVIDERS.map((provider) => (
                  <View key={provider} style={styles.apiProvider}>
                    <Text style={styles.apiProviderLabel}>
                      {properName(provider)} Key
                    </Text>
                    <TextInput
                      value={apiKeys[provider] || ""}
                      onChangeText={(text) =>
                        setApiKeys({ ...apiKeys, [provider]: text })
                      }
                      placeholder={`Enter your ${properName(provider)} API key`}
                      secureTextEntry
                      style={styles.apiKeyInput}
                    />
                  </View>
                ))}
              </ScrollView>

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[
                    styles.submitBtn,
                    PROVIDERS.every((p) => (apiKeys[p] || "").trim() === "") &&
                      styles.disabledBtn,
                  ]}
                  onPress={saveKeys}
                  disabled={PROVIDERS.every(
                    (p) => (apiKeys[p] || "").trim() === ""
                  )}
                >
                  <Text style={styles.buttonText}>Save & Start Chat</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    marginTop: 30,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#f8f9fa",
    borderBottomWidth: 1,
    borderBottomColor: "#e9ecef",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fe786b",
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  logoutButton: {
    marginLeft: 8,
  },
  chatContainer: {
    flex: 1,
    flexDirection: "row",
  },
  sidebar: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 300,
    backgroundColor: "#f8f9fa",
    borderRightWidth: 1,
    borderRightColor: "#e9ecef",
    padding: 16,
    zIndex: 1000,
  },
  backdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.3)",
    zIndex: 999,
  },
  sidebarSection: {
    marginBottom: 24,
  },
  sidebarTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 12,
    color: "#333",
  },
  questionItem: {
    padding: 8,
    backgroundColor: "#fff",
    borderRadius: 6,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#dee2e6",
    color: "#495057",
  },
  newChatButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    padding: 8,
    backgroundColor: "#fff",
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#dee2e6",
  },
  newChatText: {
    fontWeight: "bold",
    color: "#333",
  },
  chatList: {
    maxHeight: 350,
  },
  chatItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 8,
    borderRadius: 6,
    marginBottom: 4,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#dee2e6",
  },
  selectedChatItem: {
    backgroundColor: "#fe786b",
  },
  chatNameContainer: {
    flex: 1,
  },
  chatName: {
    color: "#333",
  },
  selectedChatName: {
    color: "#fff",
  },
  renameInput: {
    flex: 1,
    padding: 4,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 4,
    color: "#333",
  },
  chatActions: {
    flexDirection: "row",
    gap: 8,
  },
  mainContent: {
    flex: 1,
    padding: 16,
  },
  chatHeader: {
    marginBottom: 16,
  },
  chatTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
  },
  chatSubtitle: {
    fontSize: 16,
    color: "#6c757d",
    marginBottom: 16,
  },
  selectionContainer: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 16,
  },
  selectionItem: {
    flex: 1,
  },
  selectionLabel: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#fe786b",
    marginBottom: 4,
  },
  selectWrapper: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 10,
    borderWidth: 1,
    borderColor: "#ced4da",
    borderRadius: 6,
    backgroundColor: "#fff",
  },
  dropdown: {
    position: "absolute",
    top: "100%",
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ced4da",
    borderRadius: 6,
    marginTop: 4,
    zIndex: 1000,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },

  dropdownItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },

  modalSubtitle: {
    fontSize: 14,
    color: "#666",
    marginBottom: 16,
    textAlign: "center",
  },

  disabledBtn: {
    backgroundColor: "#ccc",
  },

  dropdownItemSelected: {
    backgroundColor: "#f8f9fa",
  },

  dropdownItemText: {
    color: "#333",
  },
  selectValue: {
    color: "#495057",
  },
  chatMessages: {
    flex: 1,
    marginBottom: 16,
  },
  message: {
    padding: 12,
    marginBottom: 8,
    borderRadius: 8,
    maxWidth: "80%",
  },
  userMessage: {
    alignSelf: "flex-end",
    backgroundColor: "#e3f2fd",
  },
  aiMessage: {
    alignSelf: "flex-start",
    backgroundColor: "#f8f9fa",
  },
  messageHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  messageName: {
    fontWeight: "bold",
    color: "#333",
  },
  messageText: {
    color: "#333",
  },
  inputArea: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ced4da",
    borderRadius: 6,
    padding: 12,
    maxHeight: 100,
    backgroundColor: "#fff",
  },
  sendButton: {
    backgroundColor: "#007bff",
    padding: 12,
    borderRadius: 6,
  },
  downloadButton: {
    backgroundColor: "#28a745",
    padding: 12,
    borderRadius: 6,
  },
  note: {
    padding: 12,
    backgroundColor: "#fff3cd",
    borderWidth: 1,
    borderColor: "#ffeaa7",
    borderRadius: 6,
  },
  noteText: {
    color: "#856404",
  },
  noteBold: {
    fontWeight: "bold",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 20,
    width: "100%",
    maxWidth: 400,
    maxHeight: "80%",
  },
  modalCloseBtn: {
    position: "absolute",
    top: 10,
    right: 10,
    zIndex: 1,
  },
  modalCloseText: {
    fontSize: 18,
    color: "#000",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
    color: "#fe786b",
    textAlign: "center",
  },
  apiProvidersList: {
    maxHeight: 300,
    marginBottom: 16,
  },
  apiProvider: {
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 6,
    padding: 12,
  },
  apiProviderWithKey: {
    borderColor: "#4CAF50",
    borderWidth: 2,
  },
  apiProviderLabel: {
    fontWeight: "600",
    marginBottom: 6,
    color: "#333",
  },
  apiKeyInput: {
    flex: 2,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 4,
    padding: 8,
    color: "#333",
    marginRight: 4,
  },
  apiKeyMasked: {
    flex: 2,
    marginHorizontal: 10,
    color: "#555",
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
  },
  cancelBtn: {
    backgroundColor: "#6c757d",
    padding: 10,
    borderRadius: 4,
    minWidth: 80,
    alignItems: "center",
  },
  submitBtn: {
    backgroundColor: "#007bff",
    padding: 10,
    borderRadius: 4,
    minWidth: 80,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "500",
  },
});

export default ChatInterface;
