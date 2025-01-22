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
            const user_id = JSON.parse(user).id; // Lấy id

            // Cấu trúc dữ liệu gửi lên API
            const data = {
                user: user_id,
                category: selectedCategory,
                content,
                visibility: "public", // Cái này có thể chỉnh sửa tùy theo yêu cầu
                is_comment_locked: false, // Cái này có thể chỉnh sửa tùy theo yêu cầu
            };

            console.log("Dữ liệu gửi lên API:", data);

            const res = await authApis(token).post(endpoints["create_post"], data);
            console.log("Full response:", res);

            if (res.status === 201) {
                Alert.alert("Thông báo", "Đăng bài thành công!");
                navigation.navigate("Home", { refresh: true }); // Gửi tham số refresh qua Home
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