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
    backgroundColor: "#000000",
    width:"60%",
  },
  buttonContainer: {
    marginTop:10,
    alignItems: "center", // Căn giữa theo chiều ngang
  },

});

export default AuthStyle;
