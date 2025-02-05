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
  const [users, setUsers] = useState([]); 
  const [loading, setLoading] = useState(true); 
  const [loadingMore, setLoadingMore] = useState(false); 
  const [nextPage, setNextPage] = useState(endpoints["allUser"]); 

  const navigation = useNavigation();
  const fetchUsers = async (loadMore = false) => {
    if (!nextPage || (loadMore && loadingMore)) return;

    try {
      if (!loadMore) setLoading(true);
      else setLoadingMore(true);

      let response = await APIs.get(nextPage);
      setUsers((prevUsers) => [...prevUsers, ...response.data.results]); 
      setNextPage(response.data.next); 
    } catch (error) {
      console.error("Lỗi khi lấy danh sách người dùng:", error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchUsers(); 
  }, []);

  const loadMoreUsers = () => {
    if (nextPage) fetchUsers(true);
  };

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

      {loading ? (
        <ActivityIndicator size="large" color="#6200ea" />
      ) : (
        <FlatList
          data={users}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          ItemSeparatorComponent={() => <View style={ChatStyle.separator} />}
          onEndReached={loadMoreUsers} 
          onEndReachedThreshold={0.5} 
          ListFooterComponent={loadingMore ? <ActivityIndicator size="small" color="#6200ea" /> : null} 
        />
      )}
    </View>
  );
};

export default AllUserChat;
