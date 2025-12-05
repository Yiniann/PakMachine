import { useEffect, useState } from "react";

type AuthState = {
  token: string | null;
  login: (token: string) => void;
  logout: () => void;
};

export const useAuth = (): AuthState => {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("token"));

  useEffect(() => {
    if (token) {
      localStorage.setItem("token", token);
    } else {
      localStorage.removeItem("token");
    }
  }, [token]);

  const login = (nextToken: string) => setToken(nextToken);
  const logout = () => setToken(null);

  return { token, login, logout };
};
