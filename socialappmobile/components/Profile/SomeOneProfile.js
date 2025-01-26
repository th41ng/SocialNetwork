import React, { useState, useEffect } from "react";
import { ScrollView, Text, View, ActivityIndicator, FlatList, Alert, Image,TouchableOpacity } from "react-native";
import { Avatar, Card } from "react-native-paper"; 
import { useNavigation, useRoute } from "@react-navigation/native";
import ProfileStyles from "./ProfileStyles";
import Navbar from "../Home/Navbar";
import APIs, { endpoints } from "../../configs/APIs";

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

        // Log dữ liệu người dùng
        console.log("User data received:", user);

        // Hàm loại bỏ tiền tố "image/upload/" nếu có
        const removePrefix = (url) => {
          const prefix = "image/upload/";
          if (url && url.startsWith(prefix)) {
            return url.replace(prefix, ""); // Loại bỏ "image/upload/"
          }
          return url;
        };

        // Lấy avatar và ảnh bìa từ dữ liệu và hiển thị
        const avatarUrl = removePrefix(user.user.avatar) || "https://via.placeholder.com/150";
        const coverImageUrl = removePrefix(user.user.cover_image) || "https://via.placeholder.com/600x200";

        // Log avatar và cover image để kiểm tra
        console.log("Avatar URL:", avatarUrl);
        console.log("Cover Image URL:", coverImageUrl);

        setAvatar(avatarUrl);
        setCoverImage(coverImageUrl);
        setUserData(user);
        setPosts(user.posts || []); // Giả sử API trả về các bài viết người dùng
      } catch (error) {
        console.error("Error fetching user profile:", error);
        setErrorMessage(error.message || "Lỗi không xác định");
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, [userId]);

  const renderPost = ({ item: post }) => (
    <Card style={ProfileStyles.postCard}>
      <Card.Content>
        <Text style={ProfileStyles.postText}>{post.content}</Text>
        {post.image && <Image source={{ uri: post.image }} style={ProfileStyles.postImage} />}
      </Card.Content>
    </Card>
  );

  if (loading) {
    return <ActivityIndicator size="large" color="#0000ff" />;
  }

  // Log thông tin userData trước khi render
  console.log("UserData for rendering:", userData);

  if (!userData) {
    return (
      <View style={ProfileStyles.errorContainer}>
        <Text style={ProfileStyles.errorText}>{errorMessage || "Không thể tải thông tin."}</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={ProfileStyles.scrollViewContainer}>
        <View>
          {/* Hiển thị ảnh bìa */}
          <Image source={{ uri: coverImage }} style={ProfileStyles.coverImage} />
        </View>
        <View style={ProfileStyles.avatarContainer}>
          {/* Sử dụng Avatar.Image để hiển thị avatar */}
          <Avatar.Image
            source={{
              uri: avatar || "https://via.placeholder.com/150" // default image nếu không có avatar
            }}
            size={80}
          />
        </View>
        <View style={ProfileStyles.profileInfo}>
          {/* Hiển thị thông tin người dùng */}
          <Text style={ProfileStyles.username}>{userData.user.username || "Người dùng"}</Text>
          <Text style={ProfileStyles.infoText}>Email: {userData.user.email || "Chưa cập nhật"}</Text>
          <Text style={ProfileStyles.infoText}>Số điện thoại: {userData.user.phone_number || "Chưa cập nhật"}</Text>
          <Text style={ProfileStyles.infoText}>Vai trò: {userData.user.role || "Chưa xác định"}</Text>
        </View>
 {/* Nút nhắn tin */}
 <View style={ProfileStyles.messageButtonContainer}>
          <TouchableOpacity 
            style={ProfileStyles.messageButton} 
            onPress={() => navigation.navigate('ChatScreen', { userId: userData.user.id })}
          >
            <Text style={ProfileStyles.messageButtonText}>Nhắn tin</Text>
          </TouchableOpacity>
        </View>

        <View style={ProfileStyles.postsContainer}>
          <Text style={ProfileStyles.postsHeader}>Bài viết của người dùng</Text>
          {posts.length === 0 ? (
            <Text style={ProfileStyles.noPostsText}>Chưa có bài viết</Text>
          ) : (
            <FlatList
              data={posts}
              keyExtractor={(item) => item.id.toString()}
              renderItem={renderPost}
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>
      </ScrollView>
      <Navbar navigation={navigation} />
    </View>
  );
};

export default Profile;
