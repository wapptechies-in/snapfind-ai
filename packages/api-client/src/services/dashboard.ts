import { request } from "../client";
import type { DashboardStats, DashboardSummary } from "@snapfind/types";

export const dashboardApi = {
  async getStats(): Promise<DashboardStats> {
    try {
      const data = await request<any>("/api/v1/dashboard/summary");
      return {
        totalEvents: data.total_events ?? data.totalEvents ?? 0,
        totalPhotos: data.total_photos ?? data.totalPhotos ?? 0,
        activeEvents: data.active_events ?? data.activeEvents ?? 0,
        photoSearches: data.photo_searches ?? data.photoSearches ?? 0,
        downloads: data.downloads ?? 0,
      };
    } catch {
      // Fallback
      return {
        totalEvents: 0,
        totalPhotos: 0,
        activeEvents: 0,
        photoSearches: 0,
        downloads: 0,
      };
    }
  },

  async getSummary(): Promise<DashboardSummary> {
    return this.getStats();
  },
};

