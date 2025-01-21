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
import APIs, { endpoints } from "../../configs/APIs";
import RenderHtml from "react-native-render-html";
import HomeStyles from "./HomeStyles";
import { useNavigation } from "@react-navigation/native";
import Navbar from "../Home/Navbar";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from '@react-native-async-storage/async-storage';

// Initial state
const initialState = {
    data: { posts: [], reactions: [], comments: [] },
    loading: true,
    visibleComments: {},
};

// Reducer function (reducer.js) - Đã chuyển nội dung reducer sang file reducer.js
import reducer from './reducer'; // Giả sử bạn đã tạo file reducer.js

const Home = ({ navigation = useNavigation() }) => {
    const [state, dispatch] = useReducer(reducer, initialState);
    const [nextPage, setNextPage] = useState(null);

    // Load posts, reactions, and comments
    const loadPosts = async (url = endpoints["posts"]) => {
        try {
            const [resPosts, resReactions, resComments] = await Promise.all([
                APIs.get(url),
                APIs.get("/reactions/"),
                APIs.get("/comments/"),
            ]);

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
                    posts: allPosts,
                    reactions: resReactions.data.results,
                    comments: resComments.data.results,
                },
            });
        } catch (error) {
            console.error("API request failed:", error);
        } finally {
            dispatch({ type: 'SET_LOADING', payload: false });
        }
    };

    useEffect(() => {
        loadPosts();
    }, []);

    // Tính toán reactions cho bài viết hoặc bình luận (không còn cần dùng nữa)
    // const calculateReactions = useMemo(() => (targetType, targetId) => {
    //     const filteredReactions = state.data.reactions.filter(
    //         (reaction) => reaction.target_type === targetType && reaction.target_id === targetId
    //     );
    //     return {
    //         like: filteredReactions.filter((r) => r.reaction_type === "like").length,
    //         haha: filteredReactions.filter((r) => r.reaction_type === "haha").length,
    //         love: filteredReactions.filter((r) => r.reaction_type === "love").length,
    //     };
    // }, [state.data.reactions]);

    const getCommentsForPost = useMemo(() => (postId) => {
        return state.data.comments.filter(comment => comment.post === postId);
    }, [state.data.comments]);

    // Toggle visibility of comments
    const toggleComments = useCallback((postId) => {
        dispatch({ type: 'TOGGLE_COMMENTS', payload: postId });
    }, []);

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

            const headers = {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            };

            // Kiểm tra xem user đã reaction chưa
            const existingReaction = state.data.reactions.find(
                r => r.user.id === userId && r.target_type === targetType && r.target_id === targetId
            );

            let response;
            if (existingReaction) {
                if (existingReaction.reaction_type === reactionType) {
                    // Xóa reaction (DELETE)
                    response = await APIs.delete(`${endpoints.reactions}${existingReaction.id}/`, { headers });
                } else {
                    // Cập nhật reaction (PATCH)
                    const payload = {
                        reaction_type: reactionType,
                    };
                    response = await APIs.patch(`${endpoints.reactions}${existingReaction.id}/`, payload, { headers });
                }
            } else {
                // Tạo reaction mới (POST)
                const payload = {
                    target_type: targetType,
                    target_id: targetId,
                    reaction_type: reactionType,
                    user: { id: userId },
                };
                console.log("Payload sent:", payload);
                response = await APIs.post(endpoints.reactions, payload, { headers });
            }

            // Xử lý response và cập nhật state
            if (response.status === 200 || response.status === 201 || response.status === 204) {
                // Lấy thông tin summary của reactions
                const summaryResponse = await APIs.get(
                    `${targetType === "post" ? endpoints.posts : endpoints.comments}${targetId}/reactions-summary/`,
                    { headers }
                );

                if (summaryResponse.status === 200) {
                    // Cập nhật state cho số lượng reactions của post/comment
                    dispatch({
                        type: 'UPDATE_POST_REACTIONS',
                        payload: {
                            postId: targetId,
                            reactionsSummary: summaryResponse.data.reaction_summary,
                            targetType: targetType
                        }
                    });

                    // Cập nhật lại danh sách reactions trong state để lần gọi tiếp theo có dữ liệu đúng
                    const resReactions = await APIs.get("/reactions/");
                    dispatch({
                        type: 'SET_REACTIONS',
                        payload: resReactions.data.results,
                    });
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
        // const postReactions = calculateReactions("post", post.id); // Không cần dùng nữa
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
                    <TouchableOpacity>
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
                        source={{ uri: post.image }}
                        style={HomeStyles.postImage}
                    />
                )}

                <View style={HomeStyles.interactionRow}>
                    <TouchableOpacity onPress={() => handleReaction("post", post.id, "like")}>
                        {/* Hiển thị reaction_summary từ post */}
                        <Text style={HomeStyles.reactionText}>👍 {post.reaction_summary?.like || 0}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleReaction("post", post.id, "haha")}>
                        {/* Hiển thị reaction_summary từ post */}
                        <Text style={HomeStyles.reactionText}>😂 {post.reaction_summary?.haha || 0}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleReaction("post", post.id, "love")}>
                        {/* Hiển thị reaction_summary từ post */}
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
                        {postComments.map((comment) => {
                            // const commentReactions = calculateReactions("comment", comment.id); // Không cần dùng nữa

                            return (
                                <View key={comment.id} style={HomeStyles.comment}>
                                    <Avatar.Image
                                        source={{ uri: "https://via.placeholder.com/150" }}
                                        size={30}
                                        style={HomeStyles.commentAvatar}
                                    />
                                    <View style={{ flex: 1 }}>
                                        <Text style={HomeStyles.commentUsername}>
                                            {comment.user || "Anonymous"}
                                        </Text>
                                        <RenderHtml
                                            contentWidth={screenWidth}
                                            source={{ html: comment.content }}
                                            baseStyle={HomeStyles.commentContent}
                                        />
                                        <View style={HomeStyles.reactionRow}>
                                            {/* Hiển thị reaction_summary từ comment */}
                                            <Text style={HomeStyles.reactionText}>
                                                👍 {comment.reaction_summary?.like || 0}
                                            </Text>
                                            <Text style={HomeStyles.reactionText}>
                                                😂 {comment.reaction_summary?.haha || 0}
                                            </Text>
                                            <Text style={HomeStyles.reactionText}>
                                                ❤️ {comment.reaction_summary?.love || 0}
                                            </Text>
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