/**
 * Authentication API Service Layer
 * Status: MOCK (Phase 3)
 *
 * Implements mock authentication endpoints for future FastAPI integration.
 */

import type { AuthResponse, User } from "../../types";
import { delay } from "./client";

const DEFAULT_USER: User = {
  id: "usr_mock_1",
  email: "photographer@snapfind.ai",
  studio_name: "Marlowe Light Studio",
  created_at: "2026-01-01T00:00:00Z",
};

export const authApi = {
  async login(credentials: { email: string; password: string }): Promise<AuthResponse> {
    await delay(250);
    const user: User = {
      ...DEFAULT_USER,
      email: credentials.email || DEFAULT_USER.email,
    };
    return {
      access_token: `mock_jwt_token_${Date.now()}`,
      token_type: "bearer",
      user,
    };
  },

  async register(data: {
    studio_name: string;
    email: string;
    password: string;
  }): Promise<AuthResponse> {
    await delay(300);
    const user: User = {
      id: `usr_mock_${Date.now()}`,
      email: data.email,
      studio_name: data.studio_name,
      created_at: new Date().toISOString(),
    };
    return {
      access_token: `mock_jwt_token_${Date.now()}`,
      token_type: "bearer",
      user,
    };
  },

  async me(): Promise<User> {
    await delay(120);
    return { ...DEFAULT_USER };
  },

  async logout(): Promise<{ ok: boolean }> {
    await delay(100);
    return { ok: true };
  },
};

