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
    alignItems: "center", 
  },
  imagePicker: {
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 10,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    padding: 10,
  },
  
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  
});

export default AuthStyle;
