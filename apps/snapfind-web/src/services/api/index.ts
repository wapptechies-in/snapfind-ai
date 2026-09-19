/**
 * SnapFind Web Application — Unified API Service Module
 * Status: MOCK (Phase 3)
 */

import { mockDashboardStats } from "../../data/mockStats";
import { delay } from "./client";
import { authApi } from "./auth";
import { eventsApi } from "./events";
import { photosApi } from "./photos";
import { searchApi } from "./search";

export { authApi, eventsApi, photosApi, searchApi };

export const dashboardApi = {
  async getStats() {
    await delay(150);
    return { ...mockDashboardStats };
  },
};
