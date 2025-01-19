import { StyleSheet } from "react-native";

const ProfileStyles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#f5f5f5",
    },
    coverImage: {
        width: "100%",
        height: 200,
    },
    changeCoverButton: {
        position: "absolute",
        bottom: 10,
        right: 10,
        backgroundColor: "#00000088",
        padding: 8,
        borderRadius: 5,
    },
    changeCoverText: {
        color: "#fff",
        fontSize: 12,
    },
    profileInfo: {
        alignItems: "center",
        padding: 20,
    },
    avatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
        borderWidth: 2,
        borderColor: "#ddd",
    },
    username: {
        fontSize: 20,
        fontWeight: "bold",
        marginTop: 10,
    },
    infoText: {
        fontSize: 16,
        color: "#555",
        marginVertical: 5,
    },
    editButton: {
        marginTop: 15,
    },
    logoutButton: {
        margin: 20,
        backgroundColor: "#d9534f",
    },
});

export default ProfileStyles;
