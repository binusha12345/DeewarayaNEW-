import axios from "axios";

// 💡 Ngrok domain එකක්ද නැතහොත් Local/IP එකක්ද යන්න හඳුනා ගැනීම
const isNgrok = window.location.hostname.includes("ngrok");

// Ngrok භාවිතා කරන්නේ නම් Port :5000 එකතු නොකරයි (Ngrok auto routing නිසා)
// Local IP / Localhost නම් Port :5000 එකතු කරයි
export const API_ORIGIN = isNgrok
  ? `${window.location.protocol}//${window.location.hostname}`
  : `${window.location.protocol}//${window.location.hostname}:5000`;

export const API_BASE = `${API_ORIGIN}/api`;

export const apiUrl = (path = "") => {
  if (/^https?:\/\//i.test(path)) {
    return path.replace(
      /^http:\/\/(localhost|127\.0\.0\.1|10\.57\.89\.85):5000/i,
      API_ORIGIN
    );
  }
  return `${API_ORIGIN}${path.startsWith("/") ? path : `/${path}`}`;
};

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    "Content-Type": "application/json",
    "ngrok-skip-browser-warning": "true", // 💡 Ngrok warning page එක bypass කිරීමට
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  // 💡 සෑම Request එකකටම Ngrok Header එක අනිවාර්යයෙන්ම එක් කරයි
  config.headers["ngrok-skip-browser-warning"] = "true";
  
  return config;
});

export default api;