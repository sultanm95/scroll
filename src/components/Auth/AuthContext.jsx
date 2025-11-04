import React, { createContext, useState, useEffect, useContext } from "react";

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem("user");
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState(false);

  // вход
  async function signIn(username, password) {
    try {
      setLoading(true);
      const res = await fetch("http://localhost:3001/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();

      if (res.ok) {
        localStorage.setItem("user", JSON.stringify(data));
        localStorage.setItem("authToken", data.token);
        setUser(data);
        return { success: true };
      } else {
        return { success: false, message: data.error || "Ошибка входа" };
      }
    } catch (err) {
      console.error("Ошибка входа:", err);
      return { success: false, message: "Ошибка сети" };
    } finally {
      setLoading(false);
    }
  }

  // регистрация
  async function register(username, email, password, avatar) {
    try {
      setLoading(true);
      const res = await fetch("http://localhost:3001/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password, avatar }),
      });
      const data = await res.json();
      if (res.ok) {
        return { success: true, message: "Регистрация успешна!" };
      } else {
        return { success: false, message: data.error || "Ошибка регистрации" };
      }
    } catch (err) {
      console.error(err);
      return { success: false, message: "Ошибка сети" };
    } finally {
      setLoading(false);
    }
  }

  // выход
  function signOut() {
    localStorage.clear();
    setUser(null);
  }

  // проверка токена
  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (user && token) {
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        if (payload.exp * 1000 < Date.now()) {
          signOut();
        }
      } catch {
        signOut();
      }
    }
  }, []);

  const value = { user, loading, signIn, signOut, register };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}