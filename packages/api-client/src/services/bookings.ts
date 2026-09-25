import { request } from "../client";
import type { BookingInquiry } from "@snapfind/types";

export const bookingsApi = {
  async list(): Promise<BookingInquiry[]> {
    return request<BookingInquiry[]>("/api/v1/bookings");
  },

  async create(payload: Partial<BookingInquiry>): Promise<BookingInquiry> {
    return request<BookingInquiry>("/api/v1/bookings", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  async updateStatus(id: string, status: BookingInquiry["status"]): Promise<BookingInquiry> {
    return request<BookingInquiry>(`/api/v1/bookings/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
  },
};

