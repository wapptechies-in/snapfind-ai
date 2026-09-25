export interface BookingInquiry {
  id: string;
  clientName: string;
  clientEmail: string;
  clientPhone?: string;
  eventType: string;
  eventDate: string;
  location?: string;
  message?: string;
  status: "pending" | "confirmed" | "declined" | "completed";
  createdAt: string;
}

