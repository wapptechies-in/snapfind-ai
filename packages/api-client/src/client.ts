import { TokenStorageAdapter, defaultTokenStorage } from "./tokenStorage";

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

export const delay = (ms = 250): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

let tokenStorage: TokenStorageAdapter = defaultTokenStorage;

const getDefaultBaseUrl = (): string => {
  if (typeof window !== "undefined" && window.localStorage) {
    const saved = localStorage.getItem("snapfind_desktop_api_url") || localStorage.getItem("snapfind_api_url");
    if (saved && saved !== "http://localhost:8000" && saved !== "http://127.0.0.1:8000") {
      return saved.replace(/\/+$/, "");
    }
  }

  const envUrl = (import.meta as any)?.env?.VITE_API_URL || (import.meta as any)?.env?.VITE_API_BASE_URL;
  if (envUrl) return envUrl.replace(/\/+$/, "");

  if (typeof window !== "undefined" && window.location.hostname) {
    const h = window.location.hostname;
    if (h === "localhost" || h === "127.0.0.1") {
      return "http://127.0.0.1:8000";
    }
    // Only bind to http://${h}:8000 if it is a numeric LAN IP (e.g. 192.168.x.x, 10.x.x.x)
    if (/^(\d{1,3}\.){3}\d{1,3}$/.test(h)) {
      return `http://${h}:8000`;
    }
  }

  return "https://snapfind-api.onrender.com";
};

let currentBaseUrl: string = getDefaultBaseUrl();

export function setTokenStorage(storage: TokenStorageAdapter): void {
  tokenStorage = storage;
}

export function getAuthToken(): string | null {
  return tokenStorage.getToken();
}

export function setAuthToken(token: string | null): void {
  tokenStorage.setToken(token);
}

export const getStoredToken = getAuthToken;
export const setStoredToken = setAuthToken;

export function getApiBaseUrl(): string {
  return currentBaseUrl;
}

export function setApiBaseUrl(url: string): void {
  currentBaseUrl = url.replace(/\/+$/, "");
  if (typeof window !== "undefined" && window.localStorage) {
    localStorage.setItem("snapfind_desktop_api_url", currentBaseUrl);
    localStorage.setItem("snapfind_api_url", currentBaseUrl);
  }
}

export async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    Accept: "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (!(options.body instanceof FormData) && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const url = `${currentBaseUrl}${endpoint}`;
  let res: Response;

  try {
    res = await fetch(url, {
      ...options,
      headers,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new ApiError(`Cannot connect to SnapFind API (${currentBaseUrl}): ${msg}`, 0, msg);
  }

  if (res.status === 401) {
    setAuthToken(null);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("snapfind:unauthorized"));
    }
  }

  if (res.status === 204) {
    return {} as T;
  }

  if (!res.ok) {
    let detail = "";
    try {
      const errJson = await res.json();
      detail = errJson.detail ? (typeof errJson.detail === "string" ? errJson.detail : JSON.stringify(errJson.detail)) : JSON.stringify(errJson);
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
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const url = `${currentBaseUrl}${endpoint}`;
  const res = await fetch(url, {
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

