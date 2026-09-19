import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import DashboardLayout from "../layouts/DashboardLayout";
import { Alert, Badge, Button, Card, EmptyState, Input, LoadingSpinner, Select } from "../components/common";
import { EventCard } from "../components/events/EventCard";
import { eventsApi } from "../services/api";
import type { EventStatus, EventType, SnapEvent } from "../types";

const eventTypes: Array<EventType | "all"> = [
  "all",
  "Wedding",
  "Marriage",
  "Birthday",
  "Sports",
  "Family",
  "Corporate",
  "College/School",
  "Candid",
  "Nature",
  "Other",
];

const eventStatuses: Array<EventStatus | "all"> = [
  "all",
  "Active",
  "Processing",
  "Draft",
  "Expired",
  "Archived",
];

export default function Events() {
  const [events, setEvents] = useState<SnapEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [selectedType, setSelectedType] = useState<EventType | "all">("all");
  const [selectedStatus, setSelectedStatus] = useState<EventStatus | "all">("all");
  const [sortBy, setSortBy] = useState<"date-desc" | "date-asc" | "photos-desc" | "name-asc">("date-desc");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");

  useEffect(() => {
    let isCurrent = true;
    async function fetchEvents() {
      setLoading(true);
      setError(null);
      try {
        const data = await eventsApi.list({
          search,
          eventType: selectedType,
          status: selectedStatus,
          sortBy,
        });
        if (isCurrent) setEvents(data);
      } catch {
        if (isCurrent) setError("Failed to load events. Please try again.");
      } finally {
        if (isCurrent) setLoading(false);
      }
    }

    fetchEvents();
    return () => {
      isCurrent = false;
    };
  }, [search, selectedType, selectedStatus, sortBy]);

  return (
    <DashboardLayout title="Events">
      {/* Top Header & Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-cloud">All Events</h2>
          <p className="text-xs text-dim">
            Manage your photoshoot galleries, photo processing, and QR codes
          </p>
        </div>
        <Link to="/events/create">
          <Button variant="primary">
            <span>+</span> Create Event
          </Button>
        </Link>
      </div>

      {error && (
        <div className="mb-6">
          <Alert type="error">{error}</Alert>
        </div>
      )}

      {/* Filter and Search Bar */}
      <Card className="p-4 mb-6 space-y-3">
        <div className="flex flex-col md:flex-row items-center gap-3">
          {/* Search Input */}
          <div className="w-full md:flex-1">
            <Input
              placeholder="Search by event name, venue, or token..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-panel2"
            />
          </div>

          {/* Type Filter */}
          <div className="w-full md:w-48">
            <Select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value as EventType | "all")}
              options={eventTypes.map((t) => ({
                value: t,
                label: t === "all" ? "All Event Types" : t,
              }))}
              className="bg-panel2"
            />
          </div>

          {/* Sort Dropdown */}
          <div className="w-full md:w-44">
            <Select
              value={sortBy}
              onChange={(e) =>
                setSortBy(e.target.value as "date-desc" | "date-asc" | "photos-desc" | "name-asc")
              }
              options={[
                { value: "date-desc", label: "Newest First" },
                { value: "date-asc", label: "Oldest First" },
                { value: "photos-desc", label: "Most Photos" },
                { value: "name-asc", label: "Name (A-Z)" },
              ]}
              className="bg-panel2"
            />
          </div>

          {/* View Mode Toggle */}
          <div className="hidden sm:flex items-center rounded-lg border border-hairline bg-panel2 p-1">
            <button
              onClick={() => setViewMode("grid")}
              className={`rounded p-1.5 transition-colors ${
                viewMode === "grid" ? "bg-violet text-white" : "text-dim hover:text-cloud"
              }`}
              title="Grid view"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
                <rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" />
              </svg>
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`rounded p-1.5 transition-colors ${
                viewMode === "table" ? "bg-violet text-white" : "text-dim hover:text-cloud"
              }`}
              title="Table view"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>

        {/* Status Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pt-2 border-t border-hairline/60">
          <span className="text-[11px] font-medium text-dim whitespace-nowrap">Status:</span>
          {eventStatuses.map((s) => (
            <button
              key={s}
              onClick={() => setSelectedStatus(s)}
              className={`rounded-full px-3 py-1 text-xs whitespace-nowrap transition-colors ${
                selectedStatus === s
                  ? "bg-violet text-white font-medium"
                  : "bg-panel2 text-dim hover:text-cloud hover:bg-hairline"
              }`}
            >
              {s === "all" ? "All" : s}
            </button>
          ))}
        </div>
      </Card>

      {/* Events Presentation */}
      {loading ? (
        <LoadingSpinner message="Filtering events..." />
      ) : events.length === 0 ? (
        <EmptyState
          title="No events match your criteria"
          description="Try clearing your filters or create a new event to get started."
          actionLabel="Create Event"
          onAction={() => (window.location.href = "/events/create")}
        />
      ) : viewMode === "grid" ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {events.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      ) : (
        /* Table View */
        <Card className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-hairline text-xs font-semibold text-dim bg-panel2/50">
                <th className="px-5 py-3.5">Event</th>
                <th className="px-5 py-3.5">Type</th>
                <th className="px-5 py-3.5">Date</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5">Photos</th>
                <th className="px-5 py-3.5">Token</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline">
              {events.map((event) => (
                <tr key={event.id} className="hover:bg-panel2/30 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={event.coverImage}
                        alt=""
                        className="h-10 w-10 rounded-lg object-cover bg-panel2"
                      />
                      <div>
                        <span className="font-semibold text-cloud">{event.name}</span>
                        <p className="text-xs text-dim truncate max-w-xs">{event.location}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-dim text-xs">{event.eventType}</td>
                  <td className="px-5 py-4 text-dim text-xs">{event.date}</td>
                  <td className="px-5 py-4">
                    <Badge variant={event.status}>{event.status}</Badge>
                  </td>
                  <td className="px-5 py-4 text-dim font-mono text-xs">
                    {event.photoCount.toLocaleString()}
                  </td>
                  <td className="px-5 py-4">
                    <code className="px-2 py-0.5 rounded bg-panel2 text-[11px] text-violet-light font-mono">
                      {event.token}
                    </code>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link to={`/events/${event.id}`}>
                        <Button size="sm" variant="secondary">
                          Manage
                        </Button>
                      </Link>
                      <Link to={`/event/${event.token}`} target="_blank">
                        <Button size="sm" variant="ghost">
                          ↗
                        </Button>
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </DashboardLayout>
  );
}
