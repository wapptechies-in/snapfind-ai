import React, { useEffect, useState } from "react";
import { Badge, Button, Card, LoadingSpinner } from "../components/common";
import { bookingsApi } from "../api";
import type { BookingInquiry } from "../types";

export const Bookings: React.FC = () => {
  const [bookings, setBookings] = useState<BookingInquiry[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
      const list = await bookingsApi.list();
      setBookings(list);
    } catch (err) {
      console.error("Failed to load bookings:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleUpdateStatus = async (id: string, status: BookingInquiry["status"]) => {
    try {
      const updated = await bookingsApi.updateStatus(id, status);
      setBookings((prev) => prev.map((b) => (b.id === id ? updated : b)));
    } catch (err) {
      alert(`Update failed: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <LoadingSpinner message="Loading client booking requests..." />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-serif font-bold text-charcoal tracking-tight flex items-center gap-3">
            <span>Studio Booking Inquiries</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-forest/10 text-forest font-sans font-semibold border border-forest/20">
              {bookings.length} leads
            </span>
          </h2>
          <p className="text-xs text-warm-gray mt-1">
            Client leads received through your public photographer portfolio and wedding landing page.
          </p>
        </div>
        <Button size="sm" variant="secondary" onClick={loadData} className="border-warm-beige">
          Refresh Leads
        </Button>
      </div>

      {bookings.length === 0 ? (
        <Card className="p-16 text-center border-dashed border-warm-beige bg-white shadow-sm">
          <div className="mx-auto w-12 h-12 rounded-full bg-sand-light text-forest flex items-center justify-center mb-3">
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          </div>
          <h3 className="text-base font-serif font-bold text-charcoal mb-1">No booking inquiries yet</h3>
          <p className="text-xs text-warm-gray max-w-sm mx-auto">
            When prospective clients submit contact forms on your photographer website, their requests appear here.
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {bookings.map((booking) => (
            <Card key={booking.id} className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border-warm-beige shadow-sm hover:border-forest/40 transition-all">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-base font-serif font-bold text-charcoal">{booking.clientName}</span>
                  <Badge variant={booking.status === "confirmed" ? "active" : booking.status === "declined" ? "failed" : "neutral"}>
                    {booking.status}
                  </Badge>
                  <span className="text-[10px] text-forest uppercase font-semibold">
                    {booking.eventType}
                  </span>
                </div>
                <p className="text-xs text-warm-gray">
                  Email: <span className="text-charcoal font-medium">{booking.clientEmail}</span>
                  {booking.clientPhone && <> • Phone: <span className="text-charcoal font-medium">{booking.clientPhone}</span></>}
                </p>
                <p className="text-xs text-warm-gray">
                  Event Date: <span className="text-charcoal font-medium">{booking.eventDate}</span>
                  {booking.location && <> • Location: <span className="text-charcoal font-medium">{booking.location}</span></>}
                </p>
                {booking.message && (
                  <p className="text-xs text-warm-gray bg-sand-light/60 p-2.5 rounded-lg mt-2 border border-warm-beige italic">
                    "{booking.message}"
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {booking.status !== "confirmed" && (
                  <Button size="sm" variant="primary" onClick={() => handleUpdateStatus(booking.id, "confirmed")}>
                    Confirm ✓
                  </Button>
                )}
                {booking.status !== "declined" && (
                  <Button size="sm" variant="secondary" onClick={() => handleUpdateStatus(booking.id, "declined")} className="border-warm-beige">
                    Decline
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

