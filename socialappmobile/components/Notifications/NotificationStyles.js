import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#f7f7f7", // Đổi màu nền nhẹ nhàng
    
  },
  safeArea: {
    flex: 1,
  },
  card:{
    marginBottom:10,
  },
  header: {
    flexDirection: "row", // Để icon và tiêu đề xếp ngang nhau
    alignItems: "center", // Căn chỉnh icon và tiêu đề
    marginBottom: 7, // Khoảng cách giữa tiêu đề và phần nội dung
  },

  icon: {
    marginRight: 12, // Khoảng cách giữa icon và tiêu đề
    color: "#000000",
    padding: 8, // Padding xung quanh icon
    borderRadius: 8, // Bo góc cho icon
  },

  eventTitle: {
    fontSize: 18,
    fontWeight: "bold",
    flex: 1,
    color: "#000000", // Màu tiêu đề sự kiện
    marginBottom: 6, // Khoảng cách giữa tiêu đề và đường gạch dưới
    borderBottomWidth: 2, // Thêm độ dày của đường gạch
    borderBottomColor: "#000000", // Màu gạch dưới
    paddingBottom: 4, // Padding dưới tiêu đề để không bị chồng lên gạch
  },

  eventContent: {
    fontSize: 16,
    color: "#333", // Màu chữ cho nội dung sự kiện
    marginBottom: 12, // Khoảng cách giữa nội dung và phần tiếp theo
  },

  note: {
    fontSize: 12,
    color: "#888", // Màu nhạt cho ghi chú
    marginBottom: 8, // Khoảng cách giữa ghi chú và thời gian
  },

  timeText: {
    fontSize: 12,
    color: "#888", // Màu thời gian
    position: "absolute",
    right: 10,
    bottom: 10,
    fontStyle: "italic", // Làm cho thời gian trông thanh lịch hơn
  },

  noEventsText: {
    fontSize: 16,
    color: "#888",
    textAlign: "center",
    marginTop: 20, // Tạo khoảng cách cho thông báo không có sự kiện
  },

  flatListContent: {
    paddingBottom: 100, // Đảm bảo không bị che khuất bởi Navbar
  },
});
