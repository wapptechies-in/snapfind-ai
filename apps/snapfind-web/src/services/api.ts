/**
 * Central API service layer for SnapFind Web.
 * Connects to the FastAPI backend with token injection, error handling,
 * and typed endpoints for Auth, Events, and Dashboard.
 *
 * Status: IMPLEMENTED (Phase 2)
 */

import type { AuthResponse, DashboardSummary, SnapEvent, User } from "../types";

const defaultApiHost = typeof window !== "undefined" && window.location.hostname ? window.location.hostname : "127.0.0.1";
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? `http://${defaultApiHost}:8000`;
const TOKEN_KEY = "snapfind_token";

export type HealthResponse = {
  name: string;
  status: string;
  environment: string;
};

export class ApiError extends Error {
  status: number;
  detail?: string;

  constructor(message: string, status: number, detail?: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.detail = detail;
  }
}

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string | null): void {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...((init?.headers as Record<string, string>) || {}),
  };

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers,
  });

  if (!response.ok) {
    let errorDetail: string | undefined;
    try {
      const errJson = await response.json();
      errorDetail = errJson.detail || JSON.stringify(errJson);
    } catch {
      errorDetail = await response.text();
    }
    throw new ApiError(
      errorDetail || `Request failed with status ${response.status}`,
      response.status,
      errorDetail
    );
  }

  return (await response.json()) as T;
}

export const api = {
  /** GET / — health check */
  getHealth: () => request<HealthResponse>("/"),

  /** Auth endpoints */
  auth: {
    login: (credentials: { email: string; password: string }) =>
      request<AuthResponse>("/api/v1/auth/login", {
        method: "POST",
        body: JSON.stringify(credentials),
      }),

    register: (data: { studio_name: string; email: string; password: string }) =>
      request<AuthResponse>("/api/v1/auth/register", {
        method: "POST",
        body: JSON.stringify(data),
      }),

    me: () => request<User>("/api/v1/auth/me"),
  },

  /** Events endpoints */
  events: {
    list: (params?: { status?: string; search?: string }) => {
      const searchParams = new URLSearchParams();
      if (params?.status && params.status !== "all") {
        searchParams.set("status", params.status);
      }
      if (params?.search) {
        searchParams.set("search", params.search);
      }
      const qs = searchParams.toString();
      return request<SnapEvent[]>(`/api/v1/events${qs ? `?${qs}` : ""}`);
    },

    get: (id: string) => request<SnapEvent>(`/api/v1/events/${id}`),

    create: (data: { name: string; date: string; status?: string }) =>
      request<SnapEvent>("/api/v1/events", {
        method: "POST",
        body: JSON.stringify(data),
      }),

    update: (id: string, data: Partial<{ name: string; date: string; status: string }>) =>
      request<SnapEvent>(`/api/v1/events/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),

    delete: (id: string) =>
      request<{ ok: boolean }>(`/api/v1/events/${id}`, {
        method: "DELETE",
      }),
  },

  /** Dashboard metrics */
  dashboard: {
    getSummary: () => request<DashboardSummary>("/api/v1/dashboard/summary"),
  },
};

// Re-export Phase 3 frontend API service layer
export * from "./api/index";

