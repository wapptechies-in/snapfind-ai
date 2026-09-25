import { request } from "../client";
import type {
  Guest,
  GuestRegisterPayload,
  MarketingLead,
  WhatsAppSendRequest,
  WhatsAppDeliveryResult,
} from "@snapfind/types";

export const guestsApi = {
  async register(payload: GuestRegisterPayload): Promise<Guest> {
    return request<Guest>("/api/v1/guests/register", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  async getById(guestId: string): Promise<Guest> {
    return request<Guest>(`/api/v1/guests/${guestId}`);
  },

  async deleteGuest(guestId: string): Promise<{ status: string; guest_id: string; message: string }> {
    return request<{ status: string; guest_id: string; message: string }>(`/api/v1/guests/${guestId}`, {
      method: "DELETE",
    });
  },

  async sendWhatsApp(guestId: string, payload: WhatsAppSendRequest): Promise<WhatsAppDeliveryResult> {
    return request<WhatsAppDeliveryResult>(`/api/v1/guests/${guestId}/send-whatsapp`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  async listGuests(eventId: string): Promise<Guest[]> {
    return request<Guest[]>(`/api/v1/guests/events/${eventId}/list`);
  },

  async listLeads(eventId: string): Promise<MarketingLead[]> {
    return request<MarketingLead[]>(`/api/v1/guests/events/${eventId}/leads`);
  },
};

