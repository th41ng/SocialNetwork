import { StyleSheet } from "react-native";

const ChatStyle = StyleSheet.create({
  container: {
    flex: 1,
    // backgroundColor: "#f2f2f2",
    // padding: 10,
  },
  messagesList: {
    flex: 1,
  },
  messageBubble: {
    padding: 10,
    borderRadius: 10,
    marginVertical: 5,
    maxWidth: "80%",
  },
  myMessage: {
    backgroundColor: "#000000",
    alignSelf: "flex-end",
    marginEnd:10,
  },
  theirMessage: {
    backgroundColor: "#383737",
    alignSelf: "flex-start",
    marginStart:10,
  },
  messageText: {
    color: "#fff",
  },
  messageTime: {
    fontSize: 8,
    color: "#ddd",
    alignSelf: "flex-end",
    marginTop: 5,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    borderTopWidth: 1,
    borderColor: "#ccc",
    backgroundColor: "#fff",
  },
  input: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 20,
    paddingHorizontal: 10,
  },
  sendButton: {
    backgroundColor: "#000000",
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 20,
    marginLeft: 10,
  },
  sendButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  header: {
    backgroundColor: "#000000", 
    paddingHorizontal: 20,
    alignItems: "center",
    justifyContent: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 3,
  },
  textheader: {
    fontSize: 20,
    fontWeight: "bold",
    color: "white",
    textTransform: "uppercase",
  },
});

export default ChatStyle;
