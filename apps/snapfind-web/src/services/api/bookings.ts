import { request } from "./client";

export interface Booking {
  id: string;
  photographerId?: string;
  name: string;
  phone: string;
  email: string;
  eventType: string;
  eventDate: string;
  location: string;
  guestCount: number;
  message?: string;
  status: "pending" | "confirmed" | "cancelled" | string;
  createdAt: string;
  updatedAt: string;
}

export const bookingsApi = {
  async list(): Promise<Booking[]> {
    try {
      return await request<Booking[]>("/api/v1/bookings");
    } catch (err) {
      console.warn("Failed to fetch bookings from backend:", err);
      return [];
    }
  },

  async updateStatus(id: string, status: "confirmed" | "cancelled" | "pending"): Promise<Booking> {
    return await request<Booking>(`/api/v1/bookings/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
  },
};

