import React, { useState, useEffect } from 'react';
import { ScrollView, Text, TouchableOpacity, Image, KeyboardAvoidingView, Platform } from 'react-native';
import { TextInput, Button, Menu, Divider } from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation } from '@react-navigation/native';
import AuthStyle from './AuthStyle';
import APIs, { authApis, endpoints } from "../../configs/APIs";

const Register = () => {
  const [first_name, setFirstName] = useState("");
  const [last_name, setLastName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [avatar, setAvatar] = useState(null);
  const [studentId, setStudentId] = useState(""); // Mã số sinh viên
  const [email, setEmail] = useState(""); // Email
  const [phoneNumber, setPhoneNumber] = useState(""); // Số điện thoại
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState(null); // Role initially is null (not selected)
  const [roles, setRoles] = useState([]); // To store the roles fetched from the backend
  const [menuVisible, setMenuVisible] = useState(false); // Added state to manage menu visibility

  const navigation = useNavigation();

  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const response = await APIs.get(endpoints["getRoles"]);
        console.log("Fetched roles:", response.data);  
        setRoles(Array.isArray(response.data) ? response.data : []); 
      } catch (error) {
        console.error("Failed to fetch roles:", error);
      }
    };

    fetchRoles();
  }, []);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      alert("Permissions denied!");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync();
    if (!result.canceled) {
      setAvatar(result.assets[0]);
    }
  };

  const register = async () => {
    if (!role) {
      alert("Vui lòng chọn vai trò");
      return;
    }
  
    // Giảng viên (teachers) do not need to enter their password, but it must be sent with a default value
    if (role.name !== "Giảng viên") {
      if (password !== confirmPassword) {
        alert("Mật khẩu không khớp!");
        return;
      }
      if (!password || password.length < 6) {
        alert("Mật khẩu phải có ít nhất 6 ký tự");
        return;
      }
    } else {
      // For teachers, set a default password if not provided
      if (!password) {
        setPassword('ou@123');  // Set a default password for Giảng viên
      }
    }
  
    if (!email || !email.includes("@")) {
      alert("Vui lòng nhập email hợp lệ!");
      return;
    }
    if (!phoneNumber || phoneNumber.length < 10) {
      alert("Số điện thoại không hợp lệ!");
      return;
    }
  
    setLoading(true);
  
    try {
      const form = new FormData();
  
      form.append("first_name", first_name);
      form.append("last_name", last_name);
      form.append("username", username);
      form.append("email", email); // Email
      form.append("phone_number", phoneNumber); // Số điện thoại
      form.append("role", role.id); // Use the role ID from the selected role
  
      if (role.name === "Sinh Viên") {
        form.append("student_id", studentId); // Add student ID only if role is "Sinh Viên"
      }
  
      form.append("password", password); // Add password regardless of role
  
      if (avatar) {
        form.append("avatar", {
          uri: avatar.uri,
          name: avatar.fileName || "avatar.jpg",
          type: avatar.type || "image/jpeg",
        });
      }
  
      const response = await APIs.post(endpoints["register"], form, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
  
      console.log("Registration Success:", response.data); // Log the response on success
  
      navigation.navigate("Login");
    } catch (error) {
      console.error("Đăng ký lỗi:", error); // Log the error in case of failure
      if (error.response) {
        // Log specific error message from the server
        console.error("Error Response:", error.response.data);
        alert("Lỗi đăng ký: " + error.response.data.detail || "Có lỗi xảy ra, vui lòng thử lại!");
      } else {
        // If there's no response, it could be a network issue
        alert("Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={AuthStyle.container}
    >
      <ScrollView>
        <TextInput
          label="Tên"
          style={AuthStyle.input}
          value={first_name}
          onChangeText={setFirstName}
          mode="outlined"
        />

        <TextInput
          label="Họ và tên lót"
          style={AuthStyle.input}
          value={last_name}
          onChangeText={setLastName}
          mode="outlined"
        />

        <TextInput
          label="Tên đăng nhập"
          style={AuthStyle.input}
          value={username}
          onChangeText={setUsername}
          mode="outlined"
        />

        <TextInput
          label="Email"
          style={AuthStyle.input}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address" // Email-specific keyboard
          mode="outlined"
        />

        <TextInput
          label="Số điện thoại"
          style={AuthStyle.input}
          value={phoneNumber}
          onChangeText={setPhoneNumber}
          keyboardType="phone-pad" // Phone number-specific keyboard
          mode="outlined"
        />

        {role && role.name === "Sinh Viên" && (
          <>
            <TextInput
              label="Mã số sinh viên"
              style={AuthStyle.input}
              value={studentId}
              onChangeText={setStudentId}
              mode="outlined"
              keyboardType="numeric"  // Ensures only numeric input
            />
          </>
        )}

        {role && role.name !== "Giảng viên" && (
          <>
            <TextInput
              label="Mật khẩu"
              style={AuthStyle.input}
              secureTextEntry
              value={password}
              onChangeText={setPassword}
              mode="outlined"
            />

            <TextInput
              label="Xác nhận mật khẩu"
              style={AuthStyle.input}
              secureTextEntry
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              mode="outlined"
            />
          </>
        )}

        <TouchableOpacity onPress={pickImage} style={AuthStyle.avatarPicker}>
          <Text>Chọn ảnh đại diện</Text>
        </TouchableOpacity>

        {avatar && <Image source={{ uri: avatar.uri }} style={AuthStyle.avatarPreview} />}

        <Menu
          visible={menuVisible} 
          onDismiss={() => setMenuVisible(false)} 
          anchor={
            <Button
              onPress={() => setMenuVisible(true)} 
            >
              {role ? role.name : "Chọn vai trò"} 
            </Button>
          }
        >
          {roles.map((roleOption) => (
            <Menu.Item
              key={roleOption.id}
              title={roleOption.name}
              onPress={() => {
                setRole(roleOption); 
                setMenuVisible(false); 
              }}
            />
          ))}
          <Divider />
        </Menu>

        <Button
          onPress={register}
          loading={loading}
          style={AuthStyle.button}
          icon="account-check"
          mode="contained"
        >
          Đăng ký
        </Button>

        <TouchableOpacity onPress={() => navigation.navigate("Login")} style={AuthStyle.link}>
          <Text style={AuthStyle.linkText}>Đã có tài khoản? Đăng nhập</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default Register;
