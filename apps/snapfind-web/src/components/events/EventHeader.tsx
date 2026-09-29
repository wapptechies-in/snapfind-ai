import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Badge, Button } from "../common";
import type { SnapEvent } from "../../types";
import { DEFAULT_EVENT_COVER } from "../../constants/images";

interface EventHeaderProps {
  event: SnapEvent;
}

export const EventHeader: React.FC<EventHeaderProps> = ({ event }) => {
  const location = useLocation();
  const coverImage =
    event.coverImage ??
    (event as { cover_image?: string; cover_photo_url?: string }).cover_image ??
    (event as { cover_image?: string; cover_photo_url?: string }).cover_photo_url ??
    DEFAULT_EVENT_COVER;

  const tabs = [
    { label: "Overview", path: `/events/${event.id}` },
    { label: "Photos", path: `/events/${event.id}/photos`, count: event.photoCount },
    { label: "Processing", path: `/events/${event.id}/processing` },
    { label: "QR Codes", path: `/events/${event.id}/qr` },
    { label: "Settings", path: `/events/${event.id}/settings` },
  ];

  return (
    <div className="space-y-6 mb-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-muted">
        <Link to="/events" className="hover:text-soft-white transition-colors">
          Events
        </Link>
        <span>/</span>
        <span className="text-soft-white font-medium truncate max-w-xs">{event.name}</span>
      </div>

      {/* Main Banner Header */}
      <div className="relative rounded-2xl border border-slate-800 bg-slate-panel overflow-hidden">
        {/* Cover Backdrop with subtle blur */}
        <div className="h-40 sm:h-52 w-full relative overflow-hidden bg-midnight">
          <img
            src={coverImage}
            alt={event.name}
            className="h-full w-full object-cover object-center"
            onError={(e) => {
              if (e.currentTarget.src !== DEFAULT_EVENT_COVER) {
                e.currentTarget.src = DEFAULT_EVENT_COVER;
              }
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-panel via-slate-panel/60 to-black/40" />
        </div>

        {/* Content Info Bar */}
        <div className="p-6 pt-0 relative -mt-16 sm:-mt-20 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="flex items-end gap-4">
            <img
              src={coverImage}
              alt=""
              className="h-24 w-24 sm:h-28 sm:w-28 rounded-xl object-cover border-4 border-slate-panel shadow-2xl bg-midnight"
              onError={(e) => {
                if (e.currentTarget.src !== DEFAULT_EVENT_COVER) {
                  e.currentTarget.src = DEFAULT_EVENT_COVER;
                }
              }}
            />
            <div className="pb-1">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={event.status}>{event.status}</Badge>
                <span className="rounded-md bg-midnight border border-slate-700 px-2 py-0.5 text-[11px] font-medium text-muted">
                  {event.eventType}
                </span>
                <span className="text-xs font-mono text-gold bg-gold/10 border border-gold/25 px-2 py-0.5 rounded">
                  Token: {event.token}
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-soft-white mt-1.5 font-serif">
                {event.name}
              </h1>
              <p className="text-xs text-muted mt-0.5 flex items-center gap-2">
                <span>📅 {event.date}</span>
                <span>•</span>
                <span>📍 {event.location}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 self-start md:self-end">
            <Link to={`/event/${event.token}/gallery`} target="_blank">
              <Button size="sm" variant="secondary">
                Customer Gallery ↗
              </Button>
            </Link>
            <Link to={`/events/${event.id}/qr`}>
              <Button size="sm" variant="primary">
                View QR
              </Button>
            </Link>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="border-t border-slate-800 px-6 flex items-center gap-1 overflow-x-auto">
          {tabs.map((tab) => {
            const isActive =
              tab.path === `/events/${event.id}`
                ? location.pathname === tab.path
                : location.pathname.startsWith(tab.path);

            return (
              <Link
                key={tab.label}
                to={tab.path}
                className={`flex items-center gap-2 px-4 py-3.5 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                  isActive
                    ? "border-gold text-gold font-semibold"
                    : "border-transparent text-muted hover:text-soft-white hover:border-slate-700"
                }`}
              >
                {tab.label}
                {tab.count !== undefined && (
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] ${
                      isActive ? "bg-gold/20 text-gold font-bold" : "bg-midnight text-muted"
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
};
