
import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";

const SurveyItem = ({ survey }) => {
  const navigation = useNavigation();
  console.log("Thông tin survey:", survey);
  console.log("User has responded:", survey?.user_has_responded);  

  if (!survey) return null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="clipboard-outline" size={24} color="#4B5563" />
        <Text style={styles.title}>{survey?.title || "No Title"}</Text>
      </View>

     
      <Text style={styles.description}>
        {survey?.description || "No Description"}
      </Text>
      <TouchableOpacity
        style={[
          styles.button,
          survey.user_has_responded && styles.buttonDisabled, 
        ]}
        onPress={() => {
          console.log("Bắt đầu khảo sát");  
          navigation.navigate("TakeSurvey", { surveyId: survey.id });
        }}
        disabled={survey.user_has_responded} 
      >
        <Text style={styles.buttonText}>
          {survey.user_has_responded ? "COMPLETED" : "TAKE SURVEY"}
        </Text>
      </TouchableOpacity>
    </View>
  );
};


const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
    padding: 15,
    backgroundColor: "#FFF",
    borderRadius: 10,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1F2937",
    marginLeft: 10,
    flex: 1,
  },
  description: {
    fontSize: 14,
    color: "#6B7280",
    lineHeight: 20,
    marginBottom: 15,
  },
  button: {
    backgroundColor: "#2563EB",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonDisabled: {
    backgroundColor: "#9CA3AF", 
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFF",
  },
});

export default SurveyItem;