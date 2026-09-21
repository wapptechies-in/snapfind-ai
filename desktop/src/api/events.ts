import { request } from "./client";
import type { SnapEvent } from "../types";

export const eventsApi = {
  async getEvents(): Promise<SnapEvent[]> {
    return request<SnapEvent[]>("/api/v1/events");
  },

  async getEventById(id: string): Promise<SnapEvent> {
    return request<SnapEvent>(`/api/v1/events/${id}`);
  },
};
