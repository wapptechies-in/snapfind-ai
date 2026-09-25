import { request } from "../client";
import type { EventFolder } from "@snapfind/types";

export const foldersApi = {
  async list(eventId: string): Promise<EventFolder[]> {
    return request<EventFolder[]>(`/api/v1/events/${eventId}/folders`);
  },

  async create(eventId: string, name: string): Promise<EventFolder> {
    return request<EventFolder>(`/api/v1/events/${eventId}/folders`, {
      method: "POST",
      body: JSON.stringify({ name }),
    });
  },

  async delete(eventId: string, folderId: string): Promise<{ ok: string; message: string }> {
    return request<{ ok: string; message: string }>(`/api/v1/events/${eventId}/folders/${folderId}`, {
      method: "DELETE",
    });
  },
};

