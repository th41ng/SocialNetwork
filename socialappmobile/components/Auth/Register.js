import React, { useState, useEffect } from 'react';
import { ScrollView, Text, TouchableOpacity, Image, KeyboardAvoidingView, Platform,View } from 'react-native';
import { TextInput, Button, Menu, Divider } from 'react-native-paper';

import { useNavigation } from '@react-navigation/native';
import AuthStyle from './AuthStyle';
import APIs, { authApis, endpoints } from "../../configs/APIs";

import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { Alert } from 'react-native';
import axios from "axios";
const Register = () => {
  const [first_name, setFirstName] = useState("");
  const [last_name, setLastName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [avatar, setAvatar] = useState(null);
  const [studentId, setStudentId] = useState(""); 
  const [email, setEmail] = useState(""); 
  const [phoneNumber, setPhoneNumber] = useState(""); 
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState(null); 
  const [roles, setRoles] = useState([]); 
  const [menuVisible, setMenuVisible] = useState(false); 

  const navigation = useNavigation();

  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const response = await APIs.get(endpoints["getRoles"]);
        console.log("Fetched roles:", response.data);
        if (response.data && response.data.results) {
          setRoles(response.data.results); 
        }
      } catch (error) {
        console.error("Failed to fetch roles:", error);
      }
    };

    fetchRoles();
  }, []);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });
  
    if (!result.canceled && result.assets.length > 0) {
      setAvatar(result.assets[0]); // Đảm bảo lưu cả object, không chỉ uri
    }
  };

  const uploadImage = async (image) => {
    try {
      if (!image || !image.uri) {
        throw new Error("Đường dẫn ảnh không hợp lệ");
      }
  
      const imageUri = image.uri; // Đảm bảo lấy đúng đường dẫn ảnh
      const fileBase64 = await FileSystem.readAsStringAsync(imageUri, {
        encoding: FileSystem.EncodingType.Base64,
      });
  
      const formData = new FormData();
      formData.append("file", `data:image/jpeg;base64,${fileBase64}`);
      formData.append("upload_preset", "ml_default");
  
      const response = await axios.post(
        "https://api.cloudinary.com/v1_1/ddskv3qix/image/upload",
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
  
      return response.data.secure_url; // Trả về URL ảnh đã upload
    } catch (error) {
      console.error("Lỗi upload ảnh:", error);
      Alert.alert("Lỗi", "Không thể tải ảnh lên.");
      return null;
    }
  };
  


  const register = async () => {
    if (!role) {
      alert("Vui lòng chọn vai trò");
      return;
    }
    let passwordToSend = password;
    if (role.name === "Giảng viên" && !password) {
      passwordToSend = 'ou@123'; 
    }

    if (role.name !== "Giảng viên") {
      if (passwordToSend !== confirmPassword) {
        alert("Mật khẩu không khớp!");
        return;
      }
      if (!passwordToSend || passwordToSend.length < 6) {
        alert("Mật khẩu phải có ít nhất 6 ký tự");
        return;
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
    
    if (!avatar) {
      alert("Vui lòng chọn ảnh đại diện!");
      return;
    }
  
    setLoading(true);
  
    try {
      // Upload ảnh lên Cloudinary
      const avatarUrl = await uploadImage(avatar);
      if (!avatarUrl) {
        alert("Lỗi upload ảnh, vui lòng thử lại!");
        return;
      }
  
      let formData = new FormData();
      formData.append("first_name", first_name);
      formData.append("last_name", last_name);
      formData.append("username", username);
      formData.append("email", email);
      formData.append("phone_number", phoneNumber);
      formData.append("role", role.id);
      formData.append("password", passwordToSend);
      formData.append("avatar", avatarUrl); // Gửi URL thay vì file ảnh
  
      if (role.name === "Sinh viên") {
        formData.append("student_id", studentId);
      }
  
      const response = await APIs.post(endpoints.register, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
  
      console.log("Đăng ký thành công:", response.data);
      navigation.navigate("Login");
    } catch (error) {
      console.error("Lỗi đăng ký:", error);
      if (error.response) {
        console.error("Error Response:", error.response.data);
        alert("Lỗi đăng ký: " + (error.response.data.detail || "Có lỗi xảy ra, vui lòng thử lại!"));
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
          keyboardType="email-address" 
          mode="outlined"
        />

        <TextInput
          label="Số điện thoại"
          style={AuthStyle.input}
          value={phoneNumber}
          onChangeText={setPhoneNumber}
          keyboardType="phone-pad"
          mode="outlined"
        />
        <TouchableOpacity onPress={pickImage} style={AuthStyle.imagePicker}>
          {avatar ? (
            <Image source={{ uri: avatar.uri }} style={AuthStyle.avatar} />
          ) : (
            <Text>Chọn ảnh đại diện</Text>
          )}
        </TouchableOpacity>


        {role && role.name === "Sinh viên" && (
          <>
            <TextInput
              label="Mã số sinh viên"
              style={AuthStyle.input}
              value={studentId}
              onChangeText={setStudentId}
              mode="outlined"
              keyboardType="numeric"  
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
        setRole(roleOption); 
        setMenuVisible(false); 
        console.log("Selected Role:",roleOption);
      }}
    />
  ))}
  <Divider />
</Menu>
      <View style={AuthStyle.buttonContainer}>
        <Button
          onPress={register} loading={loading} style={AuthStyle.button} icon="account-check" mode="contained">
          Đăng ký
        </Button>
      </View>
        <TouchableOpacity onPress={() => navigation.navigate("Login")} style={AuthStyle.link}>
          <Text style={AuthStyle.linkText}>Đã có tài khoản? Đăng nhập</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default Register;