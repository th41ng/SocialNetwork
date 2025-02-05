import React, { useContext, useState, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet } from "react-native";
import { IconButton } from 'react-native-paper';

import { database } from "./FirebaseConfig";
import { ref, push, onValue } from "firebase/database";
import { MyDispatchContext, MyUserContext } from "../../configs/UserContext";
import ChatStyle from "./ChatStyle";

const Chats = ({ navigation, route }) => {
  const { userId, username } = route.params; 
  const currentUser = useContext(MyUserContext); 

  const [messages, setMessages] = useState([]); 
  const [message, setMessage] = useState(""); 

  const chatId =
    currentUser.id < userId
      ? `${currentUser.id}_${userId}`
      : `${userId}_${currentUser.id}`;

  useEffect(() => {
    console.log("userId:", userId);
    console.log("currentUserId:", currentUser.id);
    console.log("chatId:", chatId);

    const messagesRef = ref(database, `chats/${chatId}`);
    const unsubscribe = onValue(messagesRef, (snapshot) => {
      const data = snapshot.val();
      const loadedMessages = data ? Object.values(data) : [];
      setMessages(loadedMessages);
    });

    return () => unsubscribe(); 
  }, [chatId]); 

  const sendMessage = async () => {
    if (message.trim() === "") return;

    const messagesRef = ref(database, `chats/${chatId}`);
    await push(messagesRef, {
      text: message,
      timestamp: Date.now(),
      from: currentUser.id, 
    });

    setMessage(""); 
  };


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
