import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import DashboardLayout from "../../layouts/DashboardLayout";
import { EventHeader } from "../../components/events/EventHeader";
import { Button, Card, LoadingSpinner } from "../../components/common";
import { eventsApi } from "../../services/api";
import type { SnapEvent } from "../../types";

export default function EventDetails() {
  const { id } = useParams<{ id: string }>();
  const [event, setEvent] = useState<SnapEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function loadEvent() {
      if (!id) return;
      setLoading(true);
      try {
        const found = await eventsApi.getById(id);
        setEvent(found);
      } finally {
        setLoading(false);
      }
    }
    loadEvent();
  }, [id]);

  if (loading) {
    return (
      <DashboardLayout title="Event Details">
        <LoadingSpinner message="Loading event details..." />
      </DashboardLayout>
    );
  }

  if (!event) {
    return (
      <DashboardLayout title="Event Not Found">
        <Card className="p-12 text-center">
          <h2 className="text-base font-semibold text-cloud">Event Not Found</h2>
          <p className="mt-1 text-xs text-dim">The requested event ID could not be located.</p>
          <div className="mt-4">
            <Link to="/events">
              <Button size="sm">Back to Events</Button>
            </Link>
          </div>
        </Card>
      </DashboardLayout>
    );
  }

  const galleryUrl = `${window.location.origin}/event/${event.token}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(galleryUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const statCards = [
    { label: "Photo Count", value: event.photoCount.toLocaleString(), icon: "image" },
    { label: "Gallery Views", value: event.galleryViews.toLocaleString(), icon: "eye" },
    { label: "Selfie Searches", value: event.searches.toLocaleString(), icon: "search" },
    { label: "Downloads", value: event.downloads.toLocaleString(), icon: "download" },
  ];

  return (
    <DashboardLayout title={event.name}>
      <EventHeader event={event} />

      <div className="grid gap-6 lg:grid-cols-12">
        {/* Left Column: Metrics & Description (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
            {statCards.map((stat) => (
              <Card key={stat.label} className="p-4">
                <p className="text-[11px] font-medium text-dim">{stat.label}</p>
                <p className="mt-2 text-2xl font-bold text-cloud">{stat.value}</p>
              </Card>
            ))}
          </div>

          {/* Description & Notes */}
          <Card className="p-6 space-y-3">
            <h3 className="text-sm font-semibold text-cloud">Event Description</h3>
            <p className="text-xs leading-relaxed text-dim">
              {event.description || "No description specified for this event."}
            </p>
            <div className="pt-3 border-t border-hairline grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-dim">Venue: </span>
                <span className="text-cloud font-medium">{event.location}</span>
              </div>
              <div>
                <span className="text-dim">Event Date: </span>
                <span className="text-cloud font-medium">{event.date}</span>
              </div>
            </div>
          </Card>

          {/* Quick Tab Shortcuts */}
          <Card className="p-6">
            <h3 className="text-sm font-semibold text-cloud mb-3">Quick Navigation</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <Link
                to={`/events/${event.id}/photos`}
                className="flex items-center justify-between p-3 rounded-lg border border-hairline bg-panel2/40 hover:bg-panel2 transition-colors"
              >
                <div>
                  <p className="font-semibold text-cloud">Manage Photos</p>
                  <p className="text-[11px] text-dim">Browse, filter, and inspect photos</p>
                </div>
                <span>→</span>
              </Link>
              <Link
                to={`/events/${event.id}/processing`}
                className="flex items-center justify-between p-3 rounded-lg border border-hairline bg-panel2/40 hover:bg-panel2 transition-colors"
              >
                <div>
                  <p className="font-semibold text-cloud">Processing Pipeline</p>
                  <p className="text-[11px] text-dim">Thumbnails, face embeddings & upload</p>
                </div>
                <span>→</span>
              </Link>
              <Link
                to={`/events/${event.id}/qr`}
                className="flex items-center justify-between p-3 rounded-lg border border-hairline bg-panel2/40 hover:bg-panel2 transition-colors"
              >
                <div>
                  <p className="font-semibold text-cloud">QR Code & Shortlinks</p>
                  <p className="text-[11px] text-dim">Print QR cards and share gallery</p>
                </div>
                <span>→</span>
              </Link>
              <Link
                to={`/events/${event.id}/settings`}
                className="flex items-center justify-between p-3 rounded-lg border border-hairline bg-panel2/40 hover:bg-panel2 transition-colors"
              >
                <div>
                  <p className="font-semibold text-cloud">Event Settings</p>
                  <p className="text-[11px] text-dim">Visibility, face search, and downloads</p>
                </div>
                <span>→</span>
              </Link>
            </div>
          </Card>
        </div>

        {/* Right Column: Public Share & QR Preview (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="p-6 space-y-4">
            <h3 className="text-sm font-semibold text-cloud">Customer Share URL</h3>
            <p className="text-xs text-dim">
              Share this link or QR code with attendees so they can search for their photos.
            </p>

            <div className="flex items-center gap-2 rounded-lg border border-hairline bg-base p-2.5">
              <code className="flex-1 font-mono text-xs text-cloud truncate">
                {galleryUrl}
              </code>
              <button
                onClick={handleCopyLink}
                className="rounded px-2.5 py-1 text-xs font-medium bg-panel text-violet-light hover:bg-panel2 transition-colors"
              >
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <Link to={`/event/${event.token}`} target="_blank" className="flex-1">
                <Button size="sm" variant="primary" className="w-full">
                  Open Customer View ↗
                </Button>
              </Link>
              <Link to={`/events/${event.id}/qr`}>
                <Button size="sm" variant="outline">
                  Full QR
                </Button>
              </Link>
            </div>
          </Card>

          {/* Mini QR Card */}
          <Card className="p-6 text-center space-y-3">
            <div className="inline-block p-4 rounded-xl bg-white shadow-md">
              {/* Clean SVG QR mockup */}
              <svg className="h-32 w-32" viewBox="0 0 100 100" fill="#0B0D12">
                <path d="M0 0h30v30H0zM5 5h20v20H5zM10 10h10v10H10zM70 0h30v30H70zM75 5h20v20H75zM80 10h10v10H80zM0 70h30v30H0zM5 75h20v20H5zM10 80h10v10H10zM35 10h5v10h-5zM45 5h10v5h-10zM50 15h15v5H50zM35 25h10v15H35zM50 30h5v10h-5zM60 25h10v10H60zM75 35h15v10H75zM10 35h10v10H10zM25 40h5v15h-5zM35 50h20v5H35zM60 45h5v20H60zM70 50h10v15H70zM85 55h15v10H85zM35 60h5v20h-5zM45 70h15v5H45zM50 80h10v15H50zM65 75h10v20H65zM80 75h15v5H80zM75 90h20v5H75z" />
              </svg>
            </div>
            <div>
              <p className="text-xs font-semibold text-cloud">{event.name}</p>
              <p className="text-[11px] font-mono text-violet-light">Token: {event.token}</p>
            </div>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}

