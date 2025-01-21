import axios from "axios";

const BASE_URL = "https://danhdanghoang.pythonanywhere.com/";

export const endpoints = {
  login: "/o/token/",
  register: "/users/",
  profile: "/profile/",
  getRoles: "/roles/",
  posts: "/posts/",
  // verifyOldPassword: "/users/verify-old-password/", // Add the endpoint to verify old password
};

export const authApis = (token) => {
  console.info(token); // Log the token for debugging purposes

  return axios.create({
    baseURL: BASE_URL,
    headers: {
      Authorization: `Bearer ${token}`,
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