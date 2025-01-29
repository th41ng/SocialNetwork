import React, { useState, useEffect } from "react";
import { ScrollView, StyleSheet, Alert, View } from "react-native";
import { TextInput, Button, Text } from "react-native-paper";
import { authApis, endpoints } from "../../../configs/APIs";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation, useRoute } from "@react-navigation/native";

const EditComment = () => {
    const route = useRoute();
    const { comment } = route.params;

    const [content, setContent] = useState("");
    const [loading, setLoading] = useState(false);
    const navigation = useNavigation();

    useEffect(() => {
        if (comment) {
            setContent(comment.content);
        }
    }, [comment]);

    const handleUpdateComment = async () => {
        try {
            setLoading(true);

            const token = await AsyncStorage.getItem("token");
            if (!token) {
                Alert.alert("Thông báo", "Vui lòng đăng nhập để sửa bình luận!");
                return;
            }

            if (!content.trim()) {
                Alert.alert("Thông báo", "Nội dung bình luận không được để trống!");
                return;
            }

            const res = await authApis(token).patch(endpoints.comment_detail(comment.id), {
                content: content,
            });

            if (res.status === 200) {
                // Alert.alert("Thông báo", "Cập nhật bình luận thành công!");
                navigation.navigate("Home", { refreshComment: comment.id });
            } else {
                console.error("Update comment response:", res);
                Alert.alert("Thông báo", "Cập nhật bình luận thất bại. Vui lòng thử lại!");
            }
        } catch (error) {
            console.error("Lỗi khi cập nhật bình luận:", error);
            Alert.alert("Thông báo", "Đã có lỗi xảy ra khi cập nhật bình luận.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <TextInput
                label="Nội dung bình luận"
                value={content}
                onChangeText={setContent}
                mode="outlined"
                multiline
                numberOfLines={5}
                style={styles.input}
                placeholder="Nhập nội dung bình luận"
            />

            <Button
                mode="contained"
                onPress={handleUpdateComment}
                loading={loading}
                style={styles.button}
                icon="pencil"
            >
                Cập nhật bình luận
            </Button>
        </ScrollView>
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
});

export default EditComment;