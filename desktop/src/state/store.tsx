/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useEffect, useState } from "react";
import { authApi } from "../api/auth";
import { eventsApi } from "../api/events";
import { getAuthToken, setApiBaseUrl } from "../api/client";
import { sessionStorage } from "../storage/sessionStorage";
import type { AppSettings, LocalUploadSession, ScanResult, SnapEvent, User } from "../types";
import type { UploadManager } from "../upload/uploadManager";

interface AppContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  logout: () => void;
  events: SnapEvent[];
  loadEvents: () => Promise<void>;
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
}

const AppContext = createContext<AppContextType | null>(null);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [events, setEvents] = useState<SnapEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<SnapEvent | null>(null);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [uploadManager, setUploadManager] = useState<UploadManager | null>(null);
  const [recentSessions, setRecentSessions] = useState<LocalUploadSession[]>([]);

  const [settings, setSettings] = useState<AppSettings>(() => {
    const raw = localStorage.getItem("snapfind_desktop_settings");
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (parsed.apiBaseUrl === "http://localhost:8000") {
          parsed.apiBaseUrl = "http://127.0.0.1:8000";
        }
        return parsed;
      } catch {
        // fallback
      }
    }
    const savedUrl = localStorage.getItem("snapfind_desktop_api_url");
    const activeUrl = (!savedUrl || savedUrl === "http://localhost:8000") ? "http://127.0.0.1:8000" : savedUrl;
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

  // Restore user session on mount
  useEffect(() => {
    async function initAuth() {
      const token = getAuthToken();
      if (token) {
        try {
          const me = await authApi.getMe();
          setUser(me);
          await loadEvents();
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
    await loadEvents();
    await refreshRecentSessions();
  };

  const logout = () => {
    authApi.logout();
    setUser(null);
    setSelectedEvent(null);
    setScanResult(null);
    setUploadManager(null);
  };

  return (
    <AppContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        events,
        loadEvents,
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
