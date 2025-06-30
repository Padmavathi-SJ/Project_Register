import axios from "axios";
import { useNavigate } from "react-router-dom";

// Create an Axios instance
const instance = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true
});

// // Add a response interceptor
// instance.interceptors.response.use(
//   (response) => response,
//   (error) => {
//     const message = error.response?.data?.error?.message || error.response?.data?.message;
//     if (error.response && error.response.status === 401) {
//       if (["TokenExpired", "TokenMissing", "Invalid token!"].includes(message)) {
//         window.location.href = "/login";
//       }
//     }
//     return Promise.reject(error);
//   }
// );

export default instance;