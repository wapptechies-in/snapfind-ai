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

export async function submitBookingEnquiry(
  enquiry: BookingEnquiry
): Promise<{ ok: true }> {
  // MOCK implementation — replace with a real request once the backend
  // exposes a booking endpoint, e.g.:
  //
  //   const res = await fetch(`${API_BASE_URL}/bookings`, {
  //     method: "POST",
  //     headers: { "Content-Type": "application/json" },
  //     body: JSON.stringify(enquiry),
  //   });
  //   if (!res.ok) throw new Error("Booking submission failed");
  //   return res.json();

  void enquiry; // not sent anywhere yet — mock only
  await new Promise((resolve) => setTimeout(resolve, 700));
  return { ok: true };
}
