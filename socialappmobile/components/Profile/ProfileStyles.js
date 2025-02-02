
import { StyleSheet } from "react-native";

const ProfileStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  coverImage: {
    width: "100%",
    height: 200,
    resizeMode: "cover",
  },
  avatarContainer: {
    alignItems: "center",
    marginTop: -60,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 5,
    borderColor: "#fff",
  },
  profileInfo: {
    alignItems: "center",
    marginTop: 10,
  },
  username: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#333",
  },
  infoText: {
    fontSize: 14,
    color: "#666",
    marginTop: 5,
  },
  messageButtonContainer: {
    alignItems: "center",
    marginTop: 20,
  },
  messageButton: {
    backgroundColor: "#000000",
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
  },
  messageButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  postHeaderContainer: {
    marginVertical: 15,
    marginLeft: 20,
  },
  postHeaderText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  postCard: {
    margin: 10,
    backgroundColor: "#fff",
    borderRadius: 10,
    elevation: 3,
  },
  postText: {
    fontSize: 14,
    color: "#333",
    marginVertical: 10,
  },
  postImage: {
    width: "100%",
    height: 200,
    resizeMode: "cover",
    borderRadius: 8,
  },
  noPostsText: {
    fontSize: 16,
    textAlign: "center",
    color: "#888",
    marginTop: 20,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    fontSize: 16,
    color: "#f44336",
  },

  postAuthorInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  miniAvt: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  postAuthorName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#555",
  },
  postTime: {
    fontSize: 12,
    color: "#888",
  },

  //Setting _ UserProfile
  settingsIcon: {
    position: "absolute",
    top: 10,
    right: 10,
    zIndex: 10,
  },
  drawerSection: {
    right:0,
    backgroundColor: "#fff",
    marginTop: 55,
    position: "absolute",
    width: 250,
  },
  drawerItem: {
    fontSize: 16,
    color: "#333",
  },
//Ket Thuc


formContainer: {
  width: "90%",
  marginTop: 20,
},
inputGroup: {
  marginBottom: 10,
},
inputLabel: {
  fontSize: 14,
  fontWeight: "bold",
  marginBottom: 5,
  color: "#555",
},
input: {
  backgroundColor: "#fff",
  borderWidth: 1,
  borderColor: "#ddd",
  padding: 10,
  borderRadius: 10,
},
saveButton: {
  marginTop: 20,
  backgroundColor: "#000000",
  borderRadius: 10,
  paddingVertical: 8,
},
changeCoverText: {
  fontSize: 12,
  fontWeight: "bold",
  color: "#555",
},
changeCoverButton: {
  position: "absolute",
  bottom: 10,
  right: 10,
  backgroundColor: "#ffffffcc",
  padding: 8,
  borderRadius: 10,
},
changAVtIcon: {
  color: "#fff",
  fontSize: 18,
  fontWeight: "bold",
},
avatarWrapper: {
  position: "absolute",
  bottom: 0,
  right: 0,
  backgroundColor: "#000000",
  width: 30,
  height: 30,
  borderRadius: 15,
  justifyContent: "center",
  alignItems: "center",
},

});

export default ProfileStyles;
