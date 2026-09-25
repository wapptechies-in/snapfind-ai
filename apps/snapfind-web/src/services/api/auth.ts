/**
 * Authentication API Service Layer
 * Connects directly to FastAPI backend (/api/v1/auth/*).
 * Status: IMPLEMENTED (Live API)
 */

import type { AuthResponse, User } from "../../types";
import { request, setStoredToken } from "./client";

export interface ProfileUpdatePayload {
  studio_name?: string;
  display_name?: string;
  phone?: string;
  bio?: string;
  website?: string;
  location?: string;
  email_notifications?: boolean;
  guest_download_alerts?: boolean;
  auto_watermark?: boolean;
}

export interface OnboardingPayload {
  display_name: string;
  phone: string;
  location: string;
  website?: string;
}

export const authApi = {
  async login(credentials: { email: string; password: string }): Promise<AuthResponse> {
    const res = await request<AuthResponse>("/api/v1/auth/login", {
      method: "POST",
      body: JSON.stringify(credentials),
    });
    if (res && res.access_token) {
      setStoredToken(res.access_token);
    }
    return res;
  },

  async register(data: {
    studio_name: string;
    email: string;
    password: string;
  }): Promise<AuthResponse> {
    const res = await request<AuthResponse>("/api/v1/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    });
    if (res && res.access_token) {
      setStoredToken(res.access_token);
    }
    return res;
  },

  async me(): Promise<User> {
    return request<User>("/api/v1/auth/me");
  },

  async updateProfile(data: ProfileUpdatePayload): Promise<User> {
    return request<User>("/api/v1/auth/profile", {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },

  async completeOnboarding(data: OnboardingPayload): Promise<User> {
    return request<User>("/api/v1/auth/onboarding/complete", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async changePassword(data: {
    current_password: string;
    new_password: string;
  }): Promise<{ ok: boolean; message: string }> {
    return request<{ ok: boolean; message: string }>("/api/v1/auth/change-password", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async forgotPassword(email: string): Promise<{ ok: boolean; message: string }> {
    return request<{ ok: boolean; message: string }>(`/api/v1/auth/forgot-password?email=${encodeURIComponent(email)}`, {
      method: "POST",
    });
  },

  async loginWithGoogle(credential: string, studioName?: string): Promise<AuthResponse> {
    const res = await request<AuthResponse>("/api/v1/auth/google", {
      method: "POST",
      body: JSON.stringify({ credential, studio_name: studioName }),
    });
    if (res && res.access_token) {
      setStoredToken(res.access_token);
    }
    return res;
  },

  async checkApprovalStatus(email: string): Promise<{
    status: string;
    email: string;
    message: string;
    rejection_reason?: string | null;
  }> {
    return request(`/api/v1/auth/status?email=${encodeURIComponent(email)}`);
  },

  async logout(): Promise<{ ok: boolean }> {
    setStoredToken(null);
    return { ok: true };
  },
};
