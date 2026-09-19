import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import DashboardLayout from "../layouts/DashboardLayout";
import { Badge, Button, Card, LoadingSpinner } from "../components/common";
import { dashboardApi, eventsApi } from "../services/api";
import type { DashboardStats, SnapEvent } from "../types";

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentEvents, setRecentEvents] = useState<SnapEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [statsData, eventsData] = await Promise.all([
          dashboardApi.getStats(),
          eventsApi.list({ sortBy: "date-desc" }),
        ]);
        setStats(statsData);
        setRecentEvents(eventsData.slice(0, 5));
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) {
    return (
      <DashboardLayout title="Dashboard">
        <LoadingSpinner message="Loading dashboard statistics..." />
      </DashboardLayout>
    );
  }

  const statCards = [
    { label: "Total Events", value: stats?.totalEvents || 24, icon: "calendar", change: "+3 this month" },
    { label: "Total Photos", value: (stats?.totalPhotos || 18420).toLocaleString(), icon: "image", change: "+1,240 this week" },
    { label: "Active Events", value: stats?.activeEvents || 8, icon: "bolt", change: "Live galleries" },
    { label: "Processing Jobs", value: stats?.processingJobs || 3, icon: "cpu", change: "In background" },
    { label: "Gallery Views", value: (stats?.galleryViews || 14290).toLocaleString(), icon: "eye", change: "+18% vs last week" },
    { label: "Photo Searches", value: (stats?.photoSearches || 1248).toLocaleString(), icon: "search", change: "Selfie searches" },
    { label: "Downloads", value: (stats?.downloads || 6830).toLocaleString(), icon: "download", change: "Guest downloads" },
  ];

  return (
    <DashboardLayout title="Dashboard">
      {/* Mock Badge Notice */}
      <div className="mb-6 flex items-center justify-between gap-3 rounded-xl border border-hairline bg-panel2/60 px-4 py-3 text-xs text-dim">
        <div className="flex items-center gap-2">
          <span className="rounded bg-violet/20 px-2 py-0.5 text-[10px] font-semibold text-violet-light">
            MOCK DATA
          </span>
          <span>
            Displaying simulated photographer metrics and event statistics. Database and cloud syncing will activate in later phases.
          </span>
        </div>
        <Link to="/events/create">
          <Button size="sm" variant="primary">
            + New Event
          </Button>
        </Link>
      </div>

      {/* 7 Overview Cards */}
      <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7">
        {statCards.map((c) => (
          <Card key={c.label} className="p-4 flex flex-col justify-between">
            <div>
              <p className="text-[11px] font-medium text-dim truncate">{c.label}</p>
              <p className="mt-2 text-2xl font-bold tracking-tight text-cloud">{c.value}</p>
            </div>
            <p className="mt-2 text-[10px] text-violet-light/80 font-medium truncate">{c.change}</p>
          </Card>
        ))}
      </div>

      {/* Recent Events Section */}
      <div className="mt-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-semibold text-cloud">Recent Events</h2>
            <p className="text-xs text-dim">Latest photo shoots and active event galleries</p>
          </div>
          <Link to="/events" className="text-xs text-violet-light hover:text-violet transition-colors">
            View all events →
          </Link>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {recentEvents.map((event) => (
            <Card key={event.id} hover className="overflow-hidden flex flex-col">
              {/* Cover Image */}
              <div className="relative h-40 w-full overflow-hidden bg-panel2">
                <img
                  src={event.coverImage}
                  alt={event.name}
                  className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute top-3 left-3">
                  <Badge variant={event.status}>{event.status}</Badge>
                </div>
                <div className="absolute top-3 right-3">
                  <span className="rounded-md bg-black/60 backdrop-blur-sm px-2 py-0.5 text-[11px] font-medium text-white">
                    {event.eventType}
                  </span>
                </div>
              </div>

              {/* Event Body */}
              <div className="p-4 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-cloud line-clamp-1">{event.name}</h3>
                  <p className="mt-1 text-xs text-dim flex items-center gap-1.5">
                    <span>📅</span> {new Date(event.date).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })}
                    <span className="text-hairline">•</span>
                    <span>📍</span> {event.location.split(",")[0]}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-hairline flex items-center justify-between text-xs">
                  <span className="text-dim">
                    <strong className="text-cloud font-semibold">{event.photoCount.toLocaleString()}</strong> Photos
                  </span>
                  <div className="flex items-center gap-2">
                    <Link to={`/events/${event.id}`}>
                      <Button size="sm" variant="secondary">
                        Manage
                      </Button>
                    </Link>
                    <Link to={`/event/${event.token}`} target="_blank">
                      <Button size="sm" variant="outline" title="Open Customer Gallery">
                        View ↗
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
