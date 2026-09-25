import { useEffect, useState } from "react";
import DashboardLayout from "../layouts/DashboardLayout";
import { Alert, Badge, Button, Card, LoadingSpinner } from "../components/common";
import { bookingsApi, type Booking } from "../services/api/bookings";

export default function Bookings() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const data = await bookingsApi.list();
      setBookings(data);
    } catch {
      setFeedback({ type: "error", text: "Failed to load client bookings." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleUpdateStatus = async (id: string, newStatus: "confirmed" | "cancelled" | "pending") => {
    try {
      await bookingsApi.updateStatus(id, newStatus);
      setFeedback({ type: "success", text: `Booking marked as ${newStatus}!` });
      await fetchBookings();
      setTimeout(() => setFeedback(null), 3000);
    } catch {
      setFeedback({ type: "error", text: "Failed to update booking status." });
    }
  };

  const filtered = bookings.filter((b) => {
    if (statusFilter === "all") return true;
    return (b.status || "").toLowerCase() === statusFilter.toLowerCase();
  });

  return (
    <DashboardLayout title="Client Bookings & Inquiries">
      <div className="space-y-6 max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-serif font-bold text-charcoal tracking-tight flex items-center gap-3">
              <span>Studio Bookings & Inquiries</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-forest/10 text-forest font-sans font-semibold border border-forest/20">
                {bookings.length} total
              </span>
            </h2>
            <p className="text-xs text-warm-gray mt-1">
              Client requests submitted through your portfolio website and booking forms.
            </p>
          </div>

          <Button size="sm" variant="secondary" onClick={fetchBookings} disabled={loading} className="border-warm-beige">
            Refresh Inquiries
          </Button>
        </div>

        {feedback && (
          <Alert type={feedback.type} onClose={() => setFeedback(null)}>
            {feedback.text}
          </Alert>
        )}

        {/* Filter Pills */}
        <div className="flex items-center gap-2 border-b border-warm-beige pb-3">
          {["all", "pending", "confirmed", "cancelled"].map((st) => {
            const isActive = statusFilter === st;
            return (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-lg text-xs capitalize transition-all duration-150 cursor-pointer ${
                  isActive
                    ? "bg-forest text-cream font-semibold shadow-sm"
                    : "bg-white border border-warm-beige text-warm-gray hover:text-charcoal hover:bg-sand-light"
                }`}
              >
                {st}
              </button>
            );
          })}
        </div>

        {/* Content */}
        {loading ? (
          <LoadingSpinner message="Loading client booking inquiries..." />
        ) : bookings.length === 0 ? (
          <Card className="p-16 text-center border-dashed border-warm-beige bg-white shadow-sm">
            <div className="text-3xl mb-2 text-forest">📅</div>
            <h3 className="text-base font-serif font-bold text-charcoal mb-1">No Bookings Yet</h3>
            <p className="text-xs text-warm-gray max-w-sm mx-auto">
              Client inquiries submitted via your public portfolio website will appear here in real-time.
            </p>
          </Card>
        ) : filtered.length === 0 ? (
          <Card className="p-12 text-center bg-white border-warm-beige shadow-sm">
            <p className="text-xs text-warm-gray">No inquiries match the active filter.</p>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {filtered.map((b) => {
              const isPending = (b.status || "").toLowerCase() === "pending";
              const isConfirmed = (b.status || "").toLowerCase() === "confirmed";

              return (
                <Card key={b.id} className="p-5 flex flex-col justify-between bg-white border-warm-beige hover:border-forest/40 transition-all shadow-sm">
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-serif font-bold text-charcoal">{b.name}</h3>
                          <Badge variant={isConfirmed ? "active" : isPending ? "processing" : "neutral"}>
                            {b.status.toUpperCase()}
                          </Badge>
                        </div>
                        <p className="text-xs text-forest font-semibold mt-0.5">
                          {b.eventType} Photoshoot
                        </p>
                      </div>

                      <span className="text-[11px] font-mono text-warm-gray">
                        📅 {b.eventDate}
                      </span>
                    </div>

                    {/* Details */}
                    <div className="mt-3.5 space-y-1.5 text-xs text-warm-gray">
                      <p className="flex items-center gap-2">
                        <span>📍</span>
                        <span className="text-charcoal font-medium">{b.location}</span>
                      </p>
                      <p className="flex items-center gap-2">
                        <span>👥</span>
                        <span>Estimated Guests: <strong className="text-charcoal">{b.guestCount}</strong></span>
                      </p>
                      <p className="flex items-center gap-2">
                        <span>📧</span>
                        <a href={`mailto:${b.email}`} className="text-forest hover:underline font-mono">
                          {b.email}
                        </a>
                        <span className="text-warm-beige">•</span>
                        <span>📞</span>
                        <a href={`tel:${b.phone}`} className="text-charcoal font-mono">
                          {b.phone}
                        </a>
                      </p>
                    </div>

                    {b.message && (
                      <div className="mt-3 p-3 rounded-lg bg-sand-light/60 border border-warm-beige text-xs text-warm-gray italic">
                        "{b.message}"
                      </div>
                    )}
                  </div>

                  {/* Action buttons */}
                  <div className="mt-4 pt-3 border-t border-warm-beige flex items-center justify-between">
                    <span className="text-[10px] text-warm-gray font-mono">
                      Received {new Date(b.createdAt).toLocaleDateString()}
                    </span>

                    <div className="flex items-center gap-2">
                      {isPending && (
                        <>
                          <Button
                            size="sm"
                            variant="primary"
                            onClick={() => handleUpdateStatus(b.id, "confirmed")}
                            className="text-xs"
                          >
                            Confirm ✓
                          </Button>
                          <Button
                            size="sm"
                            variant="danger"
                            onClick={() => handleUpdateStatus(b.id, "cancelled")}
                            className="text-xs"
                          >
                            Decline
                          </Button>
                        </>
                      )}
                      {isConfirmed && (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => handleUpdateStatus(b.id, "pending")}
                          className="border-warm-beige text-xs"
                        >
                          Mark Pending
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

