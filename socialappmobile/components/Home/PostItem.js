// components/PostItem.js
import React, { useCallback, useMemo } from 'react';
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

const PostItem = ({ post, dispatch, state, fetchAllComments, fetchAllReactions, updatedCommentId }) => {
  const navigation = useNavigation();
  const [visible, setVisible] = React.useState(false);
  const [anchor, setAnchor] = React.useState({ x: 0, y: 0 });
  const { width } = useWindowDimensions(); // Lấy chiều rộng màn hình
  const openMenu = (event) => {
    const { nativeEvent } = event;
    setAnchor({ x: nativeEvent.pageX, y: nativeEvent.pageY });
    setVisible(true);
  };

  const closeMenu = () => {
    setVisible(false);
  };

  const loadPosts = useCallback(async (url = endpoints["posts"], refresh = false) => {
    try {
      const [resPosts, allReactions, allComments] = await Promise.all([
        fetchData(url),
        fetchAllReactions(),
        fetchAllComments(),
      ]);
  
      let allPosts = refresh
        ? resPosts.results
        : [
          ...new Map(
            [...state.data.posts, ...resPosts.results].map((post) => [
              post.id,
              post,
            ])
          ).values(),
        ];
      dispatch({
        type: "SET_DATA",
        payload: {
          posts: allPosts,
          reactions: allReactions,
          comments: allComments,
        },
      });
    } catch (error) {
      console.error("Failed to load data:", error);
    } finally {
      dispatch({ type: "SET_LOADING", payload: false });
    }
  }, [state.data.posts, state.data.reactions, state.data.comments, dispatch]);
  
  const handleReaction = useCallback(
    async (targetType, targetId, reactionType) => {
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
            r.target_type === targetType &&
            r.target_id === targetId &&
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
            target_type: targetType,
            target_id: targetId,
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
            `${
              targetType === "post"
                ? endpoints.post_detail(targetId)
                : endpoints.comment_detail(targetId)
            }reactions-summary/`
          );

          if (summaryResponse.status === 200) {
            dispatch({
              type:
                targetType === "post"
                  ? "UPDATE_POST_REACTIONS"
                  : "UPDATE_COMMENT_REACTIONS",
              payload: {
                targetType: targetType,
                [targetType === "post" ? "postId" : "commentId"]: targetId,
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
    [state.data.reactions, dispatch]
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
    dispatch({ type: 'TOGGLE_COMMENTS', payload: post.id });
  }, [dispatch, post.id]);

  return (
    <View key={post.id} style={HomeStyles.postContainer}>
      <View style={HomeStyles.postHeader}>
        <Avatar.Image
          source={{ uri: post.user.avatar || "https://via.placeholder.com/150" }}
          size={40}
        />
        <View style={HomeStyles.headerDetails}>
          <Text style={HomeStyles.username}>{post.user.username}</Text>
          <Text style={HomeStyles.timeText}>
            {new Date(post.created_date).toLocaleTimeString()}
          </Text>
        </View>
        <TouchableOpacity onPress={openMenu}>
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
        <TouchableOpacity onPress={() => handleReaction("post", post.id, "like")}>
          <Text style={HomeStyles.reactionText}>
            👍 {post.reaction_summary?.like || 0}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => handleReaction("post", post.id, "haha")}
        >
          <Text style={HomeStyles.reactionText}>
            😂 {post.reaction_summary?.haha || 0}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => handleReaction("post", post.id, "love")}
        >
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
        handleReaction={handleReaction}
        updatedCommentId={updatedCommentId}
      />

      <Menu
        visible={visible}
        onDismiss={closeMenu}
        anchor={anchor}
      >
        <Menu.Item
          onPress={() => {
            navigation.navigate("EditPost", { post: post });
            closeMenu();
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
                    closeMenu();
                  },
                },
              ],
              { cancelable: false }
            );
          }}
          title="Xóa bài viết"
        />
      </Menu>
    </View>
  );
};

export default PostItem;