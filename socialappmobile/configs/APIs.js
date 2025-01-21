// APIs.js
import axios from "axios";

const BASE_URL = "https://danhdanghoang.pythonanywhere.com/";

export const endpoints = {
    login: "/o/token/",
    register: "/users/",
    profile: "/profile/",
    getRoles: "/roles/",
    posts: "/posts/",
    create_post: "/posts/", // Thêm endpoint cho tạo bài viết
    reactions: "/reactions/",
    
};

export const authApis = (token) => {
    console.info("Token:", token); // Log token ra để kiểm tra
    return axios.create({
        baseURL: BASE_URL,
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json", // Thêm Content-Type ở đây
        },
    });
};

export default axios.create({
    baseURL: BASE_URL,
    headers: {
        "Content-Type": "application/json",
    },
});