import AsyncStorage from "@react-native-async-storage/async-storage";
import { useContext, useState } from "react";
import { KeyboardAvoidingView, Platform, Text, TouchableOpacity, View } from "react-native";
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

  const dispatch = useContext(MyDispatchContext); // Lấy dispatch từ context
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
        alert("Đăng nhập thất bại. Vui lòng kiểm tra thông tin đăng nhập.");
        return;
      }

      await AsyncStorage.removeItem("token");
      await AsyncStorage.setItem("token", res.data.access_token);

      const token = await AsyncStorage.getItem("token");
      const userResponse = await authApis(token).get(endpoints["profile"]);
      const userData = userResponse.data.user; // Lấy dữ liệu user

      console.log("userdata:", userData); // Kiểm tra dữ liệu trả về từ API

      const role = userData.role; // Lấy role từ phản hồi API
      const isCheck = userData.student_id_verified;

      // Kiểm tra thông tin sinh viên và xác thực mật khẩu
      const password_reset_deadline = new Date(userData.password_reset_deadline);
      const currentTime = new Date();
      const timeDifference = (currentTime - password_reset_deadline) / (1000 * 60 * 60); // Tính thời gian chênh lệch (giờ)
      console.log("Chênh lệch thời gian đổi mật khẩu:", timeDifference);

      if (timeDifference > 24) {
        alert("Thời gian thay đổi mật khẩu đã quá 24 giờ. Vui lòng liên hệ quản trị viên để gia hạn thời gian đổi mật khẩu.");
        await AsyncStorage.removeItem("token");
        return;
      }

      if (isCheck === false && role !== "Giảng viên") {
        alert("Tài khoản chưa được xác thực mã sinh viên. Vui lòng liên hệ với quản trị viên.");
        await AsyncStorage.removeItem("token");
        return;
      }
      console.log("Dữ liệu user:", userData);

      const defaultAvatar = "URL_avatar_mặc_định"; // Thay thế bằng URL avatar mặc định của bạn
      await AsyncStorage.setItem("avatar", userData.avatar || defaultAvatar);
      console.log("Đã lưu avatar:", userData.avatar || defaultAvatar);

      await AsyncStorage.setItem("student_id", userData.student_id);
      console.log("Đã lưu student_id:", userData.student_id);

      // Lưu thông tin vào AsyncStorage (có giá trị mặc định nếu thiếu)
      await AsyncStorage.setItem("username", userData.username);
      console.log("Đã lưu username:", userData.username);

      await AsyncStorage.setItem("email", userData.email);
      console.log("Đã lưu email:", userData.email);

      await AsyncStorage.setItem("phone_number", userData.phone_number);
      console.log("Đã lưu phone_number:", userData.phone_number);

      await AsyncStorage.setItem("cover_image", userData.cover_image || "");
      console.log("Đã lưu cover_image:", userData.cover_image || "");

      await AsyncStorage.setItem("student_id_verified", userData.student_id_verified.toString());
      console.log("Đã lưu student_id_verified:", userData.student_id_verified);

      // Kiểm tra lại dữ liệu đã lưu
      const savedData = {
        username: await AsyncStorage.getItem("username"),
        email: await AsyncStorage.getItem("email"),
        phone_number: await AsyncStorage.getItem("phone_number"),
        avatar: await AsyncStorage.getItem("avatar"),
        student_id: await AsyncStorage.getItem("student_id"),
      };
      console.log("Thông tin đã lưu vào AsyncStorage:", savedData);

      dispatch({
        type: "login",
        payload: {
          username: userData.username,
          email: userData.email,
          phone_number: userData.phone_number,
          role: userData.role,
          avatar: userData.avatar || defaultAvatar,
          cover_image: userData.cover_image || "",
        },
      });
      // Chuyển hướng sau khi đã lưu tất cả dữ liệu vào AsyncStorage
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