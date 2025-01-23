import React, { useEffect, useMemo, useCallback, useReducer, useState } from "react";
import {
    Text,
    View,
    Dimensions,
    TouchableOpacity,
    FlatList,
    Image,
    ActivityIndicator,
    Alert
} from "react-native";
import { Avatar, Menu, Divider } from "react-native-paper";
import { MaterialIcons } from "@expo/vector-icons";
import APIs, { endpoints, authApis } from "../../configs/APIs";
import RenderHtml from "react-native-render-html";
import HomeStyles from "./HomeStyles";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import Navbar from "../Home/Navbar";
import { Ionicons } from "@expo/vector-icons";
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

    const openMenu = (event, postId) => {
        const { nativeEvent } = event;
        const anchor = {
            x: nativeEvent.pageX,
            y: nativeEvent.pageY,
        };
        setAnchor(anchor);
        setVisible(true);
        setCurrentPost(postId);
    };

    const closeMenu = () => {
        setVisible(false);
        setCurrentPost(null);
    };

    // Fetch data function
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

    // Hàm fetch tất cả comments
    const fetchAllComments = async () => {
        setLoadingComments(true);
        try {
            let allComments = [];
            let url = endpoints["comments"];

            while (url) {
                const resComments = await fetchData(url);
                allComments = [...allComments, ...resComments.results];
                url = resComments.next;
            }
            return allComments
        } catch (error) {
            console.error("Failed to fetch all comments:", error);
            return [];
        } finally {
            setLoadingComments(false);
        }
    };

    // Hàm fetch tất cả reactions
    const fetchAllReactions = async () => {
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
    };

    // Load posts, reactions, and comments
    const loadPosts = useCallback(async (url = endpoints["posts"], refresh = false) => {
        try {
            // Fetch data from API
            const [resPosts, allReactions, allComments] = await Promise.all([
                fetchData(url),
                fetchAllReactions(),
                fetchAllComments(),
            ]);

            // If refreshing, discard current posts and use only the new ones
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

    // useFocusEffect instead of useEffect
    useFocusEffect(
        React.useCallback(() => {
            // Check if the component is focused and if we need to refresh the posts
            if (state.data.posts.length === 0 || route.params?.refresh) {
                dispatch({ type: 'SET_LOADING', payload: true });
                loadPosts(endpoints["posts"], route.params?.refresh); // Pass refresh param to loadPosts
            }

            return () => {
                // Cleanup if needed
                if (route.params?.refresh) {
                    navigation.setParams({ refresh: false }); // Reset refresh param
                }
            };
        }, [state.data.posts, route.params, loadPosts]) // Add loadPosts to dependencies
    );

    // Memoized function to get comments for a specific post
    const getCommentsForPost = useMemo(() => (postId) => {
        return state.data.comments.filter(comment => comment.post === postId);
    }, [state.data.comments]);

    // Toggle visibility of comments
    const toggleComments = useCallback((postId) => {
        dispatch({ type: 'TOGGLE_COMMENTS', payload: postId });
    }, []);

    // Handle reactions
    const handleReaction = useCallback(
        async (targetType, targetId, reactionType) => {
            try {
                const token = await AsyncStorage.getItem("token");
                if (!token) {
                    console.error("Token not found.");
                    return;
                }
    
                const authenticatedApis = authApis(token);
                const userId = JSON.parse(await AsyncStorage.getItem("user")).id; // Lấy user ID
    
                // Tìm reaction của CHÍNH NGƯỜI DÙNG HIỆN TẠI
                const existingReaction = state.data.reactions.find(
                    (r) =>
                        r.target_type === targetType &&
                        r.target_id === targetId &&
                        r.user === userId // So sánh với user ID
                );
    
                let response;
    
                if (existingReaction) {
                    if (existingReaction.reaction_type === reactionType) {
                        // Xóa reaction
                        await authenticatedApis.delete(
                            `${endpoints.reactions}${existingReaction.id}/`
                        );
    
                        // Cập nhật state.data.reactions bằng cách lọc bỏ reaction đã xóa
                        dispatch({
                            type: "SET_REACTIONS",
                            payload: state.data.reactions.filter(
                                (r) => r.id !== existingReaction.id
                            ),
                        });
    
                        response = null;
                    } else {
                        // Cập nhật reaction
                        const payload = { reaction_type: reactionType };
                        response = await authenticatedApis.patch(
                            `${endpoints.reactions}${existingReaction.id}/`,
                            payload
                        );
    
                        // Cập nhật state.data.reactions
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
                    // Tạo mới reaction
                    const payload = {
                        target_type: targetType,
                        target_id: targetId,
                        reaction_type: reactionType,
                    };
                    response = await authenticatedApis.post(
                        endpoints.reactions,
                        payload
                    );
    
                    // Cập nhật state.data.reactions
                    if (response.status === 201) {
                        dispatch({
                            type: "ADD_REACTION",
                            payload: response.data,
                        });
                    }
                }
    
                // Cập nhật reaction summary
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

    const screenWidth = Dimensions.get("window").width;

    // Function to handle loading more posts
    const handleLoadMore = () => {
        if (nextPage && !loadingMore) {
            setLoadingMore(true);
            loadPosts(nextPage);
        }
    };
    // Callback function to refresh comments after adding a new one
    const handleCommentAdded = useCallback((postId) => {
        // Re-fetch comments to update the list
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

    // Xử lý xóa bài viết
    const handleDeletePost = async (postId) => {
        try {
            const token = await AsyncStorage.getItem('token');
            if (!token) {
                Alert.alert("Thông báo", "Vui lòng đăng nhập để xóa bài viết!");
                return;
            }

            const res = await authApis(token).delete(`<span class="math-inline">\{endpoints\["posts"\]\}</span>{postId}/`);

            if (res.status === 204) {
                Alert.alert("Thông báo", "Xóa bài viết thành công!");

                // Cập nhật lại state bằng cách dispatch action để xóa bài viết khỏi danh sách
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


    // Render individual post
    const renderPost = ({ item: post }) => {
        const postComments = getCommentsForPost(post.id);

        return (
            <View key={post.id} style={HomeStyles.postContainer}>
                {/* Post Header */}
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

                {/* Post Content */}
                <RenderHtml
                    contentWidth={screenWidth}
                    source={{ html: post.content }}
                    baseStyle={HomeStyles.postContent}
                />

                {/* Post Image */}
                {post.image && (
                    <Image
                        source={{ uri: post.image.startsWith('image/upload/') ? post.image.replace('image/upload/', '') : post.image }}
                        style={HomeStyles.postImage}
                        resizeMode="cover"
                    />
                )}

                {/* Interaction Row */}
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

                {/* Comments */}
                {state.visibleComments[post.id] && (
                    <View style={HomeStyles.comments}>
                        {postComments.map((comment) => (
                            <View key={comment.id} style={HomeStyles.comment}>
                                <Avatar.Image
                                    source={{ uri: comment.user?.avatar || "https://via.placeholder.com/150" }}
                                    size={30}
                                    style={HomeStyles.commentAvatar}
                                />
                                <View style={{ flex: 1 }}>
                                    <Text style={HomeStyles.commentUsername}>
                                        {/* Hiển thị trực tiếp comment.user */}
                                        {comment.user || "Anonymous"}
                                    </Text>
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
    // Loading state
    if ((state.loading || loadingComments) && state.data.posts.length == 0) {
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

export default Home;