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

// Reducer function
const reducer = (state, action) => {
    switch (action.type) {
        case 'SET_DATA':
            return { ...state, data: action.payload, loading: false };
        case 'SET_LOADING':
            return { ...state, loading: action.payload };
        case 'TOGGLE_COMMENTS':
            return {
                ...state,
                visibleComments: {
                    ...state.visibleComments,
                    [action.payload]: !state.visibleComments[action.payload],
                },
            };
        case 'ADD_REACTION':
            return {
                ...state,
                data: {
                    ...state.data,
                    reactions: [...state.data.reactions, action.payload],
                }
            };
        default:
            return state;
    }
};

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

    // Tính toán reactions cho bài viết hoặc bình luận
    const calculateReactions = useMemo(() => (targetType, targetId) => {
        const filteredReactions = state.data.reactions.filter(
            (reaction) => reaction.target_type === targetType && reaction.target_id === targetId
        );
        return {
            like: filteredReactions.filter((r) => r.reaction_type === "like").length,
            haha: filteredReactions.filter((r) => r.reaction_type === "haha").length,
            love: filteredReactions.filter((r) => r.reaction_type === "love").length,
        };
    }, [state.data.reactions]);

    const getCommentsForPost = useMemo(() => (postId) => {
        return state.data.comments.filter(comment => comment.post === postId);
    }, [state.data.comments]);

    // Toggle visibility of comments
    const toggleComments = useCallback((postId) => {
        dispatch({ type: 'TOGGLE_COMMENTS', payload: postId });
    }, []);

    

    const handleReaction = async (targetType, targetId, reactionType) => {
        try {
            // Retrieve user ID from AsyncStorage
            const storedUser = await AsyncStorage.getItem('user');
            if (!storedUser) {
                console.error("User information not found.");
                return;
            }
            const user = JSON.parse(storedUser);
            const userId = user.id;
    
            // Retrieve token from AsyncStorage
            const token = await AsyncStorage.getItem('token');
            if (!token) {
                console.error("Token not found.");
                return;
            }
    
            // Prepare payload with the user ID in the correct structure
            const payload = {
                target_type: targetType,
                target_id: targetId,
                reaction_type: reactionType,
                user: { id: userId }, // Ensure user is an object with the ID
            };
    
            console.log("Payload sent:", payload);
    
            const headers = {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            };
    
            // Make the API request
            const response = await APIs.post(endpoints.reactions, payload, { headers });
    
            // Check response status
            if (response.status === 200 || response.status === 201) {
                const summaryResponse = await APIs.get(
                    `${targetType === "post" ? endpoints.posts : endpoints.comments}${targetId}/reactions-summary/`,
                    { headers }
                );
    
                if (summaryResponse.status === 200) {
                    dispatch({
                        type: "UPDATE_REACTION_COUNT",
                        payload: {
                            postId: targetId,
                            reactionType: reactionType,
                            count: summaryResponse.data.reaction_summary[reactionType] || 0,
                        },
                    });
                } else {
                    console.error("Error fetching reaction summary:", summaryResponse);
                }
            } else {
                console.error("Error adding reaction:", response);
                // Optional: Retry logic or alert to the user
            }
        } catch (error) {
            console.error("Error in handleReaction:", error.response || error.message);
            // Optional: Additional error handling (e.g., user notification)
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
        const postReactions = calculateReactions("post", post.id);
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
                        <Text style={HomeStyles.reactionText}>👍 {postReactions.like}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleReaction("post", post.id, "haha")}>
                        <Text style={HomeStyles.reactionText}>😂 {postReactions.haha}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleReaction("post", post.id, "love")}>
                        <Text style={HomeStyles.reactionText}>❤️ {postReactions.love}</Text>
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
                            const commentReactions = calculateReactions("comment", comment.id);

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
                                            <Text style={HomeStyles.reactionText}>
                                                👍 {commentReactions.like}
                                            </Text>
                                            <Text style={HomeStyles.reactionText}>
                                                😂 {commentReactions.haha}
                                            </Text>
                                            <Text style={HomeStyles.reactionText}>
                                                ❤️ {commentReactions.love}
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
