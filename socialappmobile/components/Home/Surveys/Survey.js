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
const Surveys = () => {
  const [surveys, setSurveys] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation();
  const route = useRoute(); 

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
      <View style={HomeStyles.header}>
        <Text style={HomeStyles.appName}>SocialApp</Text>
      </View>
      <FlatList
        data={surveys}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => <SurveyItem survey={item} />}
        showsVerticalScrollIndicator={false}
      />
      <Navbar navigation={navigation} />
    </View>
  );
};

export default Surveys;