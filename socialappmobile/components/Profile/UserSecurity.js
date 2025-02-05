import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator } from "react-native";
import axios from "axios";
import ProfileStyles from "./ProfileStyles"; 
import { useNavigation } from "@react-navigation/native";

const UserSecurity = () => {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false); 
  const navigation = useNavigation();

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

    setLoading(true); 

    try {
      const response = await axios.post(
        "https://danhdanghoang.pythonanywhere.com/users/change-password/",
        {
          old_password: oldPassword,
          new_password: newPassword,
          confirm_password: confirmPassword,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`, 
            "Content-Type": "application/json",
          },
        }
      );
      Alert.alert("Thành công", response.data.message || "Mật khẩu đã được thay đổi.");
      navigation.goBack();
    } catch (error) {
      const errorMessage = error.response?.data?.detail || "Sai mật khẩu hiện tại.";
      Alert.alert("Lỗi", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[ProfileStyles.containerSC]}>
      <Text style={ProfileStyles.titleSC}>Bảo mật tài khoản</Text>
    
      <View style={ProfileStyles.formContainerSC}>
        <Text style={ProfileStyles.inputLabeSC}>Mật khẩu hiện tại</Text>
        <TextInput
          style={ProfileStyles.inputSC}
          placeholder="Nhập mật khẩu hiện tại"
          secureTextEntry
          value={oldPassword}
          onChangeText={setOldPassword}
        />
        
        <Text style={ProfileStyles.inputLabeSC}>Mật khẩu mới</Text>
        <TextInput
          style={ProfileStyles.inputSC}
          placeholder="Nhập mật khẩu mới"
          secureTextEntry
          value={newPassword}
          onChangeText={setNewPassword}
        />
        
        <Text style={ProfileStyles.inputLabeSC}>Xác nhận mật khẩu mới</Text>
        <TextInput
          style={ProfileStyles.inputSC}
          placeholder="Nhập lại mật khẩu mới"
          secureTextEntry
          value={confirmPassword}
          onChangeText={setConfirmPassword}
        />
      </View>
      
      <TouchableOpacity
        style={ProfileStyles.buttonSC}
        onPress={handleChangePassword}
        disabled={loading} 
      >
        {loading ? (
          <ActivityIndicator size="small" color="#ffffff" /> 
        ) : (
          <Text style={ProfileStyles.buttonText}>Xác nhận</Text> 
        )}
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[ProfileStyles.buttonSC, { backgroundColor: "#888", marginTop: 10 }]}
        onPress={() => navigation.goBack()}
      >
        <Text style={ProfileStyles.buttonTextSC}>Quay lại</Text>
      </TouchableOpacity>
    </View>
  );
};

export default UserSecurity;
