// components/SurveyItem.js
import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";

/**
 * Component hiển thị một khảo sát (survey) trong danh sách khảo sát.
 */
const SurveyItem = ({ survey }) => {
  const navigation = useNavigation();
  console.log("Thông tin survey:", survey);
  console.log("User has responded:", survey?.user_has_responded);  // Thêm log ở đây

  if (!survey) return null;

  return (
    <View style={styles.container}>
      {/* Header của survey */}
      <View style={styles.header}>
        <Ionicons name="clipboard-outline" size={24} color="#4B5563" />
        <Text style={styles.title}>{survey?.title || "No Title"}</Text>
      </View>

      {/* Mô tả survey */}
      <Text style={styles.description}>
        {survey?.description || "No Description"}
      </Text>

      {/* Nút "TAKE SURVEY" hoặc "COMPLETED" */}
      <TouchableOpacity
        style={[
          styles.button,
          survey.user_has_responded && styles.buttonDisabled, // Thay đổi style của nút nếu đã hoàn thành
        ]}
        onPress={() => {
          console.log("Bắt đầu khảo sát");  // Thêm log để kiểm tra hành động khi nhấn
          navigation.navigate("TakeSurvey", { surveyId: survey.id });
        }}
        disabled={survey.user_has_responded} // Disable nút nếu đã hoàn thành
      >
        <Text style={styles.buttonText}>
          {survey.user_has_responded ? "COMPLETED" : "TAKE SURVEY"}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

// Styles cho component
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
    backgroundColor: "#9CA3AF", // Màu nền cho nút khi disabled
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFF",
  },
});

export default SurveyItem;