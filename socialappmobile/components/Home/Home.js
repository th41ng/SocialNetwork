import React, { useEffect, useMemo, useCallback, useReducer, useState } from "react";
import {
    Text,
    View,
    Dimensions,
    TouchableOpacity,
    FlatList,
    Image
} from "react-native";
import { Avatar } from "react-native-paper";
import { MaterialIcons } from "@expo/vector-icons";
import APIs, { endpoints, authApis } from "../../configs/APIs";
import RenderHtml from "react-native-render-html";
import HomeStyles from "./HomeStyles";
import { useNavigation } from "@react-navigation/native";
import Navbar from "../Home/Navbar";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import reducer và initialState từ reducer.js
import reducer, { initialState, RESET_REACTIONS, SET_COMMENTS } from './reducer';

const Home = ({ navigation = useNavigation() }) => {
    const [state, dispatch] = useReducer(reducer, initialState);
    const [nextPage, setNextPage] = useState(null);
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    // Load posts (chỉ load posts)
    const loadPosts = async (url = endpoints["posts"]) => {
        try {
            const token = await AsyncStorage.getItem('token');
            const resPosts = await authApis(token).get(url);

            // Loại bỏ bài viết trùng lặp
            const allPosts = [
                ...new Map(
                    [...state.data.posts, ...resPosts.data.results].map((post) => [post.id, post])
                ).values(),
            ];

            setNextPage(resPosts.data.next);

            dispatch({
                type: 'SET_DATA',
                payload: {
                    ...state.data,
                    posts: allPosts,
                },
            });
        } catch (error) {
            console.error("API request failed:", error);
        } finally {
            dispatch({ type: 'SET_LOADING', payload: false });
        }
    };

    const loadReactions = async () => {
        try {
            const token = await AsyncStorage.getItem('token');
            let url = "/reactions/";
            let allReactions = [];
            let shouldLoadMore = true;

            while (url && shouldLoadMore) {
                const resReactions = await authApis(token).get(url);
                allReactions = allReactions.concat(resReactions.data.results);

                // Kiểm tra xem trang tiếp theo có phải là null không
                if (resReactions.data.next) {
                    url = resReactions.data.next;
                    // Thay thế domain hiện tại bằng domain của bạn
                    url = url.replace("https://danhdanghoang.pythonanywhere.com", "");
                } else {
                    shouldLoadMore = false;
                    url = null;
                }
            }

            dispatch({
                type: 'SET_REACTIONS',
                payload: allReactions
            });
        } catch (error) {
            console.error("Error loading reactions:", error);
            if (error.response && error.response.status === 401) {
                console.error("Unauthorized: Token may have expired.");
                dispatch({ type: RESET_REACTIONS });
                await AsyncStorage.removeItem('token');
                await AsyncStorage.removeItem('user');
                setIsLoggedIn(false);
                navigation.navigate('Login');
            }
        }
    };

    // Load comments (tách riêng loadComments)
    const loadComments = async () => {
        try {
            const token = await AsyncStorage.getItem('token');
            const resComments = await authApis(token).get("/comments/");
            dispatch({
                type: SET_COMMENTS, // Sửa type action thành SET_COMMENTS
                payload: resComments.data.results
            });
        } catch (error) {
            console.error("Error loading comments:", error);
        }
    };

    // Kiểm tra trạng thái đăng nhập khi mount và khi isLoggedIn thay đổi
    useEffect(() => {
        const checkLoginStatus = async () => {
            const token = await AsyncStorage.getItem('token');
            setIsLoggedIn(!!token);
        };

        checkLoginStatus();
    }, []);

    // Load lại reactions và comments khi isLoggedIn thay đổi
    useEffect(() => {
        if (isLoggedIn) {
            loadReactions();
            loadComments();
        }
    }, [isLoggedIn]);

    // Load post khi khởi tạo
    useEffect(() => {
        loadPosts();
    }, []);

    const getCommentsForPost = useMemo(() => (postId) => {
        return state.data.comments.filter(comment => comment.post === postId);
    }, [state.data.comments]);

    // Toggle visibility of comments
    const toggleComments = useCallback((postId) => {
        dispatch({ type: 'TOGGLE_COMMENTS', payload: postId });
    }, []);

    // Handle reaction (giữ nguyên, có thể tối ưu thêm)
    const handleReaction = async (targetType, targetId, reactionType) => {
        try {
            // Retrieve user ID and token from AsyncStorage
            const storedUser = await AsyncStorage.getItem('user');
            const token = await AsyncStorage.getItem('token');
            if (!storedUser || !token) {
                console.error("User information or token not found.");
                return;
            }
            const user = JSON.parse(storedUser);
            const userId = user.id;

            // Sử dụng authApis(token) để gửi request có authentication
            const authenticatedApis = authApis(token);

            // Kiểm tra xem user đã reaction chưa
            const existingReaction = state.data.reactions.find(
                r => r.user.id === userId && r.target_type === targetType && r.target_id === targetId
            );

            let response;
            let reactionChanged = false; // Biến kiểm tra reaction có thay đổi hay không

            if (existingReaction) {
                if (existingReaction.reaction_type === reactionType) {
                    // Xóa reaction (DELETE)
                    if (existingReaction.id) {
                        response = await authenticatedApis.delete(`${endpoints.reactions}${existingReaction.id}/`);
                        reactionChanged = true;
                    } else {
                        console.error("Error: existingReaction.id is undefined");
                    }
                } else {
                    // Cập nhật reaction (PATCH)
                    const payload = {
                        reaction_type: reactionType,
                    };
                    response = await authenticatedApis.patch(`${endpoints.reactions}${existingReaction.id}/`, payload);
                    reactionChanged = true;
                }
            } else {
                // Tạo reaction mới (POST)
                const payload = {
                    target_type: targetType,
                    target_id: targetId,
                    reaction_type: reactionType,
                    user: { id: userId },
                };
                response = await authenticatedApis.post(endpoints.reactions, payload);
                reactionChanged = true;
            }

            // Xử lý response và cập nhật state
            if (response.status === 200 || response.status === 201 || response.status === 204) {
                // Lấy thông tin summary của reactions
                const summaryResponse = await authenticatedApis.get(
                    `${targetType === "post" ? endpoints.posts : endpoints.comments}${targetId}/reactions-summary/`
                );

                if (summaryResponse.status === 200) {
                    // Cập nhật state cho số lượng reactions của post/comment
                    dispatch({
                        type: 'UPDATE_POST_REACTIONS',
                        payload: {
                            targetType: targetType,
                            [targetType === "post" ? "postId" : "commentId"]: targetId,
                            reactionsSummary: summaryResponse.data.reaction_summary,
                        }
                    });

                    // Chỉ cập nhật reactions nếu có thay đổi
                    if (reactionChanged) {
                        loadReactions();
                    }
                } else {
                    console.error("Error fetching reaction summary:", summaryResponse);
                }
            } else {
                console.error("Error handling reaction:", response);
            }
        } catch (error) {
            console.error("Error in handleReaction:", error.response || error.message);
        }
    };

    const screenWidth = Dimensions.get("window").width;

    if (state.loading) {
        return (
            <View style={HomeStyles.loaderContainer}>
                <Text style={HomeStyles.loaderText}>Loading posts...</Text>
            </View>
        );
    }

    const renderPost = ({ item: post }) => {
        const postComments = getCommentsForPost(post.id);

        return (
            <View key={post.id} style={HomeStyles.postContainer}>
                {/* Header của bài viết */}
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
                    <TouchableOpacity>
                        <MaterialIcons name="more-vert" size={24} color="#666" />
                    </TouchableOpacity>
                </View>

                {/* Nội dung bài viết */}
                <RenderHtml
                    contentWidth={screenWidth}
                    source={{ html: post.content }}
                    baseStyle={HomeStyles.postContent}
                />

                {/* Hình ảnh của bài viết (nếu có) */}
                {post.image && (
                    <Image
                        source={{ uri: post.image }}
                        style={HomeStyles.postImage}
                    />
                )}

                {/*  */}
                <View style={HomeStyles.interactionRow}>
                    {/* Các nút tương tác */}
                    <TouchableOpacity onPress={() => handleReaction("post", post.id, "like")}>
                        <Text style={HomeStyles.reactionText}>👍 {post.reaction_summary?.like || 0}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleReaction("post", post.id, "haha")}>
                        <Text style={HomeStyles.reactionText}>😂 {post.reaction_summary?.haha || 0}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleReaction("post", post.id, "love")}>
                        <Text style={HomeStyles.reactionText}>❤️ {post.reaction_summary?.love || 0}</Text>
                    </TouchableOpacity>
                    {/* Nút toggle comments */}
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

                {/* Hiển thị comments nếu visibleComments của post đó là true */}
                {state.visibleComments[post.id] && (
                    <View style={HomeStyles.comments}>
                        {postComments.map((comment) => {
                            return (
                                <View key={comment.id} style={HomeStyles.comment}>
                                    {/* Avatar của người comment */}
                                    <Avatar.Image
                                        source={{ uri: comment.user?.avatar || "https://via.placeholder.com/150" }}
                                        size={30}
                                        style={HomeStyles.commentAvatar}
                                    />
                                    {/* Nội dung comment */}
                                    <View style={{ flex: 1 }}>
                                        <Text style={HomeStyles.commentUsername}>
                                            {comment.user || "Anonymous"}
                                        </Text>
                                        <RenderHtml
                                            contentWidth={screenWidth}
                                            source={{ html: comment.content }}
                                            baseStyle={HomeStyles.commentContent}
                                        />
                                        {/* Các nút tương tác cho comment */}
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
                            );
                        })}
                    </View>
                )}
            </View>
        );
    };

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
                onEndReached={() => {
                    if (nextPage) {
                        loadPosts(nextPage);
                    }
                }}
                onEndReachedThreshold={0.5}
            />

            <Navbar navigation={navigation} />
        </View>
    );
};

export default Home;
