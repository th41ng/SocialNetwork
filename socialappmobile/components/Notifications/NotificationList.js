// import React, { useState, useEffect, useReducer, useContext } from "react";
// import { View, Text, ActivityIndicator, FlatList } from "react-native";
// import { Card, Title, Paragraph } from "react-native-paper";
// import { useNavigation } from "@react-navigation/native";
// import Navbar from "../Home/Navbar";
// import { MyUserContext } from "../../configs/UserContext";
// import APIs, { authApis, endpoints } from "../../configs/APIs";
// import AsyncStorage from "@react-native-async-storage/async-storage";
// import { SafeAreaView } from "react-native-safe-area-context"; 
// import { styles } from "./NotificationStyles"; // Import styles from the new styles file

// const initialState = {
//   notifications: [],
//   loading: true,
//   error: null,
// };

// const reducer = (state, action) => {
//   switch (action.type) {
//     case "FETCH_SUCCESS":
//       return { ...state, notifications: action.payload || [], loading: false };
//     default:
//       return state;
//   }
// };

// const EventList = () => {
//   const [state, dispatch] = useReducer(reducer, initialState);
//   const user = useContext(MyUserContext); 
//   const navigation = useNavigation();

//   useEffect(() => {
//     const fetchEvents = async () => {
//       try {
//         const token = await AsyncStorage.getItem("token");
//         if (!token) {
//           console.warn("Token không tồn tại hoặc chưa được lưu.");
//           return;
//         }

//         const api = authApis(token);
//         const response = await api.get(endpoints.notification);
        
//         console.log("Toàn bộ dữ liệu trả về từ API:", response.data);

//         if (response.data && response.data.results) {
//           dispatch({ type: "FETCH_SUCCESS", payload: response.data.results });
//         } else {
//           dispatch({ type: "FETCH_ERROR", payload: "Không tìm thấy dữ liệu sự kiện" });
//         }
//       } catch (err) {
//         console.error("Lỗi khi gọi API:", err.response?.data || err.message);
//         dispatch({ type: "FETCH_ERROR", payload: err.message });
//       }
//     };

//     fetchEvents();
//   }, []);

//   if (state.loading) {
//     return (
//       <View style={styles.loadingContainer}>
//         <ActivityIndicator size="large" color="#6200ee" />
//         <Text style={styles.loadingText}>Đang tải dữ liệu...</Text>
//       </View>
//     );
//   }

//   if (state.error) {
//     return (
//       <View style={styles.errorContainer}>
//         <Text style={styles.errorText}>{state.error}</Text>
//       </View>
//     );
//   }

//   const renderItem = ({ item }) => (
//     <Card style={styles.card}>
//       <Card.Content>
//         <Title style={styles.eventTitle}>SỰ KIỆN: {item.title}</Title>
//         <Paragraph style={styles.eventContent}>{item.content}</Paragraph>
//       </Card.Content>
//     </Card>
//   );

//   return (
//     <SafeAreaView style={styles.safeArea}>
//       <View style={styles.container}>
//         <Text style={styles.header}>Danh sách sự kiện</Text>
//         {state.notifications.length === 0 ? (
//           <Text style={styles.noEventsText}>Không có sự kiện nào.</Text>
//         ) : (
//           <FlatList
//             data={state.notifications}
//             renderItem={renderItem}
//             keyExtractor={(item) => item.id.toString()}
//             contentContainerStyle={styles.flatListContent}
//           />
//         )}
//       </View>

//       <Navbar navigation={navigation} />
//     </SafeAreaView>
//   );
// };

// export default EventList;

import React, { useState, useEffect, useReducer, useContext } from "react";
import { View, Text, ActivityIndicator, FlatList } from "react-native";
import { Card, Title, Paragraph } from "react-native-paper";
import { useNavigation } from "@react-navigation/native";
import Navbar from "../Home/Navbar";
import { MyUserContext } from "../../configs/UserContext";
import APIs, { authApis, endpoints } from "../../configs/APIs";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SafeAreaView } from "react-native-safe-area-context"; 
import { styles } from "./NotificationStyles"; // Import styles from the new styles file
import moment from "moment";
import Icon from 'react-native-vector-icons/MaterialIcons'; // Hoặc bất kỳ thư viện icon nào bạn muốn


const initialState = {
  notifications: [],
  loading: true,
  error: null,
};

const reducer = (state, action) => {
  switch (action.type) {
    case "FETCH_SUCCESS":
      return { ...state, notifications: action.payload || [], loading: false };
    default:
      return state;
  }
};

const EventList = () => {
  const [state, dispatch] = useReducer(reducer, initialState);
  const user = useContext(MyUserContext); 
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

        if (response.data && response.data.results) {
          // Lấy thông tin sự kiện chi tiết cho mỗi thông báo
          const eventsWithDetails = await Promise.all(
            response.data.results.map(async (notification) => {
              const eventId = notification.event;  // Lấy ID sự kiện từ thông báo
              const eventResponse = await api.get(`${endpoints.events}${eventId}/`);  // Lấy thông tin sự kiện theo ID
              return {
                ...notification,  // Giữ lại thông tin của thông báo
                eventDetails: eventResponse.data,  // Thêm thông tin sự kiện vào thông báo
                
              };
            })
            
          );
          dispatch({ type: "FETCH_SUCCESS", payload: eventsWithDetails });
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

  if (state.loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6200ee" />
        <Text style={styles.loadingText}>Đang tải dữ liệu...</Text>
      </View>
    );
  }

  if (state.error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{state.error}</Text>
      </View>
    );
  }

  const stripHtml = (html) => {
    return html.replace(/<[^>]*>/g, ""); // Xóa tất cả thẻ HTML
  };
  
  const renderItem = ({ item }) => (
    <Card style={styles.card}>
      <Card.Content>
        <View style={styles.header}>
          <Icon name="event" size={30} color="#6200ee" style={styles.icon} />
          <Title style={styles.eventTitle}>
            SỰ KIỆN: {stripHtml(item.eventDetails?.title || "Không có tên sự kiện")}
          </Title>
        </View>
        <View style={styles.separator} />
        <Paragraph style={styles.eventContent}>{stripHtml(item.content)}</Paragraph>
        <Text style={styles.note}>Ghi chú: {stripHtml(item.eventDetails?.description || "Không có mô tả")}</Text>
        <Text style={styles.timeText}>
          {moment(item.eventDetails?.start_time).format("DD/MM/YYYY - HH:mm")} đến{" "}
          {moment(item.eventDetails?.end_time).format("DD/MM/YYYY - HH:mm")}
        </Text>
      </Card.Content>
    </Card>
  );
  
  

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.header}>Danh sách sự kiện</Text>
        {state.notifications.length === 0 ? (
          <Text style={styles.noEventsText}>Không có sự kiện nào.</Text>
        ) : (
          <FlatList
            data={state.notifications}
            renderItem={renderItem}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.flatListContent}
          />
        )}
      </View>

      <Navbar navigation={navigation} />
    </SafeAreaView>
  );
};

export default EventList;
