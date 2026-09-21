import { request, setAuthToken } from "./client";
import type { User } from "../types";

export interface LoginResponse {
  access_token: string;
  token_type: string;
  user: User;
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

  logout() {
    setAuthToken(null);
  },
};
