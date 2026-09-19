/**
 * Events API Service Layer
 * Connects frontend to FastAPI backend (/api/v1/events) with offline fallback.
 * Status: IMPLEMENTED (Phase 4)
 */

import { mockEventsList } from "../../data/mockEvents";
import type { EventSettings, EventStatus, EventType, SnapEvent } from "../../types";
import { request } from "./client";

const STORAGE_KEY = "snapfind_mock_events_v3";

function getLocalEvents(): SnapEvent[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) return JSON.parse(data);
  } catch {
    // ignore
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(mockEventsList));
  return [...mockEventsList];
}

function saveLocalEvents(events: SnapEvent[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
}

export interface EventFilterOptions {
  search?: string;
  eventType?: EventType | "all";
  status?: EventStatus | "all";
  sortBy?: "date-desc" | "date-asc" | "photos-desc" | "name-asc";
}

export const eventsApi = {
  async list(filters?: EventFilterOptions): Promise<SnapEvent[]> {
    try {
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
      return await request<SnapEvent[]>(endpoint);
    } catch (err) {
      console.warn("FastAPI backend unreachable, falling back to local store:", err);

      let list = getLocalEvents();

      if (filters?.search) {
        const q = filters.search.toLowerCase();
        list = list.filter(
          (e) =>
            e.name.toLowerCase().includes(q) ||
            e.location.toLowerCase().includes(q) ||
            e.token.toLowerCase().includes(q)
        );
      }

      if (filters?.eventType && filters.eventType !== "all") {
        list = list.filter((e) => e.eventType === filters.eventType);
      }

      if (filters?.status && filters.status !== "all") {
        list = list.filter((e) => e.status === filters.status);
      }

      if (filters?.sortBy) {
        switch (filters.sortBy) {
          case "date-asc":
            list.sort((a, b) => a.date.localeCompare(b.date));
            break;
          case "photos-desc":
            list.sort((a, b) => b.photoCount - a.photoCount);
            break;
          case "name-asc":
            list.sort((a, b) => a.name.localeCompare(b.name));
            break;
          case "date-desc":
          default:
            list.sort((a, b) => b.date.localeCompare(a.date));
            break;
        }
      }

      return list;
    }
  },

  async getById(id: string): Promise<SnapEvent | null> {
    try {
      return await request<SnapEvent>(`/api/v1/events/${id}`);
    } catch (err) {
      console.warn(`FastAPI getById(${id}) failed, falling back to local store:`, err);
      const list = getLocalEvents();
      return list.find((e) => e.id === id) || null;
    }
  },

  async getByToken(token: string): Promise<SnapEvent | null> {
    try {
      return await request<SnapEvent>(`/api/v1/events/${token}`);
    } catch (err) {
      console.warn(`FastAPI getByToken(${token}) failed, falling back to local store:`, err);
      const list = getLocalEvents();
      return (
        list.find((e) => e.token.toLowerCase() === token.toLowerCase()) || null
      );
    }
  },

  async create(payload: {
    name: string;
    eventType: EventType;
    date: string;
    location: string;
    description: string;
    coverImage?: string;
  }): Promise<SnapEvent> {
    try {
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
      };

      const created = await request<SnapEvent>("/api/v1/events", {
        method: "POST",
        body: JSON.stringify(body),
      });

      // Keep local store synchronized
      const list = getLocalEvents();
      list.unshift(created);
      saveLocalEvents(list);

      return created;
    } catch (err) {
      console.warn("FastAPI create event failed, saving to local store:", err);
      const list = getLocalEvents();
      const token = `EVT${Math.floor(1000 + Math.random() * 9000)}`;
      const newEvent: SnapEvent = {
        id: `evt_${Date.now()}`,
        token,
        name: payload.name,
        eventType: payload.eventType,
        date: payload.date,
        location: payload.location,
        description: payload.description,
        coverImage:
          payload.coverImage ||
          "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=80",
        status: "Active",
        photoCount: 0,
        galleryViews: 0,
        searches: 0,
        downloads: 0,
        createdAt: new Date().toISOString(),
        settings: {
          galleryVisibility: true,
          faceSearch: true,
          downloads: true,
          originalDownloads: false,
          watermark: true,
          eventExpiry: false,
        },
      };
      list.unshift(newEvent);
      saveLocalEvents(list);
      return newEvent;
    }
  },

  async update(id: string, updates: Partial<SnapEvent>): Promise<SnapEvent> {
    try {
      const updated = await request<SnapEvent>(`/api/v1/events/${id}`, {
        method: "PATCH",
        body: JSON.stringify(updates),
      });

      const list = getLocalEvents();
      const index = list.findIndex((e) => e.id === id);
      if (index !== -1) {
        list[index] = { ...list[index], ...updated };
        saveLocalEvents(list);
      }
      return updated;
    } catch (err) {
      console.warn(`FastAPI update(${id}) failed, applying to local store:`, err);
      const list = getLocalEvents();
      const index = list.findIndex((e) => e.id === id);
      if (index === -1) throw new Error("Event not found");

      list[index] = { ...list[index], ...updates };
      saveLocalEvents(list);
      return list[index];
    }
  },

  async updateSettings(id: string, settings: Partial<EventSettings>): Promise<SnapEvent> {
    try {
      const updated = await request<SnapEvent>(`/api/v1/events/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ settings }),
      });

      const list = getLocalEvents();
      const index = list.findIndex((e) => e.id === id);
      if (index !== -1) {
        list[index] = { ...list[index], ...updated };
        saveLocalEvents(list);
      }
      return updated;
    } catch (err) {
      console.warn(`FastAPI updateSettings(${id}) failed, applying to local store:`, err);
      const list = getLocalEvents();
      const index = list.findIndex((e) => e.id === id);
      if (index === -1) throw new Error("Event not found");

      list[index].settings = {
        ...(list[index].settings || {
          galleryVisibility: true,
          faceSearch: true,
          downloads: true,
          originalDownloads: false,
          watermark: true,
          eventExpiry: false,
        }),
        ...settings,
      } as EventSettings;
      saveLocalEvents(list);
      return list[index];
    }
  },

  async delete(id: string): Promise<void> {
    try {
      await request(`/api/v1/events/${id}`, { method: "DELETE" });
    } catch (err) {
      console.warn(`FastAPI delete(${id}) failed, deleting from local store:`, err);
    }
    const list = getLocalEvents().filter((e) => e.id !== id);
    saveLocalEvents(list);
  },
};
