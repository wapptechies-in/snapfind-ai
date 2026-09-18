/**
 * Central place for talking to the FastAPI backend.
 *
 * Phase 1 only has one real endpoint (the health check), but every
 * future call should go through a small function in this file rather
 * than a fetch() scattered inside a component — that's the "API service
 * layer" called for in the project spec.
 *
 * Status: IMPLEMENTED (health check)
 *         PLANNED (auth, events, photos — later phases)
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

export type HealthResponse = {
  name: string;
  status: string;
  environment: string;
};

export class ApiError extends Error {}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });

  if (!response.ok) {
    throw new ApiError(`Request to ${path} failed with status ${response.status}`);
  }

  return (await response.json()) as T;
}

export const api = {
  /** GET / — used by the dashboard's "Backend Status" indicator. */
  getHealth: () => request<HealthResponse>("/"),
};
