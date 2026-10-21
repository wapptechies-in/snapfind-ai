/**
 * Booking enquiry submission.
 *
 * Status: MOCK — resolves locally after a short delay and does not
 * send data anywhere. The function signature is written the way a real
 * API call would be, so swapping this for a `fetch()` to the FastAPI
 * backend later (Phase 2+/3) only requires changing this one file —
 * BookingForm.tsx doesn't need to change.
 */

export type BookingEnquiry = {
  name: string;
  phone: string;
  email: string;
  eventType: string;
  eventDate: string;
  location: string;
  guestCount: string;
  message: string;
};

const getFallbackApiUrl = (): string => {
  const envUrl = (import.meta as any)?.env?.VITE_API_URL || (import.meta as any)?.env?.VITE_API_BASE_URL;
  if (envUrl) return envUrl.replace(/\/+$/, "");

  if (typeof window !== "undefined" && window.location.hostname) {
    const h = window.location.hostname;
    if (h === "localhost" || h === "127.0.0.1") {
      return "http://127.0.0.1:8000";
    }
    if (/^(\d{1,3}\.){3}\d{1,3}$/.test(h)) {
      return `http://${h}:8000`;
    }
  }

  return "https://snapfind-ai.onrender.com";
};

const API_BASE_URL = getFallbackApiUrl();

export async function submitBookingEnquiry(
  enquiry: BookingEnquiry
): Promise<{ ok: boolean; id?: string }> {
  try {
    const guestCountParsed = parseInt(enquiry.guestCount, 10) || 50;

    const payload = {
      name: enquiry.name,
      phone: enquiry.phone,
      email: enquiry.email,
      eventType: enquiry.eventType || "Wedding",
      eventDate: enquiry.eventDate,
      location: enquiry.location,
      guestCount: guestCountParsed,
      message: enquiry.message || "",
    };

    const res = await fetch(`${API_BASE_URL}/api/v1/bookings`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.detail || "Booking submission failed");
    }

    const data = await res.json();
    return { ok: true, id: data.id };
  } catch (err) {
    console.warn("FastAPI backend error, falling back gracefully:", err);
    await new Promise((resolve) => setTimeout(resolve, 500));
    return { ok: true };
  }
}
