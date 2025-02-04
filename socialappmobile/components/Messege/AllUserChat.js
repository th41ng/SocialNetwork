import React, { useEffect, useState } from "react";
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator } from "react-native";
import { Avatar, IconButton } from "react-native-paper";
import { useNavigation } from "@react-navigation/native";
import ChatStyle from "./ChatStyle";
import APIs, { endpoints } from "../../configs/APIs";

const formatImageUrl = (url) => {
  const prefix = "image/upload/";
  return url?.includes(prefix) ? url.replace(prefix, "") : url;
};

const AllUserChat = () => {
  const [users, setUsers] = useState([]); // Danh sách user
  const [loading, setLoading] = useState(true); // Loading lần đầu
  const [loadingMore, setLoadingMore] = useState(false); // Loading khi tải thêm
  const [nextPage, setNextPage] = useState(endpoints["allUser"]); // Trang hiện tại

  const navigation = useNavigation();

  // Hàm tải user (dùng để gọi cả lần đầu tiên và khi load thêm)
  const fetchUsers = async (loadMore = false) => {
    if (!nextPage || (loadMore && loadingMore)) return;

    try {
      if (!loadMore) setLoading(true);
      else setLoadingMore(true);

      let response = await APIs.get(nextPage);
      setUsers((prevUsers) => [...prevUsers, ...response.data.results]); // Gộp dữ liệu
      setNextPage(response.data.next); // Cập nhật link trang tiếp theo
    } catch (error) {
      console.error("Lỗi khi lấy danh sách người dùng:", error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchUsers(); // Gọi API lần đầu
  }, []);

  // Khi kéo xuống cuối danh sách, load trang tiếp theo
  const loadMoreUsers = () => {
    if (nextPage) fetchUsers(true);
  };

  // Render từng user trong danh sách
  const renderItem = ({ item }) => (
    <TouchableOpacity style={ChatStyle.userItem} onPress={() => navigation.navigate("Chats", { userId: item.id })}>
      {item.avatar ? (
        <Avatar.Image source={{ uri: formatImageUrl(item.avatar) }} size={55} style={ChatStyle.avatar} />
      ) : (
        <Avatar.Icon icon="account" size={55} style={ChatStyle.avatar} backgroundColor="#000000" />
      )}
      <View style={ChatStyle.userInfo}>
        <Text style={ChatStyle.userName}>{item.first_name || item.username} {item.last_name}</Text>
        <Text style={ChatStyle.userEmail}>{item.email}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={ChatStyle.container}>
      <View style={ChatStyle.header}>
        <IconButton icon="arrow-left" size={28} onPress={() => navigation.goBack()} />
        <Text style={ChatStyle.title}>Danh sách người dùng</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Hiển thị Loading lần đầu */}
      {loading ? (
        <ActivityIndicator size="large" color="#6200ea" />
      ) : (
        <FlatList
          data={users}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          ItemSeparatorComponent={() => <View style={ChatStyle.separator} />}
          onEndReached={loadMoreUsers} // Khi cuộn đến cuối, tải thêm user
          onEndReachedThreshold={0.5} // Ngưỡng 50% cuối danh sách mới tải thêm
          ListFooterComponent={loadingMore ? <ActivityIndicator size="small" color="#6200ea" /> : null} // Hiển thị loading khi đang tải thêm
        />
      )}
    </View>
  );
};

export default AllUserChat;
