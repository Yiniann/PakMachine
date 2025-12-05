import axios from "axios";

// Directly hit backend; override via VITE_API_BASE if needed.
const baseURL = (import.meta as any).env?.VITE_API_BASE || "http://localhost:3000";

const api = axios.create({ baseURL });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
