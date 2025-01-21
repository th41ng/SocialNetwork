import AsyncStorage from "@react-native-async-storage/async-storage";
import { useContext, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Text,
  TouchableOpacity,
  View,
  Alert,
} from "react-native";
import { Button, TextInput } from "react-native-paper";
import APIs, { authApis, endpoints } from "../../configs/APIs";
import { MyDispatchContext } from "../../configs/UserContext";
import AuthStyle from "./AuthStyle";
import { useNavigation } from "@react-navigation/native";
import qs from "qs";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const dispatch = useContext(MyDispatchContext);
  const navigation = useNavigation();

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

      await AsyncStorage.removeItem("token");
      await AsyncStorage.setItem("token", res.data.access_token);

      const token = await AsyncStorage.getItem("token");
      try {
        const userResponse = await authApis(token).get(endpoints["profile"]);

        // *** KIỂM TRA RESPONSE TỪ API /profile ***
        console.log("Response từ API /profile:", JSON.stringify(userResponse, null, 2)); // Log response với format đẹp hơn

        if (!userResponse || !userResponse.data || !userResponse.data.user) {
          console.error("Response từ API /profile không hợp lệ:", userResponse);
          Alert.alert("Lỗi đăng nhập", "Lỗi dữ liệu từ máy chủ. Vui lòng liên hệ quản trị viên.");
          return;
        }

        const userData = userResponse.data.user;

        if (!userData.id) {
          console.error("Dữ liệu user trả về không có id:", userData);
          Alert.alert("Lỗi đăng nhập", "Dữ liệu người dùng bị thiếu ID. Vui lòng liên hệ quản trị viên.");
          return;
        }

        console.log("userData (sau khi kiểm tra):", userData);

        // Kiểm tra thông tin sinh viên và xác thực mật khẩu (nếu có)
        if(userData.password_reset_deadline){
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

        // *** LƯU DỮ LIỆU VÀO ASYNCSTORAGE ***
        try {
          await AsyncStorage.setItem('user', JSON.stringify(userData));
          console.log('Đã lưu thông tin người dùng vào AsyncStorage:', userData);
        } catch (error) {
          console.error('Lỗi khi lưu thông tin người dùng vào AsyncStorage:', error);
          Alert.alert("Lỗi", "Đã có lỗi xảy ra khi lưu thông tin. Vui lòng thử lại sau.");
          return;
        }

        dispatch({ type: "login", payload: userData });
        navigation.navigate("UserProfile");
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
      {/* ... (JSX - không thay đổi) */}
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
      <Button onPress={login} loading={loading} style={AuthStyle.button} icon="login" mode="contained">
        Đăng nhập
      </Button>

      <TouchableOpacity onPress={() => navigation.navigate("Register")} style={AuthStyle.link}>
        <Text style={AuthStyle.linkText}>Chưa có tài khoản? Đăng ký ngay</Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
};

export default Login; 


