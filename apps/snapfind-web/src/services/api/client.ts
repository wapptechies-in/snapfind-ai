/**
 * SnapFind Web — API Client
 * Connects to FastAPI backend with graceful fallback when offline.
 * Status: IMPLEMENTED (Phase 4)
 */

export const API_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL as string) || "http://localhost:8000";

export const delay = (ms = 250): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

export class ApiError extends Error {
  status: number;
  detail?: string;

  constructor(message: string, status = 400, detail?: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.detail = detail;
  }
}

export function getAuthToken(): string | null {
  try {
    const session = localStorage.getItem("snapfind_auth_session");
    if (session) {
      const parsed = JSON.parse(session);
      return parsed.access_token || parsed.token || null;
    }
  } catch {
    // ignore
  }
  return null;
}

export async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    let detail = "";
    try {
      const errJson = await res.json();
      detail = errJson.detail || JSON.stringify(errJson);
    } catch {
      detail = await res.text();
    }
    throw new ApiError(detail || `HTTP ${res.status}`, res.status, detail);
  }

  return res.json() as Promise<T>;
}
