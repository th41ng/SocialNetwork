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
import APIs, { endpoints, authApis } from "../../configs/APIs"; // Thay đổi import
import RenderHtml from "react-native-render-html";
import HomeStyles from "./HomeStyles";
import { useNavigation } from "@react-navigation/native";
import Navbar from "../Home/Navbar";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from '@react-native-async-storage/async-storage';


// Import reducer và initialState từ reducer.js
import reducer, { initialState } from './reducer'; // Import cả initialState
const Home = ({ navigation = useNavigation() }) => {
    const [state, dispatch] = useReducer(reducer, initialState);
    const [nextPage, setNextPage] = useState(null);

    // Load posts, reactions, and comments
    const loadPosts = async (url = endpoints["posts"]) => {
        try {
            const token = await AsyncStorage.getItem('token');
            const [resPosts, resReactions, resComments] = await Promise.all([
                authApis(token).get(url),
                authApis(token).get("/reactions/"),
                authApis(token).get("/comments/"),
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

    const getCommentsForPost = useMemo(() => (postId) => {
        return state.data.comments.filter(comment => comment.post === postId);
    }, [state.data.comments]);

    // Toggle visibility of comments
    const toggleComments = useCallback((postId) => {
        dispatch({ type: 'TOGGLE_COMMENTS', payload: postId });
    }, []);

    const handleReaction = async (targetType, targetId, reactionType) => {
        try {
            // Lấy user và token từ AsyncStorage
            const storedUser = await AsyncStorage.getItem('user');
            const token = await AsyncStorage.getItem('token');
    
            if (!storedUser || !token) {
                console.error("User hoặc token không tìm thấy.");
                return;
            }
    
            const user = JSON.parse(storedUser);
    
            // Kiểm tra đầu vào
            if (!user.id || !targetType || !targetId || !reactionType) {
                console.error("Dữ liệu đầu vào không hợp lệ:", {
                    userId: user.id,
                    targetType,
                    targetId,
                    reactionType,
                });
                return;
            }
    
            console.log("Thông tin đầu vào:", {
                userId: user.id,
                targetType,
                targetId,
                reactionType,
            });
    
            const authenticatedApis = authApis(token);
    
            // Kiểm tra xem đã có reaction chưa
            const existingReaction = state.data.reactions?.find(
                r => r.user?.id === user.id && r.target_type === targetType && r.target_id === targetId
            );
    
            let response;
    
            if (existingReaction) {
                if (existingReaction.reaction_type === reactionType) {
                    // Nếu reaction giống nhau, xóa reaction
                    response = await authenticatedApis.delete(`${endpoints.reactions}${existingReaction.id}/`);
                } else {
                    // Nếu khác nhau, cập nhật reaction
                    response = await authenticatedApis.patch(`${endpoints.reactions}${existingReaction.id}/`, {
                        reaction_type: reactionType,
                    });
                }
            } else {
                // Nếu chưa có reaction, tạo mới
                const payload = {
                    target_type: targetType,
                    target_id: targetId,
                    reaction_type: reactionType,
                    user: { id: user.id },
                };
                console.log("Payload tạo mới reaction:", payload);
                response = await authenticatedApis.post(endpoints.reactions, payload);
            }
    
            // Nếu thao tác thành công, lấy lại danh sách reactions và cập nhật state
            if (response.status === 200 || response.status === 201 || response.status === 204) {
                console.log("Reaction xử lý thành công, lấy dữ liệu tóm tắt reactions...");
                const summaryResponse = await authenticatedApis.get(
                    `${targetType === "post" ? endpoints.posts : endpoints.comments}${targetId}/reactions-summary/`
                );
    
                if (summaryResponse.status === 200) {
                    dispatch({
                        type: 'UPDATE_POST_REACTIONS',
                        payload: {
                            targetType,
                            [targetType === "post" ? "postId" : "commentId"]: targetId,
                            reactionsSummary: summaryResponse.data.reaction_summary,
                        },
                    });
    
                    // Cập nhật lại danh sách reactions
                    const resReactions = await authenticatedApis.get("/reactions/");
                    dispatch({
                        type: 'SET_REACTIONS',
                        payload: resReactions.data.results,
                    });
                } else {
                    console.error("Lỗi khi lấy tóm tắt reactions:", summaryResponse);
                }
            } else {
                console.error("Lỗi trong thao tác reaction:", response);
            }
        } catch (error) {
            console.error("Lỗi trong handleReaction:", error.response || error.message);
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