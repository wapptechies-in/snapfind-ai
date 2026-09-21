/**
 * Desktop API HTTP Client.
 * Communicates with FastAPI backend with token injection and error handling.
 * Status: IMPLEMENTED (Phase 8)
 */

let authToken: string | null = localStorage.getItem("snapfind_desktop_token");
let apiBaseUrl: string = localStorage.getItem("snapfind_desktop_api_url") || "http://localhost:8000";

export function getAuthToken(): string | null {
  return authToken;
}

export function setAuthToken(token: string | null) {
  authToken = token;
  if (token) {
    localStorage.setItem("snapfind_desktop_token", token);
  } else {
    localStorage.removeItem("snapfind_desktop_token");
  }
}

export function getApiBaseUrl(): string {
  return apiBaseUrl;
}

export function setApiBaseUrl(url: string) {
  apiBaseUrl = url.replace(/\/+$/, "");
  localStorage.setItem("snapfind_desktop_api_url", apiBaseUrl);
}

export async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${apiBaseUrl}${endpoint}`;
  const headers: Record<string, string> = {
    Accept: "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (!(options.body instanceof FormData) && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  if (authToken) {
    headers["Authorization"] = `Bearer ${authToken}`;
  }

  let response: Response;
  try {
    response = await fetch(url, {
      ...options,
      headers,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new Error(`Cannot connect to SnapFind API (${apiBaseUrl}): ${msg}`);
  }

  if (response.status === 401) {
    setAuthToken(null);
    window.dispatchEvent(new CustomEvent("snapfind:unauthorized"));
    throw new Error("Session expired. Please log in again.");
  }

  if (!response.ok) {
    let errorDetail = `Request failed (${response.status} ${response.statusText})`;
    try {
      const errJson = await response.json();
      if (errJson.detail) {
        errorDetail = typeof errJson.detail === "string" ? errJson.detail : JSON.stringify(errJson.detail);
      }
    } catch {
      // ignore
    }
    throw new Error(errorDetail);
  }

  if (response.status === 204) {
    return {} as T;
  }

  return response.json() as Promise<T>;
}
