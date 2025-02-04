import React, { useContext, useState, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet } from "react-native";
import { IconButton } from 'react-native-paper';

import { database } from "./FirebaseConfig";
import { ref, push, onValue } from "firebase/database";
import { MyDispatchContext, MyUserContext } from "../../configs/UserContext";
import ChatStyle from "./ChatStyle";

const Chats = ({ navigation, route }) => {
  const { userId, username } = route.params; // Lấy userId của người nhận
  const currentUser = useContext(MyUserContext); // Lấy người dùng hiện tại từ Context

  const [messages, setMessages] = useState([]); // Danh sách tin nhắn
  const [message, setMessage] = useState(""); // Tin nhắn nhập vào

  // Tạo chatId dựa trên userId và currentUser.id
  const chatId =
    currentUser.id < userId
      ? `${currentUser.id}_${userId}`
      : `${userId}_${currentUser.id}`;

  useEffect(() => {
    // Đặt log chỉ khi chatId thay đổi (chỉ chạy một lần khi component mount)
    console.log("userId:", userId);
    console.log("currentUserId:", currentUser.id);
    console.log("chatId:", chatId);

    const messagesRef = ref(database, `chats/${chatId}`);
    const unsubscribe = onValue(messagesRef, (snapshot) => {
      const data = snapshot.val();
      const loadedMessages = data ? Object.values(data) : [];
      setMessages(loadedMessages);
    });

    return () => unsubscribe(); // Hủy đăng ký khi rời màn hình
  }, [chatId]); // Chỉ chạy lại khi chatId thay đổi

  // Hàm gửi tin nhắn
  const sendMessage = async () => {
    if (message.trim() === "") return;

    const messagesRef = ref(database, `chats/${chatId}`);
    await push(messagesRef, {
      text: message,
      timestamp: Date.now(),
      from: currentUser.id, // ID người gửi
    });

    setMessage(""); // Reset tin nhắn sau khi gửi
  };

  // Hiển thị tin nhắn
  const renderMessage = ({ item }) => (
    <View
      style={[
        ChatStyle.messageBubble,
        item.from === currentUser.id ? ChatStyle.myMessage : ChatStyle.theirMessage,
      ]}
    >
      <Text style={ChatStyle.messageText}>{item.text}</Text>
      <Text style={ChatStyle.messageTime}>
        {new Date(item.timestamp).toLocaleTimeString()}
      </Text>
    </View>
  );

  return (
    <View style={ChatStyle.container}>
      <IconButton icon="arrow-left" size={28} onPress={() => navigation.goBack()} />

      <FlatList
        data={messages}
        keyExtractor={(item, index) => index.toString()}
        renderItem={renderMessage}
        style={ChatStyle.messagesList}
      />
      <View style={ChatStyle.inputContainer}>
        <TextInput
          style={ChatStyle.input}
          placeholder="Type a message..."
          value={message}
          onChangeText={setMessage}
        />
        <TouchableOpacity style={ChatStyle.sendButton} onPress={sendMessage}>
          <Text style={ChatStyle.sendButtonText}>Send</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default Chats;
