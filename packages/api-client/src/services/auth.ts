import { getAuthToken, request, setAuthToken } from "../client";
import type { User } from "@snapfind/types";

export interface LoginResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface RegisterPayload {
  studio_name: string;
  email: string;
  password: string;
}

export const authApi = {
  async login(payloadOrEmail: { email: string; password?: string } | string, maybePassword?: string): Promise<LoginResponse> {
    let email = "";
    let password = "";

    if (typeof payloadOrEmail === "string") {
      email = payloadOrEmail;
      password = maybePassword || "";
    } else {
      email = payloadOrEmail.email;
      password = payloadOrEmail.password || "";
    }

    const data = await request<LoginResponse>("/api/v1/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });

    if (data.access_token) {
      setAuthToken(data.access_token);
    }
    return data;
  },

  async register(payload: RegisterPayload): Promise<LoginResponse> {
    const data = await request<LoginResponse>("/api/v1/auth/register", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    if (data.access_token) {
      setAuthToken(data.access_token);
    }
    return data;
  },

  async me(): Promise<User> {
    return request<User>("/api/v1/auth/me");
  },

  async getMe(): Promise<User> {
    return this.me();
  },

  async loginWithGoogle(credential: string, studioName?: string): Promise<LoginResponse> {
    const data = await request<LoginResponse>("/api/v1/auth/google", {
      method: "POST",
      body: JSON.stringify({ credential, studio_name: studioName }),
    });

    if (data.access_token) {
      setAuthToken(data.access_token);
    }
    return data;
  },

  async checkApprovalStatus(email: string): Promise<{ status: string; email: string; message: string; rejection_reason?: string | null }> {
    return request(`/api/v1/auth/status?email=${encodeURIComponent(email)}`);
  },

  logout(): void {
    setAuthToken(null);
  },

  isAuthenticated(): boolean {
    return !!getAuthToken();
  },
};

