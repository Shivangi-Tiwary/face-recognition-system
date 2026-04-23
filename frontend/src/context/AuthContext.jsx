import { createContext, useContext, useState } from "react";

const AuthContext = createContext();

export const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8080/api";

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem("token") || null);
  const [user, setUser] = useState(
    JSON.parse(localStorage.getItem("user") || "null")
  );

  const login = (token, user) => {
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(user));
    setToken(token);
    setUser(user);
  };

const logout = async () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  setToken(null);
  setUser(null);
};

  return (
    <AuthContext.Provider value={{ token, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);