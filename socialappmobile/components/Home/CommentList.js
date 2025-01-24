// components/CommentList.js
import React, { useState, useCallback } from "react";
import { View, Text, TouchableOpacity, Alert, StyleSheet } from "react-native";
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
        <View style={styles.comments}>
            {comments.map((comment) => (
                <View key={comment.id} style={styles.commentContainer}>
                    <View style={styles.comment}>
                        <View style={styles.commentHeader}>
                            <Avatar.Image
                                source={{
                                    uri: comment.user?.avatar || "https://via.placeholder.com/150",
                                }}
                                size={40}
                                style={styles.commentAvatar}
                            />
                            <View style={styles.userInfo}>
                                <Text style={styles.commentUsername}>
                                    {comment.user?.username || "Anonymous"}
                                </Text>
                             
                            </View>
                            <TouchableOpacity
                                onPress={(event) => toggleCommentMenu(event, comment.id)}
                            >
                                <MaterialIcons name="more-vert" size={24} color="black" />
                            </TouchableOpacity>
                        </View>
                        <View style={styles.commentContentContainer}>
                            <RenderHtml
                                contentWidth={width}
                                source={{ html: comment.content }}
                                baseStyle={styles.commentContent}
                            />

                        </View>
                        <View style={styles.reactionRow}>
                            <TouchableOpacity
                                style={styles.reactionButton}
                                onPress={() => handleCommentReaction(comment.id, "like")}
                            >
                                <Text style={styles.reactionIcon}>👍</Text>
                                <Text style={styles.reactionCount}>{comment.reaction_summary?.like || 0}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.reactionButton}
                                onPress={() => handleCommentReaction(comment.id, "haha")}
                            >
                                <Text style={styles.reactionIcon}>😂</Text>
                                <Text style={styles.reactionCount}>{comment.reaction_summary?.haha || 0}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.reactionButton}
                                onPress={() => handleCommentReaction(comment.id, "love")}
                            >
                                <Text style={styles.reactionIcon}>❤️</Text>
                                <Text style={styles.reactionCount}>{comment.reaction_summary?.love || 0}</Text>
                            </TouchableOpacity>
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
                </View>
            ))}
            <AddComment postId={postId} dispatch={dispatch} />
        </View>
    );
};

const styles = StyleSheet.create({
    comments: {
        marginTop: 10,
    },
    commentContainer: {
        marginBottom: 10,
        backgroundColor: '#f8f8f8',
        borderRadius: 10,
        padding: 10
    },

    commentHeader: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 5,
    },
    commentAvatar: {
        marginRight: 10,
    },
    userInfo: {
        flex: 1,
    },
    commentUsername: {
        fontWeight: "bold",
        marginBottom: 2
    },
    commentContentContainer: {
        marginBottom: 5
    },
    commentContent: {
        fontSize: 13,
    },
    reactionRow: {
        flexDirection: "row",
        marginTop: 5,
    },
    reactionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 15
    },
    reactionIcon: {
        fontSize: 13,
        marginRight: 3
    },
    reactionCount: {
        fontSize: 13
    }
});

export default CommentList;