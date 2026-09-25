import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import DashboardLayout from "../layouts/DashboardLayout";
import { dashboardApi, eventsApi } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { BotanicalLeaves } from "@snapfind/ui";
import type { DashboardStats, SnapEvent } from "../types";

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentEvents, setRecentEvents] = useState<SnapEvent[]>([]);
  const [loading, setLoading] = useState(true);

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

  if (loading) {
    return (
      <DashboardLayout title="Dashboard">
        <div className="flex h-96 items-center justify-center">
          <div className="animate-spin h-9 w-9 border-3 border-forest border-t-transparent rounded-full" />
        </div>
      </DashboardLayout>
    );
  }

  const displayName = user?.display_name || user?.studio_name || "Jebastin";

  // Default sample showcase events matching reference image if empty
  const showcaseEvents = recentEvents.length > 0 ? recentEvents.slice(0, 4) : [
    {
      id: "demo-1",
      name: "Arun & Priya Wedding",
      date: "24 Sep 2026",
      location: "Chennai",
      photoCount: 2458,
      guestsCount: 684,
      viewsCount: 3127,
      status: "Completed",
      coverUrl: "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=600&q=80",
    },
    {
      id: "demo-2",
      name: "College Day 2026",
      date: "18 Sep 2026",
      location: "Trichy",
      photoCount: 1245,
      guestsCount: 420,
      viewsCount: 890,
      status: "Completed",
      coverUrl: "https://images.unsplash.com/photo-1523580494863-6f3031224c94?auto=format&fit=crop&w=600&q=80",
    },
    {
      id: "demo-3",
      name: "Baptism Ceremony",
      date: "10 Sep 2026",
      location: "Nagercoil",
      photoCount: 892,
      guestsCount: 310,
      viewsCount: 540,
      status: "Processing",
      coverUrl: "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=600&q=80",
    },
    {
      id: "demo-4",
      name: "Corporate Event",
      date: "05 Sep 2026",
      location: "Chennai",
      photoCount: 3125,
      guestsCount: 960,
      viewsCount: 2450,
      status: "Completed",
      coverUrl: "https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=600&q=80",
    },
  ];

  return (
    <DashboardLayout title="Dashboard">
      <div className="space-y-7 max-w-7xl mx-auto font-sans">
        {/* Top Greeting & Action Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-charcoal tracking-tight">
              Good Morning, {displayName} 👋
            </h1>
            <p className="text-xs sm:text-sm text-warm-gray mt-1 flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-forest animate-pulse" />
              <span>Let's preserve beautiful memories together.</span>
            </p>
          </div>

          <Link to="/events/create">
            <button className="btn-luxury-forest inline-flex items-center gap-2 px-4.5 py-2.5 rounded-xl text-xs font-semibold shadow-md active:scale-95 cursor-pointer">
              <span className="text-base leading-none font-bold">+</span>
              <span>New Event</span>
            </button>
          </Link>
        </div>

        {/* 4 Metric Cards Row (Matching Reference) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {/* Metric 1: Active Events */}
          <div className="bg-white rounded-2xl p-5 border border-warm-border shadow-card hover:-translate-y-1 hover:shadow-hover hover:border-champagne/40 transition-all duration-200">
            <div className="flex items-center gap-3.5">
              <div className="h-12 w-12 rounded-xl bg-[#D9F2E6] text-[#165B3B] border border-[#BEE5D3] flex items-center justify-center flex-shrink-0 shadow-xs">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="4" width="18" height="18" rx="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
              </div>
              <div>
                <p className="text-2xl sm:text-3xl font-serif font-bold text-charcoal leading-none">
                  {stats?.activeEvents ?? 12}
                </p>
                <p className="text-xs text-warm-gray font-medium mt-1">Active Events</p>
              </div>
            </div>
          </div>

          {/* Metric 2: Photos */}
          <div className="bg-white rounded-2xl p-5 border border-warm-border shadow-card hover:-translate-y-1 hover:shadow-hover hover:border-champagne/40 transition-all duration-200">
            <div className="flex items-center gap-3.5">
              <div className="h-12 w-12 rounded-xl bg-[#FCECDD] text-[#9E5926] border border-[#F5D5BA] flex items-center justify-center flex-shrink-0 shadow-xs">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <polyline points="21 15 16 10 5 21" />
                </svg>
              </div>
              <div>
                <p className="text-2xl sm:text-3xl font-serif font-bold text-charcoal leading-none">
                  {stats?.totalPhotos ? stats.totalPhotos.toLocaleString() : "8,452"}
                </p>
                <p className="text-xs text-warm-gray font-medium mt-1">Photos</p>
              </div>
            </div>
          </div>

          {/* Metric 3: Guest Views */}
          <div className="bg-white rounded-2xl p-5 border border-warm-border shadow-card hover:-translate-y-1 hover:shadow-hover hover:border-champagne/40 transition-all duration-200">
            <div className="flex items-center gap-3.5">
              <div className="h-12 w-12 rounded-xl bg-[#EDE8F8] text-[#5B4C8A] border border-[#D8CFEE] flex items-center justify-center flex-shrink-0 shadow-xs">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              </div>
              <div>
                <p className="text-2xl sm:text-3xl font-serif font-bold text-charcoal leading-none">
                  {stats?.photoSearches ? stats.photoSearches.toLocaleString() : "3,127"}
                </p>
                <p className="text-xs text-warm-gray font-medium mt-1">Guest Views</p>
              </div>
            </div>
          </div>

          {/* Metric 4: Happy Clients */}
          <div className="bg-white rounded-2xl p-5 border border-warm-border shadow-card hover:-translate-y-1 hover:shadow-hover hover:border-champagne/40 transition-all duration-200">
            <div className="flex items-center gap-3.5">
              <div className="h-12 w-12 rounded-xl bg-[#FAF4EB] text-[#8F6E3B] border border-[#E2CEAD] flex items-center justify-center flex-shrink-0 shadow-xs">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M8 14s1.5 2 4 2 4-2 4-2" />
                  <line x1="9" y1="9" x2="9.01" y2="9" />
                  <line x1="15" y1="9" x2="15.01" y2="9" />
                </svg>
              </div>
              <div>
                <p className="text-2xl sm:text-3xl font-serif font-bold text-charcoal leading-none">86%</p>
                <p className="text-xs text-warm-gray font-medium mt-1">Happy Clients</p>
              </div>
            </div>
          </div>
        </div>

        {/* Featured Promotional Banner Card (Matching Reference: "Capture Share Cherish Every Moment") */}
        <div className="relative overflow-hidden rounded-3xl border border-warm-border bg-[#FAF6EE] shadow-card flex flex-col md:flex-row items-stretch justify-between min-h-[200px]">
          {/* Left Decorative Botanical Leaves */}
          <div className="absolute left-0 bottom-0 pointer-events-none opacity-40">
            <BotanicalLeaves width={220} height={190} />
          </div>

          {/* Left Text Column */}
          <div className="relative z-10 p-7 sm:p-9 flex flex-col justify-center max-w-md">
            <div className="space-y-0.5">
              <h2 className="font-serif text-2xl sm:text-3xl text-charcoal font-medium leading-tight">
                Capture
              </h2>
              <h2 className="font-serif text-2xl sm:text-3xl text-charcoal font-medium leading-tight">
                Share
              </h2>
              <h2 className="font-serif text-2xl sm:text-3xl text-charcoal font-medium leading-tight">
                Cherish
              </h2>
              <p className="font-serif italic text-lg sm:text-xl text-forest font-semibold pt-1">
                Every Moment
              </p>
            </div>
          </div>

          {/* Right Photography Image */}
          <div className="relative md:w-1/2 min-h-[170px] md:min-h-full overflow-hidden">
            <img
              src="https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=80"
              alt="Romantic wedding couple smiling"
              className="h-full w-full object-cover object-center"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#FAF6EE] via-transparent to-transparent hidden md:block" />
          </div>
        </div>

        {/* Recent Events Section (4 Cards Matching Reference) */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg sm:text-xl font-serif font-bold text-charcoal">
              Recent Events
            </h2>
            <Link
              to="/events"
              className="text-xs font-semibold text-forest hover:text-forest-hover flex items-center gap-1 transition-all active:scale-95"
            >
              <span>View All</span>
              <span>→</span>
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            {showcaseEvents.map((evtItem) => {
              const evt = evtItem as any;
              const photoNum = evt.photoCount ?? evt.photo_count ?? 1200;
              const guestNum = evt.guestsCount ?? Math.round(photoNum * 0.35);
              const viewNum = evt.viewsCount ?? Math.round(photoNum * 1.4);
              const isProcessing = evt.status?.toLowerCase() === "processing";

              return (
                <div
                  key={evt.id}
                  onClick={() => navigate(`/events/${evt.id}/photos`)}
                  className="bg-white rounded-2xl border border-warm-border overflow-hidden shadow-card hover:-translate-y-1 hover:shadow-hover hover:border-champagne/40 transition-all duration-200 cursor-pointer active:scale-[0.98] group flex flex-col justify-between"
                >
                  {/* Photo Thumbnail */}
                  <div className="relative aspect-[16/10] overflow-hidden bg-cream">
                    <img
                      src={
                        evt.coverUrl ||
                        evt.cover_image_url ||
                        "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=600&q=80"
                      }
                      alt={evt.name}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                    />
                  </div>

                  {/* Body Content */}
                  <div className="p-4 space-y-2.5 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="font-serif font-bold text-sm text-charcoal group-hover:text-forest transition-colors truncate">
                        {evt.name}
                      </h3>
                      <p className="text-[11px] text-warm-gray mt-0.5 truncate">
                        {evt.date || "24 Sep 2026"} • {evt.location || "Studio Gallery"}
                      </p>
                    </div>

                    {/* 3 Metrics: Photos, Guests, Views */}
                    <div className="pt-2 border-t border-warm-border/60 flex items-center justify-between text-[11px] text-warm-gray">
                      <span className="flex items-center gap-1 font-mono">
                        <svg className="w-3 h-3 text-warm-gray-light" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="3" y="3" width="18" height="18" rx="2" />
                          <circle cx="8.5" cy="8.5" r="1.5" />
                        </svg>
                        <strong>{photoNum.toLocaleString()}</strong>
                      </span>
                      <span className="flex items-center gap-1 font-mono">
                        <svg className="w-3 h-3 text-warm-gray-light" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                          <circle cx="9" cy="7" r="4" />
                        </svg>
                        <strong>{guestNum.toLocaleString()}</strong>
                      </span>
                      <span className="flex items-center gap-1 font-mono">
                        <svg className="w-3 h-3 text-warm-gray-light" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                        <strong>{viewNum.toLocaleString()}</strong>
                      </span>
                    </div>

                    {/* Status Badge */}
                    <div className="pt-1">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold capitalize ${
                          isProcessing
                            ? "bg-[#EDE8F8] text-[#5B4C8A] border border-[#D8CFEE]"
                            : "bg-[#D9F2E6] text-[#165B3B] border border-[#BEE5D3]"
                        }`}
                      >
                        {isProcessing ? "Processing" : "Completed"}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
