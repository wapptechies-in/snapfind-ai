/**
 * SnapFind Web — API Client
 * Connects to FastAPI backend with graceful fallback when offline.
 * Status: IMPLEMENTED (Phase 4)
 */

const defaultApiHost = typeof window !== "undefined" && window.location.hostname ? window.location.hostname : "127.0.0.1";
export const API_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL as string) || `http://${defaultApiHost}:8000`;


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
    const rawToken = localStorage.getItem("snapfind_token");
    if (rawToken && !rawToken.startsWith("{")) {
      return rawToken;
    }
    if (rawToken) {
      const parsed = JSON.parse(rawToken);
      if (parsed.access_token || parsed.token) {
        return parsed.access_token || parsed.token;
      }
    }
  } catch {
    // ignore
  }

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

export function setAuthToken(token: string | null): void {
  if (token) {
    localStorage.setItem("snapfind_token", token);
  } else {
    localStorage.removeItem("snapfind_token");
    localStorage.removeItem("snapfind_auth_session");
  }
}

export const getStoredToken = getAuthToken;
export const setStoredToken = setAuthToken;

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

  if (res.status === 401) {
    setAuthToken(null);
    window.dispatchEvent(new CustomEvent("snapfind:unauthorized"));
  }

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

export async function downloadFile(
  endpoint: string,
  defaultFilename = "download.zip",
  options: RequestInit = {}
): Promise<void> {
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
    throw new ApiError(detail || `Download failed with HTTP ${res.status}`, res.status, detail);
  }

  let filename = defaultFilename;
  const disposition = res.headers.get("Content-Disposition");
  if (disposition && disposition.includes("filename=")) {
    const match = disposition.match(/filename="?([^"]+)"?/);
    if (match && match[1]) {
      filename = match[1];
    }
  }

  const blob = await res.blob();
  const blobUrl = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = blobUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(blobUrl);
}

