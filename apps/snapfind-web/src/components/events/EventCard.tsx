import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Badge, Button, Card } from "../common";
import type { SnapEvent } from "../../types";
import { DEFAULT_EVENT_COVER } from "../../constants/images";

interface EventCardProps {
  event: SnapEvent;
  onManage?: (id: string) => void;
  onDelete?: (event: SnapEvent) => void;
  onShowQR?: (event: SnapEvent) => void;
}

export const EventCard: React.FC<EventCardProps> = ({ event, onDelete, onShowQR }) => {
  const [copied, setCopied] = useState(false);

  const handleCopyLink = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const url = `${window.location.origin}/event/${event.token}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card hover className="overflow-hidden flex flex-col justify-between group transition-all duration-200">
      <div>
        {/* Cover Image Banner */}
        <div className="relative h-44 w-full overflow-hidden bg-panel2">
          <img
            src={event.coverImage || (event as { cover_image?: string; cover_photo_url?: string }).cover_image || (event as { cover_image?: string; cover_photo_url?: string }).cover_photo_url || DEFAULT_EVENT_COVER}
            alt={event.name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
            onError={(e) => {
              if (e.currentTarget.src !== DEFAULT_EVENT_COVER) {
                e.currentTarget.src = DEFAULT_EVENT_COVER;
              }
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />

          <div className="absolute top-2.5 left-2.5">
            <Badge variant={event.status}>{event.status}</Badge>
          </div>
          <div className="absolute top-2.5 right-2.5">
            <span className="rounded-md bg-black/65 backdrop-blur-sm px-2 py-0.5 text-[10px] font-semibold text-white">
              {event.eventType}
            </span>
          </div>

          <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between text-[11px] text-white/90">
            <button
              onClick={handleCopyLink}
              title="Copy Customer Gallery Link"
              className="px-2 py-0.5 rounded bg-black/50 backdrop-blur-sm hover:bg-violet/80 text-white font-mono text-[10px] transition-all flex items-center gap-1 active:scale-95 cursor-pointer"
            >
              <span>{copied ? "✓ Copied!" : `Token: ${event.token}`}</span>
            </button>
            <span className="font-semibold font-mono text-[11px]">
              {event.photoCount.toLocaleString()} photos
            </span>
          </div>
        </div>

        {/* Content Details */}
        <div className="p-4">
          <h3 className="font-bold text-sm text-cloud line-clamp-1 group-hover:text-violet-light transition-colors">
            {event.name}
          </h3>
          <p className="mt-1.5 text-xs text-dim flex items-center gap-1.5">
            <span>📅</span> {event.date}
          </p>
          <p className="text-xs text-dim truncate mt-0.5 flex items-center gap-1.5">
            <span>📍</span> {event.location}
          </p>
        </div>
      </div>

      {/* Footer Info & Actions */}
      <div className="p-4 pt-0">
        <div className="pt-3 border-t border-hairline flex items-center justify-between text-xs gap-2">
          <Link
            to={`/event/${event.token}/gallery`}
            target="_blank"
            className="text-dim hover:text-cloud font-medium flex items-center gap-1"
          >
            <span>Gallery</span>
            <span>↗</span>
          </Link>

          <div className="flex items-center gap-1.5">
            {onShowQR && (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onShowQR(event);
                }}
                title="Generate & View QR Code"
                className="p-1.5 rounded-lg bg-panel2 hover:bg-violet/20 hover:text-violet-light text-dim transition-all active:scale-95 cursor-pointer border border-hairline/60"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="7" height="7" rx="1" />
                  <rect x="14" y="3" width="7" height="7" rx="1" />
                  <rect x="14" y="14" width="7" height="7" rx="1" />
                  <rect x="3" y="14" width="7" height="7" rx="1" />
                </svg>
              </button>
            )}

            {onDelete && (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onDelete(event);
                }}
                title="Delete Event"
                className="p-1.5 rounded-lg bg-panel2 hover:bg-bad/20 hover:text-bad text-dim transition-all active:scale-95 cursor-pointer border border-hairline/60"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                </svg>
              </button>
            )}

            <Link to={`/events/${event.id}/photos`}>
              <Button size="sm" variant="secondary" className="text-xs active:scale-95 transition-all">
                Photos
              </Button>
            </Link>
            <Link to={`/events/${event.id}`}>
              <Button size="sm" variant="primary" className="text-xs active:scale-95 transition-all">
                Manage
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </Card>
  );
};
