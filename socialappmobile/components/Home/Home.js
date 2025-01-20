import React, { useState, useEffect, useMemo, useCallback } from "react";
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

const Home = () => {
    const [data, setData] = useState({ posts: [], reactions: [], comments: [] });
    const [loading, setLoading] = useState(true);
    const [visibleComments, setVisibleComments] = useState({});
    const navigation = useNavigation();  

    const loadPosts = async () => {
        try {
            const [resPosts, resReactions, resComments] = await Promise.all([
                APIs.get(endpoints["posts"]),
                APIs.get("/reactions/"),
                APIs.get("/comments/"),
            ]);
            setData({
                posts: resPosts.data,
                reactions: resReactions.data,
                comments: resComments.data,
            });
        } catch (error) {
            console.error("API request failed:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadPosts();
    }, []);

    const calculateReactions = useMemo(() => (targetType, targetId) => {
        const filteredReactions = data.reactions.filter(
            (reaction) => reaction.target_type === targetType && reaction.target_id === targetId
        );
        return {
            like: filteredReactions.filter((r) => r.reaction_type === "like").length,
            haha: filteredReactions.filter((r) => r.reaction_type === "haha").length,
            love: filteredReactions.filter((r) => r.reaction_type === "love").length,
        };
    }, [data.reactions]);

    const getCommentsForPost = useMemo(() => (postId) => {
        const uniqueComments = data.comments
            .filter((comment) => comment.post === postId)
            .reduce((acc, current) => {
                if (!acc.find((item) => item.id === current.id)) {
                    acc.push(current);
                }
                return acc;
            }, []);
        return uniqueComments;
    }, [data.comments]);

    const toggleComments = useCallback((postId) => {
        setVisibleComments((prev) => ({
            ...prev,
            [postId]: !prev[postId],
        }));
    }, []);

    const screenWidth = Dimensions.get("window").width;

    if (loading) {
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

                {visibleComments[post.id] && (
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
                data={data.posts}
                keyExtractor={(item) => item.id.toString()}
                renderItem={renderPost}
            />

            {/* Bottom Navigation Bar */}
            <Navbar navigation={navigation} />
        </View>
    );
};

export default Home;
