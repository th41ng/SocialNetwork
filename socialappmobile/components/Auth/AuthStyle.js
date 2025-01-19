import { StyleSheet } from "react-native";

const AuthStyle = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 16,
    backgroundColor: "#fff",
  },
  input: {
    marginBottom: 16,
  },
  button: {
    marginTop: 16,
  },
  avatarPicker: {
    marginBottom: 16,
    alignItems: "center",
  },
  avatarPreview: {
    width: 100,
    height: 100,
    alignSelf: "center",
    marginBottom: 16,
  },
});

export default AuthStyle;
