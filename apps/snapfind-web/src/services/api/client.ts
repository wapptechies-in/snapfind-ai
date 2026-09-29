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

