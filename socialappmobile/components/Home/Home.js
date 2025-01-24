import React, { useEffect, useMemo, useCallback, useReducer, useState } from "react";
import {
    Text,
    View,
    Dimensions,
    TouchableOpacity,
    FlatList,
    Image,
    ActivityIndicator,
    Alert,
    StyleSheet
} from "react-native";
import { Avatar, Menu, Divider } from "react-native-paper";
import { MaterialIcons, Ionicons } from "@expo/vector-icons";
import APIs, { endpoints, authApis } from "../../configs/APIs";
import RenderHtml from "react-native-render-html";
import HomeStyles from "./HomeStyles";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import Navbar from "../Home/Navbar";
import AsyncStorage from '@react-native-async-storage/async-storage';
import reducer, { initialState } from './reducer';
import AddComment from "./AddComment";

const Home = ({ route, navigation = useNavigation() }) => {
    const [state, dispatch] = useReducer(reducer, initialState);
    const [nextPage, setNextPage] = useState(null);
    const [loadingMore, setLoadingMore] = useState(false);
    const [loadingComments, setLoadingComments] = useState(false);
    const [visible, setVisible] = useState(false);
    const [anchor, setAnchor] = useState({ x: 0, y: 0 });
    const [currentPost, setCurrentPost] = useState(null);

    const [visibleComment, setVisibleComment] = useState(false);
    const [anchorComment, setAnchorComment] = useState({ x: 0, y: 0 });
    const [currentComment, setCurrentComment] = useState(null);
    const updatedCommentId = route.params?.refreshComment;

    const screenWidth = Dimensions.get("window").width;

    const openMenu = (event, postId) => {
        const { nativeEvent } = event;
        setAnchor({ x: nativeEvent.pageX, y: nativeEvent.pageY });
        setVisible(true);
        setCurrentPost(postId);
    };

    const closeMenu = () => {
        setVisible(false);
        setCurrentPost(null);
    };

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

    // Tối ưu API call và cache dữ liệu
    const fetchData = async (url) => {
        try {
            const token = await AsyncStorage.getItem('token');
            const res = await authApis(token).get(url);
            return res.data;
        } catch (error) {
            console.error("API request failed:", error);
            throw error;
        }
    };

    // Chỉ gọi API nếu chưa tải dữ liệu
    const fetchAllComments = useCallback(async () => {
        setLoadingComments(true);
        try {
            let allComments = [];
            let url = endpoints["comments"];
            while (url) {
                const resComments = await fetchData(url);
                allComments = [...allComments, ...resComments.results];
                url = resComments.next;
            }
            if (updatedCommentId) {
                const updatedComment = await fetchData(endpoints.comment_detail(updatedCommentId));
                allComments = allComments.map(c => c.id === updatedCommentId ? updatedComment : c);
                navigation.setParams({ refreshComment: null });
            }
            return allComments;
        } catch (error) {
            console.error("Failed to fetch all comments:", error);
            return [];
        } finally {
            setLoadingComments(false);
        }
    }, [updatedCommentId]);

    const fetchAllReactions = useCallback(async () => {
        try {
            let allReactions = [];
            let url = endpoints["reactions"];
            while (url) {
                const resReactions = await fetchData(url);
                allReactions = [...allReactions, ...resReactions.results];
                url = resReactions.next;
            }
            return allReactions;
        } catch (error) {
            console.error("Failed to fetch all reactions:", error);
            return [];
        }
    }, []);

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
                        [...state.data.posts, ...resPosts.results].map((post) => [post.id, post])
                    ).values(),
                ];

            setNextPage(resPosts.next);

            dispatch({
                type: 'SET_DATA',
                payload: {
                    posts: allPosts,
                    reactions: allReactions,
                    comments: allComments,
                },
            });
        } catch (error) {
            console.error("Failed to load data:", error);
        } finally {
            dispatch({ type: 'SET_LOADING', payload: false });
            if (url !== endpoints["posts"]) {
                setLoadingMore(false);
            }
        }
    }, [state.data.posts, state.data.reactions]);

    useFocusEffect(
        React.useCallback(() => {
            if (state.data.posts.length === 0 || route.params?.refresh) {
                dispatch({ type: 'SET_LOADING', payload: true });
                loadPosts(endpoints["posts"], route.params?.refresh);
            }

            return () => {
                if (route.params?.refresh) {
                    navigation.setParams({ refresh: false });
                }
            };
        }, [state.data.posts, route.params, loadPosts])
    );

    const getCommentsForPost = useMemo(() => (postId) => {
        return state.data.comments.filter(comment => comment.post === postId);
    }, [state.data.comments]);

    const toggleComments = useCallback((postId) => {
        dispatch({ type: 'TOGGLE_COMMENTS', payload: postId });
    }, []);

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
                            `<span class="math-inline">\{endpoints\.reactions\}</span>{existingReaction.id}/`
                        );

                        // ... tiếp tục từ comment trước

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
                                    updatedReaction: response.data
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

                if (response === null || response.status === 200 || response.status === 201) {
                    const summaryResponse = await authenticatedApis.get(
                        `${targetType === "post" ? endpoints.post_detail(targetId) : endpoints.comment_detail(targetId)}reactions-summary/`
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
        [state.data.reactions]
    );

    const handleLoadMore = () => {
        if (nextPage && !loadingMore) {
            setLoadingMore(true);
            loadPosts(nextPage);
        }
    };

    const handleCommentAdded = useCallback((postId) => {
        const fetchData = async () => {
            try {
                const token = await AsyncStorage.getItem('token');
                const resComments = await authApis(token).get(endpoints["comments"]);
                dispatch({ type: 'SET_COMMENTS', payload: resComments.data.results });
            } catch (error) {
                console.error("Failed to refresh comments:", error);
            }
        };

        fetchData();
    }, [dispatch]);

    const handleDeletePost = async (postId) => {
        try {
            const token = await AsyncStorage.getItem('token');
            if (!token) {
                Alert.alert("Thông báo", "Vui lòng đăng nhập để xóa bài viết!");
                return;
            }

            const res = await authApis(token).delete(endpoints.post_detail(postId));

            if (res.status === 204) {
                Alert.alert("Thông báo", "Xóa bài viết thành công!");

                dispatch({
                    type: 'DELETE_POST',
                    payload: postId
                });

            } else {
                Alert.alert("Lỗi", "Xóa bài viết thất bại. Vui lòng thử lại!");
            }
        } catch (error) {
            console.error("Error deleting post:", error);
            Alert.alert("Lỗi", "Đã có lỗi xảy ra khi xóa bài viết.");
        }
    };

    const handleDeleteComment = async (commentId) => {
        try {
            const token = await AsyncStorage.getItem('token');
            const currentUser = JSON.parse(await AsyncStorage.getItem("user")); // Lấy thông tin người dùng hiện tại
            if (!token) {
                Alert.alert("Thông báo", "Vui lòng đăng nhập để xóa bình luận!");
                return;
            }
    
            // Lấy thông tin chi tiết của bình luận
            const comment = await authApis(token).get(endpoints.comment_detail(commentId));
    
            // Kiểm tra xem người dùng hiện tại có phải là chủ sở hữu của bình luận không
            if (comment.data.user.id !== currentUser.id) {
                Alert.alert("Lỗi", "Bạn không có quyền xóa bình luận này.");
                return;
            }
    
            const res = await authApis(token).delete(endpoints.comment_detail(commentId));
    
            if (res.status === 204) {
                Alert.alert("Thông báo", "Xóa bình luận thành công!");
    
                dispatch({
                    type: 'DELETE_COMMENT',
                    payload: commentId
                });
    
            } else {
                Alert.alert("Lỗi", "Xóa bình luận thất bại. Vui lòng thử lại!");
            }
        } catch (error) {
            console.error("Error deleting comment:", error);
            Alert.alert("Lỗi", "Đã có lỗi xảy ra khi xóa bình luận.");
        }
    };

    const renderPost = ({ item: post }) => {
        const postComments = getCommentsForPost(post.id);

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
                    <TouchableOpacity onPress={(event) => openMenu(event, post.id)}>
                        <MaterialIcons name="more-vert" size={24} color="#666" />
                    </TouchableOpacity>
                </View>

                <RenderHtml
                    contentWidth={screenWidth}
                    source={{ html: post.content }}
                    baseStyle={HomeStyles.postContent}
                />

                {post.image && (
                    <Image
                        source={{ uri: post.image.startsWith('image/upload/') ? post.image.replace('image/upload/', '') : post.image }}
                        style={HomeStyles.postImage}
                        resizeMode="cover"
                    />
                )}

                <View style={HomeStyles.interactionRow}>
                    <TouchableOpacity onPress={() => handleReaction("post", post.id, "like")}>
                        <Text style={HomeStyles.reactionText}>👍 {post.reaction_summary?.like || 0}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleReaction("post", post.id, "haha")}>
                        <Text style={HomeStyles.reactionText}>😂 {post.reaction_summary?.haha || 0}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleReaction("post", post.id, "love")}>
                        <Text style={HomeStyles.reactionText}>❤️ {post.reaction_summary?.love || 0}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={HomeStyles.interactionButton}
                        onPress={() => toggleComments(post.id)}
                    >
                        <Ionicons name="chatbubble-outline" size={20} color="#333" />
                        <Text style={HomeStyles.reactionText}>
                            {postComments.length}
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={HomeStyles.interactionButton}>
                        <Ionicons name="share-outline" size={20} color="#333" />
                    </TouchableOpacity>
                </View>

                {state.visibleComments[post.id] && (
                    <View style={HomeStyles.comments}>
                        {postComments.map((comment) => (
                            <View key={comment.id} style={HomeStyles.comment}>
                                <View style={HomeStyles.commentHeader}>
                                    <Avatar.Image
                                        source={{ uri: comment.user?.avatar || "https://via.placeholder.com/150" }}
                                        size={30}
                                        style={HomeStyles.commentAvatar}
                                    />
                                    <View style={{ flex: 1, marginLeft: 10 }}>
                                    <Text style={HomeStyles.commentUsername}>
                                        {comment.user?.username || "Anonymous"}
                                    </Text>
                                    </View>
                                    <TouchableOpacity onPress={(event) => openCommentMenu(event, comment.id)}>
                                        <MaterialIcons name="more-vert" size={20} color="#666" />
                                    </TouchableOpacity>
                                </View>
                                <View style={{ flex: 1 }}>
                                    <RenderHtml
                                        contentWidth={screenWidth}
                                        source={{ html: comment.content }}
                                        baseStyle={HomeStyles.commentContent}
                                    />
                                    <View style={HomeStyles.reactionRow}>
                                        <TouchableOpacity onPress={() => handleReaction("comment", comment.id, "like")}>
                                            <Text style={HomeStyles.reactionText}>
                                                👍 {comment.reaction_summary?.like || 0}
                                            </Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity onPress={() => handleReaction("comment", comment.id, "haha")}>
                                            <Text style={HomeStyles.reactionText}>
                                                😂 {comment.reaction_summary?.haha || 0}
                                            </Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity onPress={() => handleReaction("comment", comment.id, "love")}>
                                            <Text style={HomeStyles.reactionText}>
                                                ❤️ {comment.reaction_summary?.love || 0}
                                            </Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                                <Menu
                                    visible={visibleComment && currentComment === comment.id}
                                    onDismiss={closeCommentMenu}
                                    anchor={anchorComment}>
                                    <Menu.Item onPress={() => {
                                        navigation.navigate('EditComment', { comment: comment });
                                        closeCommentMenu();
                                    }} title="Sửa bình luận" />
                                    <Divider />
                                    <Menu.Item onPress={() => {
                                        Alert.alert(
                                            "Xác nhận xóa",
                                            "Bạn có chắc chắn muốn xóa bình luận này?",
                                            [
                                                {
                                                    text: "Hủy",
                                                    style: "cancel"
                                                },
                                                {
                                                    text: "Xóa", onPress: () => {
                                                        handleDeleteComment(comment.id);
                                                        closeCommentMenu();
                                                    }
                                                }
                                            ],
                                            { cancelable: false }
                                        );
                                    }} title="Xóa bình luận" />
                                </Menu>
                            </View>
                        ))}
                        <AddComment postId={post.id} onCommentAdded={handleCommentAdded} />
                    </View>
                )}

                <Menu
                    visible={visible && currentPost === post.id}
                    onDismiss={closeMenu}
                    anchor={anchor}>
                    <Menu.Item onPress={() => {
                        navigation.navigate('EditPost', { post: post });
                        closeMenu();
                    }} title="Sửa bài viết" />
                    <Divider />
                    <Menu.Item onPress={() => {
                        Alert.alert(
                            "Xác nhận xóa",
                            "Bạn có chắc chắn muốn xóa bài viết này?",
                            [
                                {
                                    text: "Hủy",
                                    style: "cancel"
                                },
                                {
                                    text: "Xóa", onPress: () => {
                                        handleDeletePost(post.id);
                                        closeMenu();
                                    }
                                }
                            ],
                            { cancelable: false }
                        );
                    }} title="Xóa bài viết" />
                </Menu>
            </View>
        );
    };

    if ((state.loading || loadingComments) && state.data.posts.length === 0) {
        return (
            <View style={HomeStyles.loaderContainer}>
                <ActivityIndicator size="large" color="#0000ff" />
                <Text style={HomeStyles.loaderText}>Loading posts...</Text>
            </View>
        );
    }

    return (
        <View style={HomeStyles.container}>
            <View style={HomeStyles.header}>
                <Text style={HomeStyles.appName}>SocialApp</Text>
            </View>

            <FlatList
                data={state.data.posts || []}
                keyExtractor={(item) => item.id.toString()}
                renderItem={renderPost}
                showsVerticalScrollIndicator={false}
                onEndReached={handleLoadMore}
                onEndReachedThreshold={0.5}
                ListFooterComponent={loadingMore && (
                    <View style={HomeStyles.loaderContainer}>
                        <ActivityIndicator size="small" color="#0000ff" />
                    </View>
                )}
            />

            <Navbar navigation={navigation} />
        </View>
    );
};

const styles = StyleSheet.create({
    // ... các style khác giữ nguyên
    commentHeader: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 5,
    },
});

export default Home;