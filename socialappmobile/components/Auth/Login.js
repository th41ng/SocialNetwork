import AsyncStorage from "@react-native-async-storage/async-storage";
import { useContext, useEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Text,
  TouchableOpacity,
  View,
  Alert,
} from "react-native";
import { Button, TextInput, Switch } from "react-native-paper";
import APIs, { authApis, endpoints } from "../../configs/APIs";
import { MyDispatchContext } from "../../configs/UserContext";
import AuthStyle from "./AuthStyle";
import { useNavigation } from "@react-navigation/native";
import qs from "qs";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);  // Thêm trạng thái cho mật khẩu
  const dispatch = useContext(MyDispatchContext);
  const navigation = useNavigation();
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);  // Đảo ngược trạng thái showPassword
  };

    useEffect(() => {
      const autoLogin = async () => {
        try {
          const savedUsername = await AsyncStorage.getItem("savedUsername");
          const savedPassword = await AsyncStorage.getItem("savedPassword");
          const token = await AsyncStorage.getItem("token");
          const user = await AsyncStorage.getItem("user");
    
          if (token && user) {
            const parsedUser = JSON.parse(user);
    
            if (parsedUser && parsedUser.id) {
              dispatch({ type: "login", payload: parsedUser });
              navigation.navigate("Home");
            } else {
              console.warn("Thông tin người dùng không hợp lệ.");
            }
          } else if (savedUsername && savedPassword) {
            setUsername(savedUsername);
            setPassword(savedPassword);
            setRememberMe(true);
          }
        } catch (error) {
          console.error("Lỗi khi tự động đăng nhập:", error);
        }
      };
    
      autoLogin();
    }, []);
    

  const login = async () => {
    try {
      setLoading(true);

      const formData = qs.stringify({
        client_id: "2od6fQO9tu6D34r3OLHvpje4Iqsc35LxnhH45wbN",
        client_secret: "tvbhvOWlQNb3hOypekFHKa6pmzlqN3D4zLiQkaLmcE1D3ns5zdYeiA4wyZip79tZvw45KaD2i7Kg1kAsF8E4FbFLttn1YwYRA68qIWTsCXLqK9ceQCWqKunmSoKiPoNb",
        grant_type: "password",
        username,
        password,
      });

      const headers = {
        "Content-Type": "application/x-www-form-urlencoded",
      };

      const res = await APIs.post(endpoints["login"], formData, { headers });

      if (!res.data.access_token) {
        Alert.alert("Lỗi đăng nhập", "Vui lòng kiểm tra thông tin đăng nhập.");
        return;
      }

      if (rememberMe) {
        await AsyncStorage.setItem("savedUsername", username);
        await AsyncStorage.setItem("savedPassword", password);
      } else {
        await AsyncStorage.removeItem("savedUsername");
        await AsyncStorage.removeItem("savedPassword");
      }

      await AsyncStorage.setItem("token", res.data.access_token);

      const token = await AsyncStorage.getItem("token");
      try {
        const userResponse = await authApis(token).get(endpoints["profile"]);

        if (!userResponse || !userResponse.data || !userResponse.data.user) {
          Alert.alert("Lỗi đăng nhập", "Lỗi dữ liệu từ máy chủ. Vui lòng liên hệ quản trị viên.");
          return;
        }

        const userData = userResponse.data.user;

        if (userData.password_reset_deadline && userData.role === "Giảng viên") {
          const password_reset_deadline = new Date(userData.password_reset_deadline);
          const currentTime = new Date();
          const timeDifference = (currentTime - password_reset_deadline) / (1000 * 60 * 60);

          if (timeDifference > 24) {
            Alert.alert("Lỗi", "Thời gian thay đổi mật khẩu đã quá 24 giờ. Vui lòng liên hệ quản trị viên.");
            await AsyncStorage.removeItem("token");
            return;
          }
        }

        if (userData.student_id_verified === false && userData.role !== "Giảng viên") {
          Alert.alert("Lỗi", "Tài khoản chưa được xác thực mã sinh viên. Vui lòng liên hệ với quản trị viên.");
          await AsyncStorage.removeItem("token");
          return;
        }

        await AsyncStorage.setItem('user', JSON.stringify(userData));

        dispatch({ type: "login", payload: userData });
        navigation.navigate("Home");
      } catch (profileError) {
        console.error("Lỗi khi gọi API /profile:", profileError);
        Alert.alert("Lỗi đăng nhập", "Không thể lấy thông tin người dùng. Vui lòng thử lại.");
        await AsyncStorage.removeItem("token");
        return;
      }
    } catch (loginError) {
      console.error("Login error:", loginError);
      Alert.alert("Lỗi", "Đăng nhập thất bại. Vui lòng thử lại.");
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
          secureTextEntry={!showPassword}  // Nếu showPassword là true thì sẽ không ẩn mật khẩu
          mode="outlined"
          right={
            <TextInput.Icon
              icon={showPassword ? "eye-off" : "eye"}  // Thay đổi icon khi showPassword thay đổi
              onPress={togglePasswordVisibility}  // Khi nhấn vào icon "eye", gọi hàm togglePasswordVisibility
            />
          }
        />

      <View style={{ flexDirection: "row", alignItems: "center" }}>
        <Switch thumbColor={rememberMe ? "#000000" : "#d3d3d3"} trackColor={{ false: "#767577", true: "#81b0ff" }} value={rememberMe} onValueChange={setRememberMe} />
        <Text style={{ marginLeft: 8}}>Lưu thông tin đăng nhập</Text>
      </View>
      <View style={AuthStyle.buttonContainer}>
      <Button onPress={login} loading={loading} style={AuthStyle.button} icon="login" mode="contained">
        Đăng nhập
      </Button>
      </View>
      <TouchableOpacity onPress={() => navigation.navigate("Register")} style={AuthStyle.link}>
        <Text style={AuthStyle.linkText}>Chưa có tài khoản? Đăng ký ngay</Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
};

export default Login;
