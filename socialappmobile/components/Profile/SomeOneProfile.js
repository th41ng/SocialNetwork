import React, { useState, useEffect } from "react";
import { ScrollView, Text, View, ActivityIndicator, FlatList, Alert, Image, TouchableOpacity } from "react-native";
import { Avatar, Card } from "react-native-paper";
import { useNavigation, useRoute } from "@react-navigation/native";
import ProfileStyles from "./ProfileStyles";
import Navbar from "../Home/Navbar";
import APIs, { endpoints } from "../../configs/APIs";
import moment from "moment";  // Thêm moment để xử lý thời gian

const Profile = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { userId } = route.params || {};

  const [avatar, setAvatar] = useState("");
  const [coverImage, setCoverImage] = useState("");
  const [userData, setUserData] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  // Hàm loại bỏ tiền tố "image/upload/" nếu có
  const formatImageUrl = (url) => {
    const prefix = "image/upload/";
    return url?.startsWith(prefix) ? url.replace(prefix, "") : url;
  };

  useEffect(() => {
    const fetchProfileData = async () => {
      if (!userId) {
        Alert.alert("Lỗi", "Không thể tải thông tin người dùng. Vui lòng thử lại.");
        navigation.goBack(); // Quay lại nếu không có userId
        return;
      }
      setLoading(true);
      try {
        // Lấy thông tin người dùng dựa trên userId
        const userResponse = await APIs.get(endpoints.someOneProfile(userId));
        const user = userResponse.data;

        // Lấy avatar và ảnh bìa từ dữ liệu
        setAvatar(formatImageUrl(user.user.avatar) || "https://via.placeholder.com/150");
        setCoverImage(formatImageUrl(user.user.cover_image) || "https://via.placeholder.com/600x200");

        setUserData(user);
        setPosts(user.posts || []);
      } catch (error) {
        console.error("Error fetching user profile:", error);
        setErrorMessage(error.message || "Lỗi không xác định");
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, [userId]);

  const renderHeader = () => (
    <View>
      <Image source={{ uri: coverImage }} style={ProfileStyles.coverImage} />
      <View style={ProfileStyles.avatarContainer}>
        <Image source={{ uri: avatar }} style={ProfileStyles.avatar}/>
      </View>
      <View style={ProfileStyles.profileInfo}>
        {/* Thông tin người dùng */}
        <Text style={ProfileStyles.username}>{userData?.user?.username}</Text>
        <Text style={ProfileStyles.infoText}>Email: {userData?.user?.email}</Text>
        <Text style={ProfileStyles.infoText}>Số điện thoại: {userData?.user?.phone_number}</Text>
        <Text style={ProfileStyles.infoText}>Vai trò: {userData?.user?.role}</Text>
      </View>
      {/* Nút nhắn tin */}
      <View style={ProfileStyles.messageButtonContainer}>
        <TouchableOpacity
          style={ProfileStyles.messageButton}
          onPress={() => navigation.navigate("Chats", { 
            userId: userData?.user?.id, 
            username: userData?.user?.username 
          })}

        >
          <Text style={ProfileStyles.messageButtonText}>Nhắn tin</Text>
        </TouchableOpacity>
      </View>
      {/* Tiêu đề danh sách bài viết */}
      <View style={ProfileStyles.postHeaderContainer}>
        <Text style={ProfileStyles.postHeaderText}>Bài viết</Text>
      </View>
    </View>
  );

  const formatPostTime = (time) => {
    return moment(time).fromNow();  // Sử dụng moment để tính thời gian đã trôi qua
  };
  const renderPost = ({ item: post }) => (
    <Card style={ProfileStyles.postCard}>
      <Card.Content>
          <View style={ProfileStyles.postAuthorInfo}>
            <Image source={{ uri: avatar }} style={ProfileStyles.miniAvt} />
            <Text style={ProfileStyles.postAuthorName}>{userData.user.username}</Text>
          </View>
        <Text style={ProfileStyles.postTime}>{formatPostTime(post.created_date)}</Text>
        <Text style={ProfileStyles.postText}>{post.content}</Text>
        {post.image && <Image source={{ uri: formatImageUrl(post.image)  }} style={ProfileStyles.postImage} />}
      </Card.Content>
    </Card>
  );

  if (loading) {
    return <ActivityIndicator size="large" color="#0000ff" />;
  }

  if (!userData) {
    return (
      <View style={ProfileStyles.errorContainer}>
        <Text style={ProfileStyles.errorText}>{errorMessage || "Không thể tải thông tin."}</Text>
      </View>
    );
  }

  return (
    <View style={ProfileStyles.container}>
      {/* Sử dụng FlatList luôn, ngay cả khi không có bài viết */}
      <FlatList
        data={posts}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderPost}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={<Text style={ProfileStyles.noPostsText}>Chưa có bài viết</Text>}
        showsVerticalScrollIndicator={false}
      />
      <Navbar navigation={navigation} />
    </View>
  );
};

export default Profile;
