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

const TakeSurvey = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { surveyId } = route.params;
  const [survey, setSurvey] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
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

  const handleAnswerChange = (questionId, value) => {
    setAnswers({ ...answers, [questionId]: value });
  };

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


  const handleSubmit = async () => {
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      const token = await AsyncStorage.getItem("token");

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
            navigation.navigate("Surveys", { refresh: true });
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
      {survey && ( 
        <>
          <Text style={styles.title}>{survey.title}</Text>
          {survey.questions && survey.questions.length > 0 && currentQuestionIndex >=0 && currentQuestionIndex < survey.questions.length && (
            <>
              <Text style={styles.questionText}>
                {survey.questions[currentQuestionIndex].text}
              </Text>
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