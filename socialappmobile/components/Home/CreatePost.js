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
    { id: 1, name: "status" },
    { id: 2, name: "Công nghệ" },
    // Bạn có thể thêm nhiều thể loại khác nếu cần
  ]);
  const [visible, setVisible] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(1); // Lưu ID của category, ban đầu là 1
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
  
      // Lấy các thông tin của người dùng từ AsyncStorage
      const username = await AsyncStorage.getItem("username");
      const email = await AsyncStorage.getItem("email");
      const phone_number = await AsyncStorage.getItem("phone_number");
      const avatar = await AsyncStorage.getItem("avatar");
      const student_id = await AsyncStorage.getItem("student_id");
  
      if (!username || !email || !phone_number || !avatar || !student_id) {
        Alert.alert(
          "Thông báo",
          "Vui lòng đăng nhập đầy đủ thông tin trước khi đăng bài!"
        );
        navigation.navigate("Login");
        return;
      }
  
      // Cấu trúc dữ liệu gửi lên API với category_id thay vì category object
      const data = {
        user: {
          avatar,
          cover_image: (await AsyncStorage.getItem("cover_image")) || "", // Nếu không có cover image thì truyền rỗng
          phone_number,
          student_id,
        },
        category: selectedCategory, // Gửi ID của category, không phải đối tượng category
        content,
        visibility: "public", // Cài đặt mặc định visibility là "public"
        is_comment_locked: false, // Cài đặt mặc định is_comment_locked là false
      };
  
      console.log("Dữ liệu gửi lên API:", data);
  
      // Gửi POST request lên API
      const res = await authApis(token).post(endpoints["create_post"], data);
      console.log("Full response:", res);
  
      // Kiểm tra response từ server
      if (res.status === 201) {
        Alert.alert("Thông báo", "Đăng bài thành công!");
        // Chuyển về Home và truyền thông tin để làm mới dữ liệu bài viết
        navigation.navigate("Home", { refreshPosts: true });
      } else {
        Alert.alert("Thông báo", "Đăng bài thất bại. Vui lòng thử lại!");
      }
    } catch (error) {
      console.error(
        "Lỗi khi đăng bài:",
        error.response?.data || error.message || error
      );
      let errorMessage = "Lỗi không xác định.";
      if (error.response) {
        if (error.response.data) {
          errorMessage = `Lỗi từ server: ${JSON.stringify(error.response.data)}`;
        } else {
          errorMessage = `Lỗi từ server: ${error.response.status} ${error.response.statusText}`;
        }
      } else if (error.request) {
        errorMessage = "Không thể kết nối đến server.";
      } else {
        errorMessage = error.message;
      }
      Alert.alert("Thông báo", `Đã có lỗi xảy ra: ${errorMessage}`);
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
                {categories.find(cat => cat.id === selectedCategory)?.name || "Chọn danh mục"}
              </Button>
            }
          >
            {categories.map((cat) => (
              <Menu.Item
                key={cat.id}
                title={cat.name}
                onPress={() => {
                  setSelectedCategory(cat.id); // Lưu ID của category
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
    marginBottom: 9,
  },
});

export default CreatePost;
