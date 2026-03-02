import axios from "axios";

const isDev = (import.meta as any).env?.DEV;
const baseURL = isDev ? "http://localhost:3000" : (import.meta as any).env?.VITE_API_BASE;
const ignoredAuthPaths = ["/auth/login", "/auth/register", "/auth/register/send-code", "/auth/forgot-password", "/auth/reset-password"];

let isRedirectingToLogin = false;

const api = axios.create({ baseURL });

const clearAuthStorage = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user_role");
  localStorage.removeItem("user_email");
  localStorage.removeItem("user_type");
};

const shouldIgnore401 = (requestUrl?: string) => {
  if (!requestUrl) return false;
  const urlWithoutQuery = requestUrl.split("?")[0];
  return ignoredAuthPaths.some((path) => urlWithoutQuery.endsWith(path));
};

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const token = localStorage.getItem("token");
    const requestUrl = error.config?.url;

    if (status === 401 && token && !shouldIgnore401(requestUrl) && !isRedirectingToLogin) {
      isRedirectingToLogin = true;
      clearAuthStorage();

      const from = `${window.location.pathname}${window.location.search}${window.location.hash}`;
      const loginUrl = `/auth/login?from=${encodeURIComponent(from)}`;
      window.location.replace(loginUrl);
    }

    return Promise.reject(error);
  },
);

export default api;
