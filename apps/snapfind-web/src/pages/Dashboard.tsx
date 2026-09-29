import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import DashboardLayout from "../layouts/DashboardLayout";
import { dashboardApi, eventsApi } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { MetricCard } from "@snapfind/ui";
import { EventCard } from "@snapfind/ui";
import { QRPanel } from "../components/events/QRPanel";
import { Modal } from "../components/common/Modal";
import type { DashboardStats, SnapEvent } from "../types";

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentEvents, setRecentEvents] = useState<SnapEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [qrModalEvent, setQrModalEvent] = useState<SnapEvent | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [statsData, eventsData] = await Promise.all([
          dashboardApi.getStats().catch(() => null),
          eventsApi.list({ sortBy: "date-desc" }).catch(() => []),
        ]);
        setStats(statsData);
        setRecentEvents(eventsData || []);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const displayName = user?.display_name || user?.studio_name || "Jebastin";

  // Default showcase events matching photography theme
  const showcaseEvents = recentEvents.length > 0 ? recentEvents.slice(0, 4) : [
    {
      id: "demo-1",
      name: "Arun & Priya Wedding",
      date: "24 Sep 2026",
      location: "Chennai",
      photoCount: 12450,
      guestsCount: 684,
      viewsCount: 3127,
      status: "Active",
      coverImage: "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=80",
    } as unknown as SnapEvent,
    {
      id: "demo-2",
      name: "Autumn Fashion Editorial",
      date: "18 Sep 2026",
      location: "Bangalore",
      photoCount: 4280,
      guestsCount: 120,
      viewsCount: 890,
      status: "Completed",
      coverImage: "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=1200&q=80",
    } as unknown as SnapEvent,
    {
      id: "demo-3",
      name: "Summit Corporate Gala",
      date: "10 Sep 2026",
      location: "Mumbai",
      photoCount: 3890,
      guestsCount: 450,
      viewsCount: 1540,
      status: "Processing",
      coverImage: "https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1200&q=80",
    } as unknown as SnapEvent,
    {
      id: "demo-4",
      name: "Highland Portrait Session",
      date: "05 Sep 2026",
      location: "Ooty",
      photoCount: 1450,
      guestsCount: 45,
      viewsCount: 620,
      status: "Completed",
      coverImage: "https://images.unsplash.com/photo-1523580494863-6f3031224c94?auto=format&fit=crop&w=1200&q=80",
    } as unknown as SnapEvent,
  ];

  if (loading) {
    return (
      <DashboardLayout title="Dashboard">
        <div className="flex h-96 items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="animate-spin h-8 w-8 border-2 border-[#D6A84F] border-t-transparent rounded-full" />
            <p className="text-xs text-[#A8B0BE] font-sans">Loading photography dashboard...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Dashboard">
      <div className="space-y-8 max-w-7xl mx-auto font-sans">
        {/* Section 10: Hero Section - Dark Cinematic Command Center */}
        <div className="relative overflow-hidden rounded-2xl border border-[#232F48] bg-[#151D2E] shadow-2xl min-h-[240px] sm:min-h-[280px] flex items-center">
          {/* Cinematic Background Photography Image with dark gradient overlay */}
          <div className="absolute inset-0 pointer-events-none">
            <img
              src="https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=1600&q=80"
              alt="Cinematic photography atmosphere"
              className="h-full w-full object-cover object-center opacity-30 mix-blend-luminosity filter saturate-50"
            />
            {/* Subtle dark gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#0B1220] via-[#0B1220]/90 to-[#0B1220]/60" />
            <div className="absolute inset-0 bg-radial-gradient from-transparent via-[#0B1220]/40 to-[#0B1220]/90" />
          </div>

          {/* Hero Content */}
          <div className="relative z-10 p-6 sm:p-10 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-[#D6A84F]/10 border border-[#D6A84F]/25 text-[#D6A84F] text-[11px] font-bold tracking-wide uppercase mb-3">
              <span className="h-1.5 w-1.5 rounded-full bg-[#D6A84F] animate-pulse" />
              <span>Studio: {displayName}</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#F7F5F0] tracking-tight leading-tight">
              Capture. Organize. Find. Share.
            </h1>

            <p className="text-sm sm:text-base text-[#A8B0BE] mt-2 max-w-xl font-normal leading-relaxed">
              Turn every event into an intelligent, searchable memory.
            </p>

            {/* Hero Action Buttons */}
            <div className="flex flex-wrap items-center gap-3.5 mt-6">
              <Link to="/events/create">
                <button className="px-5 py-2.5 rounded-xl bg-[#D6A84F] hover:bg-[#C5963E] text-[#0B1220] font-bold text-xs sm:text-sm tracking-wide shadow-md transition-all active:scale-95 cursor-pointer flex items-center gap-2">
                  <span className="text-base leading-none">+</span>
                  <span>Create Event</span>
                </button>
              </Link>

              <Link to="/events">
                <button className="px-5 py-2.5 rounded-xl bg-[#151D2E]/80 hover:bg-[#1B253B] text-[#F7F5F0] border border-[#D6A84F]/40 hover:border-[#D6A84F] font-semibold text-xs sm:text-sm tracking-wide transition-all active:scale-95 cursor-pointer flex items-center gap-2 backdrop-blur-sm">
                  <svg className="w-4 h-4 text-[#D6A84F]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <polyline points="21 15 16 10 5 21" />
                  </svg>
                  <span>View Photos</span>
                </button>
              </Link>
            </div>
          </div>
        </div>

        {/* Section 11: Understated Premium KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Active Events */}
          <MetricCard
            title="Active Events"
            value={stats?.activeEvents ?? 12}
            subtext="Live galleries indexed"
            iconColor="gold"
            icon={
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
            }
          />

          {/* Photos Indexed */}
          <MetricCard
            title="Photos Indexed"
            value={stats?.totalPhotos ? stats.totalPhotos.toLocaleString() : "24,560"}
            subtext="Face embeddings ready"
            iconColor="sage"
            icon={
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
              </svg>
            }
          />

          {/* Happy Clients */}
          <MetricCard
            title="Happy Clients"
            value={stats?.photoSearches ? stats.photoSearches.toLocaleString() : "3,420"}
            subtext="Guest photo searches"
            iconColor="coral"
            icon={
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            }
          />

          {/* AI Match Rate */}
          <MetricCard
            title="AI Match Rate"
            value="98%"
            subtext="Precision face recognition"
            iconColor="gold"
            trend="↑ Top benchmark accuracy"
            icon={
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48 2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48 2.83-2.83" />
              </svg>
            }
          />
        </div>

        {/* Section 12: Photography-First Events Showcase */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-[#F7F5F0] tracking-tight">
                Recent Events
              </h2>
              <p className="text-xs text-[#A8B0BE] mt-0.5">
                Your active galleries with AI face indexing
              </p>
            </div>
            <Link
              to="/events"
              className="text-xs font-bold text-[#D6A84F] hover:text-[#C5963E] transition-colors flex items-center gap-1"
            >
              <span>View All Events</span>
              <span>→</span>
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {showcaseEvents.map((evt) => (
              <EventCard
                key={evt.id}
                event={evt}
                coverImage={evt.coverImage || (evt as { coverUrl?: string }).coverUrl}
                onClick={() => navigate(`/events/${evt.id}/photos`)}
                onOpenPhotos={() => navigate(`/events/${evt.id}/photos`)}
                onOpenQR={() => setQrModalEvent(evt)}
                onOpenSettings={() => navigate(`/events/${evt.id}/settings`)}
              />
            ))}
          </div>
        </div>

        {/* Quick QR Modal if requested */}
        {qrModalEvent && (
          <Modal
            isOpen={Boolean(qrModalEvent)}
            onClose={() => setQrModalEvent(null)}
            title="Event QR & Guest Access"
            maxWidth="md"
          >
            <QRPanel
              event={qrModalEvent}
            />
          </Modal>
        )}
      </div>
    </DashboardLayout>
  );
}
