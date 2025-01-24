// Import các thư viện cần thiết
import React, { useState, useEffect, useReducer, useContext } from "react";
import { View, Text, Button, ActivityIndicator, FlatList, Alert } from "react-native";
import axios from "axios";
import { Provider as PaperProvider, Card, Title, Paragraph } from "react-native-paper";
import { useNavigation } from "@react-navigation/native";
import Navbar from "../Home/Navbar";
import { MyDispatchContext, MyUserContext } from "../../configs/UserContext";
import APIs, { authApis, endpoints } from "../../configs/APIs";
import AsyncStorage from "@react-native-async-storage/async-storage";
const initialState = {
    notifications: [],  // Đảm bảo giá trị mặc định là một mảng rỗng
    loading: true,
    error: null,
  };
  
  const reducer = (state, action) => {
    switch (action.type) {
      case "FETCH_SUCCESS":
        return { ...state, notifications: action.payload || [], loading: false }; 
        return { ...state, error: action.payload, loading: false };
      default:
        return state;
    }
  };
const EventList = () => {
  const [state, dispatch] = useReducer(reducer, initialState);
  const user = useContext(MyUserContext); // Lấy thông tin user từ context
  console.log("Thông tin user:", user);
  const navigation = useNavigation();

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const token = await AsyncStorage.getItem("token");
        if (!token) {
          console.warn("Token không tồn tại hoặc chưa được lưu.");
          return;
        }
  
        const api = authApis(token);
        const response = await api.get(endpoints.notification);
  
        console.log("Toàn bộ dữ liệu trả về từ API:", response.data);
  
        // Sử dụng response.data.results thay vì response.data.notifications
        if (response.data && response.data.results) {
          dispatch({ type: "FETCH_SUCCESS", payload: response.data.results });
        } else {
          dispatch({ type: "FETCH_ERROR", payload: "Không tìm thấy dữ liệu sự kiện" });
        }
        
      } catch (err) {
        console.error("Lỗi khi gọi API:", err.response?.data || err.message);
        dispatch({ type: "FETCH_ERROR", payload: err.message });
      }
    };
  
    fetchEvents();
  }, []);

  const handleRegister = (id) => {
    Alert.alert("Đăng ký thành công", `Bạn đã đăng ký sự kiện với ID: ${id}`);
  };

  if (state.loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#6200ee" />
        <Text>Đang tải dữ liệu...</Text>
      </View>
    );
  }

  if (state.error) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text>{state.error}</Text>
      </View>
    );
  }

  const renderItem = ({ item }) => (
    <Card style={{ margin: 10 }}>
      <Card.Content>
        <Title>{item.title}</Title>
        <Paragraph>{item.content}</Paragraph>
      </Card.Content>
    </Card>
  );

  return (
    <PaperProvider>
      <View style={{ flex: 1 }}>
        <View style={{ flex: 1, padding: 10 }}>
          <Text style={{ fontSize: 24, fontWeight: "bold", marginBottom: 10 }}>
            Danh sách sự kiện
          </Text>
          {state.notifications.length === 0 ? (
            <Text>Không có sự kiện nào.</Text>
          ) : (
            <FlatList
              data={state.notifications}
              renderItem={renderItem}
              keyExtractor={(item) => item.id.toString()}
              contentContainerStyle={{ paddingBottom: 60 }}
            />
          )}
        </View>
       
          <Navbar navigation={navigation} />
   
      </View>
    </PaperProvider>
  );
};

export default EventList;
