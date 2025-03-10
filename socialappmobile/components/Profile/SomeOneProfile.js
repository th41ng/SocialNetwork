// import React, { useState, useEffect } from "react";
// import { ScrollView, Text, View, ActivityIndicator, FlatList, Alert, Image, TouchableOpacity,ImageBackground } from "react-native";
// import { Avatar, Card } from "react-native-paper";
// import { useNavigation, useRoute } from "@react-navigation/native";
// import ProfileStyles from "./ProfileStyles";
// import Navbar from "../Home/Navbar";
// import APIs, { endpoints } from "../../configs/APIs";
// import moment from "moment";  

// const Profile = () => {
//   const navigation = useNavigation();
//   const route = useRoute();
//   const { userId } = route.params || {};

//   const [avatar, setAvatar] = useState("");
//   const [coverImage, setCoverImage] = useState("");
//   const [userData, setUserData] = useState(null);
//   const [posts, setPosts] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [errorMessage, setErrorMessage] = useState("");

//   const formatImageUrl = (url) => {
//     const prefix = "image/upload/";
//     return url?.startsWith(prefix) ? url.replace(prefix, "") : url;
//   };

//   useEffect(() => {
//     const fetchProfileData = async () => {
//       if (!userId) {
//         Alert.alert("Lỗi", "Không thể tải thông tin người dùng. Vui lòng thử lại.");
//         navigation.goBack(); 
//         return;
//       }
//       setLoading(true);
//       try {
//         const userResponse = await APIs.get(endpoints.someOneProfile(userId));
//         const user = userResponse.data;
//         setAvatar(formatImageUrl(user.user.avatar) || null);
//         setCoverImage(formatImageUrl(user.user.cover_image) || null);

//         setUserData(user);
//         setPosts(user.posts || []);
//       } catch (error) {
//         console.error("Error fetching user profile:", error);
//         setErrorMessage(error.message || "Lỗi không xác định");
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchProfileData();
//   }, [userId]);

//   const renderHeader = () => (
//     <View>
//       <View>
//         {coverImage ? (
//           <Image source={{ uri: coverImage }} style={ProfileStyles.coverImage} />
//         ) : (
//           <ImageBackground style={[ProfileStyles.coverImage, { backgroundColor: "#ccc", justifyContent: "center", alignItems: "center" }]}>
//             <Avatar.Icon size={50} icon="image" backgroundColor="#000000" />
//           </ImageBackground>
//         )}
//       </View>

//       <View style={ProfileStyles.avatarContainer}>
//         {avatar ? (
//             <Image source={{ uri: avatar }} style={ProfileStyles.avatar} />
//           ) : (
//             <Avatar.Icon size={80} icon="account" backgroundColor="#000000"/>
//           )}
//       </View>
//       <View style={ProfileStyles.profileInfo}>
//         <Text style={ProfileStyles.username}>{userData?.user?.username}</Text>
//         <Text style={ProfileStyles.infoText}>Email: {userData?.user?.email}</Text>
//         <Text style={ProfileStyles.infoText}>Số điện thoại: {userData?.user?.phone_number}</Text>
//         <Text style={ProfileStyles.infoText}>Vai trò: {userData?.user?.role}</Text>
//       </View>
//       <View style={ProfileStyles.messageButtonContainer}>
//         <TouchableOpacity
//           style={ProfileStyles.messageButton}
//           onPress={() => navigation.navigate("Chats", { 
//             userId: userData?.user?.id, 
//             username: userData?.user?.username 
//           })}

//         >
//           <Text style={ProfileStyles.messageButtonText}>Nhắn tin</Text>
//         </TouchableOpacity>
//       </View>
//       <View style={ProfileStyles.postHeaderContainer}>
//         <Text style={ProfileStyles.postHeaderText}>Bài viết</Text>
//       </View>
//     </View>
//   );

//   const formatPostTime = (time) => {
//     return moment(time).fromNow();  
//   };
//   const renderPost = ({ item: post }) => (
//     <Card style={ProfileStyles.postCard}>
//       <Card.Content>
//       <View style={ProfileStyles.postAuthorInfo}>
//           {avatar ? (
//             <Image source={{ uri: avatar }} style={ProfileStyles.miniAvt} />
//           ) : (
//             <Avatar.Icon size={40} icon="account" backgroundColor="#000000" />
//           )}
//           <View style={ProfileStyles.postTextContainer}>
//           <Text style={ProfileStyles.postAuthorName}>{userData.user.username}</Text>
//           <Text style={ProfileStyles.postTime}>{formatPostTime(post.created_date)}</Text>
//           </View>
//         </View>
       
//         <Text style={ProfileStyles.postText}>{post.content}</Text>
//         {post.image && <Image source={{ uri: formatImageUrl(post.image)  }} style={ProfileStyles.postImage} />}
//       </Card.Content>
//     </Card>
//   );

//   if (loading) {
//     return <ActivityIndicator size="large" color="#0000ff" />;
//   }

//   if (!userData) {
//     return (
//       <View style={ProfileStyles.errorContainer}>
//         <Text style={ProfileStyles.errorText}>{errorMessage || "Không thể tải thông tin."}</Text>
//       </View>
//     );
//   }

//   return (
//     <View style={ProfileStyles.container}>
//       <FlatList
//         data={posts}
//         keyExtractor={(item) => item.id.toString()}
//         renderItem={renderPost}
//         ListHeaderComponent={renderHeader}
//         ListEmptyComponent={<Text style={ProfileStyles.noPostsText}>Chưa có bài viết</Text>}
//         showsVerticalScrollIndicator={false}
//       />
//       <Navbar navigation={navigation} />
//     </View>
//   );
// };

// export default Profile;
import React, { useState, useEffect, useCallback } from "react";
import { ScrollView, Text, View, ActivityIndicator, FlatList, Alert, Image, TouchableOpacity, ImageBackground } from "react-native";
import { Avatar, Card } from "react-native-paper";
import { useNavigation, useRoute } from "@react-navigation/native";
import ProfileStyles from "./ProfileStyles";
import Navbar from "../Home/Navbar";
import APIs, { endpoints } from "../../configs/APIs";
import moment from "moment";
import he from "he";
import { debounce } from "lodash";

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

  const [loadingMore, setLoadingMore] = useState(false);
  const [nextPage, setNextPage] = useState(null); // Lưu trang tiếp theo

  const formatImageUrl = (url) => {
    const prefix = "image/upload/";
    return url?.startsWith(prefix) ? url.replace(prefix, "") : url;
  };

  const decodeHtml = (html) => {
    const strippedHtml = html.replace(/<[^>]*>/g, "");
    return he.decode(strippedHtml);
  };

  const fetchProfileData = async (pageUrl = null) => {
    try {
      const url = pageUrl || endpoints.someOneProfile(userId);
      const response = await APIs.get(url);
      console.log("🔍 Dữ liệu API trả về:", response.data);
  
      const userData = response.data.results?.user || null;
      const postsData = response.data.results?.posts || [];
      const nextPageData = response.data.next || null;
  
      if (!userData) {
        throw new Error("Không tìm thấy thông tin người dùng!");
      }
  
      setUserData(userData);
      setAvatar(formatImageUrl(userData.avatar) || null);
      setCoverImage(formatImageUrl(userData.cover_image) || null);
      setPosts((prevPosts) => (pageUrl ? [...prevPosts, ...postsData] : postsData));
      setNextPage(nextPageData);
    } catch (error) {
      console.error("❌ Lỗi tải hồ sơ:", error);
      setErrorMessage(error.message || "Lỗi không xác định");
    } finally {
      setLoading(false);
    }
  };
  
  // Gọi khi màn hình render lần đầu
  useEffect(() => {
    fetchProfileData();
  }, [userId]);
  
  // Tải thêm bài viết khi cuộn xuống
  const handleLoadMore = debounce(() => {
    if (nextPage && !loadingMore) {
      setLoadingMore(true);
      fetchProfileData(nextPage).finally(() => setLoadingMore(false));
    }
  }, 500);
  

  const renderHeader = () => (
    <View>
      <View>
        {coverImage ? (
          <Image source={{ uri: coverImage }} style={ProfileStyles.coverImage} />
        ) : (
          <ImageBackground style={[ProfileStyles.coverImage, { backgroundColor: "#ccc", justifyContent: "center", alignItems: "center" }]}>
            <Avatar.Icon size={50} icon="image" backgroundColor="#000000" />
          </ImageBackground>
        )}
      </View>

      <View style={ProfileStyles.avatarContainer}>
        {avatar ? (
          <Image source={{ uri: avatar }} style={ProfileStyles.avatar} />
        ) : (
          <Avatar.Icon size={80} icon="account" backgroundColor="#000000" />
        )}
      </View>
      <View style={ProfileStyles.profileInfo}>
        <Text style={ProfileStyles.username}>{userData?.username}</Text>
        <Text style={ProfileStyles.infoText}>Email: {userData?.email}</Text>
        <Text style={ProfileStyles.infoText}>Số điện thoại: {userData?.phone_number}</Text>
        <Text style={ProfileStyles.infoText}>Vai trò: {userData?.role}</Text>
      </View>
      <View style={ProfileStyles.messageButtonContainer}>
        <TouchableOpacity
          style={ProfileStyles.messageButton}
          onPress={() =>
            navigation.navigate("Chats", {
              userId: userData?.user?.id,
              username: userData?.username,
            })
          }
        >
          <Text style={ProfileStyles.messageButtonText}>Nhắn tin</Text>
        </TouchableOpacity>
      </View>
      <View style={ProfileStyles.postHeaderContainer}>
        <Text style={ProfileStyles.postHeaderText}>Bài viết</Text>
      </View>
    </View>
  );

  const formatPostTime = (time) => {
    return moment(time).fromNow();
  };

  const renderPost = ({ item: post }) => (
    <Card style={ProfileStyles.postCard}>
      <Card.Content>
        <View style={ProfileStyles.postAuthorInfo}>
          {avatar ? (
            <Image source={{ uri: avatar }} style={ProfileStyles.miniAvt} />
          ) : (
            <Avatar.Icon size={40} icon="account" backgroundColor="#000000" />
          )}
          <View style={ProfileStyles.postTextContainer}>
            <Text style={ProfileStyles.postAuthorName}>{userData.username}</Text>
            <Text style={ProfileStyles.postTime}>{formatPostTime(post.created_date)}</Text>
          </View>
        </View>

        <Text style={ProfileStyles.postText}>{decodeHtml(post.content)}</Text>
        {post.image && <Image source={{ uri: formatImageUrl(post.image) }} style={ProfileStyles.postImage} />}
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
      <FlatList
        data={posts}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderPost}
        ListHeaderComponent={renderHeader}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5} // Kích hoạt tải thêm khi cuộn gần cuối
        ListFooterComponent={loadingMore ? <ActivityIndicator size="small" color="#0000ff" /> : null}
        ListEmptyComponent={<Text style={ProfileStyles.noPostsText}>Chưa có bài viết</Text>}
        showsVerticalScrollIndicator={false}
      />
      <Navbar navigation={navigation} />
    </View>
  );
};

export default Profile;
