import AsyncStorage from "@react-native-async-storage/async-storage";
import { useContext, useState } from "react";
import { KeyboardAvoidingView, Platform, Text, TouchableOpacity, View } from "react-native";
import { Button, TextInput } from "react-native-paper";
import APIs, { authApis, endpoints } from "../../configs/APIs";
import { MyDispatchContext } from "../../configs/UserContext"; // Import context
import AuthStyle from "./AuthStyle";
import { useNavigation } from "@react-navigation/native";
import qs from "qs";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  
  const dispatch = useContext(MyDispatchContext); // Lấy dispatch từ context
  const navigation = useNavigation();

  const login = async () => {
    try {
      setLoading(true);
  
      const formData = qs.stringify({
        client_id: "UesP5I1seeUaDeUzTTPB2HxJmb6V0K7tI7dqbSGs",
        client_secret: "enFoARwSUlY1MeChzohgYbngsCHYYlu2YKZVM0dCmRmbXfDUzokZvgPOhbUjYT4enJqOdQg2LYGadR0MWIHNCzcEocK4ZXMvGXrSpeVcBHCRU7coO9QV9ovi8oZK6JOf",
        grant_type: "password",
        username,
        password,
      });
  
      const headers = {
        "Content-Type": "application/x-www-form-urlencoded",
      };
  
      const res = await APIs.post(endpoints["login"], formData, { headers });
  
      if (!res.data.access_token) {
        alert("Đăng nhập thất bại. Vui lòng kiểm tra thông tin đăng nhập.");
        return;
      }
  
      await AsyncStorage.removeItem("token");
      await AsyncStorage.setItem("token", res.data.access_token);
  
      const token = await AsyncStorage.getItem("token");
      const userResponse = await authApis(token).get(endpoints["profile"]);
      const userData = userResponse.data.user; // Lấy dữ liệu user
      const role = userData.role; // Lấy role từ phản hồi API
      const isCheck = userData.student_id_verified;
  
      console.log("Role của người dùng:", role);
  
      if (isCheck === false && role !== "Giảng viên") {
        alert("Tài khoản chưa được xác thực mã sinh viên. Vui lòng liên hệ với quản trị viên.");
        await AsyncStorage.removeItem("token");
        return;
      }
  
      dispatch({
        type: "login",
        payload: { username: userData.username },
      });
  
      navigation.navigate("UserProfile");
    } catch (error) {
      console.error("Login error:", error);
      alert("Đăng nhập thất bại. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={AuthStyle.container}
    >
      <TextInput
        label="Tên đăng nhập"
        value={username}
        onChangeText={setUsername}
        style={AuthStyle.input}
        mode="outlined"
        right={<TextInput.Icon icon="account" />}
      />
      <TextInput
        label="Mật khẩu"
        value={password}
        onChangeText={setPassword}
        style={AuthStyle.input}
        secureTextEntry
        mode="outlined"
        right={<TextInput.Icon icon="eye" />}
      />
      <Button
        onPress={login}
        loading={loading}
        style={AuthStyle.button}
        icon="login"
        mode="contained"
      >
        Đăng nhập
      </Button>

      <TouchableOpacity
        onPress={() => navigation.navigate("Register")}
        style={AuthStyle.link}
      >
        <Text style={AuthStyle.linkText}>Chưa có tài khoản? Đăng ký ngay</Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
};

export default Login;
