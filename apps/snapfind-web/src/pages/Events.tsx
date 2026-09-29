import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import DashboardLayout from "../layouts/DashboardLayout";
import { Alert, Badge, Button, Card, EmptyState, Input, LoadingSpinner, Select } from "../components/common";
import { Modal } from "../components/common/Modal";
import { EventCard } from "../components/events/EventCard";
import { QuickCreateEventModal } from "../components/events/QuickCreateEventModal";
import { QRPanel } from "../components/events/QRPanel";
import { eventsApi } from "../services/api";
import type { EventStatus, EventType, SnapEvent } from "../types";
import { DEFAULT_EVENT_COVER } from "../constants/images";

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
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [qrModalEvent, setQrModalEvent] = useState<SnapEvent | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [eventToDelete, setEventToDelete] = useState<SnapEvent | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteEvent = (event: SnapEvent) => {
    setEventToDelete(event);
  };

  const confirmDeleteEvent = async () => {
    if (!eventToDelete) return;
    setIsDeleting(true);
    try {
      await eventsApi.delete(eventToDelete.id);
      setEvents((prev) => prev.filter((e) => e.id !== eventToDelete.id));
      setSuccessMessage(`Event "${eventToDelete.name}" was permanently deleted.`);
      setEventToDelete(null);
      setTimeout(() => setSuccessMessage(null), 3500);
    } catch {
      setError(`Failed to delete event "${eventToDelete.name}". Please check the server logs.`);
    } finally {
      setIsDeleting(false);
    }
  };

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

  const handleCreated = (newEvent: SnapEvent) => {
    setEvents((prev) => [newEvent, ...prev]);
    setSuccessMessage(`Event "${newEvent.name}" created successfully!`);
    setTimeout(() => setSuccessMessage(null), 4000);
  };

  return (
    <DashboardLayout title="Events">
      {/* Top Header & Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-[#F7F5F0]">
            Events & Galleries
          </h1>
          <p className="text-xs md:text-sm text-[#A8B0BE] mt-1">
            Manage your photoshoot collections, AI facial search indexing, and client QR access
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="primary" onClick={() => setIsCreateModalOpen(true)} className="active:scale-95 transition-all shadow-sm font-bold">
            <span>+</span> Quick Add Event
          </Button>
          <Link to="/events/create">
            <Button variant="secondary" className="active:scale-95 transition-all">
              Full Creation Form
            </Button>
          </Link>
        </div>
      </div>

      {successMessage && (
        <div className="mb-6">
          <Alert type="success" onClose={() => setSuccessMessage(null)}>
            {successMessage}
          </Alert>
        </div>
      )}

      {error && (
        <div className="mb-6">
          <Alert type="error">{error}</Alert>
        </div>
      )}

      {/* Filter and Search Bar */}
      <Card className="p-4 mb-8 space-y-3.5 bg-[#151D2E] border-[#232F48] shadow-card">
        <div className="flex flex-col md:flex-row items-center gap-3">
          {/* Search Input */}
          <div className="w-full md:flex-1">
            <Input
              placeholder="Search by event name, venue, or token..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-[#0F1624] border-[#232F48] focus:border-[#D6A84F] focus:ring-1 focus:ring-[#D6A84F]/40 text-[#F7F5F0] placeholder-[#6E788B]"
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
              className="bg-[#0F1624] border-[#232F48] text-[#F7F5F0]"
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
              className="bg-[#0F1624] border-[#232F48] text-[#F7F5F0]"
            />
          </div>

          {/* View Mode Toggle */}
          <div className="hidden sm:flex items-center rounded-xl border border-[#232F48] bg-[#0F1624] p-1">
            <button
              onClick={() => setViewMode("grid")}
              className={`rounded-lg p-1.5 transition-colors cursor-pointer ${
                viewMode === "grid" ? "bg-[#D6A84F] text-[#0B1220] shadow-xs" : "text-[#A8B0BE] hover:text-[#F7F5F0]"
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
              className={`rounded-lg p-1.5 transition-colors cursor-pointer ${
                viewMode === "table" ? "bg-[#D6A84F] text-[#0B1220] shadow-xs" : "text-[#A8B0BE] hover:text-[#F7F5F0]"
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
        <div className="flex items-center gap-2 overflow-x-auto pt-3 border-t border-[#232F48]">
          <span className="text-[11px] font-bold text-[#A8B0BE] uppercase tracking-wider whitespace-nowrap">Filter:</span>
          {eventStatuses.map((s) => (
            <button
              key={s}
              onClick={() => setSelectedStatus(s)}
              className={`rounded-full px-3 py-1 text-xs whitespace-nowrap transition-all cursor-pointer ${
                selectedStatus === s
                  ? "bg-[#D6A84F] text-[#0B1220] font-bold shadow-xs"
                  : "bg-[#0F1624] text-[#A8B0BE] border border-[#232F48] hover:text-[#F7F5F0] hover:bg-[#1B253B]"
              }`}
            >
              {s === "all" ? "All Statuses" : s}
            </button>
          ))}
        </div>
      </Card>

      {/* Events Presentation */}
      {loading ? (
        <LoadingSpinner message="Filtering photography events..." />
      ) : events.length === 0 ? (
        <EmptyState
          title="No events match your criteria"
          description="Try clearing your filters or create a new event to get started."
          actionLabel="+ Create Event"
          onAction={() => setIsCreateModalOpen(true)}
        />
      ) : viewMode === "grid" ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {events.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              onDelete={handleDeleteEvent}
              onShowQR={(ev) => setQrModalEvent(ev)}
            />
          ))}
        </div>
      ) : (
        /* Table View */
        <Card className="overflow-x-auto bg-[#151D2E] border-[#232F48] shadow-card">
          <table className="w-full text-left text-sm font-sans">
            <thead>
              <tr className="border-b border-[#232F48] text-xs font-bold text-[#A8B0BE] bg-[#0F1624]">
                <th className="px-5 py-3.5">Event</th>
                <th className="px-5 py-3.5">Type</th>
                <th className="px-5 py-3.5">Date</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5">Photos</th>
                <th className="px-5 py-3.5">Token</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#232F48]">
              {events.map((event) => (
                <tr key={event.id} className="hover:bg-[#1B253B] transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={event.coverImage || DEFAULT_EVENT_COVER}
                        alt=""
                        className="h-10 w-10 rounded-lg object-cover bg-[#0B1220] border border-[#232F48]"
                        onError={(e) => {
                          if (e.currentTarget.src !== DEFAULT_EVENT_COVER) {
                            e.currentTarget.src = DEFAULT_EVENT_COVER;
                          }
                        }}
                      />
                      <div>
                        <span className="font-bold text-[#F7F5F0]">{event.name}</span>
                        <p className="text-xs text-[#A8B0BE] truncate max-w-xs">{event.location}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-[#A8B0BE] text-xs">{event.eventType}</td>
                  <td className="px-5 py-4 text-[#A8B0BE] text-xs">{event.date}</td>
                  <td className="px-5 py-4">
                    <Badge variant={event.status}>{event.status}</Badge>
                  </td>
                  <td className="px-5 py-4 text-[#A8B0BE] font-mono text-xs">
                    {event.photoCount.toLocaleString()}
                  </td>
                  <td className="px-5 py-4">
                    <code className="px-2 py-0.5 rounded-lg bg-[#0F1624] border border-[#232F48] text-[11px] text-[#D6A84F] font-mono">
                      {event.token}
                    </code>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {/* QR Code */}
                      <button
                        type="button"
                        onClick={() => setQrModalEvent(event)}
                        title="View QR Code"
                        className="p-1.5 rounded-lg bg-[#0F1624] hover:bg-[#D6A84F]/15 hover:text-[#D6A84F] text-[#A8B0BE] transition-all cursor-pointer border border-[#232F48]"
                      >
                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="3" y="3" width="7" height="7" rx="1" />
                          <rect x="14" y="3" width="7" height="7" rx="1" />
                          <rect x="14" y="14" width="7" height="7" rx="1" />
                          <rect x="3" y="14" width="7" height="7" rx="1" />
                        </svg>
                      </button>

                      {/* Delete */}
                      <button
                        type="button"
                        onClick={() => handleDeleteEvent(event)}
                        title="Delete Event"
                        className="p-1.5 rounded-lg bg-[#0F1624] hover:bg-[#E87961]/20 hover:text-[#E87961] text-[#A8B0BE] transition-all cursor-pointer border border-[#232F48]"
                      >
                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        </svg>
                      </button>

                      <Link to={`/events/${event.id}`}>
                        <Button size="sm" variant="secondary">
                          Manage
                        </Button>
                      </Link>
                      <Link to={`/event/${event.token}/gallery`} target="_blank" title="Client Gallery">
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

      {/* Quick Create Event Modal */}
      <QuickCreateEventModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={handleCreated}
      />

      {/* QR Code Presentation Modal */}
      {qrModalEvent && (
        <Modal
          isOpen={Boolean(qrModalEvent)}
          onClose={() => setQrModalEvent(null)}
          title={`Event QR Code — ${qrModalEvent.name}`}
          maxWidth="lg"
        >
          <div className="mt-2">
            <QRPanel event={qrModalEvent} />
          </div>
        </Modal>
      )}

      {/* Delete Event Confirmation Modal */}
      {eventToDelete && (
        <Modal
          isOpen={Boolean(eventToDelete)}
          onClose={() => !isDeleting && setEventToDelete(null)}
          title="Delete Event"
          maxWidth="md"
        >
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3.5 bg-[#E87961]/15 border border-[#E87961]/30 rounded-xl text-[#E87961]">
              <svg className="w-6 h-6 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div>
                <p className="text-sm font-bold">Permanent Deletion Warning</p>
                <p className="text-xs text-[#E87961]/90 mt-0.5">This action cannot be undone and will permanently erase all associated data.</p>
              </div>
            </div>

            <p className="text-sm text-[#A8B0BE] leading-relaxed">
              Are you sure you want to permanently delete <strong className="text-[#F7F5F0] font-bold">{eventToDelete.name}</strong>? All uploaded photos, sub-folders, face recognition vectors, guest purchases, and QR access links will be purged immediately.
            </p>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#232F48]">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setEventToDelete(null)}
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="danger"
                loading={isDeleting}
                onClick={confirmDeleteEvent}
                className="font-bold shadow-lg"
              >
                Permanently Delete Event
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </DashboardLayout>
  );
}
