import axios from "axios";

const isDev = (import.meta as any).env?.DEV;
const baseURL = isDev ? "http://localhost:3000" : (import.meta as any).env?.VITE_API_BASE;

const api = axios.create({ baseURL });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
