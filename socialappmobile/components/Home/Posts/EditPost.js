import React, { useState, useEffect } from "react";
import {ScrollView,StyleSheet,Alert,View,Image,Platform,} from "react-native";
import { TextInput, Button, Menu, Divider, Text } from "react-native-paper";
import APIs, { authApis, endpoints } from "../../../configs/APIs";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation, useRoute } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system";
import axios from "axios";
import { SafeAreaView } from "react-native-safe-area-context";
import he from "he"; 

const decodeHtml = (html) => {
    const strippedHtml = html.replace(/<[^>]*>/g, ""); 
    return he.decode(strippedHtml); 
  };  
const EditPost = () => {
    const route = useRoute();
    const { post } = route.params;
    const navigation = useNavigation();

    const [content, setContent] = useState(post.content);
    const [loading, setLoading] = useState(false);
    const [visible, setVisible] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState(post.category);
    const [image, setImage] = useState(null);
    const [categories, setCategories] = useState([]);

    useEffect(() => {
        if (post.image) {
            const processedImage = post.image.startsWith("image/upload/")
                ? post.image.replace("image/upload/", "")
                : post.image;
            setImage({ uri: processedImage });
        }
    }, [post.image]);

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const res = await APIs.get(endpoints["post_categories"]);
                if (res.data && Array.isArray(res.data.results)) {
                    setCategories(res.data.results);
                }
            } catch (error) {
                Alert.alert("Lỗi", "Không thể tải danh mục bài viết.");
            }
        };

        fetchCategories();
    }, []);

    const openMenu = () => setVisible(true);
    const closeMenu = () => setVisible(false);

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
    
            if (image && !image.uri.startsWith("http")) {
                try {
                    const fileBase64 = await FileSystem.readAsStringAsync(image.uri, {
                        encoding: FileSystem.EncodingType.Base64,
                    });
    
                    const formData = new FormData();
                    formData.append("file", `data:image/jpeg;base64,${fileBase64}`);
                    formData.append("upload_preset", "ml_default");
    
                    const response = await axios.post(
                        "https://api.cloudinary.com/v1_1/ddskv3qix/image/upload",
                        formData,
                        {
                            headers: {
                                "Content-Type": "multipart/form-data",
                            },
                        }
                    );
    
                    imageUrl = response.data.secure_url;
                } catch (error) {
                    console.error("Error uploading image:", error.response || error.message);
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
                console.error("API Response Error:", res.data);
                Alert.alert("Thông báo", "Cập nhật bài viết thất bại. Vui lòng thử lại!");
            }
        } catch (error) {
            console.error("Error:", error.message || error);
            Alert.alert("Thông báo", "Đã có lỗi xảy ra.");
        } finally {
            setLoading(false);
        }
    };
    
    

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView contentContainerStyle={styles.container}>
                <TextInput
                    label="Nội dung bài viết"
                    value={decodeHtml(content)}
                    onChangeText={setContent}
                    mode="outlined"
                    multiline
                    numberOfLines={5}
                    style={styles.input}
                />
                <View style={styles.menuContainer}>
                    <Text style={styles.label}>Danh mục</Text>
                    <Menu
                        visible={visible}
                        onDismiss={closeMenu}
                        anchor={
                            <Button mode="outlined" onPress={openMenu}>
                                {categories.find(
                                    (cat) => cat.id === selectedCategory
                                )?.name || "Chọn danh mục"}
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
                {image && image.uri ? (
                    <Image source={{ uri: image.uri }} style={styles.image} />
                ) : (
                    <Text style={styles.noImageText}>Không có hình ảnh</Text>
                )}
                <Button
                    icon="camera"
                    mode="outlined"
                    onPress={pickImage}
                    style={styles.button}
                    
                >
                    {image && image.uri ? "Đổi ảnh" : "Chọn ảnh"}
                </Button>
                <Button
                    mode="contained"
                    onPress={handleUpdatePost}
                    loading={loading}
                    style={[styles.button, styles.updateButton]}
                    labelStyle={styles.updateButtonText}
                >
                    Cập nhật bài viết
                </Button>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: "#f8f9fa",
    },
    container: {
        padding: 16,
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
    label: {
        fontSize: 14,
        fontWeight: "bold",
        marginBottom: 8,
    },
    image: {
        width: "100%",
        height: 200,
        borderRadius: 10,
        marginVertical: 16,
    },
    noImageText: {
        textAlign: "center",
        color: "#7f8c8d",
        fontSize: 16,
        marginVertical: 16,
    },
    updateButton: {
        backgroundColor: "#000",
    },
    updateButtonText: {
        color: "#fff",
    },
});

export default EditPost;
