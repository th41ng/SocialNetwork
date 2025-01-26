import React from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';

const SurveyItem = ({ survey }) => {
    const navigation = useNavigation();
    if (!survey) return null;

    return (
        <View style={styles.container}>
            <Text style={styles.title}>{survey?.title || "No Title"}</Text>
            <Text style={styles.description}>{survey?.description || "No Description"}</Text>
            <Button
                title="TAKE SURVEY"
                onPress={() => navigation.navigate('TakeSurvey', { surveyId: survey.id })}
                disabled={survey.user_has_responded} // Disable nút nếu user_has_responded là true
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: 20,
        padding: 10,
        backgroundColor: '#f9f9f9',
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    description: {
        marginVertical: 5,
        fontSize: 14,
        color: '#555',
    },
});

export default SurveyItem;