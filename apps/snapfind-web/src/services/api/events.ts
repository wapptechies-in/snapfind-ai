/**
 * Events API Service Layer
 * Connects directly to FastAPI backend (/api/v1/events) with full parity with Desktop.
 * Status: IMPLEMENTED (Live API)
 */

import type { EventSettings, EventStatus, EventType, SnapEvent } from "../../types";
import { downloadFile, request } from "./client";

export interface EventFilterOptions {
  search?: string;
  eventType?: EventType | "all";
  status?: EventStatus | "all";
  sortBy?: "date-desc" | "date-asc" | "photos-desc" | "name-asc";
}

export const eventsApi = {
  async list(filters?: EventFilterOptions): Promise<SnapEvent[]> {
    const params = new URLSearchParams();
    if (filters?.search) params.set("search", filters.search);
    if (filters?.eventType && filters.eventType !== "all") {
      params.set("eventType", filters.eventType);
    }
    if (filters?.status && filters.status !== "all") {
      params.set("status", filters.status);
    }
    if (filters?.sortBy) params.set("sortBy", filters.sortBy);

    const qs = params.toString();
    const endpoint = `/api/v1/events${qs ? `?${qs}` : ""}`;
    return request<SnapEvent[]>(endpoint);
  },

  async getById(id: string): Promise<SnapEvent | null> {
    try {
      return await request<SnapEvent>(`/api/v1/events/${id}`);
    } catch {
      return null;
    }
  },

  async getByToken(token: string): Promise<SnapEvent | null> {
    try {
      return await request<SnapEvent>(`/api/v1/events/${token}`);
    } catch {
      return null;
    }
  },

  async getPublicPhotos(
    idOrToken: string,
    page = 1,
    limit = 500
  ): Promise<{
    eventId: string;
    eventName: string;
    token: string;
    downloadsEnabled: boolean;
    originalDownloadsEnabled: boolean;
    total: number;
    items: any[];
  }> {
    return request<{
      eventId: string;
      eventName: string;
      token: string;
      downloadsEnabled: boolean;
      originalDownloadsEnabled: boolean;
      total: number;
      items: any[];
    }>(`/api/v1/events/${idOrToken}/public-photos?page=${page}&limit=${limit}`);
  },

  async create(payload: {
    name: string;
    eventType: EventType;
    date: string;
    location: string;
    description: string;
    coverImage?: string;
    settings?: Partial<EventSettings>;
  }): Promise<SnapEvent> {
    const body = {
      name: payload.name,
      eventType: payload.eventType,
      date: payload.date,
      location: payload.location,
      description: payload.description,
      coverImage:
        payload.coverImage ||
        "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=80",
      status: "Active",
      settings: payload.settings,
    };

    return request<SnapEvent>("/api/v1/events", {
      method: "POST",
      body: JSON.stringify(body),
    });
  },

  async update(id: string, updates: Partial<SnapEvent>): Promise<SnapEvent> {
    return request<SnapEvent>(`/api/v1/events/${id}`, {
      method: "PATCH",
      body: JSON.stringify(updates),
    });
  },

  async updateSettings(id: string, settings: Partial<EventSettings>): Promise<SnapEvent> {
    return request<SnapEvent>(`/api/v1/events/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ settings }),
    });
  },

  async delete(id: string): Promise<void> {
    await request(`/api/v1/events/${id}`, { method: "DELETE" });
  },

  async setCoverPhoto(id: string, photoId: string): Promise<SnapEvent> {
    return request<SnapEvent>(`/api/v1/events/${id}/cover`, {
      method: "PATCH",
      body: JSON.stringify({ photo_id: photoId }),
    });
  },

  /**
   * Download all photos for an event as a ZIP archive.
   */
  async downloadAllZip(idOrToken: string, variant: "web" | "original" = "web"): Promise<void> {
    await downloadFile(
      `/api/v1/events/${idOrToken}/download-zip?variant=${variant}`,
      `event-${idOrToken}-photos.zip`
    );
  },
};
