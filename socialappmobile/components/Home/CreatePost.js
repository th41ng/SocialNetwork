import React, { useState } from "react";
import { ScrollView, StyleSheet, Alert, View } from "react-native";
import { TextInput, Button, Menu, Divider, Provider, Text } from "react-native-paper";
import APIs, { authApis, endpoints } from "../../configs/APIs";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";

const CreatePost = () => {
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([
    { id: 1, name: "Trạng thái" },
    { id: 2, name: "Công nghệ" },
  ]);
  const [visible, setVisible] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(1); // Mặc định là ID 1
  const navigation = useNavigation();

  const openMenu = () => setVisible(true);
  const closeMenu = () => setVisible(false);

  const handlePost = async () => {
    try {
      setLoading(true);
  
      // Lấy token từ AsyncStorage
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        Alert.alert("Thông báo", "Vui lòng đăng nhập trước khi đăng bài!");
        return;
      }
  
      // Kiểm tra nội dung bài viết và danh mục
      if (!content.trim()) {
        Alert.alert("Thông báo", "Nội dung bài viết không được để trống!");
        return;
      }
  
      if (!selectedCategory) {
        Alert.alert("Thông báo", "Vui lòng chọn danh mục!");
        return;
      }
  
      // Lấy thông tin người dùng từ AsyncStorage
      const userInfoKeys = [
        "username",
        "email",
        "phone_number",
        "avatar",
        "student_id",
        "cover_image",
      ];
      const userInfo = await Promise.all(
        userInfoKeys.map((key) => AsyncStorage.getItem(key))
      );
  
      const [username, email, phone_number, avatar, student_id, cover_image] = userInfo;
  
      // Debug: Log thông tin đã lấy ra
      console.log("Thông tin lấy từ AsyncStorage:", {
        username,
        email,
        phone_number,
        avatar,
        student_id,
        cover_image,
      });
  
      // Kiểm tra thông tin
      if (!username || !email || !phone_number || !avatar || !student_id) {
        Alert.alert(
          "Thông báo",
          "Vui lòng đăng nhập đầy đủ thông tin trước khi đăng bài!"
        );
        navigation.navigate("Login");
        return;
      }
  
      // Dữ liệu gửi lên API
      const data = {
        user: {
          avatar,
          cover_image: cover_image || "",
          phone_number,
          student_id,
        },
        category: selectedCategory,
        content,
        visibility: "public",
        is_comment_locked: false,
      };
  
      console.log("Dữ liệu gửi lên API:", data);
  
      // Gửi yêu cầu POST
      const res = await authApis(token).post(endpoints["create_post"], data);
  
      if (res.status === 201) {
        Alert.alert("Thông báo", "Đăng bài thành công!");
        navigation.navigate("Home", { refreshPosts: true });
      } else {
        Alert.alert("Thông báo", "Đăng bài thất bại. Vui lòng thử lại!");
      }
    } catch (error) {
      console.error("Lỗi khi đăng bài:", error.response?.data || error.message || error);
      Alert.alert("Thông báo", "Đã có lỗi xảy ra. Vui lòng thử lại!");
    } finally {
      setLoading(false);
    }
  };
  

  return (
    <Provider>
      <ScrollView contentContainerStyle={styles.container}>
        <TextInput
          label="Nội dung bài viết"
          value={content}
          onChangeText={setContent}
          mode="outlined"
          multiline
          numberOfLines={5}
          style={styles.input}
          placeholder="Nhập nội dung bài viết"
        />

        <View style={styles.menuContainer}>
          <Text style={styles.label}>Danh mục</Text>
          <Menu
            visible={visible}
            onDismiss={closeMenu}
            anchor={
              <Button
                mode="outlined"
                onPress={openMenu}
                style={styles.menuButton}
              >
                {categories.find((cat) => cat.id === selectedCategory)?.name || "Chọn danh mục"}
              </Button>
            }
          >
            {categories.map((cat) => (
              <Menu.Item
                key={cat.id}
                title={cat.name}
                onPress={() => {
                  setSelectedCategory(cat.id);
                  closeMenu();
                }}
              />
            ))}
            <Divider />
          </Menu>
        </View>

        <Button
          mode="contained"
          onPress={handlePost}
          loading={loading}
          style={styles.button}
          icon="send"
        >
          Đăng bài
        </Button>
      </ScrollView>
    </Provider>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 16,
    backgroundColor: "#fff",
  },
  input: {
    marginBottom: 16,
  },
  button: {
    marginTop: 16,
  },
  menuContainer: {
    marginBottom: 16,
  },
  menuButton: {
    width: "100%",
    justifyContent: "flex-start",
    padding: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 8,
  },
});

export default CreatePost;
