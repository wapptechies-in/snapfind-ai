import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Badge, Button, Card, LoadingSpinner, Modal } from "../components/common";
import { CreateEventModal } from "../components/CreateEventModal";
import { QRCodeModal } from "../components/QRCodeModal";
import { useApp } from "../state/store";
import { eventsApi } from "@snapfind/api-client";
import type { SnapEvent } from "../types";

const defaultCoverImages: Record<string, string> = {
  wedding: "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&q=80",
  corporate: "https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=800&q=80",
  birthday: "https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&w=800&q=80",
  sports: "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=800&q=80",
  family: "https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=800&q=80",
  candid: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=800&q=80",
  default: "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=800&q=80",
};

export const EventSelect: React.FC = () => {
  const navigate = useNavigate();
  const { events, selectedEvent, setSelectedEvent, loadEvents, deleteEvent } = useApp();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [refreshing, setRefreshing] = useState(false);
  const [initialLoading, setInitialLoading] = useState(events.length === 0);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [qrModalEvent, setQrModalEvent] = useState<SnapEvent | null>(null);
  const [copiedTokenId, setCopiedTokenId] = useState<string | null>(null);

  const safeEvents = Array.isArray(events) ? events : [];

  useEffect(() => {
    let mounted = true;
    loadEvents().finally(() => {
      if (mounted) setInitialLoading(false);
    });
    return () => {
      mounted = false;
    };
  }, []);

  const filtered = safeEvents.filter((e) => {
    const matchesSearch =
      (e.name || "").toLowerCase().includes(search.toLowerCase()) ||
      (e.location || "").toLowerCase().includes(search.toLowerCase()) ||
      (e.public_token || "").toLowerCase().includes(search.toLowerCase()) ||
      (e.eventType || "").toLowerCase().includes(search.toLowerCase());

    if (!matchesSearch) return false;

    if (statusFilter === "all") return true;
    if (statusFilter === "active") {
      return e.isActive !== false && (e.status || "").toLowerCase() === "active";
    }
    if (statusFilter === "inactive") {
      return e.isActive === false || (e.status || "").toLowerCase() === "inactive";
    }
    return (e.status || "").toLowerCase() === statusFilter.toLowerCase();
  });

  const handleToggleActive = async (e: React.MouseEvent, evt: SnapEvent) => {
    e.stopPropagation();
    const currentlyActive = evt.isActive !== false && (evt.status || "").toLowerCase() === "active";
    const nextActive = !currentlyActive;
    try {
      await eventsApi.toggleActive(evt.id, nextActive);
      await loadEvents();
    } catch (err) {
      alert(`Failed to update event status: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  const handleSelect = (event: SnapEvent) => {
    setSelectedEvent(event);
    navigate(`/events/${event.id}/photos`);
  };

  const handleScanEvent = (e: React.MouseEvent, event: SnapEvent) => {
    e.stopPropagation();
    setSelectedEvent(event);
    navigate("/scan");
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await loadEvents();
    } finally {
      setRefreshing(false);
    }
  };

  const handleCopyToken = (e: React.MouseEvent, token: string, eventId: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(token);
    setCopiedTokenId(eventId);
    setTimeout(() => setCopiedTokenId(null), 2000);
  };

  const handleOpenGallery = (e: React.MouseEvent, token: string) => {
    e.stopPropagation();
    const url = `http://localhost:5173/event/${token}/gallery`;
    if (window.desktopAPI) {
      window.desktopAPI.openExternal(url);
    } else {
      window.open(url, "_blank");
    }
  };

  const [eventToDelete, setEventToDelete] = useState<SnapEvent | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleDeleteEvent = (e: React.MouseEvent, evt: SnapEvent) => {
    e.stopPropagation();
    setDeleteError(null);
    setEventToDelete(evt);
  };

  const confirmDeleteEvent = async () => {
    if (!eventToDelete) return;
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await deleteEvent(eventToDelete.id);
      setEventToDelete(null);
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsDeleting(false);
    }
  };

  const handleOpenWebStudio = () => {
    const url = "http://localhost:5173";
    if (window.desktopAPI) {
      window.desktopAPI.openExternal(url);
    } else {
      window.open(url, "_blank");
    }
  };

  const handleCreated = (newEvent: SnapEvent) => {
    setSelectedEvent(newEvent);
    // Directly navigate to scanner for this newly created event
    navigate("/scan");
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Top Header & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl md:text-3xl font-semibold text-studio-charcoal tracking-tight flex items-center gap-3">
            <span>Destination Events</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-studio-cream border border-studio-sand text-studio-forest font-mono font-medium">
              {safeEvents.length} galleries
            </span>
          </h1>
          <p className="text-xs md:text-sm text-studio-muted mt-1">
            Select or create a studio event gallery to scan, upload, and index photos.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <Button
            size="sm"
            variant="champagne"
            onClick={() => setIsCreateModalOpen(true)}
            className="shadow-sm font-semibold"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            <span>+ Create New Event</span>
          </Button>

          <Button
            size="sm"
            variant="secondary"
            onClick={handleOpenWebStudio}
            title="Open SnapFind Web Application in browser"
          >
            <span>Web Portal</span>
            <svg className="w-3 h-3 text-studio-forest" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              <polyline points="15 3 21 3 21 9" />
              <line x1="10" y1="14" x2="21" y2="3" />
            </svg>
          </Button>

          <Button
            size="sm"
            variant="secondary"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <svg
              className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <polyline points="23 4 23 10 17 10" />
              <polyline points="1 20 1 14 7 14" />
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
            </svg>
            <span>{refreshing ? "Refreshing…" : "Refresh"}</span>
          </Button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <Card className="p-3.5 flex flex-col md:flex-row items-center justify-between gap-3 bg-white border-studio-sand shadow-xs">
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto">
          {["all", "active", "inactive", "processing", "draft"].map((tab) => {
            const isTabActive = statusFilter === tab;
            return (
              <button
                key={tab}
                onClick={() => setStatusFilter(tab)}
                className={`px-3 py-1 rounded-full text-xs font-medium capitalize transition-all duration-150 active:scale-95 cursor-pointer ${
                  isTabActive
                    ? "bg-studio-forest text-white shadow-xs font-semibold"
                    : "text-studio-muted hover:text-studio-charcoal hover:bg-studio-cream"
                }`}
              >
                {tab === "all" ? "All Statuses" : tab}
              </button>
            );
          })}
        </div>

        <div className="relative w-full md:w-64">
          <input
            type="text"
            placeholder="Search name, venue, token..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3.5 py-1.5 rounded-xl border border-studio-sand bg-studio-cream/40 text-xs text-studio-charcoal placeholder:text-studio-muted/60 focus:border-studio-forest focus:outline-none transition-colors"
          />
          <svg
            className="w-3.5 h-3.5 text-studio-muted absolute left-2.5 top-2.5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </div>
      </Card>

      {/* Events Grid Presentation */}
      {initialLoading ? (
        <Card className="p-16 text-center bg-white border-studio-sand">
          <LoadingSpinner message="Loading studio events from cloud database..." />
        </Card>
      ) : safeEvents.length === 0 ? (
        <Card className="p-16 text-center border-dashed border-studio-sand bg-studio-cream/40">
          <div className="h-16 w-16 mx-auto rounded-2xl bg-white border border-studio-sand flex items-center justify-center text-studio-forest mb-4 shadow-xs">
            <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
              <line x1="12" y1="11" x2="12" y2="17" />
              <line x1="9" y1="14" x2="15" y2="14" />
            </svg>
          </div>
          <h3 className="font-serif text-lg font-semibold text-studio-charcoal mb-1">No Destination Events Yet</h3>
          <p className="text-xs text-studio-muted max-w-sm mx-auto mb-6">
            Create your first client event photoshoot to start scanning local RAW/JPEG folders and uploading.
          </p>
          <div className="flex items-center justify-center gap-3">
            <Button
              size="md"
              variant="champagne"
              onClick={() => setIsCreateModalOpen(true)}
              className="shadow-sm font-semibold"
            >
              + Create First Event
            </Button>
            <Button size="md" variant="secondary" onClick={handleRefresh} disabled={refreshing}>
              Refresh Events
            </Button>
          </div>
        </Card>
      ) : filtered.length === 0 ? (
        <Card className="p-12 text-center bg-white border-studio-sand">
          <p className="text-xs text-studio-muted">No events match your search term or active filter.</p>
          <button
            onClick={() => {
              setSearch("");
              setStatusFilter("all");
            }}
            className="mt-2 text-xs text-studio-forest hover:underline font-semibold cursor-pointer"
          >
            Clear filters
          </button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((evt) => {
            const isSelected = selectedEvent?.id === evt.id;
            const coverUrl =
              evt.coverImage ||
              evt.cover_photo_url ||
              evt.cover_image_url ||
              defaultCoverImages[(evt.eventType || "").toLowerCase()] ||
              defaultCoverImages.default;

            const isCopied = copiedTokenId === evt.id;

            return (
              <Card
                key={evt.id}
                className={`p-0 overflow-hidden flex flex-col justify-between group transition-all duration-200 cursor-pointer bg-white border-studio-sand hover:border-studio-forest/40 hover:shadow-card-hover ${
                  isSelected
                    ? "border-studio-forest ring-2 ring-studio-forest/30 bg-studio-forest/5 shadow-md"
                    : "hover:-translate-y-0.5"
                }`}
                onClick={() => handleSelect(evt)}
              >
                {/* Cover Image Banner */}
                <div className="relative h-44 w-full overflow-hidden bg-studio-cream">
                  <img
                    src={coverUrl}
                    alt={evt.name}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />

                  {/* Top Badges */}
                  <div className="absolute top-3 left-3 flex items-center gap-1.5">
                    <Badge variant={(evt.isActive !== false && (evt.status || "Active").toLowerCase() === "active") ? "active" : "inactive"}>
                      {evt.isActive !== false && (evt.status || "Active").toLowerCase() === "active" ? "Active" : "Inactive"}
                    </Badge>
                  </div>

                  <div className="absolute top-3 right-3">
                    <span className="rounded-full bg-white/20 backdrop-blur-md px-2.5 py-0.5 text-[10px] font-semibold text-white uppercase tracking-wider border border-white/20">
                      {evt.eventType || "Photoshoot"}
                    </span>
                  </div>

                  {/* Selected Pill Indicator */}
                  {isSelected && (
                    <div className="absolute bottom-2.5 left-3 px-2.5 py-0.5 rounded-full bg-studio-forest text-white text-[10px] font-semibold flex items-center gap-1 shadow-sm">
                      <span>✓</span> ACTIVE TARGET
                    </div>
                  )}

                  {/* Photos count pill */}
                  <div className="absolute bottom-2.5 right-3 px-2 py-0.5 rounded-lg bg-black/40 backdrop-blur-md border border-white/10 text-[11px] font-mono text-white font-semibold">
                    {((evt.photo_count ?? (evt as any).photoCount ?? (evt as any).photos ?? 0)).toLocaleString()} photos
                  </div>
                </div>

                {/* Event Body Info */}
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-serif text-base font-semibold text-studio-charcoal line-clamp-1 group-hover:text-studio-forest transition-colors">
                      {evt.name}
                    </h3>
                    <p className="text-xs text-studio-muted mt-1.5 flex items-center gap-1.5">
                      <svg className="w-3.5 h-3.5 text-studio-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                        <line x1="16" y1="2" x2="16" y2="6" />
                        <line x1="8" y1="2" x2="8" y2="6" />
                        <line x1="3" y1="10" x2="21" y2="10" />
                      </svg>
                      <span>{evt.date || "Date not set"}</span>
                    </p>
                    <p className="text-xs text-studio-muted truncate mt-0.5 flex items-center gap-1.5">
                      <svg className="w-3.5 h-3.5 text-studio-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                        <circle cx="12" cy="10" r="3" />
                      </svg>
                      <span>{evt.location || "Venue not set"}</span>
                    </p>
                  </div>

                  {/* Quick Action Bar on Card */}
                  <div className="mt-4 pt-3 border-t border-studio-sand flex items-center justify-between text-xs gap-2">
                    {/* Token with copy button */}
                    <button
                      type="button"
                      onClick={(e) => handleCopyToken(e, evt.public_token || evt.token || "", evt.id)}
                      title="Copy Public Token"
                      className="px-2 py-1 rounded-lg bg-studio-cream border border-studio-sand text-[11px] font-mono text-studio-muted hover:text-studio-forest hover:border-studio-forest/40 transition-colors flex items-center gap-1 cursor-pointer active:scale-95"
                    >
                      <span>{isCopied ? "✓ Copied" : (evt.public_token || evt.token)}</span>
                    </button>

                    <div className="flex items-center gap-1.5">
                      {/* QR Code generator modal trigger */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setQrModalEvent(evt);
                        }}
                        title="Generate & View QR Code"
                        className="p-1.5 rounded-lg bg-studio-cream hover:bg-studio-forest/10 hover:text-studio-forest text-studio-muted transition-all active:scale-95 cursor-pointer border border-studio-sand"
                      >
                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="3" y="3" width="7" height="7" rx="1" />
                          <rect x="14" y="3" width="7" height="7" rx="1" />
                          <rect x="14" y="14" width="7" height="7" rx="1" />
                          <rect x="3" y="14" width="7" height="7" rx="1" />
                        </svg>
                      </button>

                      {/* Web Gallery Preview */}
                      <button
                        type="button"
                        onClick={(e) => handleOpenGallery(e, evt.public_token || evt.token || "")}
                        title="Open Public Gallery in Browser"
                        className="p-1.5 rounded-lg bg-studio-cream hover:bg-studio-sand text-studio-muted hover:text-studio-charcoal transition-all active:scale-95 cursor-pointer border border-studio-sand"
                      >
                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                          <polyline points="15 3 21 3 21 9" />
                          <line x1="10" y1="14" x2="21" y2="3" />
                        </svg>
                      </button>

                      {/* Active / Inactive Toggle */}
                      <button
                        type="button"
                        onClick={(e) => handleToggleActive(e, evt)}
                        title={evt.isActive !== false && (evt.status || "").toLowerCase() === "active" ? "Mark Event as Inactive" : "Mark Event as Active"}
                        className={`p-1.5 rounded-lg transition-all active:scale-95 cursor-pointer border border-studio-sand ${
                          evt.isActive !== false && (evt.status || "").toLowerCase() === "active"
                            ? "bg-studio-cream hover:bg-amber-50 text-studio-muted hover:text-amber-700"
                            : "bg-studio-cream hover:bg-emerald-50 text-amber-700 hover:text-emerald-700"
                        }`}
                      >
                        {evt.isActive !== false && (evt.status || "").toLowerCase() === "active" ? (
                          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="6" y="4" width="4" height="16" rx="1" />
                            <rect x="14" y="4" width="4" height="16" rx="1" />
                          </svg>
                        ) : (
                          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                            <polygon points="5 3 19 12 5 21 5 3" />
                          </svg>
                        )}
                      </button>

                      {/* Delete Event */}
                      <button
                        type="button"
                        onClick={(e) => handleDeleteEvent(e, evt)}
                        title="Delete Event"
                        className="p-1.5 rounded-lg bg-studio-cream hover:bg-red-50 hover:text-red-700 text-studio-muted transition-all active:scale-95 cursor-pointer border border-studio-sand"
                      >
                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        </svg>
                      </button>

                      {/* Event Actions */}
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelect(evt);
                        }}
                        className="text-xs"
                      >
                        Photos
                      </Button>

                      <Button
                        size="sm"
                        variant="primary"
                        onClick={(e) => handleScanEvent(e, evt)}
                        className="text-xs font-semibold"
                      >
                        ⚡ Scan
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create Event Modal */}
      <CreateEventModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreated={handleCreated}
      />

      {/* QR Code Modal */}
      <QRCodeModal
        isOpen={Boolean(qrModalEvent)}
        onClose={() => setQrModalEvent(null)}
        event={qrModalEvent}
      />

      {/* Delete Event Confirmation Modal */}
      {eventToDelete && (
        <Modal
          isOpen={Boolean(eventToDelete)}
          onClose={() => !isDeleting && setEventToDelete(null)}
          title="Delete Event"
          maxWidth="md"
        >
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3.5 bg-bad/10 border border-bad/20 rounded-xl text-bad">
              <svg className="w-6 h-6 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div>
                <p className="text-sm font-semibold">Permanent Deletion Warning</p>
                <p className="text-xs text-bad/80 mt-0.5">This action cannot be undone and will permanently erase all associated data.</p>
              </div>
            </div>

            {deleteError && (
              <div className="p-3 bg-bad/15 border border-bad/30 text-bad rounded-lg text-xs">
                {deleteError}
              </div>
            )}

            <p className="text-sm text-dim leading-relaxed">
              Are you sure you want to permanently delete <strong className="text-cloud font-semibold">{eventToDelete.name}</strong>? All uploaded photos, sub-folders, face recognition vectors, and QR access links will be purged immediately.
            </p>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-hairline">
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
                className="font-semibold shadow-lg shadow-bad/20"
              >
                Permanently Delete Event
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
