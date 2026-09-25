import { request } from "../client";
import type { AdminSummary, AdminUserListResponse, User } from "@snapfind/types";

export interface AdminUserFilterOptions {
  status?: string;
  role?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export const adminApi = {
  async getSummary(): Promise<AdminSummary> {
    return request<AdminSummary>("/api/v1/admin/summary");
  },

  async listUsers(filters?: AdminUserFilterOptions): Promise<AdminUserListResponse> {
    const params = new URLSearchParams();
    if (filters?.status && filters.status !== "all") params.set("status", filters.status);
    if (filters?.role && filters.role !== "all") params.set("role", filters.role);
    if (filters?.search) params.set("search", filters.search);
    if (filters?.page) params.set("page", String(filters.page));
    if (filters?.limit) params.set("limit", String(filters.limit));

    const qs = params.toString();
    return request<AdminUserListResponse>(`/api/v1/admin/users${qs ? `?${qs}` : ""}`);
  },

  async approveUser(photographerId: string): Promise<User> {
    return request<User>(`/api/v1/admin/users/${photographerId}/approve`, {
      method: "POST",
    });
  },

  async rejectUser(photographerId: string, rejectionReason?: string): Promise<User> {
    return request<User>(`/api/v1/admin/users/${photographerId}/reject`, {
      method: "POST",
      body: JSON.stringify({ rejection_reason: rejectionReason }),
    });
  },

  async suspendUser(photographerId: string): Promise<User> {
    return request<User>(`/api/v1/admin/users/${photographerId}/suspend`, {
      method: "POST",
    });
  },

  async updateUserRole(photographerId: string, role: string): Promise<User> {
    return request<User>(`/api/v1/admin/users/${photographerId}/role`, {
      method: "POST",
      body: JSON.stringify({ role }),
    });
  },
};
