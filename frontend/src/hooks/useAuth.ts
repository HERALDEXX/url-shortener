"use client";

import { useState, useEffect } from "react";
import { User } from "@/lib/types";
import { apiService } from "@/lib/api";

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const login = async (username: string, password: string) => {
    try {
      const tokens = await apiService.login(username, password);
      localStorage.setItem("jwt_access", tokens.access);
      localStorage.setItem("jwt_refresh", tokens.refresh);

      const userData = await apiService.getCurrentUser();
      setUser(userData);
      return userData;
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem("jwt_access");
    localStorage.removeItem("jwt_refresh");
    setUser(null);
  };

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem("jwt_access");
      if (!token) {
        setLoading(false);
        return;
      }

      const userData = await apiService.getCurrentUser();
      setUser(userData);
    } catch (error) {
      localStorage.removeItem("jwt_access");
      localStorage.removeItem("jwt_refresh");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  return { user, login, logout, loading };
};
