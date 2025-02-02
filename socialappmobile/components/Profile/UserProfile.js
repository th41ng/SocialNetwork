import React, { useContext, useState, useEffect, useCallback, useMemo } from "react";
import {
  Text,
  View,
  Image,
  ActivityIndicator,
  FlatList,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import moment from "moment";
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
  const [page, setPage] = useState(1);
  const [isFetchingMore, setIsFetchingMore] = useState(false);

  const formatImageUrl = (url) => {
    const prefix = "image/upload/";
    return url?.includes(prefix) ? url.replace(prefix, "") : url;
  };

  useEffect(() => {
    setAvatar(formatImageUrl(user.avatar) || "https://via.placeholder.com/150");
    setCoverImage(formatImageUrl(user.cover_image) || "https://via.placeholder.com/600x200");
  }, [user]);

  const [hasMorePosts, setHasMorePosts] = useState(true); // Theo dõi có bài viết nào nữa không

const fetchPosts = useCallback(async () => {
  if (isFetchingMore || !hasMorePosts) return;

  try {
    const token = await AsyncStorage.getItem("token");
    if (!token) throw new Error("Token không tồn tại. Vui lòng đăng nhập.");

    setIsFetchingMore(true);
    const response = await authApis(token).get(`${endpoints.currentUserPosts}?page=${page}`);

    if (response.data.length === 0) {
      setHasMorePosts(false); // Không còn bài viết nào nữa => dừng fetch
    } else {
      setPosts((prevPosts) => [...prevPosts, ...response.data]);
      setPage((prevPage) => prevPage + 1);
    }
  } catch (error) {
    console.error("Lỗi khi gọi API:", error);
    setErrorMessage(error.response?.data?.message || error.message || "Đã xảy ra lỗi không xác định");
  } finally {
    setIsFetchingMore(false);
    setLoading(false);
  }
}, [page, isFetchingMore, hasMorePosts]);

useEffect(() => {
  fetchPosts();
}, []);

  const logout = useCallback(async () => {
    try {
      await AsyncStorage.removeItem("token");
      await AsyncStorage.removeItem("usavedUsername");
      await AsyncStorage.removeItem("savedPassword");

      dispatch({ type: "logout" });
      navigation.reset({
        index: 0,
        routes: [{ name: "Login" }],
      });
    } catch (error) {
      console.error("Lỗi khi đăng xuất:", error);
      alert("Đăng xuất thất bại. Vui lòng thử lại.");
    }
  }, [dispatch, navigation]);

  const toggleDrawer = useCallback(() => setDrawerVisible((prev) => !prev), []);

  const editInfo = useCallback(() => navigation.navigate("EditProfile"), [navigation]);
  const sercurity = useCallback(() => navigation.navigate("UserSecurity"), [navigation]);

  const formatPostTime = useCallback((time) => moment(time).fromNow(), []);

  const renderPost = useMemo(
    () => ({ item: post }) => (
      <Card style={ProfileStyles.postCard}>
        <Card.Content>
          <View style={ProfileStyles.postAuthorInfo}>
            <Image source={{ uri: avatar }} style={ProfileStyles.miniAvt} />
            <Text style={ProfileStyles.postAuthorName}>{user.username}</Text>
          </View>
          <Text style={ProfileStyles.postTime}>{formatPostTime(post.created_date)}</Text>
          <Text style={ProfileStyles.postText}>{post.content}</Text>
          {post.image && <Image source={{ uri: formatImageUrl(post.image) }} style={ProfileStyles.postImage} />}
        </Card.Content>
      </Card>
    ),
    [avatar, user.username, formatPostTime]
  );

  const renderHeader = useMemo(() => (
    <View>
      <Image source={{ uri: coverImage }} style={ProfileStyles.coverImage} />
      <View style={ProfileStyles.avatarContainer}>
        <Image source={{ uri: avatar }} style={ProfileStyles.avatar} />
      </View>
      <View style={ProfileStyles.profileInfo}>
        <Text style={ProfileStyles.username}>{user.username}</Text>
      </View>
    </View>
  ), [coverImage, avatar, user.username]);

  return (
    <View style={ProfileStyles.container}>
      <FlatList
        data={posts}
        keyExtractor={(item, index) => `${item.id}-${index}`}
        renderItem={renderPost}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={<Text style={ProfileStyles.noPostsText}>Chưa có bài viết</Text>}
        onEndReached={fetchPosts}
        onEndReachedThreshold={0.5} // Khi kéo xuống 50% cuối cùng thì mới load thêm
        ListFooterComponent={isFetchingMore && <ActivityIndicator size="small" color="#6200ee" />}
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
            labelStyle={ProfileStyles.drawerItem}
          />
          <Drawer.Item
            label="Đăng xuất"
            onPress={logout}
            labelStyle={ProfileStyles.drawerItem}
          />
          <Drawer.Item
            label="Bảo mật"
            onPress={sercurity}
            labelStyle={ProfileStyles.drawerItem}
          />
        </Drawer.Section>
      )}
    </View>
  );
};

export default Profile;
