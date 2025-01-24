import axios from "axios";


const BASE_URL = "https://danhdanghoang.pythonanywhere.com";

export const endpoints = {
    login: "/o/token/",
    register: "/users/register/",
    profile: "/profile/",
    getRoles: "/roles/",
    posts: "/posts/",
    create_post: "/posts/",
    reactions: "/reactions/",
    comments: "/comments/", 
    notification: "/notifications/",
    currentUserPosts : "/posts/my-posts/",
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
export default axios.create({
    baseURL: BASE_URL,
    headers: {
        "Content-Type": "application/json",
    },
});