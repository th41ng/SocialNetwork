// components/PostItem.js
import React, { useState,useCallback, useMemo, useContext } from 'react';
import { View, Text, TouchableOpacity, Image, Alert } from 'react-native';
import { Avatar, Menu, Divider } from 'react-native-paper';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { useWindowDimensions } from 'react-native';
import RenderHtml from 'react-native-render-html';
import { useNavigation } from '@react-navigation/native';
import HomeStyles from "./HomeStyles";
import CommentList from './CommentList';
import { fetchData } from "../../configs/APIs";
import { authApis, endpoints } from "../../configs/APIs";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MyUserContext } from "../../configs/UserContext"; 
const PostItem = ({
    post,
    dispatch,
    state,
    updatedCommentId,
  }) => {
    const navigation = useNavigation();
    const user = useContext(MyUserContext);
    const [isMenuVisible, setIsMenuVisible] = useState(false);
    const [anchor, setAnchor] = useState({ x: 0, y: 0 });
    const { width } = useWindowDimensions();
  
    const toggleMenu = (event) => {
      if (event) {
        const { nativeEvent } = event;
        setAnchor({ x: nativeEvent.pageX, y: nativeEvent.pageY });
      }
      setIsMenuVisible(!isMenuVisible);
    };
  
    const handlePostReaction = useCallback(
      async (reactionType) => {
        try {
          const token = await AsyncStorage.getItem("token");
          if (!token) {
            console.error("Token not found.");
            return;
          }
  
          const authenticatedApis = authApis(token);
          const userId = JSON.parse(await AsyncStorage.getItem("user")).id;
  
          const existingReaction = state.data.reactions.find(
            (r) =>
              r.target_type === "post" &&
              r.target_id === post.id &&
              r.user === userId
          );
  
          let response;
  
          if (existingReaction) {
            if (existingReaction.reaction_type === reactionType) {
              await authenticatedApis.delete(
                `${endpoints.reactions}${existingReaction.id}/`
              );
  
              dispatch({
                type: "SET_REACTIONS",
                payload: state.data.reactions.filter(
                  (r) => r.id !== existingReaction.id
                ),
              });
  
              response = null;
            } else {
              const payload = { reaction_type: reactionType };
              response = await authenticatedApis.patch(
                `${endpoints.reactions}${existingReaction.id}/`,
                payload
              );
  
              if (response.status === 200) {
                dispatch({
                  type: "UPDATE_REACTION",
                  payload: {
                    reactionId: existingReaction.id,
                    updatedReaction: response.data,
                  },
                });
              }
            }
          } else {
            const payload = {
              target_type: "post",
              target_id: post.id,
              reaction_type: reactionType,
            };
            response = await authenticatedApis.post(
              endpoints.reactions,
              payload
            );
  
            if (response.status === 201) {
              dispatch({
                type: "ADD_REACTION",
                payload: response.data,
              });
            }
          }
  
          if (
            response === null ||
            response.status === 200 ||
            response.status === 201
          ) {
            const summaryResponse = await authenticatedApis.get(
              `${endpoints.post_detail(post.id)}reactions-summary/`
            );
  
            if (summaryResponse.status === 200) {
              dispatch({
                type: "UPDATE_REACTIONS",
                payload: {
                  targetType: "post",
                  postId: post.id,
                  reactionsSummary: summaryResponse.data.reaction_summary,
                },
              });
            }
          }
        } catch (error) {
          console.error(
            "Error in handleReaction:",
            error.response || error.message
          );
        }
      },
      [state.data.reactions, dispatch, post.id]
    );
  
    const handleDeletePost = async () => {
      try {
        const token = await AsyncStorage.getItem("token");
        if (!token) {
          Alert.alert("Thông báo", "Vui lòng đăng nhập để xóa bài viết!");
          return;
        }
  
        const res = await authApis(token).delete(
          endpoints.post_detail(post.id)
        );
  
        if (res.status === 204) {
          Alert.alert("Thông báo", "Xóa bài viết thành công!");
  
          dispatch({
            type: "DELETE_POST",
            payload: post.id,
          });
        } else {
          Alert.alert("Lỗi", "Xóa bài viết thất bại. Vui lòng thử lại!");
        }
      } catch (error) {
        console.error("Error deleting post:", error);
        Alert.alert("Lỗi", "Đã có lỗi xảy ra khi xóa bài viết.");
      }
    };
  
    const getCommentsForPost = useMemo(() => {
      return state.data.comments.filter((comment) => comment.post === post.id);
    }, [state.data.comments, post.id]);
  
    const toggleComments = useCallback(() => {
      dispatch({ type: "TOGGLE_COMMENTS", payload: post.id });
    }, [dispatch, post.id]);
    
    return (
      <View key={post.id} style={HomeStyles.postContainer}>
        <View style={HomeStyles.postHeader}>
        <TouchableOpacity
            onPress={() => {
              console.log("Navigating to SomeOneProfile with userId:", post.user.id); // Log userId
              navigation.navigate("SomeOneProfile", { userId: post.user.id });
            }}
          >
            <Avatar.Image
              source={{
                uri: post.user.avatar
                  ? post.user.avatar.startsWith("image/upload/")
                    ? post.user.avatar.replace("image/upload/", "")
                    : post.user.avatar
                  : "https://via.placeholder.com/150", // default image
              }}
              size={40}
            />
        </TouchableOpacity>
          <View style={HomeStyles.headerDetails}>
            <Text style={HomeStyles.username}>{post.user.username}</Text>
            <Text style={HomeStyles.timeText}>
              {new Date(post.created_date).toLocaleTimeString()}
            </Text>
          </View>
          <TouchableOpacity onPress={toggleMenu}>
            <MaterialIcons name="more-vert" size={24} color="#666" />
          </TouchableOpacity>
        </View>
  
        <RenderHtml
          contentWidth={width}
          source={{ html: post.content }}
          baseStyle={HomeStyles.postContent}
        />
  
        {post.image && (
          <Image
            source={{
              uri: post.image.startsWith("image/upload/")
                ? post.image.replace("image/upload/", "")
                : post.image,
            }}
            style={HomeStyles.postImage}
            resizeMode="cover"
          />
        )}
  
        <View style={HomeStyles.interactionRow}>
          <TouchableOpacity onPress={() => handlePostReaction("like")}>
            <Text style={HomeStyles.reactionText}>
              👍 {post.reaction_summary?.like || 0}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handlePostReaction("haha")}>
            <Text style={HomeStyles.reactionText}>
              😂 {post.reaction_summary?.haha || 0}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handlePostReaction("love")}>
            <Text style={HomeStyles.reactionText}>
              ❤️ {post.reaction_summary?.love || 0}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={HomeStyles.interactionButton}
            onPress={toggleComments}
          >
            <Ionicons name="chatbubble-outline" size={20} color="#333" />
            <Text style={HomeStyles.reactionText}>
              {getCommentsForPost.length}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={HomeStyles.interactionButton}>
            <Ionicons name="share-outline" size={20} color="#333" />
          </TouchableOpacity>
        </View>
        <CommentList
          postId={post.id}
          comments={getCommentsForPost}
          isVisible={state.visibleComments[post.id]}
          dispatch={dispatch}
          state={state}
          handlePostReaction={handlePostReaction}
          updatedCommentId={updatedCommentId}
        />
  
  <Menu visible={isMenuVisible} onDismiss={toggleMenu} anchor={anchor}>
                {/* Chỉ hiển thị nếu là chủ bài viết */}
                {post.user?.id === user.id && (
                    <>
                        <Menu.Item
                            onPress={() => {
                                navigation.navigate("EditPost", { post: post });
                                toggleMenu();
                            }}
                            title="Sửa bài viết"
                        />
                        <Divider />
                        <Menu.Item
                            onPress={() => {
                                Alert.alert(
                                    "Xác nhận xóa",
                                    "Bạn có chắc chắn muốn xóa bài viết này?",
                                    [
                                        {
                                            text: "Hủy",
                                            style: "cancel",
                                        },
                                        {
                                            text: "Xóa",
                                            onPress: () => {
                                                handleDeletePost();
                                                toggleMenu();
                                            },
                                        },
                                    ],
                                    { cancelable: false }
                                );
                            }}
                            title="Xóa bài viết"
                        />
                    </>
                )}
            </Menu>
        </View>
    );
};
  
  export default PostItem;