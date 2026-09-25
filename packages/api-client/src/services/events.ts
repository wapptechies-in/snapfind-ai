import { downloadFile, request } from "../client";
import { CreateEventPayload, EventFilterOptions, EventSettings, SnapEvent, normalizeSnapEvent } from "@snapfind/types";

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
    const rawList = await request<SnapEvent[]>(endpoint);
    return Array.isArray(rawList) ? rawList.map(normalizeSnapEvent) : [];
  },

  async getEvents(): Promise<SnapEvent[]> {
    return this.list();
  },

  async getById(id: string): Promise<SnapEvent | null> {
    try {
      const raw = await request<SnapEvent>(`/api/v1/events/${id}`);
      return normalizeSnapEvent(raw);
    } catch {
      return null;
    }
  },

  async getEventById(id: string): Promise<SnapEvent> {
    const ev = await this.getById(id);
    if (!ev) throw new Error(`Event ${id} not found`);
    return ev;
  },

  async getByToken(token: string): Promise<SnapEvent | null> {
    try {
      const raw = await request<SnapEvent>(`/api/v1/events/${token}`);
      return normalizeSnapEvent(raw);
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

  async create(payload: CreateEventPayload | any): Promise<SnapEvent> {
    const cover = payload.coverImage || payload.cover_image || payload.cover_image_url || "";
    const body = {
      name: payload.name,
      event_type: payload.eventType || payload.event_type || "Wedding",
      date: payload.date,
      location: payload.location || "",
      description: payload.description || "",
      cover_image: cover,
      coverImage: cover,
      cover_image_url: cover,
      status: payload.status || "Active",
      settings: payload.settings || {},
    };

    const raw = await request<SnapEvent>("/api/v1/events", {
      method: "POST",
      body: JSON.stringify(body),
    });
    return normalizeSnapEvent(raw);
  },

  async uploadCover(file: File): Promise<{ url: string; storageKey: string }> {
    const formData = new FormData();
    formData.append("file", file);
    return request<{ url: string; storageKey: string }>("/api/v1/events/upload-cover", {
      method: "POST",
      body: formData,
    });
  },

  async createEvent(payload: CreateEventPayload | any): Promise<SnapEvent> {
    return this.create(payload);
  },

  async update(id: string, updates: Partial<SnapEvent> | Partial<CreateEventPayload>): Promise<SnapEvent> {
    const raw = await request<SnapEvent>(`/api/v1/events/${id}`, {
      method: "PATCH",
      body: JSON.stringify(updates),
    });
    return normalizeSnapEvent(raw);
  },

  async toggleActive(id: string, isActive: boolean): Promise<SnapEvent> {
    return this.update(id, {
      isActive,
      is_active: isActive,
      status: isActive ? "Active" : "Inactive",
    } as any);
  },

  async updateSettings(id: string, settings: Partial<EventSettings>): Promise<SnapEvent> {
    const raw = await request<SnapEvent>(`/api/v1/events/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ settings }),
    });
    return normalizeSnapEvent(raw);
  },

  async delete(id: string): Promise<{ ok: boolean }> {
    return request<{ ok: boolean }>(`/api/v1/events/${id}`, {
      method: "DELETE",
    });
  },

  async deleteEvent(id: string): Promise<{ ok: boolean }> {
    return this.delete(id);
  },

  async setCoverPhoto(id: string, photoId: string): Promise<SnapEvent> {
    const raw = await request<SnapEvent>(`/api/v1/events/${id}/cover`, {
      method: "PATCH",
      body: JSON.stringify({ photo_id: photoId }),
    });
    return normalizeSnapEvent(raw);
  },

  async regenerateToken(id: string): Promise<{ token: string; public_token: string }> {
    const res = await request<{ token?: string; public_token?: string }>(`/api/v1/events/${id}/token`, {
      method: "POST",
    });
    const token = res.token || res.public_token || "";
    return { token, public_token: token };
  },

  async exportZip(id: string, eventName = "event_photos"): Promise<void> {
    const safeName = eventName.toLowerCase().replace(/[^a-z0-9]+/g, "_");
    await downloadFile(`/api/v1/events/${id}/export`, `${safeName}_all_photos.zip`);
  },

  async downloadAllZip(idOrToken: string, variant: "web" | "original" = "web"): Promise<void> {
    await downloadFile(
      `/api/v1/events/${idOrToken}/download-zip?variant=${variant}`,
      `event-${idOrToken}-photos.zip`
    );
  },
};

