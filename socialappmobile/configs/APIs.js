import axios from "axios";


const BASE_URL = "https://danhdanghoang.pythonanywhere.com/";

export const endpoints = {
  login: "/o/token/",
  register: "/users/",
  profile: "/profile/",
  getRoles: "/roles/",
'posts' : '/posts/',
};

export const authApis = (token) => {
  console.info(token);
  return axios.create({
    baseURL: BASE_URL,
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

export default axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});
