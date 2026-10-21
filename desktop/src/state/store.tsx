/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useEffect, useState } from "react";
import { authApi } from "../api/auth";
import { billingApi } from "../api";
import { eventsApi } from "../api/events";
import { getAuthToken, setApiBaseUrl } from "../api/client";
import { sessionStorage } from "../storage/sessionStorage";
import type { AppSettings, CreateEventPayload, LocalUploadSession, ScanResult, SnapEvent, SubscriptionStatus, User } from "../types";
import type { UploadManager } from "../upload/uploadManager";

interface AppContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  loginWithGoogle: (credential: string, studioName?: string) => Promise<void>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
  events: SnapEvent[];
  loadEvents: () => Promise<void>;
  createEvent: (payload: CreateEventPayload) => Promise<SnapEvent>;
  deleteEvent: (id: string) => Promise<void>;
  selectedEvent: SnapEvent | null;
  setSelectedEvent: (ev: SnapEvent | null) => void;
  scanResult: ScanResult | null;
  setScanResult: (res: ScanResult | null) => void;
  uploadManager: UploadManager | null;
  setUploadManager: (mgr: UploadManager | null) => void;
  settings: AppSettings;
  updateSettings: (s: Partial<AppSettings>) => void;
  recentSessions: LocalUploadSession[];
  refreshRecentSessions: () => Promise<void>;
  subscription: SubscriptionStatus | null;
  refreshSubscription: () => Promise<SubscriptionStatus | null>;
}


const AppContext = createContext<AppContextType | null>(null);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [subscription, setSubscription] = useState<SubscriptionStatus | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [events, setEvents] = useState<SnapEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<SnapEvent | null>(null);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [uploadManager, setUploadManager] = useState<UploadManager | null>(null);
  const [recentSessions, setRecentSessions] = useState<LocalUploadSession[]>([]);

  const [settings, setSettings] = useState<AppSettings>(() => {
    const isProd = Boolean((import.meta as any).env?.PROD);
    const defaultProductionUrl = (import.meta as any).env?.VITE_API_URL || "https://snapfind-ai.onrender.com";
    const defaultDevelopmentUrl = "http://127.0.0.1:8000";
    const defaultUrl = isProd ? defaultProductionUrl : defaultDevelopmentUrl;

    const raw = localStorage.getItem("snapfind_desktop_settings");
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (isProd && (parsed.apiBaseUrl === "http://localhost:8000" || parsed.apiBaseUrl === "http://127.0.0.1:8000" || parsed.apiBaseUrl === "https://staging-api.snapfind.ai")) {
          parsed.apiBaseUrl = defaultProductionUrl;
        } else if ((!isProd) && (parsed.apiBaseUrl === "http://localhost:8000")) {
          parsed.apiBaseUrl = "http://127.0.0.1:8000";
        }
        return parsed;
      } catch {
        // fallback
      }
    }
    const savedUrl = localStorage.getItem("snapfind_desktop_api_url");
    let activeUrl = savedUrl || defaultUrl;
    if (isProd && (!savedUrl || savedUrl === "http://localhost:8000" || savedUrl === "http://127.0.0.1:8000" || savedUrl === "https://staging-api.snapfind.ai")) {
      activeUrl = defaultProductionUrl;
    }
    return {
      apiBaseUrl: activeUrl,
      concurrency: 4,
      autoStartProcessing: true,
    };
  });

  const updateSettings = (partial: Partial<AppSettings>) => {
    if (partial.apiBaseUrl) {
      setApiBaseUrl(partial.apiBaseUrl);
    }
    setSettings((prev) => {
      const next = { ...prev, ...partial };
      localStorage.setItem("snapfind_desktop_settings", JSON.stringify(next));
      return next;
    });
  };

  const refreshRecentSessions = async () => {
    const list = await sessionStorage.list();
    list.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    setRecentSessions(list);
  };

  const loadEvents = async () => {
    try {
      const list = await eventsApi.getEvents();
      setEvents(list);
    } catch (err) {
      console.error("Failed to load events:", err);
    }
  };

  const createEvent = async (payload: CreateEventPayload): Promise<SnapEvent> => {
    const created = await eventsApi.createEvent(payload);
    setEvents((prev) => [created, ...prev]);
    setSelectedEvent(created);
    return created;
  };

  const deleteEvent = async (id: string): Promise<void> => {
    await eventsApi.deleteEvent(id);
    setEvents((prev) => prev.filter((e) => e.id !== id));
    if (selectedEvent?.id === id) {
      setSelectedEvent(null);
    }
  };


  const refreshSubscription = async (): Promise<SubscriptionStatus | null> => {
    try {
      const sub = await billingApi.getSubscription();
      setSubscription(sub);
      return sub;
    } catch {
      return null;
    }
  };

  // Restore user session on mount
  useEffect(() => {
    async function initAuth() {
      const token = getAuthToken();
      if (token) {
        try {
          const me = await authApi.getMe();
          setUser(me);
          await Promise.all([loadEvents(), refreshSubscription()]);
        } catch {
          authApi.logout();
          setUser(null);
        }
      }
      await refreshRecentSessions();
      setLoading(false);
    }

    initAuth();

    const handleUnauthorized = () => {
      setUser(null);
    };
    window.addEventListener("snapfind:unauthorized", handleUnauthorized);
    return () => window.removeEventListener("snapfind:unauthorized", handleUnauthorized);
  }, []);

  const login = async (email: string, pass: string) => {
    const res = await authApi.login(email, pass);
    setUser(res.user);
    await Promise.all([loadEvents(), refreshSubscription(), refreshRecentSessions()]);
  };

  const loginWithGoogle = async (credential: string, studioName?: string) => {
    const res = await authApi.loginWithGoogle(credential, studioName);
    setUser(res.user);
    await Promise.all([loadEvents(), refreshSubscription(), refreshRecentSessions()]);
  };

  const refreshProfile = async () => {
    try {
      const me = await authApi.getMe();
      setUser(me);
      await refreshSubscription();
    } catch (err) {
      console.error("Failed to refresh profile:", err);
    }
  };

  const updateProfile = async (data: Partial<User>) => {
    const updated = await authApi.updateProfile(data);
    setUser(updated);
  };

  const logout = () => {
    authApi.logout();
    try {
      localStorage.removeItem("snapfind_desktop_settings");
      localStorage.removeItem("snapfind_desktop_api_url");
      // Remove any snapfind_session_* items
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith("snapfind_session_") || key.startsWith("snapfind_"))) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach((k) => localStorage.removeItem(k));
    } catch (e) {
      console.warn("Error clearing localStorage on logout:", e);
    }
    setUser(null);
    setSelectedEvent(null);
    setScanResult(null);
    setUploadManager(null);
    setSubscription(null);
  };

  return (
    <AppContext.Provider
      value={{
        user,
        loading,
        login,
        loginWithGoogle,
        logout,
        refreshProfile,
        updateProfile,
        events,
        loadEvents,
        createEvent,
        deleteEvent,
        selectedEvent,
        setSelectedEvent,
        scanResult,
        setScanResult,
        uploadManager,
        setUploadManager,
        settings,
        updateSettings,
        recentSessions,
        refreshRecentSessions,
        subscription,
        refreshSubscription,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export function useApp(): AppContextType {
  const ctx = useContext(AppContext);
  if (!ctx) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return ctx;
}
