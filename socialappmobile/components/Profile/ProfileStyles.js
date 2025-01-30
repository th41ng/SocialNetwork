import { StyleSheet } from 'react-native';

const ProfileStyles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#f9f9f9",
  },
  settingsIcon: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 10,
  },
  coverImageContainer: {
    position: 'relative',
    marginBottom: 20,
    borderRadius: 10,
    overflow: 'hidden',
  },
  coverImage: {
    width: '100%',
    height: 240,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
  avatarContainer: {
    alignItems: 'center',
    marginTop: -40,
  },
  avatarChange: {
    borderWidth: 5,
    borderColor: '#fff',
    borderRadius: 60,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 4,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  profileInfo: {
    alignItems: 'center',
    marginTop: 20,
    paddingHorizontal: 16,
  },
  username: {
    fontSize: 22,
    fontWeight: 'bold',
    marginVertical: 10,
    color: '#333',
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    marginVertical: 4,
  },


  drawerWrapper: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 250,
    height: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 100,
    flexDirection: 'column',
    paddingTop: 60,
  },
  drawerContent: {
    backgroundColor: '#fff',
    flex: 1,
    paddingTop: 16,
    paddingHorizontal: 16,
    borderTopLeftRadius: 15,
    borderBottomLeftRadius: 15,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  drawerSection: {
    position: "absolute",
    top: 70,  // Điều chỉnh lại vị trí nếu cần thiết
    right: 0,  // Đảm bảo Drawer mở ra từ bên phải
    width: 250,  // Thay đổi chiều rộng để làm cho Drawer rộng hơn
    backgroundColor: "white",  // Màu nền trắng cho Drawer
    padding: 20,  // Thêm padding để các mục trong Drawer không bị sát vào nhau
    borderRadius: 10,  // Bo góc để Drawer đẹp hơn
    shadowColor: "#000",  // Thêm bóng cho Drawer
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
    zIndex: 100,  // Đảm bảo Drawer nằm trên các phần tử khác
    height: "100%",  // Đảm bảo Drawer chiếm hết chiều cao màn hình
  },
  drawerItem: {
    color: "#333",  // Màu chữ tối để dễ đọc
    fontSize: 16,  // Kích thước chữ hợp lý
    fontWeight: "bold",  // Tạo sự nổi bật cho chữ
  },


  button: {
    backgroundColor: '#0066cc',
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 20,
    width: '100%',
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },

  formContainer: {
    marginTop: 10,
    width: "100%",
  },
  inputGroup: {
    marginBottom: 10,
    width: "100%",
  },
  inputLabel: {
    fontSize: 14,
    color: '#333',
    marginBottom: 8,
  },
  input: {
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    fontSize: 14,
    backgroundColor: '#fff',
    width: "100%",
  },
  saveButton: {
    marginTop: 20,
    backgroundColor: '#0066cc',
    paddingVertical: 10,
    borderRadius: 25,
    width: '100%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 5,
    transform: [{ scale: 1.05 }],  // Hiệu ứng khi nhấn
    marginBottom: 20,
  },

  changeCoverButton: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  changeCoverText: {
    color: '#fff',
    fontSize: 14,
  },

  postAuthorInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  postsContainer: { marginHorizontal: 10, marginTop: 20 },
  postCard: { marginBottom: 10 },
  postText: { fontSize: 16 },
  postImage: { width: "90%", height: 200, marginTop: 10 },
  noPostsText: { fontSize: 16, color: "#888", textAlign: "center" },
  postAuthorName: {
    fontSize: 16,
    fontWeight: "bold",
  },
  postTime: {
    fontSize: 10,
    fontStyle: "italic",
    alignItems: "flex-start",
  },
  miniAvt: {
    width: 35,
    height: 35,
    borderRadius: 60,
    marginEnd: 10,
  }

});


export default ProfileStyles;
