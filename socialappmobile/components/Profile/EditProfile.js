import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import { useContext, useState, useEffect } from "react";
import { Image, ScrollView, Text, TextInput, TouchableOpacity, View, ImageBackground} from "react-native";
import { Button,Avatar } from "react-native-paper";
import * as ImagePicker from "expo-image-picker";
import { MyDispatchContext, MyUserContext } from "../../configs/UserContext";
import ProfileStyles from "./ProfileStyles"; 
import APIs, { authApis, endpoints } from "../../configs/APIs"; 
import axios from "axios";
import * as FileSystem from "expo-file-system";
import moment from "moment";


const EditProfile = () => {
  const user = useContext(MyUserContext); 
  console.log("user edit:", user);
  const dispatch = useContext(MyDispatchContext); 
  const navigation = useNavigation();

  const formatUrl = (url) => {
    const prefix = "image/upload/";
    return url?.includes(prefix) ? url.replace(prefix, "") : url;
  };

  const [avatar, setAvatar] = useState(formatUrl(user.avatar || null));
  const [coverImage, setCoverImage] = useState(formatUrl(user.cover_image || null));
  const [email, setEmail] = useState(user.email || "");
  const [phoneNumber, setPhoneNumber] = useState(user.phone_number || "");
  const [last_name, setLastName] = useState(user.last_name ||"");
  const [first_name, setFirstName] = useState(user.first_name ||"");

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

  const changeAvatar = async () => {
    const result = await ImagePicker.launchImageLibraryAsync();
    if (!result.canceled) {
      const avatarUrl = await uploadImage(result.assets[0]);
      if (avatarUrl) setAvatar(formatUrl(avatarUrl));
    }
  };

  const changeCoverImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync();
    if (!result.canceled) {
      const coverUrl = await uploadImage(result.assets[0]);
      if (coverUrl) setCoverImage(formatUrl(coverUrl));
    }
  };

  const saveChanges = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      const api = authApis(token); 
      const data = {
        avatar,
        cover_image: coverImage,
        email,
        phone_number: phoneNumber,
        last_name,
        first_name,
      };
  
      const response = await api.patch('/users/update/', data);
      const updatedUser = response.data;
      updatedUser.avatar = formatUrl(updatedUser.avatar);
      updatedUser.cover_image = formatUrl(updatedUser.cover_image);
      dispatch({ type: "updateUser", payload: updatedUser }); 
      alert("Profile updated successfully!");
      await AsyncStorage.removeItem("token"); 
      dispatch({ type: "logout" }); 
      navigation.navigate("Login"); 
  
    } catch (error) {
      console.error("Error updating profile:", error.response?.data || error.message);
      alert("Update failed. Please try again.");
    }
  };
  

  
  return (
    <ScrollView style={ProfileStyles.container}>
      <View style={ProfileStyles.coverImageContainer}>
        {coverImage ? (
          <Image source={{ uri: coverImage }} style={ProfileStyles.coverImage} />
        ) : (
          <ImageBackground style={[ProfileStyles.coverImage, { backgroundColor: "#ccc", justifyContent: "center", alignItems: "center" }]}>
            <Avatar.Icon size={50} icon="image" backgroundColor="#000000" />
          </ImageBackground>
        )}
        <TouchableOpacity style={ProfileStyles.changeCoverButton} onPress={changeCoverImage}>
          <Text style={ProfileStyles.changeCoverText}>Change Cover Photo</Text>
        </TouchableOpacity>
      </View>
      <View style={ProfileStyles.profileInfo}>
            <View style={ProfileStyles.avatarContainer}>
          {avatar ? (
            <Image source={{ uri: avatar }} style={ProfileStyles.avatar} />
          ) : (
            <Avatar.Icon size={80} icon="account" backgroundColor="#000000"/>
          )}
          <TouchableOpacity onPress={changeAvatar} style={ProfileStyles.avatarWrapper}>
            <Text style={ProfileStyles.changAVtIcon}>+</Text>
          </TouchableOpacity>
        </View>

        <Text style={ProfileStyles.username}>{user.username || "User"}</Text>
        <View style={ProfileStyles.formContainer}>

        <View style={ProfileStyles.inputGroup}>
            <Text style={ProfileStyles.inputLabel}>Họ</Text>
            <TextInput
              style={ProfileStyles.input}
              placeholder="Enter last name"
              value={last_name}
              onChangeText={setLastName}
            />
          </View>

          <View style={ProfileStyles.inputGroup}>
            <Text style={ProfileStyles.inputLabel}>Tên</Text>
            <TextInput
              style={ProfileStyles.input}
              placeholder="Enter first name"
              value={first_name}
              onChangeText={setFirstName}
            />
          </View>

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
            <Text style={ProfileStyles.inputLabel}>Vai trò</Text>
            <TextInput
              style={ProfileStyles.input}
              value={user.role}
            />
          </View>
          
          {user.role === "Sinh viên" && (
          <>
            <View style={ProfileStyles.inputGroup}>
              <Text style={ProfileStyles.inputLabel}>Mã số sinh viên</Text>
              <TextInput style={ProfileStyles.input} value={user.student_id} editable={false} />
            </View>
          </>
        )}
        </View>
        <Button mode="contained" onPress={saveChanges} style={ProfileStyles.saveButton}>
          Save Changes
        </Button>
      </View>

     
    </ScrollView>
  );
};

export default EditProfile;
