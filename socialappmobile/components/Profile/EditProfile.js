import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import { useContext, useState, useEffect } from "react";
import { Image, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";
import { Button } from "react-native-paper";
import * as ImagePicker from "expo-image-picker";
import { MyDispatchContext, MyUserContext } from "../../configs/UserContext";
import ProfileStyles from "./ProfileStyles"; // Import styles from ProfileStyles
import APIs, { authApis, endpoints } from "../../configs/APIs"; // Import APIs
import axios from "axios";
import * as FileSystem from "expo-file-system";

const EditProfile = () => {
  const user = useContext(MyUserContext); // Get user info from Context
  const dispatch = useContext(MyDispatchContext); // Get Dispatch from Context
  const navigation = useNavigation();

  // Helper function to remove unwanted prefix
  const formatUrl = (url) => {
    const prefix = "image/upload/";
    return url?.includes(prefix) ? url.replace(prefix, "") : url;
  };

  // State for editing information
  const [avatar, setAvatar] = useState(formatUrl(user.avatar || "https://via.placeholder.com/150"));
  const [coverImage, setCoverImage] = useState(formatUrl(user.cover_image || "https://via.placeholder.com/600x200"));
  const [email, setEmail] = useState(user.email || "");
  const [phoneNumber, setPhoneNumber] = useState(user.phone_number || "");
  const [password, setPassword] = useState("");

  // Upload image to Cloudinary
  const uploadImage = async (image) => {
    if (!image) return null;

    try {
      const fileBase64 = await FileSystem.readAsStringAsync(image.uri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      const formData = new FormData();
      formData.append("file", `data:image/jpeg;base64,${fileBase64}`);
      formData.append("upload_preset", "ml_default"); // Upload preset for Cloudinary

      const response = await axios.post(
        "https://api.cloudinary.com/v1_1/ddskv3qix/image/upload",
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      return response.data.secure_url;
    } catch (error) {
      console.error("Error uploading image:", error);
      alert("Could not upload the image. Please try again.");
      return null;
    }
  };

  // Change avatar
  const changeAvatar = async () => {
    const result = await ImagePicker.launchImageLibraryAsync();
    if (!result.canceled) {
      const avatarUrl = await uploadImage(result.assets[0]);
      if (avatarUrl) setAvatar(formatUrl(avatarUrl));
    }
  };

  // Change cover image
  const changeCoverImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync();
    if (!result.canceled) {
      const coverUrl = await uploadImage(result.assets[0]);
      if (coverUrl) setCoverImage(formatUrl(coverUrl));
    }
  };

  // Save changes
  const saveChanges = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      const api = authApis(token); // axios instance with token
      const data = {
        avatar,
        cover_image: coverImage,
        email,
        phone_number: phoneNumber,
        ...(password && { password }), // Only send password if provided
      };

      // Call update user endpoint with PATCH method
      const response = await api.patch('/users/update/', data);
      const updatedUser = response.data;

      // Remove prefix before updating context
      updatedUser.avatar = formatUrl(updatedUser.avatar);
      updatedUser.cover_image = formatUrl(updatedUser.cover_image);

      dispatch({ type: "updateUser", payload: updatedUser }); // Update Context
      alert("Profile updated successfully!");
    } catch (error) {
      console.error("Error updating profile:", error.response?.data || error.message);
      alert("Update failed. Please try again.");
    }
  };

  // Logout
  const logout = async () => {
    await AsyncStorage.removeItem("token");
    dispatch({ type: "logout" });
    navigation.navigate("index");
  };

  return (
    <ScrollView style={ProfileStyles.container}>
      {/* Cover image */}
      <View style={ProfileStyles.coverImageContainer}>
        <Image source={{ uri: coverImage }} style={ProfileStyles.coverImage} />
        <TouchableOpacity style={ProfileStyles.changeCoverButton} onPress={changeCoverImage}>
          <Text style={ProfileStyles.changeCoverText}>Change Cover Photo</Text>
        </TouchableOpacity>
      </View>

      {/* Avatar and user info */}
      <View style={ProfileStyles.profileInfo}>
        <View style={ProfileStyles.avatarContainer}>
          <TouchableOpacity onPress={changeAvatar} style={ProfileStyles.avatarWrapper}>
            <Image source={{ uri: avatar }} style={ProfileStyles.avatar} />
          </TouchableOpacity>
        </View>

        <Text style={ProfileStyles.username}>Hello, {user.username || "User"}</Text>

        {/* Form inputs */}
        <View style={ProfileStyles.formContainer}>
          <View style={ProfileStyles.inputGroup}>
            <Text style={ProfileStyles.inputLabel}>Email</Text>
            <TextInput
              style={ProfileStyles.input}
              placeholder="Enter email"
              value={email}
              onChangeText={setEmail}
            />
          </View>

          <View style={ProfileStyles.inputGroup}>
            <Text style={ProfileStyles.inputLabel}>Phone Number</Text>
            <TextInput
              style={ProfileStyles.input}
              placeholder="Enter phone number"
              value={phoneNumber}
              onChangeText={setPhoneNumber}
            />
          </View>

          <View style={ProfileStyles.inputGroup}>
            <Text style={ProfileStyles.inputLabel}>New Password (optional)</Text>
            <TextInput
              style={ProfileStyles.input}
              placeholder="Enter new password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>
        </View>

        {/* Save changes button */}
        <Button mode="contained" onPress={saveChanges} style={ProfileStyles.saveButton}>
          Save Changes
        </Button>
      </View>

      {/* Logout button */}
      <Button onPress={logout} style={ProfileStyles.logoutButton} mode="contained">
        Log Out
      </Button>
    </ScrollView>
  );
};

export default EditProfile;
