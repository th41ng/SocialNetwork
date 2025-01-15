import axios from "axios";

const BASE_URL= "https://danhdanghoang.pythonanywhere.com/";

export const endpoints = {
    'posts' : '/posts/'
}


export default axios.create({
    baseURL: BASE_URL
})