import React, { useContext, useState, useEffect } from "react";
import {
  Text,
  View,
  Image,
  ActivityIndicator,
  FlatList,
  StyleSheet,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { MyDispatchContext, MyUserContext } from "../../configs/UserContext";
import { useNavigation } from "@react-navigation/native";
import { Drawer, IconButton, Card } from "react-native-paper";
import Navbar from "../Home/Navbar";
import APIs, { authApis, endpoints } from "../../configs/APIs";
import ProfileStyles from "./ProfileStyles";

const Profile = () => {
  const user = useContext(MyUserContext);
  const dispatch = useContext(MyDispatchContext);
  const navigation = useNavigation();

  const [avatar, setAvatar] = useState("");
  const [coverImage, setCoverImage] = useState("");
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const formatImageUrl = (url) => {
    const prefix = "image/upload/";
    return url?.includes(prefix) ? url.replace(prefix, "") : url;
  };
  useEffect(() => {
    setAvatar(formatImageUrl(user.avatar) || "https://via.placeholder.com/150");
    setCoverImage(formatImageUrl(user.cover_image) || "https://via.placeholder.com/600x200");
  }, [user]);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const token = await AsyncStorage.getItem("token");
        if (!token) throw new Error("Token không tồn tại. Vui lòng đăng nhập.");

        const response = await authApis(token).get(endpoints.currentUserPosts);
        setPosts(response.data);
      } catch (error) {
        console.error("Lỗi khi gọi API:", error);
        setErrorMessage(
          error.response?.data?.message ||
          error.message ||
          "Đã xảy ra lỗi không xác định"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, []);

  const logout = async () => {
    try {
      await AsyncStorage.removeItem("token");
      await AsyncStorage.removeItem("usavedUsername");
      await AsyncStorage.removeItem("savedPassword")

      dispatch({ type: "logout" });
      navigation.reset({
        index: 0,
        routes: [{ name: "Login" }],
      });
    } catch (error) {
      console.error("Lỗi khi đăng xuất:", error);
      alert("Đăng xuất thất bại. Vui lòng thử lại.");
    }
  };

  const toggleDrawer = () => setDrawerVisible(!drawerVisible);

  const editInfo = () => navigation.navigate("EditProfile");
  const sercurity = () => navigation.navigate("UserSecurity");

  const renderPost = ({ item: post }) => (
    <Card style={ProfileStyles.postCard}>
      <Card.Content>
        <Text style={ProfileStyles.postText}>{post.content}</Text>
        {post.image && <Image source={{ uri: formatImageUrl(post.image)  }} style={ProfileStyles.postImage} />}
      </Card.Content>
    </Card>
  );

  const renderHeader = () => (
    <View>
      <Image source={{ uri: coverImage }} style={ProfileStyles.coverImage} />
      <View style={ProfileStyles.avatarContainer}>
        <Image source={{ uri: avatar }} style={ProfileStyles.avatar} />
      </View>
      <View style={ProfileStyles.profileInfo}>
        <Text style={ProfileStyles.username}>Chào, {user.username || "Người dùng"}</Text>
        <Text style={ProfileStyles.infoText}>Email: {user.email || "Chưa cập nhật"}</Text>
        <Text style={ProfileStyles.infoText}>Số điện thoại: {user.phone_number || "Chưa cập nhật"}</Text>
        <Text style={ProfileStyles.infoText}>Vai trò: {user.role || "Chưa xác định"}</Text>
      </View>
      <View style={ProfileStyles.postsContainer}>
        <Text style={ProfileStyles.postsHeader}>Bài viết của bạn</Text>
        {loading && <ActivityIndicator size="large" color="#0000ff" />}
        {errorMessage && (
          <View style={ProfileStyles.errorContainer}>
            <Text style={ProfileStyles.errorText}>{errorMessage}</Text>
          </View>
        )}
      </View>
    </View>
  );

  return (
    <View style={ProfileStyles.container}>
      <FlatList
        data={posts}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderPost}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={<Text style={ProfileStyles.noPostsText}>Chưa có bài viết</Text>}
      />
      <Navbar navigation={navigation} />
      <IconButton
        icon="cog"
        size={30}
        onPress={toggleDrawer}
        style={ProfileStyles.settingsIcon}
      />
      {drawerVisible && (
  <Drawer.Section style={ProfileStyles.drawerSection}>
    <Drawer.Item
      label="Chỉnh sửa thông tin"
      onPress={editInfo}
      labelStyle={ProfileStyles.drawerItem}  // Áp dụng style cho label
    />
    <Drawer.Item
      label="Đăng xuất"
      onPress={logout}
      labelStyle={ProfileStyles.drawerItem}  // Áp dụng style cho label
    />
    <Drawer.Item
      label="Bảo mật"
      onPress={sercurity}
      labelStyle={ProfileStyles.drawerItem}  // Áp dụng style cho label
    />
  </Drawer.Section>
)}
    </View>
  );
};

export default Profile;
