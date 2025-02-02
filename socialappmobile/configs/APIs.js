// configs/api.js
import axios from "axios";
import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = "https://danhdanghoang.pythonanywhere.com"; // Thay đổi nếu cần

export const endpoints = {
    // login: "/o/token/",
    // register: "/users/register/",
    // profile: "/profile/",
    // getRoles: "/roles/",
    // posts: "/posts/",
    // create_post: "/posts/",
    // reactions: "/reactions/",
    // comments: "/comments/", 
    notification: "/notifications/",
    events: "/events/",
    currentUserPosts : "/posts/my-posts/",
    login: "/o/token/",
    register: "/users/register/",
    profile: "/profile/",
    getRoles: "/roles/",
    posts: "/posts/",
    create_post: "/posts/",
    reactions: "/reactions/",
    comments: "/comments/",
    // userProfileDetail: (userId) => `/profile/?user_id=${userId}`, 
    // userPostDetail: (userId) => `/posts/?user_id=${userId}/user-posts/`, 
    someOneProfile: (userId) => `/someone-profile/?user_id=${userId}`, 
    post_detail: (postId) => `/posts/${postId}/`,
    comment_detail: (commentId) => `/comments/${commentId}/`,
  surveys: "/surveys/", // Thêm endpoint cho khảo sát
  survey_detail: (surveyId) => `/surveys/${surveyId}/`,
  survey_responses: `/survey-responses/`,
};

export const authApis = (token) => {
  console.info("Token:", token);
  return axios.create({
    baseURL: BASE_URL,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
};

// Default axios instance without authorization (for public endpoints)
const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

export const fetchData = async (url) => {
  try {
    const token = await AsyncStorage.getItem('token');
    const res = await authApis(token).get(url);
    return res.data;
  } catch (error) {
    console.error("API request failed:", error);
    throw error;
  }
};

export const fetchAllComments = async (updatedCommentId, navigation) => {
  try {
    let allComments = [];
    let url = endpoints["comments"];
    while (url) {
      const resComments = await fetchData(url);
      allComments = [...allComments, ...resComments.results];
      url = resComments.next;
    }
    if (updatedCommentId) {
      const updatedComment = await fetchData(
        endpoints.comment_detail(updatedCommentId)
      );
      allComments = allComments.map((c) =>
        c.id === updatedCommentId ? updatedComment : c
      );
      navigation.setParams({ refreshComment: null });
    }
    return allComments;
  } catch (error) {
    console.error("Failed to fetch all comments:", error);
    return [];
  }
};

export const fetchAllReactions = async () => {
  try {
    let allReactions = [];
    let url = endpoints["reactions"];
    while (url) {
      const resReactions = await fetchData(url);
      allReactions = [...allReactions, ...resReactions.results];
      url = resReactions.next;
    }
    return allReactions;
  } catch (error) {
    console.error("Failed to fetch all reactions:", error);
    return [];
  }
};

export const fetchAllSurveys = async () => {
  try {
    let allSurveys = [];
    let url = endpoints["surveys"];
    while (url) {
      const resSurveys = await fetchData(url);
      allSurveys = [...allSurveys, ...resSurveys.results];
      url = resSurveys.next;
    }
    return allSurveys;
  } catch (error) {
    console.error("Failed to fetch all surveys:", error);
    return [];
  }
};

export default api;