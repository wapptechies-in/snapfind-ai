import { request, setAuthToken } from "./client";
import type { User } from "../types";

export interface LoginResponse {
  access_token: string;
  token_type: string;
  user: User;
}

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
  async login(email: string, password: string): Promise<LoginResponse> {
    const res = await request<LoginResponse>("/api/v1/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    setAuthToken(res.access_token);
    return res;
  },

  async getMe(): Promise<User> {
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

  async loginWithGoogle(credential: string, studioName?: string): Promise<LoginResponse> {
    const res = await request<LoginResponse>("/api/v1/auth/google", {
      method: "POST",
      body: JSON.stringify({ credential, studio_name: studioName }),
    });
    if (res && res.access_token) {
      setAuthToken(res.access_token);
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

  logout() {
    setAuthToken(null);
  },
};
