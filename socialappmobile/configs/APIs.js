import axios from "axios";

const BASE_URL = "https://danhdanghoang.pythonanywhere.com";

export const endpoints = {
    login: "/o/token/",
    register: "/users/",
    profile: "/profile/",
    getRoles: "/roles/",
    posts: "/posts/",
    create_post: "/posts/",
    reactions: "/reactions/",
    comments: "/comments/", // Đã thêm endpoint cho comments
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

export default axios.create({
    baseURL: BASE_URL,
    headers: {
        "Content-Type": "application/json",
    },
});