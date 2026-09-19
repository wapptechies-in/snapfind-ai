/**
 * Authentication Context for SnapFind Web.
 * Provides user profile, JWT token management, login, register, and logout capabilities.
 *
 * Status: Phase 3 Mock & Phase 2 Fallback Architecture
 */

import React, { createContext, useContext, useEffect, useState } from "react";
import { authApi } from "../services/api/auth";
import { getStoredToken, setStoredToken } from "../services/api";
import type { User } from "../types";

const MOCK_DEFAULT_USER: User = {
  id: "usr_mock_1",
  email: "photographer@snapfind.ai",
  studio_name: "Marlowe Light Studio",
  created_at: "2026-01-01T00:00:00Z",
};

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (studioName: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => getStoredToken() || "mock_session_token_active");
  const [user, setUser] = useState<User | null>(MOCK_DEFAULT_USER);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadUser() {
      const stored = getStoredToken();
      if (!stored) {
        // Set default mock photographer session
        setStoredToken("mock_session_token_active");
        setToken("mock_session_token_active");
        setUser(MOCK_DEFAULT_USER);
        setLoading(false);
        return;
      }
      try {
        const profile = await authApi.me();
        setUser(profile);
        setToken(stored);
      } catch {
        setUser(MOCK_DEFAULT_USER);
      } finally {
        setLoading(false);
      }
    }
    loadUser();
  }, []);

  const login = async (email: string, password: string) => {
    const res = await authApi.login({ email, password });
    setStoredToken(res.access_token);
    setToken(res.access_token);
    setUser(res.user);
  };

  const register = async (studioName: string, email: string, password: string) => {
    const res = await authApi.register({
      studio_name: studioName,
      email,
      password,
    });
    setStoredToken(res.access_token);
    setToken(res.access_token);
    setUser(res.user);
  };

  const logout = () => {
    setStoredToken(null);
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        register,
        logout,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

/* eslint-disable-next-line react-refresh/only-export-components */
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
