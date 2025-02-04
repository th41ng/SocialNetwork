import React, { useState, useEffect } from "react";
import {
  ScrollView,
  StyleSheet,
  Alert,
  View,
  Image,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Text, // Import Text từ react-native
} from "react-native";
import { TextInput, Button, Menu, Divider } from "react-native-paper";
import APIs, { authApis, endpoints } from "../../../configs/APIs";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system";
import axios from "axios";
import { SafeAreaView } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";

const CreatePost = () => {
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]); // Danh mục từ API
  const [visible, setVisible] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const navigation = useNavigation();
  const [image, setImage] = useState(null);

  // Lấy danh mục từ API
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await APIs.get(endpoints["post_categories"]);
        console.log("Dữ liệu danh mục từ API:", res.data);
        if (res.data && Array.isArray(res.data.results)) {
          setCategories(res.data.results);
        } else {
          console.error("API trả về dữ liệu không hợp lệ.");
        }
      } catch (error) {
        console.error("Lỗi khi lấy danh mục:", error);
        Alert.alert("Lỗi", "Không thể tải danh mục bài viết.");
      }
    };

    fetchCategories();
  }, []);

  const openMenu = () => setVisible(true);
  const closeMenu = () => setVisible(false);

  // Chọn ảnh
  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });
    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  // Upload ảnh lên Cloudinary
  const uploadImage = async (imageUri) => {
    try {
      const fileBase64 = await FileSystem.readAsStringAsync(imageUri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      const formData = new FormData();
      formData.append("file", `data:image/jpeg;base64,${fileBase64}`);
      formData.append("upload_preset", "ml_default");
      const response = await axios.post(
        "https://api.cloudinary.com/v1_1/ddskv3qix/image/upload",
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      return response.data.secure_url;
    } catch (error) {
      console.error("Lỗi khi upload ảnh:", error);
      Alert.alert("Lỗi", "Không thể tải ảnh lên.");
      return null;
    }
  };

  // Xử lý đăng bài
  const handlePost = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        Alert.alert("Thông báo", "Vui lòng đăng nhập trước khi đăng bài!");
        return;
      }
      if (!content.trim()) {
        Alert.alert("Thông báo", "Nội dung không được để trống!");
        return;
      }
      if (!selectedCategory) {
        Alert.alert("Thông báo", "Vui lòng chọn danh mục!");
        return;
      }
      const user = await AsyncStorage.getItem("user");
      const user_id = JSON.parse(user).id;
      let imageUrl = null;
      if (image) {
        imageUrl = await uploadImage(image);
        if (!imageUrl) return;
      }
      const data = {
        user: user_id,
        category: selectedCategory,
        content,
        image: imageUrl,
        visibility: "public",
        is_comment_locked: false,
      };
      console.log("Dữ liệu gửi lên API:", data);
      const res = await authApis(token).post(endpoints["create_post"], data);
      if (res.status === 201) {
        // Alert.alert("Thông báo", "Đăng bài thành công!");
        navigation.navigate("Home", { refresh: true });
        setContent("");
        setImage(null);
        setSelectedCategory(null);
      } else {
        Alert.alert("Thông báo", "Đăng bài thất bại. Vui lòng thử lại!");
      }
    } catch (error) {
      console.error("Lỗi khi đăng bài:", error);
      Alert.alert("Lỗi", "Có lỗi xảy ra.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.keyboardAvoiding}
    >
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Icon name="arrow-left" size={24} color="#2d3436" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Tạo bài viết mới</Text>
          {/* Để đảm bảo không có chuỗi rời rạc, bọc placeholder bằng Text */}
          <View style={{ width: 24 }}>
            <Text>{""}</Text>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.container}>
          <Text style={styles.sectionTitle}>Nội dung bài viết</Text>
          <TextInput
            value={content}
            onChangeText={setContent}
            mode="flat"
            multiline
            numberOfLines={6}
            style={styles.contentInput}
            placeholder="Hôm nay bạn muốn chia sẻ điều gì?"
            placeholderTextColor="#95a5a6"
            underlineColor="transparent"
            theme={{ colors: { primary: "#3498db" } }}
          />

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Danh mục bài viết</Text>
            <Menu
              visible={visible}
              onDismiss={closeMenu}
              anchor={
                <TouchableOpacity
                  style={styles.categoryButton}
                  onPress={openMenu}
                >
                  <Text style={styles.categoryButtonText}>
                    {selectedCategory
                      ? categories.find((cat) => cat.id === selectedCategory)
                          ?.name
                      : "Chọn danh mục"}
                  </Text>
                  <Icon name="chevron-down" size={20} color="#7f8c8d" />
                </TouchableOpacity>
              }
              contentStyle={styles.menuContent}
            >
              {categories.map((cat) => (
                <Menu.Item
                  key={cat.id}
                  title={cat.name}
                  titleStyle={styles.menuItemText}
                  onPress={() => {
                    setSelectedCategory(cat.id);
                    closeMenu();
                  }}
                  style={styles.menuItem}
                />
              ))}
            </Menu>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Hình ảnh đính kèm</Text>
            {image && (
              <Image
                source={{ uri: image }}
                style={styles.previewImage}
                resizeMode="cover"
              />
            )}
            <Button
              mode="contained-tonal"
              onPress={pickImage}
              style={styles.imageButton}
              labelStyle={styles.buttonLabel}
              icon="image-plus"
            >
              {image ? "Đổi ảnh" : "Thêm ảnh"}
            </Button>
          </View>

          <Button
            mode="contained"
            onPress={handlePost}
            loading={loading}
            style={styles.postButton}
            labelStyle={styles.buttonLabel}
            icon="send-check"
            contentStyle={styles.buttonContent}
          >
            Đăng bài
          </Button>
        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  keyboardAvoiding: {
    flex: 1,
    backgroundColor: "#f5f6fa",
  },
  safeArea: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#ecf0f1",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#2d3436",
  },
  container: {
    flexGrow: 1,
    padding: 20,
    paddingTop: 10,
  },
  section: {
    marginBottom: 24,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2d3436",
    marginBottom: 12,
  },
  contentInput: {
    fontSize: 16,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    minHeight: 150,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  categoryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#f8f9fa",
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  categoryButtonText: {
    fontSize: 16,
    color: "#2d3436",
  },
  menuContent: {
    backgroundColor: "#fff",
    borderRadius: 8,
    paddingVertical: 8,
    marginTop: 10,
  },
  menuItem: {
    paddingVertical: 12,
  },
  menuItemText: {
    fontSize: 16,
    color: "#2d3436",
  },
  previewImage: {
    width: "100%",
    height: 200,
    borderRadius: 12,
    marginBottom: 16,
  },
  imageButton: {
    borderRadius: 10,
    backgroundColor: "#333333",
  },
  postButton: {
    borderRadius: 10,
    backgroundColor: "#000000",
    paddingVertical: 6,
    marginTop: 8,
    shadowColor: "#3498db",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  buttonLabel: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "500",
  },
  buttonContent: {
    height: 46,
  },
});

export default CreatePost;
