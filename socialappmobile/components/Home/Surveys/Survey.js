// screens/Surveys.js
import React, { useCallback, useState, useEffect } from "react";
import {
  Text,
  View,
  ActivityIndicator,
  FlatList,
} from "react-native";
import { useNavigation, useFocusEffect, useRoute } from "@react-navigation/native";
import Navbar from "../Navbar";
import SurveyItem from "./SurveyItem";
import { fetchAllSurveys } from "../../../configs/APIs";
import HomeStyles from "../HomeStyles";

/**
 * Component hiển thị danh sách các khảo sát (surveys).
 */
const Surveys = () => {
  // State lưu trữ danh sách surveys
  const [surveys, setSurveys] = useState([]);

  // State cho trạng thái loading
  const [loading, setLoading] = useState(true);

  const navigation = useNavigation();
  const route = useRoute(); // Thêm dòng này


  /**
   * Hàm tải danh sách surveys.
   */
  const loadSurveys = useCallback(async () => {
    try {
      const allSurveys = await fetchAllSurveys();
      setSurveys(allSurveys);
    } catch (error) {
      console.error("Failed to load surveys:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Hook useFocusEffect được gọi mỗi khi màn hình Surveys được focus.
   */
  useFocusEffect(
    useCallback(() => {
      loadSurveys();
        return () => {
          if (route.params?.refresh) {
              navigation.setParams({ refresh: false });
          }
        };
    }, [loadSurveys, route.params])
  );

  // Hiển thị màn hình loading khi đang tải dữ liệu
  if (loading) {
    return (
      <View style={HomeStyles.loaderContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text style={HomeStyles.loaderText}>Loading surveys...</Text>
      </View>
    );
  }

  return (
    <View style={HomeStyles.container}>
      {/* Header */}
      <View style={HomeStyles.header}>
        <Text style={HomeStyles.appName}>SocialApp</Text>
      </View>

      {/* Danh sách surveys */}
      <FlatList
        data={surveys}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => <SurveyItem survey={item} />}
        showsVerticalScrollIndicator={false}
      />

      {/* Navbar */}
      <Navbar navigation={navigation} />
    </View>
  );
};

export default Surveys;