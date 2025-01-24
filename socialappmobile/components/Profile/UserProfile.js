// import React, { useContext, useState, useEffect } from "react";
// import { ScrollView, Text, View, Image, ActivityIndicator } from "react-native";
// import AsyncStorage from "@react-native-async-storage/async-storage";
// import axios from "axios"; // Import axios
// import { MyDispatchContext, MyUserContext } from "../../configs/UserContext";
// import { useNavigation } from "@react-navigation/native";
// import { Drawer, IconButton, Card } from "react-native-paper"; // Import Paper components
// import ProfileStyles from "./ProfileStyles";
// import HomeStyles from "../Home/HomeStyles";
// import Navbar from "../Home/Navbar";
// import APIs, { authApis, endpoints } from "../../configs/APIs";

// const Profile = () => {
//   const user = useContext(MyUserContext);
//   const dispatch = useContext(MyDispatchContext);
//   const navigation = useNavigation();

//   // State for avatar, cover image, posts, loading state, and error message
//   const [avatar, setAvatar] = useState("");
//   const [coverImage, setCoverImage] = useState("");
//   const [posts, setPosts] = useState([]);
//   const [loading, setLoading] = useState(true); // Loading state for posts
//   const [drawerVisible, setDrawerVisible] = useState(false); // Drawer visibility
//   const [errorMessage, setErrorMessage] = useState(""); // State for error message


//    // Fetch user details
//    useEffect(() => {
//     const removePrefix = (url) => {
//       const prefix = "image/upload/";
//       if (url?.includes(prefix)) {
//         return url.replace(prefix, "");
//       }
//       return url;
//     };

//     setAvatar(removePrefix(user.avatar) || "https://via.placeholder.com/150");
//     setCoverImage(removePrefix(user.cover_image) || "https://via.placeholder.com/600x200");
//   }, [user]);


//   useEffect(() => {

//     const fetchPosts = async () => {
//       try {
//         const token = await AsyncStorage.getItem("token");
//         if (!token) {
//           throw new Error("Token không tồn tại. Vui lòng đăng nhập.");
//         }
  
//         // Use authApis function to handle the request
//         const response = await authApis(token).get(endpoints.currentUserPosts);
//         console.log("Posts data:", response.data);
        
//         // Set posts data from the response
//         setPosts(response.data);
//       } catch (error) {
//         console.error("Lỗi khi gọi API:", error.message);
  
//         // Handle specific error responses
//         if (error.response) {
//           console.error("Chi tiết lỗi từ server:", error.response.data);
//           setErrorMessage(
//             error.response.data?.message || "Lỗi từ server: " + error.response.status
//           );
//         } 
//         // If there was no response from the server
//         else if (error.request) {
//           console.error("Không có phản hồi từ server:", error.request);
//           setErrorMessage("Không có phản hồi từ server.");
//         } 
//         // Handle unexpected errors
//         else {
//           console.error("Lỗi không xác định:", error.message);
//           setErrorMessage("Lỗi không xác định: " + error.message);
//         }
//       } finally {
//         setLoading(false); // Disable loading state once the request is done
//       }
//     };
  
//     fetchPosts();
//   }, []);
  
//   // Logout function
//   const logout = async () => {
//     try {
//       await AsyncStorage.removeItem("token");
//       dispatch({ type: "logout" });
//       navigation.reset({
//         index: 0,
//         routes: [{ name: "Login" }],
//       });
//     } catch (error) {
//       console.error("Error during logout:", error);
//       alert("Đăng xuất thất bại. Vui lòng thử lại.");
//     }
//   };

//   // Toggle Drawer
//   const toggleDrawer = () => setDrawerVisible(!drawerVisible);

//   // Navigate to Edit Profile and Security screens
//   const editInfo = () => navigation.navigate("EditProfile");
//   const sercurity = () => navigation.navigate("UserSecurity");

//   return (
//     <View style={{ flex: 1 }}>
//       <ScrollView contentContainerStyle={ProfileStyles.scrollViewContainer}>
//         {/* Cover Image */}
//         <View>
//           <Image source={{ uri: coverImage }} style={ProfileStyles.coverImage} />
//         </View>

//         {/* Avatar and Profile Info */}
//         <View style={ProfileStyles.avatarContainer}>
//           <Image source={{ uri: avatar }} style={ProfileStyles.avatar} />
//         </View>
//         <View style={ProfileStyles.profileInfo}>
//           <Text style={ProfileStyles.username}>Chào, {user.username || "Người dùng"}</Text>
//           <Text style={ProfileStyles.infoText}>Email: {user.email || "Chưa cập nhật"}</Text>
//           <Text style={ProfileStyles.infoText}>Số điện thoại: {user.phone_number || "Chưa cập nhật"}</Text>
//           <Text style={ProfileStyles.infoText}>Vai trò: {user.role || "Chưa xác định"}</Text>
//         </View>

//         {/* Posts Section */}
//         <View style={ProfileStyles.postsContainer}>
//           <Text style={ProfileStyles.postsHeader}>Bài viết của bạn</Text>
//           {loading ? (
//             <ActivityIndicator size="large" color="#0000ff" />
//           ) : posts.length === 0 ? (
//             <Text style={ProfileStyles.noPostsText}>Chưa có bài viết</Text>
//           ) : (
//             posts.map((post, index) => (
//               <Card key={index} style={ProfileStyles.postCard}>
//                 <Card.Content>
//                   <Text style={ProfileStyles.postText}>{post.content}</Text>
//                   {/* Làm ở đây tiếp để hiện ra nếu là hình ảnh post.image */}
//                   {/* các nút cảm xúc, bình luận */}
//                 </Card.Content>
//               </Card>
//             ))
//           )}
//         </View>

//         {/* Display Error Message if API fails */}
//         {errorMessage ? (
//           <View style={ProfileStyles.errorContainer}>
//             <Text style={ProfileStyles.errorText}>{errorMessage}</Text>
//           </View>
//         ) : null}

//         {/* Drawer for Settings */}
//         {drawerVisible && (
//           <View style={ProfileStyles.drawerWrapper}>
//             <View style={ProfileStyles.drawerContent}>
//               <Drawer.Section style={ProfileStyles.drawerSection}>
//                 <Drawer.Item label="Chỉnh sửa thông tin" onPress={editInfo} />
//                 <Drawer.Item label="Đăng xuất" onPress={logout} />
//                 <Drawer.Item label="Bảo mật" onPress={sercurity} />
//               </Drawer.Section>
//             </View>
//           </View>
//         )}
//       </ScrollView>

//       {/* Navbar */}
//       <View style={HomeStyles.navbarWrapper}>
//         <Navbar navigation={navigation} />
//       </View>

//       {/* Settings Icon */}
//       <IconButton
//         icon="cog"
//         size={30}
//         onPress={toggleDrawer}
//         style={ProfileStyles.settingsIcon}
//       />
//     </View>
//   );
// };

// export default Profile;
import React, { useContext, useState, useEffect } from "react";
import { ScrollView, Text, View, Image, ActivityIndicator, FlatList } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { MyDispatchContext, MyUserContext } from "../../configs/UserContext";
import { useNavigation } from "@react-navigation/native";
import { Drawer, IconButton, Card } from "react-native-paper"; // Import Paper components
import ProfileStyles from "./ProfileStyles";
import HomeStyles from "../Home/HomeStyles";
import Navbar from "../Home/Navbar";
import APIs, { authApis, endpoints } from "../../configs/APIs";

const Profile = () => {
  const user = useContext(MyUserContext);
  const dispatch = useContext(MyDispatchContext);
  const navigation = useNavigation();

  // State for avatar, cover image, posts, loading state, and error message
  const [avatar, setAvatar] = useState("");
  const [coverImage, setCoverImage] = useState("");
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true); // Loading state for posts
  const [drawerVisible, setDrawerVisible] = useState(false); // Drawer visibility
  const [errorMessage, setErrorMessage] = useState(""); // State for error message

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
  }, [user]);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const token = await AsyncStorage.getItem("token");
        if (!token) {
          throw new Error("Token không tồn tại. Vui lòng đăng nhập.");
        }

        // Use authApis function to handle the request
        const response = await authApis(token).get(endpoints.currentUserPosts);
        console.log("Posts data:", response.data);
        
        // Set posts data from the response
        setPosts(response.data);
      } catch (error) {
        console.error("Lỗi khi gọi API:", error.message);

        // Handle specific error responses
        if (error.response) {
          console.error("Chi tiết lỗi từ server:", error.response.data);
          setErrorMessage(
            error.response.data?.message || "Lỗi từ server: " + error.response.status
          );
        } 
        // If there was no response from the server
        else if (error.request) {
          console.error("Không có phản hồi từ server:", error.request);
          setErrorMessage("Không có phản hồi từ server.");
        } 
        // Handle unexpected errors
        else {
          console.error("Lỗi không xác định:", error.message);
          setErrorMessage("Lỗi không xác định: " + error.message);
        }
      } finally {
        setLoading(false); // Disable loading state once the request is done
      }
    };

    fetchPosts();
  }, []);

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

  // Render each post item
  const renderPost = ({ item: post }) => (
    <Card style={ProfileStyles.postCard}>
      <Card.Content>
        <Text style={ProfileStyles.postText}>{post.content}</Text>
        {/* Check for image and display */}
        {post.image && <Image source={{ uri: post.image }} style={ProfileStyles.postImage} />}
        {/* Display reactions, comments buttons, etc. */}
      </Card.Content>
    </Card>
  );

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
          <Text style={ProfileStyles.postsHeader}>Bài viết của bạn</Text>
          {loading ? (
            <ActivityIndicator size="large" color="#0000ff" />
          ) : posts.length === 0 ? (
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

        {/* Display Error Message if API fails */}
        {errorMessage ? (
          <View style={ProfileStyles.errorContainer}>
            <Text style={ProfileStyles.errorText}>{errorMessage}</Text>
          </View>
        ) : null}

        {/* Drawer for Settings */}
        {drawerVisible && (
          <View style={ProfileStyles.drawerWrapper}>
            <View style={ProfileStyles.drawerContent}>
              <Drawer.Section style={ProfileStyles.drawerSection}>
                <Drawer.Item label="Chỉnh sửa thông tin" onPress={editInfo} />
                <Drawer.Item label="Đăng xuất" onPress={logout} />
                <Drawer.Item label="Bảo mật" onPress={sercurity} />
              </Drawer.Section>
            </View>
          </View>
        )}
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
