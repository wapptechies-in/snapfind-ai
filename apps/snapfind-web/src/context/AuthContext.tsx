/**
 * Authentication Context for SnapFind Web.
 * Provides user profile, JWT token management, login, register, and logout capabilities
 * connected directly to the FastAPI backend.
 *
 * Status: IMPLEMENTED (Live API)
 */

import React, { createContext, useContext, useEffect, useState } from "react";
import { authApi } from "../services/api/auth";
import { getStoredToken, setStoredToken } from "../services/api/client";
import type { User } from "../types";

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: (credential: string, studioName?: string) => Promise<void>;
  register: (studioName: string, email: string, password: string) => Promise<User>;
  logout: () => void;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => getStoredToken());
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const refreshProfile = async () => {
    const stored = getStoredToken();
    if (!stored) {
      setUser(null);
      setToken(null);
      return;
    }
    try {
      const profile = await authApi.me();
      setUser(profile);
      setToken(stored);
    } catch {
      setStoredToken(null);
      setUser(null);
      setToken(null);
    }
  };

  useEffect(() => {
    async function loadUser() {
      const stored = getStoredToken();
      if (!stored) {
        setLoading(false);
        return;
      }
      try {
        const profile = await authApi.me();
        setUser(profile);
        setToken(stored);
      } catch {
        setStoredToken(null);
        setUser(null);
        setToken(null);
      } finally {
        setLoading(false);
      }
    }
    loadUser();

    const handleUnauthorized = () => {
      setUser(null);
      setToken(null);
      setStoredToken(null);
    };

    window.addEventListener("snapfind:unauthorized", handleUnauthorized);
    return () => window.removeEventListener("snapfind:unauthorized", handleUnauthorized);
  }, []);

  const login = async (email: string, password: string) => {
    const res = await authApi.login({ email, password });
    if (res.access_token) {
      setStoredToken(res.access_token);
      setToken(res.access_token);
      setUser(res.user);
      if (res.user && res.user.onboarding_completed === false) {
        window.location.href = "/onboarding";
      }
    }
  };

  const loginWithGoogle = async (credential: string, studioName?: string) => {
    const res = await authApi.loginWithGoogle(credential, studioName);
    if (res.access_token) {
      setStoredToken(res.access_token);
      setToken(res.access_token);
      setUser(res.user);
      if (res.user && res.user.onboarding_completed === false) {
        window.location.href = "/onboarding";
      }
    }
  };

  const register = async (studioName: string, email: string, password: string): Promise<User> => {
    const res = await authApi.register({
      studio_name: studioName,
      email,
      password,
    });
    if (res.access_token) {
      setStoredToken(res.access_token);
      setToken(res.access_token);
      setUser(res.user);
      if (res.user && res.user.onboarding_completed === false) {
        window.location.href = "/onboarding";
      }
    }
    return res.user;
  };

  const logout = () => {
    authApi.logout();
    setStoredToken(null);
    setToken(null);
    setUser(null);
  };

  const isAdmin = Boolean(user?.role === "admin" || user?.role === "super_admin");
  const isSuperAdmin = Boolean(user?.role === "super_admin");

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        loginWithGoogle,
        register,
        logout,
        isAuthenticated: !!user && !!token,
        isAdmin,
        isSuperAdmin,
        refreshProfile,
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
