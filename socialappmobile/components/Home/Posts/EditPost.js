import React, { useState, useEffect } from "react";
import { ScrollView, StyleSheet, Alert, View, Image,KeyboardAvoidingView,Platform } from "react-native";
import { TextInput, Button, Menu, Divider, Text } from "react-native-paper";
import APIs, { authApis, endpoints } from "../../../configs/APIs";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation, useRoute } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system";
import axios from "axios";
import { SafeAreaView } from "react-native-safe-area-context"; // Import SafeAreaView

const EditPost = () => {
    const route = useRoute();
    const { post } = route.params;

    const [content, setContent] = useState(post.content);
    const [loading, setLoading] = useState(false);
    const [categories, setCategories] = useState([
        { id: 1, name: "Trạng thái" },
        { id: 2, name: "Công nghệ" },
    ]);
    const [visible, setVisible] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState(post.category);
    const navigation = useNavigation();
    const [image, setImage] = useState(post.image ? { uri: post.image } : null);

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
            setImage({ uri: result.assets[0].uri });
        }
    };

    // Upload image to Cloudinary
    const uploadImage = async (image) => {
        if (!image || !image.uri) return null;

        try {
            const token = await AsyncStorage.getItem("token");
            const fileBase64 = await FileSystem.readAsStringAsync(image.uri, {
                encoding: FileSystem.EncodingType.Base64,
            });

            const formData = new FormData();
            formData.append("file", `data:image/jpeg;base64,${fileBase64}`);
            formData.append("upload_preset", "ml_default"); // Upload preset for Cloudinary

            const response = await axios.post(
                "https://api.cloudinary.com/v1_1/ddskv3qix/image/upload",
                formData,
                {
                    headers: {
                        "Content-Type": "multipart/form-data"
                    },
                    Authorization: `Bearer ${token}`
                }
            );

            return response.data.secure_url;
        } catch (error) {
            console.error("Error uploading image:", error);
            if (error.response) {
                console.error("Error response data:", error.response.data);
                console.error("Error response status:", error.response.status);
                Alert.alert("Lỗi", `Không thể tải ảnh lên: ${error.response.data.error.message}`);
            } else {
                Alert.alert("Lỗi", "Không thể tải ảnh lên. Vui lòng thử lại.");
            }
            return null;
        }
    };

    const handleUpdatePost = async () => {
        try {
            setLoading(true);

            const token = await AsyncStorage.getItem("token");
            if (!token) {
                Alert.alert("Thông báo", "Vui lòng đăng nhập để sửa bài viết!");
                return;
            }

            if (!content.trim()) {
                Alert.alert("Thông báo", "Nội dung bài viết không được để trống!");
                return;
            }

            let imageUrl = post.image;
            if (image && image.uri !== post.image) {
                imageUrl = await uploadImage(image);
                if (!imageUrl) {
                    Alert.alert("Lỗi", "Không thể tải ảnh lên. Vui lòng thử lại.");
                    return;
                }
            }

            const data = {
                category: selectedCategory,
                content,
                image: imageUrl,
            };

            const res = await authApis(token).patch(`${endpoints["posts"]}${post.id}/`, data);

            if (res.status === 200) {
                Alert.alert("Thông báo", "Cập nhật bài viết thành công!");
                navigation.navigate("Home", { refresh: true });
            } else {
                console.error("Update post response:", res);
                Alert.alert("Thông báo", "Cập nhật bài viết thất bại. Vui lòng thử lại!");
            }
        } catch (error) {
            console.error("Lỗi khi cập nhật bài viết:", error);
            Alert.alert("Thông báo", "Đã có lỗi xảy ra khi cập nhật bài viết.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={{flex:1}}>
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
                            <Button mode="outlined" onPress={openMenu} style={styles.menuButton}>
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

                {/* Hiển thị và chọn ảnh */}
                {image && (
                    <Image source={{ uri: image.uri }} style={{ width: 200, height: 200, alignSelf: "center" }} />
                )}
                <Button icon="camera" mode="outlined" onPress={pickImage} style={styles.button}>
                    {image ? "Đổi ảnh" : "Chọn ảnh"}
                </Button>

                <Button mode="contained" onPress={handleUpdatePost} loading={loading} style={styles.button} icon="pencil">
                    Cập nhật bài viết
                </Button>
            </ScrollView>
        </SafeAreaView>
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

export default EditPost;