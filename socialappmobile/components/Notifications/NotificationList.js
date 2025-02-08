// import React, { useState, useEffect, useReducer, useContext } from "react";
// import { View, Text, ActivityIndicator, FlatList, RefreshControl } from "react-native";
// import { Card, Title, Paragraph } from "react-native-paper";
// import { useNavigation } from "@react-navigation/native";
// import Navbar from "../Home/Navbar";
// import { MyUserContext } from "../../configs/UserContext";
// import APIs, { authApis, endpoints } from "../../configs/APIs";
// import AsyncStorage from "@react-native-async-storage/async-storage";
// import { SafeAreaView } from "react-native-safe-area-context"; 
// import { styles } from "./NotificationStyles"; 
// import moment from "moment";
// import Icon from 'react-native-vector-icons/MaterialIcons'; 
// import he from "he"; 

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
//   const [isRefreshing, setIsRefreshing] = useState(false);
//   const user = useContext(MyUserContext); 
//   const navigation = useNavigation();

//   const fetchEvents = async () => {
//     try {
//       const token = await AsyncStorage.getItem("token");
//       if (!token) {
//         console.warn("Token không tồn tại hoặc chưa được lưu.");
//         return;
//       }

//       const api = authApis(token);
//       const response = await api.get(endpoints.notification);
//       console.log("Toàn bộ dữ liệu trả về từ API:", response.data);

//       if (response.data && response.data.results) {
//         const eventsWithDetails = await Promise.all(
//           response.data.results.map(async (notification) => {
//             const eventId = notification.event;  
//             const eventResponse = await api.get(`${endpoints.events}${eventId}/`);  
//             return {
//               ...notification, 
//               eventDetails: eventResponse.data,  
//             };
//           })
//         );
//         dispatch({ type: "FETCH_SUCCESS", payload: eventsWithDetails });
//       } else {
//         dispatch({ type: "FETCH_SUCCESS", payload: [] });
//       }
//     } catch (err) {
//       console.error("Lỗi khi gọi API:", err.response?.data || err.message);
//       dispatch({ type: "FETCH_SUCCESS", payload: [] });
//     }
//   };

//   useEffect(() => {
//     fetchEvents();
//   }, []);

//   const handleRefresh = async () => {
//     setIsRefreshing(true);
//     await fetchEvents();
//     setIsRefreshing(false);
//   };

//   if (state.loading) {
//     return (
//       <View style={styles.loadingContainer}>
//         <ActivityIndicator size="large" color="#6200ee" />
//         <Text style={styles.loadingText}>Đang tải dữ liệu...</Text>
//       </View>
//     );
//   }

//   const decodeHtml = (html) => {
//     const strippedHtml = html.replace(/<[^>]*>/g, ""); 
//     return he.decode(strippedHtml); 
//   };
  
//   const renderItem = ({ item }) => (
//     <Card style={styles.card}>
//       <Card.Content>
//         <View style={styles.header}>
//           <Icon name="event" size={30} color="#6200ee" style={styles.icon} />
//           <Title style={styles.eventTitle}>
//             SỰ KIỆN: {decodeHtml(item.eventDetails?.title || "Không có tên sự kiện")}
//           </Title>
//         </View>
//         <View style={styles.separator} />
//         <Paragraph style={styles.eventContent}>{decodeHtml(item.content)}</Paragraph>
//         <Text style={styles.note}>Ghi chú: {decodeHtml(item.eventDetails?.description || "Không có mô tả")}</Text>
//         <Text style={styles.timeText}>
//           {moment(item.eventDetails?.start_time).format("DD/MM/YYYY - HH:mm")} đến{" "}
//           {moment(item.eventDetails?.end_time).format("DD/MM/YYYY - HH:mm")}
//         </Text>
//       </Card.Content>
//     </Card>
//   );

//   return (
//     <SafeAreaView style={styles.safeArea}>
//       <View style={styles.container}>
//         <Text style={styles.header}>Danh sách sự kiện</Text>
//         <FlatList
//           data={state.notifications}
//           renderItem={state.notifications.length > 0 ? renderItem : null}
//           keyExtractor={(item, index) => (item.id ? item.id.toString() : index.toString())}
//           contentContainerStyle={styles.flatListContent}
//           ListEmptyComponent={
//             <Text style={styles.noEventsText}>Không có sự kiện nào.</Text>
//           }
//           refreshControl={
//             <RefreshControl
//               refreshing={isRefreshing}  
//               onRefresh={handleRefresh}  
//             />
//           }
//         />
//       </View>

//       <Navbar navigation={navigation} />
//     </SafeAreaView>
//   );
// };

// export default EventList;
import React, { useState, useEffect, useReducer, useContext } from "react";
import { View, Text, ActivityIndicator, FlatList, RefreshControl } from "react-native";
import { Card, Title, Paragraph } from "react-native-paper";
import { useNavigation } from "@react-navigation/native";
import Navbar from "../Home/Navbar";
import { MyUserContext } from "../../configs/UserContext";
import APIs, { authApis, endpoints } from "../../configs/APIs";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SafeAreaView } from "react-native-safe-area-context";
import { styles } from "./NotificationStyles";
import moment from "moment";
import Icon from "react-native-vector-icons/MaterialIcons";
import he from "he";
import { debounce } from "lodash";

const initialState = {
  notifications: [],
  loading: true,
  error: null,
};

const reducer = (state, action) => {
  switch (action.type) {
    case "FETCH_SUCCESS":
      return { ...state, notifications: action.payload || [], loading: false };
    case "LOAD_MORE":
      return { ...state, notifications: [...state.notifications, ...action.payload] };
    default:
      return state;
  }
};

const EventList = () => {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [nextPage, setNextPage] = useState(null);
  const user = useContext(MyUserContext);
  const navigation = useNavigation();

  const fetchEvents = async (url = endpoints.notification) => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        console.warn("Token không tồn tại hoặc chưa được lưu.");
        return;
      }

      const api = authApis(token);
      const response = await api.get(url);
      console.log("Toàn bộ dữ liệu trả về từ API:", response.data);

      if (response.data && response.data.results) {
        const eventsWithDetails = await Promise.all(
          response.data.results.map(async (notification) => {
            const eventId = notification.event;
            const eventResponse = await api.get(`${endpoints.events}${eventId}/`);
            return { ...notification, eventDetails: eventResponse.data };
          })
        );

        if (url === endpoints.notification) {
          dispatch({ type: "FETCH_SUCCESS", payload: eventsWithDetails });
        } else {
          dispatch({ type: "LOAD_MORE", payload: eventsWithDetails });
        }

        setNextPage(response.data.next);
      } else {
        dispatch({ type: "FETCH_SUCCESS", payload: [] });
      }
    } catch (err) {
      console.error("Lỗi khi gọi API:", err.response?.data || err.message);
      dispatch({ type: "FETCH_SUCCESS", payload: [] });
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchEvents();
    setIsRefreshing(false);
  };

  const handleLoadMore = debounce(() => {
    if (nextPage && !loadingMore) {
      setLoadingMore(true);
      fetchEvents(nextPage).finally(() => setLoadingMore(false));
    }
  }, 500);

  if (state.loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6200ee" />
        <Text style={styles.loadingText}>Đang tải dữ liệu...</Text>
      </View>
    );
  }

  const decodeHtml = (html) => {
    const strippedHtml = html.replace(/<[^>]*>/g, "");
    return he.decode(strippedHtml);
  };

  const renderItem = ({ item }) => (
    <Card style={styles.card}>
      <Card.Content>
        <View style={styles.header}>
          <Icon name="event" size={30} color="#6200ee" style={styles.icon} />
          <Title style={styles.eventTitle}>
            SỰ KIỆN: {decodeHtml(item.eventDetails?.title || "Không có tên sự kiện")}
          </Title>
        </View>
        <View style={styles.separator} />
        <Paragraph style={styles.eventContent}>{decodeHtml(item.content)}</Paragraph>
        <Text style={styles.note}>
          Ghi chú: {decodeHtml(item.eventDetails?.description || "Không có mô tả")}
        </Text>
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
        <FlatList
          data={state.notifications}
          renderItem={state.notifications.length > 0 ? renderItem : null}
          keyExtractor={(item, index) => (item.id ? item.id.toString() : index.toString())}
          contentContainerStyle={styles.flatListContent}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            loadingMore ? <ActivityIndicator size="small" color="#6200ee" /> : null
          }
          ListEmptyComponent={
            <Text style={styles.noEventsText}>Không có sự kiện nào.</Text>
          }
          refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />}
        />
      </View>

      <Navbar navigation={navigation} />
    </SafeAreaView>
  );
};

export default EventList;

