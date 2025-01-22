import React, { useState, useContext } from "react";
import { View, StyleSheet, Alert } from "react-native";
import { TextInput, Button } from "react-native-paper";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import APIs, { authApis, endpoints } from "../../configs/APIs";
import { MyUserContext } from "../../configs/UserContext";

const AddComment = ({ postId, onCommentAdded }) => {
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation();
  const user = useContext(MyUserContext); // Sửa ở đây: bỏ dấu ngoặc vuông

  const handleAddComment = async () => {
    if (!content.trim()) {
      Alert.alert("Thông báo", "Vui lòng nhập nội dung bình luận!");
      return;
    }

    setLoading(true);

    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        Alert.alert("Thông báo", "Bạn cần đăng nhập để bình luận!");
        navigation.navigate("Login");
        return;
      }

      // Lấy user id từ context
      const user_id = user.id;

      const data = {
        content: content,
        post: postId,
        user: user_id,
      };

      const res = await authApis(token).post(endpoints['comments'], data);

      if (res.status === 201) {
        Alert.alert("Thông báo", "Bình luận thành công!");
        setContent("");
        onCommentAdded(postId);
      } else {
        console.error("Add comment response:", res);
        Alert.alert("Thông báo", "Bình luận thất bại. Vui lòng thử lại!");
      }
    } catch (error) {
      console.error("Error adding comment:", error);
      Alert.alert("Thông báo", "Đã có lỗi xảy ra khi thêm bình luận.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <TextInput
        label="Thêm bình luận"
        value={content}
        onChangeText={setContent}
        mode="outlined"
        multiline
        style={styles.input}
      />
      <Button
        mode="contained"
        onPress={handleAddComment}
        loading={loading}
        style={styles.button}
        disabled={!content.trim()}
      >
        Bình luận
      </Button>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 10,
  },
  input: {
    marginBottom: 10,
  },
  button: {
    marginTop: 5,
  },
});

export default AddComment;