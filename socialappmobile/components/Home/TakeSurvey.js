import React, { useState, useEffect } from 'react';
import { View, Text, Button, ScrollView, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { authApis, endpoints } from '../../configs/APIs';
import AsyncStorage from '@react-native-async-storage/async-storage';

const TakeSurvey = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { surveyId } = route.params;
  const [survey, setSurvey] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false); // Thêm biến isSubmitting

  useEffect(() => {
    const fetchSurvey = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        const response = await authApis(token).get(endpoints.survey_detail(surveyId));
        setSurvey(response.data);
      } catch (error) {
        console.error('Error fetching survey:', error);
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
    if (!survey || !survey.questions) return false;

    const currentQuestion = survey.questions[currentQuestionIndex];
    const currentAnswer = answers[currentQuestion.id];

    if (currentQuestion.question_type === 'text') {
      return currentAnswer !== undefined && currentAnswer !== '';
    } else if (currentQuestion.question_type === 'multiple_choice') {
      return currentAnswer !== undefined;
    }
    return false;
  };

  const handleNextQuestion = () => {
    console.log("handleNextQuestion called");
    if (!survey || !survey.questions) return;

    const isLastQuestion = currentQuestionIndex === survey.questions.length - 1;

    if (!isLastQuestion) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else if (isLastQuestion && isCurrentQuestionAnswered()) {
      handleSubmit();
    }
  };

  const handleSubmit = async () => {
    console.log("handleSubmit called");
    if (isSubmitting) {
      console.log("Already submitting, ignoring this request.");
      return;
    }

    setIsSubmitting(true); // Bắt đầu submit

    try {
      const token = await AsyncStorage.getItem('token');

      if (!survey || !survey.questions) {
        console.error("Survey or survey questions are not available.");
        Alert.alert("Error", "Survey data is incomplete. Please try again.");
        return;
      }

      const formattedAnswers = Object.entries(answers).map(([question, answer]) => {
        const questionObj = survey.questions.find(q => q.id === parseInt(question));

        if (!questionObj) {
          console.error(`Question with ID ${question} not found.`);
          return null;
        }

        const questionType = questionObj.question_type;
        return {
          question: parseInt(question),
          text_answer: questionType === 'text' ? answer : null,
          option: questionType === 'multiple_choice' ? parseInt(answer) : null,
        };
      }).filter(answer => answer !== null);

      console.log("Formatted Answers:", formattedAnswers);

      if (formattedAnswers.length === 0) {
        console.error("Formatted Answers is empty.");
        Alert.alert("Error", "Please answer at least one question.");
        return;
      }

      const response = await authApis(token).post(endpoints.survey_responses, {
        survey: surveyId,
        answers: formattedAnswers,
      });

      console.log('Survey response submitted:', response.data);

      if (response.status >= 200 && response.status < 300) {
        Alert.alert("Success", "Survey submitted successfully!", [
          { text: "OK", onPress: () => navigation.navigate('Home') }
        ]);
      } else {
        console.error('Failed to submit survey. Status:', response.status);
        Alert.alert("Error", "Failed to submit survey. Please try again.");
      }
    } catch (error) {
      console.error('Error submitting survey:', error);
      if (error.response) {
        console.error('Response data:', error.response.data);
        console.error('Response status:', error.response.status);
      }
      Alert.alert("Error", "An error occurred while submitting the survey. Please try again.");
    } finally {
      setIsSubmitting(false); // Hoàn thành submit
    }
  };

  if (loading || !survey) {
    return <Text>Loading survey...</Text>;
  }

  const currentQuestion = survey.questions[currentQuestionIndex];

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>{survey.title}</Text>
      <Text style={styles.questionText}>{currentQuestion.text}</Text>

      {currentQuestion.question_type === 'text' && (
        <TextInput
          style={styles.input}
          onChangeText={(text) => handleAnswerChange(currentQuestion.id, text)}
          value={answers[currentQuestion.id] || ''}
        />
      )}

      {currentQuestion.question_type === 'multiple_choice' && (
        currentQuestion.options.map(option => (
          <TouchableOpacity
            key={option.id}
            style={[
              styles.option,
              answers[currentQuestion.id] === option.id.toString() && styles.selectedOption,
            ]}
            onPress={() => handleAnswerChange(currentQuestion.id, option.id.toString())}
          >
            <Text style={styles.optionText}>{option.text}</Text>
          </TouchableOpacity>
        ))
      )}

      <Button
        title={currentQuestionIndex < survey.questions.length - 1 ? 'Next' : 'Submit'}
        onPress={handleNextQuestion}
        disabled={!isCurrentQuestionAnswered() || isSubmitting} // Disable khi đang submit
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  questionText: {
    fontSize: 18,
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: 'gray',
    padding: 10,
    marginBottom: 20,
    borderRadius: 5,
  },
  option: {
    borderWidth: 1,
    borderColor: 'gray',
    padding: 10,
    marginBottom: 10,
    borderRadius: 5,
  },
  selectedOption: {
    backgroundColor: 'lightblue',
  },
  optionText: {
    fontSize: 16,
  },
});

export default TakeSurvey;