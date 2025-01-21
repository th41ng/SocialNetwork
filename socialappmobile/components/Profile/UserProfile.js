import React, { useContext, useState, useEffect } from "react";
import { ScrollView, Text, View, Button, Image, TouchableOpacity } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { MyDispatchContext, MyUserContext } from "../../configs/UserContext";
import { useNavigation } from "@react-navigation/native";
import { Drawer, IconButton } from "react-native-paper"; // Import Paper components
import ProfileStyles from "./ProfileStyles";
import HomeStyles from "../Home/HomeStyles";
import Navbar from "../Home/Navbar";

const Profile = () => {
  const user = useContext(MyUserContext);
  const dispatch = useContext(MyDispatchContext);
  const navigation = useNavigation();

  // State for avatar, cover image, and posts
  const [avatar, setAvatar] = useState("");
  const [coverImage, setCoverImage] = useState("");
  const [posts, setPosts] = useState([]);
  const [drawerVisible, setDrawerVisible] = useState(false); // Drawer visibility

  // Fetch user details
  useEffect(() => {
    const removePrefix = (url) => {
      const prefix = "image/upload/";
      if (url?.includes(prefix)) {
        return url.replace(prefix, "");
      }
      return url;
    };

    setAvatar(removePrefix(user.avatar) || "https://via.placeholder.com/150");
    setCoverImage(removePrefix(user.cover_image) || "https://via.placeholder.com/600x200");
    setPosts(user.posts || []);
  }, [user]);

  // Logout function
  const logout = async () => {
    try {
      await AsyncStorage.removeItem("token");
      dispatch({ type: "logout" });
      navigation.reset({
        index: 0,
        routes: [{ name: "Login" }],
      });
    } catch (error) {
      console.error("Error during logout:", error);
      alert("Đăng xuất thất bại. Vui lòng thử lại.");
    }
  };

  // Toggle Drawer
  const toggleDrawer = () => setDrawerVisible(!drawerVisible);

  // Navigate to Edit Profile and Security screens
  const editInfo = () => navigation.navigate("EditProfile");
  const sercurity = () => navigation.navigate("UserSecurity");

  return (
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={ProfileStyles.scrollViewContainer}>
        {/* Cover Image */}
        <View>
          <Image source={{ uri: coverImage }} style={ProfileStyles.coverImage} />
        </View>

        {/* Avatar and Profile Info */}
        <View style={ProfileStyles.avatarContainer}>
          <Image source={{ uri: avatar }} style={ProfileStyles.avatar} />
        </View>
        <View style={ProfileStyles.profileInfo}>
          <Text style={ProfileStyles.username}>Chào, {user.username || "Người dùng"}</Text>
          <Text style={ProfileStyles.infoText}>Email: {user.email || "Chưa cập nhật"}</Text>
          <Text style={ProfileStyles.infoText}>Số điện thoại: {user.phone_number || "Chưa cập nhật"}</Text>
          <Text style={ProfileStyles.infoText}>Vai trò: {user.role || "Chưa xác định"}</Text>
        </View>

        {/* Posts Section */}
        <View style={ProfileStyles.postsContainer}>
          {posts.length === 0 ? (
            <Text style={ProfileStyles.noPostsText}>Chưa có bài viết</Text>
          ) : (
            posts.map((post, index) => (
              <View key={index} style={ProfileStyles.postItem}>
                <Text style={ProfileStyles.postText}>{post.content}</Text>
              </View>
            ))
          )}
        </View>

        {/* Drawer for Settings */}
        {drawerVisible && (
          <View style={ProfileStyles.drawerWrapper}>
            <View style={ProfileStyles.drawerContent}>
              <Drawer.Section style={ProfileStyles.drawerSection}>
                <Drawer.Item label="Chỉnh sửa thông tin" onPress={editInfo} />
                <Drawer.Item label="Đăng xuất" onPress={logout} />
                <Drawer.Item label="Bảo mật" onPress={sercurity} />
              </Drawer.Section>
              <Button title="Close" onPress={toggleDrawer} />
            </View>
          </View>
        )}

        {/* Logout Button */}
        <Button title="Đăng xuất" onPress={logout} style={ProfileStyles.logoutButton} />
      </ScrollView>

      {/* Navbar */}
      <View style={HomeStyles.navbarWrapper}>
        <Navbar navigation={navigation} />
      </View>

      {/* Settings Icon */}
      <IconButton
        icon="cog"
        size={30}
        onPress={toggleDrawer}
        style={ProfileStyles.settingsIcon}
      />
    </View>
  );
};

export default Profile;
