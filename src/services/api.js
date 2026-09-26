import axios from "axios";

export const API_ORIGIN = `${window.location.protocol}//${window.location.hostname}:5000`;
export const API_BASE = `${API_ORIGIN}/api`;

export const apiUrl = (path = "") => {
  if (/^https?:\/\//i.test(path)) {
    return path.replace(/^http:\/\/(localhost|127\.0\.0\.1|10\.57\.89\.85):5000/i, API_ORIGIN);
  }
  return `${API_ORIGIN}${path.startsWith("/") ? path : `/${path}`}`;
};

const api = axios.create({
  baseURL: API_BASE,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;