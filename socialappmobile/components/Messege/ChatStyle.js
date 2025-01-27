import { StyleSheet } from 'react-native';

const ChatStyle = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: "#f5f5f5",
    },
    messagesList: {
      flex: 1,
      padding: 10,
    },
    messageBubble: {
      padding: 10,
      marginBottom: 5,
      borderRadius: 10,
      maxWidth: "70%",
    },
    myMessage: {
      alignSelf: "flex-end",
      backgroundColor: "#d1ffd6",
    },
    theirMessage: {
      alignSelf: "flex-start",
      backgroundColor: "#f1f1f1",
    },
    messageText: {
      fontSize: 16,
    },
    messageTime: {
      fontSize: 12,
      color: "#999",
      marginTop: 5,
      textAlign: "right",
    },
    inputContainer: {
      flexDirection: "row",
      alignItems: "center",
      padding: 10,
      borderTopWidth: 1,
      borderColor: "#ddd",
    },
    input: {
      flex: 1,
      height: 40,
      backgroundColor: "#fff",
      borderRadius: 5,
      paddingHorizontal: 10,
      borderWidth: 1,
      borderColor: "#ddd",
    },
    sendButton: {
      backgroundColor: "#007bff",
      paddingHorizontal: 15,
      paddingVertical: 10,
      borderRadius: 5,
      marginLeft: 10,
    },
    sendButtonText: {
      color: "#fff",
      fontSize: 16,
    },
  });

export default ChatStyle;