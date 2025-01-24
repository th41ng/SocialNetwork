// components/CommentList.js
import React, { useState, useCallback } from "react";
import { View, Text, TouchableOpacity, Alert } from "react-native";
import { Avatar, Menu, Divider } from "react-native-paper";
import { MaterialIcons } from "@expo/vector-icons";
import { useWindowDimensions } from 'react-native';
import RenderHtml from "react-native-render-html";
import { useNavigation } from "@react-navigation/native";
import HomeStyles from "./HomeStyles";
import AddComment from "./AddComment";
import { endpoints, authApis } from "../../configs/APIs";
import AsyncStorage from "@react-native-async-storage/async-storage";

const CommentList = ({
  postId,
  comments,
  isVisible,
  dispatch,
  state,
  handleReaction,
  updatedCommentId,
}) => {
  const navigation = useNavigation();
  const [visibleComment, setVisibleComment] = useState(false);
  const [anchorComment, setAnchorComment] = useState({ x: 0, y: 0 });
  const [currentComment, setCurrentComment] = useState(null);
  const { width } = useWindowDimensions();
  const openCommentMenu = (event, commentId) => {
    const { nativeEvent } = event;
    setAnchorComment({ x: nativeEvent.pageX, y: nativeEvent.pageY });
    setVisibleComment(true);
    setCurrentComment(commentId);
  };

  const closeCommentMenu = () => {
    setVisibleComment(false);
    setCurrentComment(null);
  };

  const handleCommentAdded = useCallback((postId) => {
    const fetchData = async () => {
      try {
        const token = await AsyncStorage.getItem("token");
        const resComments = await authApis(token).get(endpoints["comments"]);
        dispatch({
          type: "SET_COMMENTS",
          payload: resComments.data.results,
        });
      } catch (error) {
        console.error("Failed to refresh comments:", error);
      }
    };

    fetchData();
  }, [dispatch]);

  const handleDeleteComment = async (commentId) => {
    try {
      const token = await AsyncStorage.getItem("token");
      const currentUser = JSON.parse(await AsyncStorage.getItem("user")); // Lấy thông tin người dùng hiện tại
      if (!token) {
        Alert.alert("Thông báo", "Vui lòng đăng nhập để xóa bình luận!");
        return;
      }

      // Lấy thông tin chi tiết của bình luận
      const comment = await authApis(token).get(
        endpoints.comment_detail(commentId)
      );

      // Kiểm tra xem người dùng hiện tại có phải là chủ sở hữu của bình luận không
      if (comment.data.user.id !== currentUser.id) {
        Alert.alert("Lỗi", "Bạn không có quyền xóa bình luận này.");
        return;
      }

      const res = await authApis(token).delete(
        endpoints.comment_detail(commentId)
      );

      if (res.status === 204) {
        Alert.alert("Thông báo", "Xóa bình luận thành công!");

        dispatch({
          type: "DELETE_COMMENT",
          payload: commentId,
        });
      } else {
        Alert.alert("Lỗi", "Xóa bình luận thất bại. Vui lòng thử lại!");
      }
    } catch (error) {
      console.error("Error deleting comment:", error);
      Alert.alert("Lỗi", "Đã có lỗi xảy ra khi xóa bình luận.");
    }
  };

  if (!isVisible) {
    return null;
  }

  return (
    <View style={HomeStyles.comments}>
      {comments.map((comment) => (
        <View key={comment.id} style={HomeStyles.comment}>
          <View style={HomeStyles.commentHeader}>
            <Avatar.Image
              source={{
                uri: comment.user?.avatar || "https://via.placeholder.com/150",
              }}
              size={30}
              style={HomeStyles.commentAvatar}
            />
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={HomeStyles.commentUsername}>
                {comment.user?.username || "Anonymous"}
              </Text>
            </View>
            <TouchableOpacity
              onPress={(event) => openCommentMenu(event, comment.id)}
            >
              <MaterialIcons name="more-vert" size={20} color="#666" />
            </TouchableOpacity>
          </View>
          <View style={{ flex: 1 }}>
            <RenderHtml
              contentWidth={width}
              source={{ html: comment.content }}
              baseStyle={HomeStyles.commentContent}
            />
            <View style={HomeStyles.reactionRow}>
              <TouchableOpacity
                onPress={() => handleReaction("comment", comment.id, "like")}
              >
                <Text style={HomeStyles.reactionText}>
                  👍 {comment.reaction_summary?.like || 0}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleReaction("comment", comment.id, "haha")}
              >
                <Text style={HomeStyles.reactionText}>
                  😂 {comment.reaction_summary?.haha || 0}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleReaction("comment", comment.id, "love")}
              >
                <Text style={HomeStyles.reactionText}>
                  ❤️ {comment.reaction_summary?.love || 0}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
          // components/CommentList.js (tiếp theo)
          <Menu
            visible={visibleComment && currentComment === comment.id}
            onDismiss={closeCommentMenu}
            anchor={anchorComment}
          >
            <Menu.Item
              onPress={() => {
                navigation.navigate("EditComment", { comment: comment });
                closeCommentMenu();
              }}
              title="Sửa bình luận"
            />
            <Divider />
            <Menu.Item
              onPress={() => {
                Alert.alert(
                  "Xác nhận xóa",
                  "Bạn có chắc chắn muốn xóa bình luận này?",
                  [
                    {
                      text: "Hủy",
                      style: "cancel",
                    },
                    {
                      text: "Xóa",
                      onPress: () => {
                        handleDeleteComment(comment.id);
                        closeCommentMenu();
                      },
                    },
                  ],
                  { cancelable: false }
                );
              }}
              title="Xóa bình luận"
            />
          </Menu>
        </View>
      ))}
      <AddComment postId={postId} onCommentAdded={handleCommentAdded} />
    </View>
  );
};

export default CommentList;