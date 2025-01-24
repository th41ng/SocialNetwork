import React, { useState, useCallback, useContext } from "react"; // Sửa import
import { View, TextInput, Button, StyleSheet, Alert } from "react-native";
import { authApis, endpoints } from "../../configs/APIs";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { MyUserContext } from "../../configs/UserContext"; // Import MyUserContext

const AddComment = ({ postId, dispatch }) => {
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const  user  = useContext(MyUserContext); // Lấy user từ context

  const handleAddComment = async () => {
    if (!content.trim()) {
      Alert.alert("Thông báo", "Vui lòng nhập nội dung bình luận!");
      return;
    }

    setLoading(true);

    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        Alert.alert("Thông báo", "Bạn cần đăng nhập để bình luận!");
        return; // Không navigate nữa
      }

      // Lấy user id từ context
      const user_id = user.id; // Giả sử user có property id

      const data = {
        content: content,
        post: postId,
        user: user_id,
      };

      const res = await authApis(token).post(endpoints["comments"], data);

      if (res.status === 201) {
        Alert.alert("Thông báo", "Bình luận thành công!");
        setContent("");

        // Dispatch action để cập nhật danh sách comments
        dispatch({
          type: "ADD_COMMENT", // Thêm action ADD_COMMENT
          payload: res.data, // Thêm comment mới vào payload
        });
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
    title="Bình luận" // Đảm bảo title là string
    onPress={handleAddComment}
    disabled={!content.trim() || loading} // Thêm loading vào điều kiện disabled
/>
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