import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
    ScrollView,
    Text,
    View,
    StyleSheet,
    Image,
    Dimensions,
    TouchableOpacity,
    FlatList
} from "react-native";
import { Avatar } from "react-native-paper";
import { MaterialIcons, Ionicons } from "@expo/vector-icons";
import APIs, { endpoints } from "../../configs/APIs";
import RenderHtml from "react-native-render-html";

const Home = () => {
    const [data, setData] = useState({ posts: [], reactions: [], comments: [] });
    const [loading, setLoading] = useState(true);
    const [visibleComments, setVisibleComments] = useState({});

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
            <View style={styles.loaderContainer}>
                <Text style={styles.loaderText}>Loading posts...</Text>
            </View>
        );
    }

    const renderPost = ({ item: post }) => {
        const postReactions = calculateReactions("post", post.id);
        const postComments = getCommentsForPost(post.id);

        return (
            <View key={post.id} style={styles.postContainer}>
                <View style={styles.postHeader}>
                    <Avatar.Image
                        source={{ uri: post.user.avatar || "https://via.placeholder.com/150" }}
                        size={40}
                    />
                    <View style={styles.headerDetails}>
                        <Text style={styles.username}>{post.user.username}</Text>
                        <Text style={styles.timeText}>
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
                    baseStyle={styles.postContent}
                />

                {post.image && (
                    <Image
                        source={{ uri: post.image }}
                        style={styles.postImage}
                    />
                )}

                <View style={styles.interactionRow}>
                    <Text style={styles.reactionText}>👍 {postReactions.like}</Text>
                    <Text style={styles.reactionText}>😂 {postReactions.haha}</Text>
                    <Text style={styles.reactionText}>❤️ {postReactions.love}</Text>
                    <TouchableOpacity
                        style={styles.interactionButton}
                        onPress={() => toggleComments(post.id)}
                    >
                        <Ionicons name="chatbubble-outline" size={20} color="#333" />
                        <Text style={styles.reactionText}>
                            {postComments.length}
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.interactionButton}>
                        <Ionicons name="share-outline" size={20} color="#333" />
                    </TouchableOpacity>
                </View>

                {visibleComments[post.id] && (
                    <View style={styles.comments}>
                        {postComments.map((comment) => {
                            const commentReactions = calculateReactions("comment", comment.id);

                            return (
                                <View key={comment.id} style={styles.comment}>
                                    <Avatar.Image
                                        source={{ uri: "https://via.placeholder.com/150" }}
                                        size={30}
                                        style={styles.commentAvatar}
                                    />
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.commentUsername}>
                                            {comment.user || "Anonymous"}
                                        </Text>
                                        <RenderHtml
                                            contentWidth={screenWidth}
                                            source={{ html: comment.content }}
                                            baseStyle={styles.commentContent}
                                        />
                                        <View style={styles.reactionRow}>
                                            <Text style={styles.reactionText}>
                                                👍 {commentReactions.like}
                                            </Text>
                                            <Text style={styles.reactionText}>
                                                😂 {commentReactions.haha}
                                            </Text>
                                            <Text style={styles.reactionText}>
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
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.appName}>SocialApp</Text>
            </View>

            {/* Posts List */}
            <FlatList
                data={data.posts}
                keyExtractor={(item) => item.id.toString()}
                renderItem={renderPost}
            />

            {/* Bottom Navigation Bar */}
            <View style={styles.navbar}>
                <TouchableOpacity style={styles.navItem}>
                    <Ionicons name="home-outline" size={28} color="#000" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.navItem}>
                    <Ionicons name="search-outline" size={28} color="#000" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.navItemCenter}>
                    <View style={styles.addButton}>
                        <Ionicons name="add" size={32} color="#FFF" />
                    </View>
                </TouchableOpacity>
                <TouchableOpacity style={styles.navItem}>
                    <Ionicons name="notifications-outline" size={28} color="#000" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.navItem}>
                    <Ionicons name="person-outline" size={28} color="#000" />
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#FAFAFA",
    },
    header: {
        justifyContent: "center", 
        alignItems: "center", 
        padding: 15,
        backgroundColor: "#FFF",
        elevation: 3,
    },
    appName: {
        fontSize: 20,
        fontWeight: "bold",
        color: "#333",
    },
    navbar: {
        flexDirection: "row",
        justifyContent: "space-around",
        paddingVertical: 10,
        backgroundColor: "#FFF",
        borderTopWidth: 1,
        borderTopColor: "#DDD",
    },
    navItem: {
        alignItems: "center",
    },
    navItemCenter: {
        alignItems: "center",
        marginTop: -25,
    },
    addButton: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: "#007AFF",
        justifyContent: "center",
        alignItems: "center",
        shadowColor: "#000",
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 5,
    },
    postContainer: {
        margin: 10,
        backgroundColor: "#FFF",
        borderRadius: 10,
        padding: 10,
        shadowColor: "#000",
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    postHeader: {
        flexDirection: "row",
        alignItems: "center",
    },
    headerDetails: {
        flex: 1,
        marginLeft: 10,
    },
    username: {
        fontWeight: "bold",
        fontSize: 14,
    },
    timeText: {
        fontSize: 12,
        color: "#777",
    },
    postContent: {
        fontSize: 14,
        color: "#333",
    },
    postImage: {
        width: "100%",
        height: 200,
        borderRadius: 10,
        marginTop: 10,
    },
    interactionRow: {
        flexDirection: "row",
        justifyContent: "space-evenly",
        marginTop: 10,
    },
    interactionButton: {
        flexDirection: "row",
        alignItems: "center",
    },
    reactionText: {
        marginLeft: 5,
        fontSize: 14,
    },
    comments: {
        marginTop: 15,
        paddingLeft: 15,
    },
    comment: {
        flexDirection: "row",
        alignItems: "flex-start",
        marginBottom: 12,
    },
    commentAvatar: {
        marginRight: 10,
    },
    commentUsername: {
        fontWeight: "bold",
        fontSize: 14,
        color: "#333",
    },
    commentContent: {
        color: "#555",
        fontSize: 14,
    },
    reactionRow: {
        flexDirection: "row",
        marginTop: 5,
    },
});

export default Home;
