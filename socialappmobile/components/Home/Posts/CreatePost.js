import React, { useState } from "react";
import { ScrollView, StyleSheet, Alert, View, Image,KeyboardAvoidingView,Platform } from "react-native";
import { TextInput, Button, Menu, Divider, Text } from "react-native-paper";
import APIs, { authApis, endpoints } from "../../../configs/APIs";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system";
import axios from "axios";
import { SafeAreaView } from "react-native-safe-area-context"; // Import SafeAreaView

const CreatePost = () => {
    const [content, setContent] = useState("");
    const [loading, setLoading] = useState(false);
    const [categories, setCategories] = useState([
        { id: 1, name: "Trạng thái" },
        { id: 2, name: "Công nghệ" },
    ]);
    const [visible, setVisible] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState(1);
    const navigation = useNavigation();
    const [image, setImage] = useState(null); // State để lưu ảnh

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

    // Hàm upload ảnh lên Cloudinary
    const uploadImage = async (imageUri) => {
        try {
            const fileBase64 = await FileSystem.readAsStringAsync(imageUri, {
                encoding: FileSystem.EncodingType.Base64,
            });

            const formData = new FormData();
            formData.append("file", `data:image/jpeg;base64,${fileBase64}`);
            formData.append("upload_preset", "ml_default"); // Thay bằng upload preset của bạn

            const response = await axios.post(
                "https://api.cloudinary.com/v1_1/ddskv3qix/image/upload", // Thay bằng cloud name của bạn
                formData,
                { headers: { "Content-Type": "multipart/form-data" } }
            );

            return response.data.secure_url;
        } catch (error) {
            console.error("Error uploading image:", error);
            Alert.alert("Lỗi", "Không thể tải ảnh lên. Vui lòng thử lại.");
            return null;
        }
    };

    const handlePost = async () => {
        try {
            setLoading(true);

            const token = await AsyncStorage.getItem("token");
            if (!token) {
                Alert.alert("Thông báo", "Vui lòng đăng nhập trước khi đăng bài!");
                return;
            }

            if (!content.trim()) {
                Alert.alert("Thông báo", "Nội dung bài viết không được để trống!");
                return;
            }

            if (!selectedCategory) {
                Alert.alert("Thông báo", "Vui lòng chọn danh mục!");
                return;
            }

            const user = await AsyncStorage.getItem("user");
            const user_id = JSON.parse(user).id;

            // Upload image to Cloudinary if selected
            let imageUrl = null;
            if (image) {
                imageUrl = await uploadImage(image);
                if (!imageUrl) {
                    Alert.alert("Lỗi", "Không thể tải ảnh lên. Vui lòng thử lại.");
                    return;
                }
                // Xóa image/upload/ nếu có
                imageUrl = imageUrl.startsWith('image/upload/') ? imageUrl.replace('image/upload/', '') : imageUrl;
            }

            const data = {
                user: user_id,
                category: selectedCategory,
                content,
                image: imageUrl, // Thêm image URL vào data
                visibility: "public",
                is_comment_locked: false,
            };

            console.log("Dữ liệu gửi lên API:", data);

            const res = await authApis(token).post(endpoints["create_post"], data);
            console.log("Full response:", res);

            if (res.status === 201) {
                Alert.alert("Thông báo", "Đăng bài thành công!");
                navigation.navigate("Home", { refresh: true });
                // Reset state
                setContent("");
                setImage(null);
            } else {
                Alert.alert("Thông báo", "Đăng bài thất bại. Vui lòng thử lại!");
            }
        } catch (error) {
            console.error("Lỗi khi đăng bài:", error.response?.data || error.message || error);
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
        <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1 }}
    >
      <SafeAreaView style={{ flex: 1 }}>
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
                  {
                    categories.find((cat) => cat.id === selectedCategory)
                      ?.name || "Chọn danh mục"
                  }
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

          {/* Hiển thị ảnh đã chọn */}
          {image && (
            <Image
              source={{ uri: image }}
              style={{ width: 200, height: 200, alignSelf: "center" }}
            />
          )}

          {/* Nút chọn ảnh */}
          <Button
            icon="camera"
            mode="outlined"
            onPress={pickImage}
            style={styles.button}
          >
            Chọn ảnh
          </Button>

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
      </SafeAreaView>
    </KeyboardAvoidingView>
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