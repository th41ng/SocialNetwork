import React, { useEffect, useMemo, useCallback, useReducer } from "react";
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
        default:
            return state;
    }
};

const Home = ({ navigation = useNavigation() }) => {
    // useReducer hook
    const [state, dispatch] = useReducer(reducer, initialState);

    // Load posts, reactions, and comments
    const loadPosts = async () => {
        try {
            const [resPosts, resReactions, resComments] = await Promise.all([
                APIs.get(endpoints["posts"]),
                APIs.get("/reactions/"),
                APIs.get("/comments/"),
            ]);
            console.log("Posts:", resPosts.data); // Debugging
            console.log("Reactions:", resReactions.data); // Debugging
            console.log("Comments:", resComments.data); // Debugging
            dispatch({
                type: 'SET_DATA',
                payload: {
                    posts: resPosts.data,
                    reactions: resReactions.data,
                    comments: resComments.data,
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

    // Calculate reactions for post or comment
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

    // Get comments for post
    const getCommentsForPost = useMemo(() => (postId) => {
        console.log(state.data.comments);  // Debugging comments
        const uniqueComments = state.data.comments
            .filter((comment) => comment.post === postId)
            .reduce((acc, current) => {
                if (!acc.find((item) => item.id === current.id)) {
                    acc.push(current);
                }
                return acc;
            }, []);
        return uniqueComments;
    }, [state.data.comments]);

    // Toggle visibility of comments
    const toggleComments = useCallback((postId) => {
        dispatch({ type: 'TOGGLE_COMMENTS', payload: postId });
    }, []);

    const screenWidth = Dimensions.get("window").width;

    if (state.loading) {
        return (
            <View style={HomeStyles.loaderContainer}>
                <Text style={HomeStyles.loaderText}>Loading posts...</Text>
            </View>
        );
    }

    const renderPost = ({ item: post }) => {
        console.log(post);  // Debugging
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
                    <Text style={HomeStyles.reactionText}>👍 {postReactions.like}</Text>
                    <Text style={HomeStyles.reactionText}>😂 {postReactions.haha}</Text>
                    <Text style={HomeStyles.reactionText}>❤️ {postReactions.love}</Text>
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
            {/* Header */}
            <View style={HomeStyles.header}>
                <Text style={HomeStyles.appName}>SocialApp</Text>
            </View>

            {/* Posts List */}
            <FlatList
                data={state.data.posts || []}
                keyExtractor={(item) => item.id.toString()}
                renderItem={renderPost}
            />

            {/* Bottom Navigation Bar */}
            <Navbar navigation={navigation} />
        </View>
    );
};

export default Home;
