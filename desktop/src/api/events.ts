import { request } from "./client";
import type { CreateEventPayload, SnapEvent } from "../types";

export const eventsApi = {
  async getEvents(): Promise<SnapEvent[]> {
    return request<SnapEvent[]>("/api/v1/events");
  },

  async getEventById(id: string): Promise<SnapEvent> {
    return request<SnapEvent>(`/api/v1/events/${id}`);
  },

  async createEvent(payload: CreateEventPayload): Promise<SnapEvent> {
    return request<SnapEvent>("/api/v1/events", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  async deleteEvent(id: string): Promise<{ ok: boolean }> {
    return request<{ ok: boolean }>(`/api/v1/events/${id}`, {
      method: "DELETE",
    });
  },
};

