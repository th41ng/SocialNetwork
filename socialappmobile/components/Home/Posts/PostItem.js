// components/PostItem.js
import React, { useState, useCallback, useMemo, useContext, useEffect } from "react";
import { View, Text, TouchableOpacity, Image, Alert, Animated, Easing } from "react-native"; // Import Animated and Easing
import { Avatar, Menu, Divider } from "react-native-paper";
import { MaterialIcons, Ionicons } from "@expo/vector-icons";
import { useWindowDimensions } from "react-native";
import RenderHtml from "react-native-render-html";
import { useNavigation } from "@react-navigation/native";
import HomeStyles from "../HomeStyles";
import CommentList from "../Comments/CommentList";
import { authApis, endpoints } from "../../../configs/APIs";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { MyUserContext } from "../../../configs/UserContext";

/**
* Component hiển thị một bài viết (post) trong danh sách bài viết.
*/
const PostItem = ({ post, dispatch, state, updatedCommentId }) => {
    const navigation = useNavigation();

    // Lấy thông tin user hiện tại từ context
    const user = useContext(MyUserContext);

    // State cho menu sửa/xóa bài viết
    const [isMenuVisible, setIsMenuVisible] = useState(false);
    const [anchor, setAnchor] = useState({ x: 0, y: 0 }); // Tọa độ để hiển thị menu
    // State cho việc khóa/mở khóa bình luận
    const [isCommentLocked, setIsCommentLocked] = useState(post.is_comment_locked || false);

    // State cho animation
    const [likeAnimation] = useState(new Animated.Value(0));
    const [hahaAnimation] = useState(new Animated.Value(0));
    const [loveAnimation] = useState(new Animated.Value(0));

    // Lấy kích thước màn hình
    const { width } = useWindowDimensions();

    /**
    * Ẩn/hiện menu sửa/xóa bài viết.
    */
    const toggleMenu = useCallback((event) => {
        if (event) {
            const { nativeEvent } = event;
            setAnchor({ x: nativeEvent.pageX, y: nativeEvent.pageY });
        }
        setIsMenuVisible((prev) => !prev);
    }, []);

    /**
     * Hàm thực hiện animation
     */
    const runAnimation = (animationValue) => {
        Animated.sequence([
            Animated.timing(animationValue, {
                toValue: 1,
                duration: 200,
                easing: Easing.ease,
                useNativeDriver: true,
            }),
            Animated.timing(animationValue, {
                toValue: 0,
                duration: 500,
                easing: Easing.ease,
                useNativeDriver: true,
            }),
        ]).start();
    };

    /**
    * Xử lý tương tác (reaction) với bài viết: like, haha, love.
    */
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

                // Kiểm tra reaction tồn tại của user với bài viết
                const existingReaction = state.data.reactions.find(
                    (r) =>
                        r.target_type === "post" &&
                        r.target_id === post.id &&
                        r.user === userId
                );

                let response;

                if (existingReaction) {
                    // Nếu đã có reaction
                    if (existingReaction.reaction_type === reactionType) {
                        // Nếu reaction type trùng với type hiện tại => xóa reaction
                        response = await authenticatedApis.delete(
                            `${endpoints.reactions}${existingReaction.id}/`
                        );

                        if (response.status === 204) {
                            dispatch({
                                type: "DELETE_REACTION",
                                payload: existingReaction.id
                            });
                        }
                    } else {
                        // Nếu reaction type khác => cập nhật reaction type
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
                    // Nếu chưa có reaction => tạo mới
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

                // Cập nhật reaction summary
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
                
          // Chạy animation tương ứng với reaction type
      if (reactionType === "like") {
        Animated.sequence([
          Animated.timing(likeAnimation, {
            toValue: 1.2,
            duration: 100,
            easing: Easing.ease,
            useNativeDriver: true,
          }),
          Animated.spring(likeAnimation, {
            toValue: 1,
            friction: 2,
            tension: 50,
            useNativeDriver: true,
          }),
        ]).start();
      } else if (reactionType === "haha") {
        Animated.sequence([
          Animated.timing(hahaAnimation, {
            toValue: 1.2,
            duration: 100,
            easing: Easing.ease,
            useNativeDriver: true,
          }),
          Animated.spring(hahaAnimation, {
            toValue: 1,
            friction: 2,
            tension: 50,
            useNativeDriver: true,
          }),
        ]).start();
      } else if (reactionType === "love") {
        Animated.sequence([
          Animated.timing(loveAnimation, {
            toValue: 1.2,
            duration: 100,
            easing: Easing.ease,
            useNativeDriver: true,
          }),
          Animated.spring(loveAnimation, {
            toValue: 1,
            friction: 2,
            tension: 50,
            useNativeDriver: true,
          }),
        ]).start();
      }

            } catch (error) {
                console.error(
                    "Error in handleReaction:",
                    error.response || error.message
                );
                // Alert.alert("Lỗi", "Đã có lỗi xảy ra khi tương tác với bài viết.");
            }
        },
        [state.data.reactions, dispatch, post.id, likeAnimation, hahaAnimation, loveAnimation]
    );

    /**
    * Xử lý xóa bài viết.
    */
    const handleDeletePost = useCallback(async () => {
        try {
            const token = await AsyncStorage.getItem("token");
            if (!token) {
                Alert.alert("Thông báo", "Vui lòng đăng nhập để xóa bài viết!");
                return;
            }

            const res = await authApis(token).delete(endpoints.post_detail(post.id));

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
    }, [post.id, dispatch]);

    /**
    * Lấy danh sách comment cho bài viết hiện tại.
    */
    const getCommentsForPost = useMemo(() => {
        return state.data.comments.filter((comment) => comment.post === post.id);
    }, [state.data.comments, post.id]);

    /**
    * Ẩn/hiện danh sách comment.
    */
    const toggleComments = useCallback(() => {
        dispatch({ type: "TOGGLE_COMMENTS", payload: post.id });
    }, [dispatch, post.id]);

    /**
    * Xử lý khóa/mở khóa bình luận.
    */
    const handleToggleCommentLock = async () => {
        try {
            const token = await AsyncStorage.getItem("token");
            if (!token) {
                Alert.alert("Thông báo", "Vui lòng đăng nhập để thực hiện thao tác này!");
                return;
            }
            const res = await authApis(token).patch(endpoints.post_detail(post.id), {
                is_comment_locked: !isCommentLocked,
            });
            if (res.status === 200) {
                setIsCommentLocked(!isCommentLocked);
                dispatch({
                    type: "UPDATE_POST",
                    payload: res.data,
                });
                Alert.alert("Thông báo", `Đã ${isCommentLocked ? "mở khóa" : "khóa"} bình luận thành công!`);
            } else {
                Alert.alert("Lỗi", "Thao tác thất bại. Vui lòng thử lại!");
            }
        } catch (error) {
            console.error("Error toggling comment lock:", error);
            Alert.alert("Lỗi", "Đã có lỗi xảy ra.");
        }
    };
    // // Sử dụng useEffect để log ra state.data.posts mỗi khi nó thay đổi
    // useEffect(() => {
    // console.log("state.data.posts updated:", state.data.posts);
    // }, [state.data.posts]);

    // Scale animation cho từng reaction
    const likeScale = likeAnimation.interpolate({
        inputRange: [0, 0.5, 1],
        outputRange: [1, 1.2, 1],
    });

    const hahaScale = hahaAnimation.interpolate({
        inputRange: [0, 0.5, 1],
        outputRange: [1, 1.2, 1],
    });

    const loveScale = loveAnimation.interpolate({
        inputRange: [0, 0.5, 1],
        outputRange: [1, 1.2, 1],
    });

    return (
        <View key={post.id} style={HomeStyles.postContainer}>
            <View style={HomeStyles.postHeader}>
                {/* Avatar và thông tin người đăng */}
                <TouchableOpacity
                    onPress={() => {
                        navigation.navigate("SomeOneProfile", { userId: post.user.id });
                    }}
                >
                    <Avatar.Image
                        source={{
                            uri: post.user.avatar
                                ? post.user.avatar.startsWith("image/upload/")
                                    ? post.user.avatar.replace("image/upload/", "")
                                    : post.user.avatar
                                : "https://via.placeholder.com/150",
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

                {/* Nút "more-vert" - chỉ hiển thị cho chủ bài viết */}
                {post.user?.id === user?.id && (
                    <TouchableOpacity onPress={toggleMenu}>
                        <MaterialIcons name="more-vert" size={24} color="#666" />
                    </TouchableOpacity>
                )}
            </View>

            {/* Nội dung bài viết (HTML) */}
            <RenderHtml
                contentWidth={width}
                source={{ html: post.content }}
                baseStyle={HomeStyles.postContent}
            />

            {/* Hình ảnh bài viết (nếu có) */}
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

            {/* Thanh tương tác: like, haha, love, comment, share */}
            <View style={HomeStyles.interactionRow}>
                <Animated.View style={{ transform: [{ scale: likeScale }] }}>
                    <TouchableOpacity onPress={() => handlePostReaction("like")}>
                        <Text style={HomeStyles.reactionText}>
                            👍 {post.reaction_summary?.like || 0}
                        </Text>
                    </TouchableOpacity>
                </Animated.View>
                <Animated.View style={{ transform: [{ scale: hahaScale }] }}>
                    <TouchableOpacity onPress={() => handlePostReaction("haha")}>
                        <Text style={HomeStyles.reactionText}>
                            😂 {post.reaction_summary?.haha || 0}
                        </Text>
                    </TouchableOpacity>
                </Animated.View>
                <Animated.View style={{ transform: [{ scale: loveScale }] }}>
                    <TouchableOpacity onPress={() => handlePostReaction("love")}>
                        <Text style={HomeStyles.reactionText}>
                            ❤️ {post.reaction_summary?.love || 0}
                        </Text>
                    </TouchableOpacity>
                </Animated.View>

                <TouchableOpacity
                    style={HomeStyles.interactionButton}
                    onPress={toggleComments}
                    disabled={isCommentLocked}
                >
                    <Ionicons name="chatbubble-outline" size={20} color={isCommentLocked ? "#ccc" : "#333"} />
                    <Text style={[HomeStyles.reactionText, isCommentLocked && { color: "#ccc" }]}>
                        {getCommentsForPost.length}
                    </Text>
                </TouchableOpacity>
                {/* <TouchableOpacity style={HomeStyles.interactionButton}>
<Ionicons name="share-outline" size={20} color="#333" />
</TouchableOpacity> */}
            </View>

            {/* Danh sách comment */}
            <CommentList
                postId={post.id}
                comments={getCommentsForPost}
                isVisible={state.visibleComments[post.id] && !isCommentLocked} // Ẩn comment list khi bị khóa
                dispatch={dispatch}
                state={state}
                handlePostReaction={handlePostReaction}
                updatedCommentId={updatedCommentId}
                isCommentLocked={isCommentLocked} // Truyền trạng thái khóa comment xuống CommentList
                postUser={post.user}
            />

            {/* Menu sửa/xóa bài viết */}
            <Menu visible={isMenuVisible} onDismiss={toggleMenu} anchor={anchor}>
                {/* Chỉ hiển thị cho chủ bài viết */}
                {post.user?.id === user?.id && (
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
                        <Divider />
                        <Menu.Item
                            onPress={() => {
                                handleToggleCommentLock();
                                toggleMenu();
                            }}
                            title={`${isCommentLocked ? "Mở khóa" : "Khóa"} bình luận`}
                        />
                    </>
                )}
            </Menu>
        </View>
    );
};

export default PostItem;