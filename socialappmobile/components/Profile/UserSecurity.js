import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator } from "react-native";
import axios from "axios"; // Import axios
import ProfileStyles from "./ProfileStyles"; // Reuse the existing styles
import { useNavigation } from "@react-navigation/native";

const UserSecurity = () => {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false); // State loading để theo dõi quá trình gửi yêu cầu
  const navigation = useNavigation();

  // Function to handle password change
  const handleChangePassword = async () => {
    if (!oldPassword || !newPassword || !confirmPassword) {
      Alert.alert("Lỗi", "Vui lòng điền đầy đủ thông tin.");
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert("Lỗi", "Mật khẩu mới không khớp.");
      return;
    }

    const token = await AsyncStorage.getItem('token');
    if (!token) {
      Alert.alert("Lỗi", "Bạn cần đăng nhập trước.");
      return;
    }

    setLoading(true); // Bắt đầu loading khi gửi yêu cầu

    try {
      // Thực hiện gọi API để thay đổi mật khẩu
      const response = await axios.post(
        "https://danhdanghoang.pythonanywhere.com/users/change-password/",
        {
          old_password: oldPassword,
          new_password: newPassword,
          confirm_password: confirmPassword,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`, // Thêm token vào header
            "Content-Type": "application/json", // Đảm bảo content type đúng
          },
        }
      );

      // Xử lý thành công
      Alert.alert("Thành công", response.data.message || "Mật khẩu đã được thay đổi.");
      navigation.goBack();
    } catch (error) {
      const errorMessage = error.response?.data?.detail || "Đã xảy ra lỗi. Vui lòng thử lại.";
      Alert.alert("Lỗi", errorMessage);
    } finally {
      setLoading(false); // Dừng loading khi nhận được phản hồi từ server
    }
  };

  return (
    <View style={[ProfileStyles.container, { padding: 20 }]}>
      <Text style={ProfileStyles.username}>Bảo mật tài khoản</Text>
      
      {/* Old Password Input */}
      <View style={ProfileStyles.formContainer}>
        <Text style={ProfileStyles.inputLabel}>Mật khẩu hiện tại</Text>
        <TextInput
          style={ProfileStyles.input}
          placeholder="Nhập mật khẩu hiện tại"
          secureTextEntry
          value={oldPassword}
          onChangeText={setOldPassword}
        />
        
        {/* New Password Input */}
        <Text style={ProfileStyles.inputLabel}>Mật khẩu mới</Text>
        <TextInput
          style={ProfileStyles.input}
          placeholder="Nhập mật khẩu mới"
          secureTextEntry
          value={newPassword}
          onChangeText={setNewPassword}
        />
        
        {/* Confirm Password Input */}
        <Text style={ProfileStyles.inputLabel}>Xác nhận mật khẩu mới</Text>
        <TextInput
          style={ProfileStyles.input}
          placeholder="Nhập lại mật khẩu mới"
          secureTextEntry
          value={confirmPassword}
          onChangeText={setConfirmPassword}
        />
      </View>
      
      {/* Buttons */}
      <TouchableOpacity
        style={ProfileStyles.button}
        onPress={handleChangePassword}
        disabled={loading} // Disable nút khi đang loading
      >
        {loading ? (
          <ActivityIndicator size="small" color="#ffffff" /> // Hiển thị ActivityIndicator khi loading
        ) : (
          <Text style={ProfileStyles.buttonText}>Xác nhận</Text> // Hiển thị text khi không loading
        )}
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[ProfileStyles.button, { backgroundColor: "#888", marginTop: 10 }]}
        onPress={() => navigation.goBack()}
      >
        <Text style={ProfileStyles.buttonText}>Quay lại</Text>
      </TouchableOpacity>
    </View>
  );
};

export default UserSecurity;
