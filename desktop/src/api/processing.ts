import { request } from "./client";
import type { ProcessingStatus } from "../types";

export const processingApi = {
  async getStatus(eventId: string): Promise<ProcessingStatus> {
    return request<ProcessingStatus>(`/api/v1/events/${eventId}/processing`);
  },

  async startProcessing(eventId: string): Promise<{ success: boolean; message: string }> {
    return request<{ success: boolean; message: string }>(
      `/api/v1/events/${eventId}/processing/start`,
      { method: "POST" }
    );
  },

  async reprocessEvent(eventId: string): Promise<{ success: boolean; message: string }> {
    return request<{ success: boolean; message: string }>(
      `/api/v1/events/${eventId}/processing/reprocess`,
      { method: "POST" }
    );
  },

  async retryFailed(eventId: string): Promise<{ success: boolean; message: string }> {
    return request<{ success: boolean; message: string }>(
      `/api/v1/events/${eventId}/processing/retry-failed`,
      { method: "POST" }
    );
  },

  async cancel(eventId: string): Promise<{ success: boolean; message: string }> {
    return request<{ success: boolean; message: string }>(
      `/api/v1/events/${eventId}/processing/cancel`,
      { method: "POST" }
    );
  },
};
