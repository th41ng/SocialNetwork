import React, { useState, useEffect } from 'react';
import { ScrollView, Text, TouchableOpacity, Image, KeyboardAvoidingView, Platform } from 'react-native';
import { TextInput, Button, Menu, Divider } from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation } from '@react-navigation/native';
import AuthStyle from './AuthStyle';
import APIs, { authApis, endpoints } from "../../configs/APIs";
import axios from 'axios';
import * as FileSystem from 'expo-file-system';
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
        if (response.data && response.data.results) {
          setRoles(response.data.results); // Lưu kết quả vào state
        }
      } catch (error) {
        console.error("Failed to fetch roles:", error);
      }
    };

    fetchRoles();
  }, []);

 


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
    // Prepare data for the registration API
    const data = {
      first_name,
      last_name,
      username,
      email,
      phone_number: phoneNumber,
      role: role.id, // Use the role ID from the selected role
      password,
    };

    // Add student_id if the role is "Sinh viên"
    if (role.name === "Sinh viên") {
      data.student_id = studentId;
    }

   
    console.log("DAta",data);
    // Make the POST request to register the user
    const response = await APIs.post(endpoints.register, data, {
      headers: {
        "Content-Type": "application/json",
      },
    });

    console.log("Registration Success:", response.data); // Log the response on success
    navigation.navigate("Login");
  } catch (error) {
    console.error("Đăng ký lỗi:", error); // Log the error in case of failure
    if (error.response) {
      console.error("Error Response:", error.response.data);
      alert("Lỗi đăng ký: " + error.response.data.detail || "Có lỗi xảy ra, vui lòng thử lại!");
    } else {
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

        {role && role.name === "Sinh viên" && (
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

<Menu
  visible={menuVisible}
  onDismiss={() => setMenuVisible(false)}
  anchor={
    <Button mode="outlined" onPress={() => setMenuVisible(true)}>
      {role ? role.name : "Chọn vai trò"}
    </Button>
  }
>
  {roles.map((roleOption) => (
    <Menu.Item
      key={roleOption.id}
      title={roleOption.name}
      onPress={() => {
        setRole(roleOption); // Cập nhật role ngay khi nhấn chọn
        setMenuVisible(false); // Ẩn menu ngay lập tức
        console.log("Selected Role:",roleOption);
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