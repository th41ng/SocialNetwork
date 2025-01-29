import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import { authApis, endpoints } from "../../../configs/APIs";
import AsyncStorage from "@react-native-async-storage/async-storage";

/**
 * Component cho phép người dùng làm khảo sát.
 */
const TakeSurvey = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { surveyId } = route.params;

  // State lưu trữ thông tin khảo sát
  const [survey, setSurvey] = useState(null);

  // State lưu vị trí câu hỏi hiện tại
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  // State lưu câu trả lời
  const [answers, setAnswers] = useState({});

  // State cho trạng thái loading
  const [loading, setLoading] = useState(true);

  // State cho trạng thái submitting
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    /**
     * Hàm tải thông tin chi tiết khảo sát.
     */
    const fetchSurvey = async () => {
      try {
        const token = await AsyncStorage.getItem("token");
        const response = await authApis(token).get(
          endpoints.survey_detail(surveyId)
        );
        setSurvey(response.data);
      } catch (error) {
        console.error("Error fetching survey:", error);
        Alert.alert("Error", "Failed to load survey. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchSurvey();
  }, [surveyId]);

  /**
   * Hàm xử lý thay đổi câu trả lời.
   */
  const handleAnswerChange = (questionId, value) => {
    setAnswers({ ...answers, [questionId]: value });
  };

  /**
   * Hàm kiểm tra câu hỏi hiện tại đã được trả lời hay chưa.
   */
  const isCurrentQuestionAnswered = () => {
    if (!survey || !survey.questions) {
      return false; // Thêm kiểm tra survey và survey.questions
    }
    const currentQuestion = survey.questions[currentQuestionIndex];
    const currentAnswer = answers[currentQuestion?.id];
  
    return currentQuestion?.question_type === "text"
      ? currentAnswer?.trim().length > 0
      : currentAnswer !== undefined;
  };
  /**
   * Hàm xử lý chuyển sang câu hỏi tiếp theo hoặc submit khảo sát.
   */
  const handleNextQuestion = () => {
    if (!survey || !survey.questions) {
      return; // Thêm kiểm tra survey và survey.questions
    }
    const isLastQuestion = currentQuestionIndex === survey.questions.length - 1;

    if (!isLastQuestion) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else if (isLastQuestion && isCurrentQuestionAnswered()) {
      handleSubmit();
    }
  };

  /**
   * Hàm submit khảo sát.
   */
  const handleSubmit = async () => {
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      const token = await AsyncStorage.getItem("token");

      // Format lại câu trả lời
      const formattedAnswers = Object.entries(answers).map(
        ([questionId, answer]) => {
          const question = survey.questions.find(
            (q) => q.id.toString() === questionId
          );
          return {
            question: parseInt(questionId),
            text_answer: question?.question_type === "text" ? answer : null,
            option:
              question?.question_type === "multiple_choice"
                ? parseInt(answer)
                : null,
          };
        }
      );

      const response = await authApis(token).post(endpoints.survey_responses, {
        survey: surveyId,
        answers: formattedAnswers,
      });

      Alert.alert("Success", "Survey submitted successfully!", [
        {
          text: "OK",
          onPress: () => {
            // Navigate đến Surveys
            navigation.navigate("Surveys", { refresh: true }); // Truyền thêm params để refresh
          },
        },
      ]);
    } catch (error) {
      console.error("Error submitting survey:", error);
      Alert.alert("Error", "An error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Hiển thị màn hình loading khi đang tải
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3498db" />
        <Text style={styles.loadingText}>Loading survey...</Text>
      </View>
    );
  }

  const currentQuestion = survey.questions[currentQuestionIndex];

  return (
    <ScrollView style={styles.container}>
      {survey && ( // Thêm điều kiện kiểm tra survey khác null
        <>
          {/* Tiêu đề khảo sát */}
          <Text style={styles.title}>{survey.title}</Text>
  
          {/* Câu hỏi hiện tại và các phần khác sử dụng currentQuestion */}
          {survey.questions && survey.questions.length > 0 && currentQuestionIndex >=0 && currentQuestionIndex < survey.questions.length && (
            <>
              <Text style={styles.questionText}>
                {survey.questions[currentQuestionIndex].text}
              </Text>
  
              {/* Hiển thị input cho câu hỏi text */}
              {survey.questions[currentQuestionIndex].question_type === "text" && (
                <TextInput
                  style={styles.input}
                  onChangeText={(text) =>
                    handleAnswerChange(survey.questions[currentQuestionIndex].id, text)
                  }
                  value={answers[survey.questions[currentQuestionIndex].id] || ""}
                  placeholder="Type your answer here..."
                />
              )}
  
              {/* Hiển thị options cho câu hỏi multiple choice */}
              {survey.questions[currentQuestionIndex].question_type ===
                "multiple_choice" && (
                <View>
                  {survey.questions[currentQuestionIndex].options &&
                    survey.questions[currentQuestionIndex].options.map((option) => (
                      <TouchableOpacity
                        key={option.id}
                        style={[
                          styles.option,
                          answers[survey.questions[currentQuestionIndex].id] ===
                            option.id.toString() && styles.selectedOption,
                        ]}
                        onPress={() =>
                          handleAnswerChange(
                            survey.questions[currentQuestionIndex].id,
                            option.id.toString()
                          )
                        }
                      >
                        <Text style={styles.optionText}>{option.text}</Text>
                      </TouchableOpacity>
                    ))}
                </View>
              )}
            </>
          )}
  
          {/* Nút "Next" hoặc "Submit" */}
          <TouchableOpacity
            style={[
              styles.button,
              (!isCurrentQuestionAnswered() || isSubmitting) &&
                styles.disabledButton,
            ]}
            onPress={handleNextQuestion}
            disabled={!isCurrentQuestionAnswered() || isSubmitting}
          >
            <Text style={styles.buttonText}>
              {survey.questions &&
              currentQuestionIndex < survey.questions.length - 1
                ? "Next"
                : "Submit"}
            </Text>
          </TouchableOpacity>
        </>
      )}
    </ScrollView>
  );
};

// Styles cho component
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#f8f9fa",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#2c3e50",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    color: "#2c3e50",
    textAlign: "center",
  },
  questionText: {
    fontSize: 18,
    marginBottom: 20,
    color: "#34495e",
  },
  input: {
    borderWidth: 1,
    borderColor: "#bdc3c7",
    padding: 15,
    borderRadius: 8,
    backgroundColor: "#fff",
    marginBottom: 20,
    fontSize: 16,
  },
  option: {
    borderWidth: 1,
    borderColor: "#bdc3c7",
    padding: 15,
    borderRadius: 8,
    backgroundColor: "#fff",
    marginBottom: 10,
  },
  selectedOption: {
    backgroundColor: "#3498db",
    borderColor: "#2980b9",
  },
  optionText: {
    fontSize: 16,
    color: "#2c3e50",
  },
  button: {
    backgroundColor: "#3498db",
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: "center",
  },
  disabledButton: {
    backgroundColor: "#bdc3c7",
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
});

export default TakeSurvey;