import React, { useState, useCallback, useContext } from "react"; 
import { View, TextInput, Button, StyleSheet, Alert, StatusBar } from "react-native";
import { authApis, endpoints } from "../../../configs/APIs";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { MyUserContext } from "../../../configs/UserContext"; 
import { SafeAreaView } from 'react-native-safe-area-context'; // Import SafeAreaView

const AddComment = ({ postId, dispatch }) => {
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const  user  = useContext(MyUserContext); 

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
        return; 
      }

      // Lấy user id từ context
      const user_id = user.id; 

      const data = {
        content: content,
        post: postId,
        user: user_id,
      };

      const res = await authApis(token).post(endpoints["comments"], data);

      if (res.status === 201) {
        // Alert.alert("Thông báo", "Bình luận thành công!");
        setContent("");

        // Dispatch action để cập nhật danh sách comments
        dispatch({
          type: "ADD_COMMENT",
          payload: res.data, 
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
    <SafeAreaView style={styles.container}>
        <View style={styles.inputContainer}>
            <TextInput
                placeholder="Nhập bình luận của bạn..."
                value={content}
                onChangeText={setContent}
                multiline
                style={styles.input}
            />
        </View>
        <Button
            title="Bình luận"
            onPress={handleAddComment}
            disabled={!content.trim() || loading}
            color="#2196F3" 
        />
    </SafeAreaView>
);
};

const styles = StyleSheet.create({
container: {
  padding: 10,
  flex: 1, // Thêm flex: 1
},
inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
},

input: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    padding: 10,
    maxHeight: 150, 
},
button: {
    marginTop: 5,
},
});

export default AddComment;