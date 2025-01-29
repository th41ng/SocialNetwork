import { StyleSheet, Dimensions, StatusBar } from 'react-native'; 
const screenWidth = Dimensions.get("window").width;

const HomeStyles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#F9FAFB",
    },
    header: {
        justifyContent: "center",
        alignItems: "center",
        paddingTop: StatusBar.currentHeight,
        backgroundColor: "#FFF",
        elevation: 3,
    },
    appName: {
        fontSize: 20,
        fontWeight: "bold",
        color: "#1F2937",
    },
    navbar: {
        flexDirection: "row",
        justifyContent: "space-around",
        paddingVertical: 10,
        backgroundColor: "#FFF",
        borderTopWidth: 1,
        borderTopColor: "#E5E7EB",
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
        marginVertical: 10,
        marginHorizontal: 15,
        backgroundColor: "#FFF",
        borderRadius: 15,
        padding: 12,
        shadowColor: "#000",
        shadowOpacity: 0.08,
        shadowRadius: 5,
        elevation: 3,
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
        fontSize: 16,
        color: "#1F2937",
    },
    timeText: {
        fontSize: 12,
        color: "#6B7280",
    },
    postContent: {
        fontSize: 14,
        color: "#374151",
        marginTop: 8,
        lineHeight: 20,
    },
    postImage: {
        width: "100%",
        height: 200,
        borderRadius: 15,
        marginTop: 10,
    },
    interactionRow: {
        flexDirection: "row",
        justifyContent: "space-evenly",
        marginTop: 12,
        paddingVertical: 10,
        borderTopWidth: 1,
        borderTopColor: "#E5E7EB",
    },
    interactionButton: {
        flexDirection: "row",
        alignItems: "center",
    },
    reactionText: {
        marginLeft: 5,
        fontSize: 14,
        fontWeight: "500",
        color: "#4B5563",
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
        color: "#1F2937",
    },
    commentContent: {
        color: "#6B7280",
        fontSize: 14,
    },
    reactionRow: {
        flexDirection: "row",
        marginTop: 5,
    },
});

export default HomeStyles;
