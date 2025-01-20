import { StyleSheet, Dimensions } from 'react-native';

const screenWidth = Dimensions.get("window").width;

const HomeStyles = StyleSheet.create({
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

export default HomeStyles;
