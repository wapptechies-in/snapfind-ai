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
            <h2 className="text-2xl font-serif font-bold text-soft-white tracking-tight flex items-center gap-3">
              <span>Studio Bookings & Inquiries</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-gold/15 text-gold font-sans font-semibold border border-gold/30">
                {bookings.length} total
              </span>
            </h2>
            <p className="text-xs text-muted mt-1">
              Client requests submitted through your portfolio website and booking forms.
            </p>
          </div>

          <Button size="sm" variant="secondary" onClick={fetchBookings} disabled={loading} className="border-slate-700 bg-midnight text-soft-white hover:border-gold">
            Refresh Inquiries
          </Button>
        </div>

        {feedback && (
          <Alert type={feedback.type} onClose={() => setFeedback(null)}>
            {feedback.text}
          </Alert>
        )}

        {/* Filter Pills */}
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
          {["all", "pending", "confirmed", "cancelled"].map((st) => {
            const isActive = statusFilter === st;
            return (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-lg text-xs capitalize transition-all duration-150 cursor-pointer ${
                  isActive
                    ? "bg-gold text-midnight font-bold shadow-sm"
                    : "bg-slate-panel border border-slate-800 text-muted hover:text-soft-white hover:bg-midnight"
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
          <Card className="p-16 text-center border-dashed border-slate-800 bg-slate-panel shadow-sm">
            <div className="text-3xl mb-2 text-gold">📅</div>
            <h3 className="text-base font-serif font-bold text-soft-white mb-1">No Bookings Yet</h3>
            <p className="text-xs text-muted max-w-sm mx-auto">
              Client inquiries submitted via your public portfolio website will appear here in real-time.
            </p>
          </Card>
        ) : filtered.length === 0 ? (
          <Card className="p-12 text-center bg-slate-panel border-slate-800 shadow-sm">
            <p className="text-xs text-muted">No inquiries match the active filter.</p>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {filtered.map((b) => {
              const isPending = (b.status || "").toLowerCase() === "pending";
              const isConfirmed = (b.status || "").toLowerCase() === "confirmed";

              return (
                <Card key={b.id} className="p-5 flex flex-col justify-between bg-slate-panel border-slate-800 hover:border-gold/40 transition-all shadow-sm">
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-serif font-bold text-soft-white">{b.name}</h3>
                          <Badge variant={isConfirmed ? "active" : isPending ? "processing" : "neutral"}>
                            {b.status.toUpperCase()}
                          </Badge>
                        </div>
                        <p className="text-xs text-gold font-semibold mt-0.5">
                          {b.eventType} Photoshoot
                        </p>
                      </div>

                      <span className="text-[11px] font-mono text-muted">
                        📅 {b.eventDate}
                      </span>
                    </div>

                    {/* Details */}
                    <div className="mt-3.5 space-y-1.5 text-xs text-muted">
                      <p className="flex items-center gap-2">
                        <span>📍</span>
                        <span className="text-soft-white font-medium">{b.location}</span>
                      </p>
                      <p className="flex items-center gap-2">
                        <span>👥</span>
                        <span>Estimated Guests: <strong className="text-soft-white">{b.guestCount}</strong></span>
                      </p>
                      <p className="flex items-center gap-2">
                        <span>📧</span>
                        <a href={`mailto:${b.email}`} className="text-gold hover:underline font-mono">
                          {b.email}
                        </a>
                        <span className="text-slate-700">•</span>
                        <span>📞</span>
                        <a href={`tel:${b.phone}`} className="text-soft-white font-mono">
                          {b.phone}
                        </a>
                      </p>
                    </div>

                    {b.message && (
                      <div className="mt-3 p-3 rounded-lg bg-midnight/60 border border-slate-800 text-xs text-muted italic">
                        "{b.message}"
                      </div>
                    )}
                  </div>

                  {/* Action buttons */}
                  <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
                    <span className="text-[10px] text-muted font-mono">
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
                          className="border-slate-700 bg-midnight text-soft-white text-xs hover:border-gold"
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
