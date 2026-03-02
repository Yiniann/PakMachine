import { createContext, useContext, useEffect, useState, ReactNode } from "react";

type AuthState = {
  token: string | null;
  role: string | null;
  email: string | null;
  userType: string | null;
  login: (token: string, role?: string, email?: string, userType?: string) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthState | undefined>(undefined);

const clearStoredAuth = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user_role");
  localStorage.removeItem("user_email");
  localStorage.removeItem("user_type");
};

const isTokenExpired = (rawToken: string) => {
  try {
    const payload = JSON.parse(atob(rawToken.split(".")[1])) as { exp?: number };
    if (!payload.exp) return false;
    return payload.exp * 1000 <= Date.now();
  } catch {
    return true;
  }
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("token"));
  const [role, setRole] = useState<string | null>(() => localStorage.getItem("user_role"));
  const [email, setEmail] = useState<string | null>(() => localStorage.getItem("user_email"));
  const [userType, setUserType] = useState<string | null>(() => localStorage.getItem("user_type"));

  useEffect(() => {
    if (token) {
      localStorage.setItem("token", token);
    } else {
      localStorage.removeItem("token");
    }
  }, [token]);

  useEffect(() => {
    if (role) {
      localStorage.setItem("user_role", role);
    } else {
      localStorage.removeItem("user_role");
    }
  }, [role]);

  useEffect(() => {
    if (email) {
      localStorage.setItem("user_email", email);
    } else {
      localStorage.removeItem("user_email");
    }
  }, [email]);

  useEffect(() => {
    if (userType) {
      localStorage.setItem("user_type", userType);
    } else {
      localStorage.removeItem("user_type");
    }
  }, [userType]);

  useEffect(() => {
    if (!token) return;
    if (!isTokenExpired(token)) return;

    setToken(null);
    setRole(null);
    setEmail(null);
    setUserType(null);
    clearStoredAuth();
  }, [token]);

  const login = (nextToken: string, nextRole?: string, nextEmail?: string, nextUserType?: string) => {
    setToken(nextToken);
    if (nextRole) setRole(nextRole);
    if (nextEmail) setEmail(nextEmail);
    if (nextUserType) setUserType(nextUserType);
  };
  const logout = () => {
    setToken(null);
    setRole(null);
    setEmail(null);
    setUserType(null);
    clearStoredAuth();
  };

  return <AuthContext.Provider value={{ token, role, email, userType, login, logout }}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthState => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
};
