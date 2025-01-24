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
    handlePostReaction,
    updatedCommentId,
  }) => {
    const navigation = useNavigation();
    const [isCommentMenuVisible, setIsCommentMenuVisible] = useState(false);
    const [anchorComment, setAnchorComment] = useState({ x: 0, y: 0 });
    const [currentComment, setCurrentComment] = useState(null);
    const { width } = useWindowDimensions();
  
    const toggleCommentMenu = (event, commentId) => {
      if (event) {
        const { nativeEvent } = event;
        setAnchorComment({ x: nativeEvent.pageX, y: nativeEvent.pageY });
        setCurrentComment(commentId);
      }
      setIsCommentMenuVisible(!isCommentMenuVisible);
    };
  
    const handleDeleteComment = async (commentId) => {
      try {
        const token = await AsyncStorage.getItem("token");
        const currentUser = JSON.parse(await AsyncStorage.getItem("user"));
        if (!token) {
          Alert.alert("Thông báo", "Vui lòng đăng nhập để xóa bình luận!");
          return;
        }
  
        const comment = await authApis(token).get(
          endpoints.comment_detail(commentId)
        );
  
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
  
    // CommentList.js
    const handleCommentReaction = useCallback(
        async (commentId, reactionType) => {
          try {
            const token = await AsyncStorage.getItem("token");
            if (!token) {
              console.error("Token not found.");
              return;
            }
      
            const authenticatedApis = authApis(token);
            const userId = JSON.parse(await AsyncStorage.getItem("user")).id;
      
            const existingReactionIndex = state.data.reactions.findIndex(
              (r) =>
                r.target_type === "comment" &&
                r.target_id === commentId &&
                r.user === userId
            );
      
            let response;
            let newReactions = [...state.data.reactions];
      
            if (existingReactionIndex !== -1) {
              const existingReaction = newReactions[existingReactionIndex];
              if (existingReaction.reaction_type === reactionType) {
                response = await authenticatedApis.delete(
                  `<span class="math-inline">\{endpoints\.reactions\}</span>{existingReaction.id}/`
                );
                if (response.status === 204) {
                  newReactions.splice(existingReactionIndex, 1);
                }
              } else {
                const payload = { reaction_type: reactionType };
                response = await authenticatedApis.patch(
                  `<span class="math-inline">\{endpoints\.reactions\}</span>{existingReaction.id}/`,
                  payload
                );
                if (response.status === 200) {
                  newReactions[existingReactionIndex] = response.data;
                }
              }
            } else {
              const payload = {
                target_type: "comment",
                target_id: commentId,
                reaction_type: reactionType,
              };
              response = await authenticatedApis.post(
                endpoints.reactions,
                payload
              );
              if (response.status === 201) {
                newReactions.push(response.data);
              }
            }
      
            if (
              response &&
              (response.status === 200 ||
                response.status === 201 ||
                response.status === 204)
            ) {
              // Chỉ dispatch SET_REACTIONS 1 lần
              dispatch({
                type: "SET_REACTIONS",
                payload: newReactions,
              });
      
              const summaryResponse = await authenticatedApis.get(
                `${endpoints.comment_detail(commentId)}reactions-summary/`
              );
              if (summaryResponse.status === 200) {
                dispatch({
                  type: "UPDATE_REACTIONS",
                  payload: {
                    targetType: "comment",
                    commentId: commentId,
                    reactionsSummary: summaryResponse.data.reaction_summary,
                  },
                });
              }
            }
          } catch (error) {
            console.error(
              "Error in handleCommentReaction:",
              error.response || error.message
            );
            Alert.alert("Lỗi", "Đã có lỗi xảy ra với reaction.");
          }
        },
        [dispatch, state.data.reactions]
      );
  
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
                onPress={(event) => toggleCommentMenu(event, comment.id)}
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
                  onPress={() => handleCommentReaction(comment.id, "like")}
                >
                  <Text style={HomeStyles.reactionText}>
                    👍 {comment.reaction_summary?.like || 0}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleCommentReaction(comment.id, "haha")}
                >
                  <Text style={HomeStyles.reactionText}>
                    😂 {comment.reaction_summary?.haha || 0}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleCommentReaction(comment.id, "love")}
                >
                  <Text style={HomeStyles.reactionText}>
                    ❤️ {comment.reaction_summary?.love || 0}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
            <Menu
              visible={isCommentMenuVisible && currentComment === comment.id}
              onDismiss={toggleCommentMenu}
              anchor={anchorComment}
            >
              <Menu.Item
                onPress={() => {
                  navigation.navigate("EditComment", { comment: comment });
                  toggleCommentMenu();
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
                          toggleCommentMenu();
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
        <AddComment postId={postId} dispatch={dispatch} />
      </View>
    );
  };
  
  export default CommentList;