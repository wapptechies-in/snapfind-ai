/**
 * SnapFind Web — API Client
 * Connects to FastAPI backend with graceful fallback when offline.
 * Status: IMPLEMENTED (Phase 4)
 */

export function getApiBaseUrl(): string {
  if (typeof window !== "undefined" && window.localStorage) {
    const saved = localStorage.getItem("snapfind_api_url") || localStorage.getItem("snapfind_desktop_api_url");
    if (saved && saved !== "http://localhost:8000" && saved !== "http://127.0.0.1:8000") {
      return saved.replace(/\/+$/, "");
    }
  }

  const envUrl = (import.meta.env.VITE_API_URL as string) || (import.meta.env.VITE_API_BASE_URL as string);
  if (envUrl) {
    return envUrl.replace(/\/+$/, "");
  }

  if (typeof window !== "undefined" && window.location.hostname) {
    const h = window.location.hostname;
    if (h === "localhost" || h === "127.0.0.1") {
      return "http://127.0.0.1:8000";
    }
    // Only bind to port 8000 if accessing over local LAN numeric IP (e.g. 192.168.x.x, 10.x.x.x)
    if (/^(\d{1,3}\.){3}\d{1,3}$/.test(h)) {
      return `http://${h}:8000`;
    }
  }

  return "https://snapfind-api.onrender.com";
}

export function setApiBaseUrl(url: string): void {
  if (typeof window !== "undefined" && window.localStorage) {
    localStorage.setItem("snapfind_api_url", url.replace(/\/+$/, ""));
    localStorage.setItem("snapfind_desktop_api_url", url.replace(/\/+$/, ""));
  }
}

export const API_BASE_URL = getApiBaseUrl();


export const delay = (ms = 250): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

export class ApiError extends Error {
  status: number;
  detail?: string;

  constructor(message: string, status = 400, detail?: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.detail = detail || message;
  }
}

export function extractErrorMessage(err: unknown): string {
  if (!err) return "An unexpected error occurred.";
  if (typeof err === "string") return err;

  if (err instanceof ApiError) {
    if (err.detail) {
      if (typeof err.detail === "string") return err.detail;
      if (Array.isArray(err.detail)) {
        return (err.detail as any[])
          .map((d) => (d.msg ? (d.loc ? `${d.loc.slice(-1)}: ${d.msg}` : d.msg) : JSON.stringify(d)))
          .join("; ");
      }
      return JSON.stringify(err.detail);
    }
    return err.message;
  }

  if (typeof err === "object" && err !== null) {
    const e = err as any;
    if (e.detail) {
      if (typeof e.detail === "string") return e.detail;
      if (Array.isArray(e.detail)) {
        return (e.detail as any[])
          .map((d: any) => (d.msg ? (d.loc ? `${d.loc.slice(-1)}: ${d.msg}` : d.msg) : JSON.stringify(d)))
          .join("; ");
      }
      return JSON.stringify(e.detail);
    }
    if (e.message && typeof e.message === "string") return e.message;
  }

  if (err instanceof Error) return err.message;
  return String(err);
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

  const baseUrl = getApiBaseUrl();
  let res: Response;
  try {
    res = await fetch(`${baseUrl}${endpoint}`, {
      ...options,
      headers,
    });
  } catch (err: unknown) {
    if (err instanceof ApiError) throw err;
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("Failed to fetch") || msg.includes("NetworkError") || msg.includes("Network request failed")) {
      throw new ApiError(
        `Unable to reach backend API at ${baseUrl}. Please ensure the server is live and CORS is enabled.`,
        0,
        `Network error: Cannot reach ${baseUrl}`
      );
    }
    throw new ApiError(msg, 0, msg);
  }

  if (res.status === 401) {
    setAuthToken(null);
    window.dispatchEvent(new CustomEvent("snapfind:unauthorized"));
  }

  if (!res.ok) {
    let detail: any = "";
    try {
      const errJson = await res.json();
      if (typeof errJson.detail === "string") {
        detail = errJson.detail;
      } else if (Array.isArray(errJson.detail)) {
        detail = errJson.detail
          .map((d: any) => (d.msg ? (d.loc ? `${d.loc.slice(-1)}: ${d.msg}` : d.msg) : JSON.stringify(d)))
          .join("; ");
      } else if (errJson.detail) {
        detail = JSON.stringify(errJson.detail);
      } else if (errJson.message) {
        detail = errJson.message;
      } else {
        detail = JSON.stringify(errJson);
      }
    } catch {
      detail = await res.text();
    }

    let message = typeof detail === "string" ? detail : JSON.stringify(detail);
    if (res.status === 404) {
      message = `Backend endpoint not found (404: ${endpoint}). If using Render, ensure the latest deploy has finished and your API URL points to the running backend service.`;
    } else if (!message) {
      message = `Server responded with HTTP ${res.status}`;
    }

    throw new ApiError(message, res.status, typeof detail === "string" ? detail : JSON.stringify(detail));
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

