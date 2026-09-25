import React from "react";
import { Badge } from "./Badge";
import { Card } from "./Card";
import type { SnapEvent } from "@snapfind/types";

export interface EventCardProps {
  event: SnapEvent;
  coverImage?: string;
  onClick?: () => void;
  onSelectAndScan?: () => void;
  onOpenPhotos?: () => void;
  onOpenSettings?: () => void;
  onOpenQR?: () => void;
  onDelete?: () => void;
  className?: string;
  isDesktop?: boolean;
}

export const EventCard: React.FC<EventCardProps> = ({
  event,
  coverImage,
  onClick,
  onSelectAndScan,
  onOpenPhotos,
  onOpenSettings,
  onOpenQR,
  onDelete,
  className = "",
  isDesktop = false,
}) => {
  const photoCount = event.photoCount ?? event.photo_count ?? 0;
  const guestCount = (event as any).guestCount ?? (event as any).total_registrations ?? 0;
  const formattedDate = event.date
    ? new Date(event.date).toLocaleDateString(undefined, {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "No date set";

  const fallbackCover =
    "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=80";

  const imageSrc = coverImage || event.coverImage || event.cover_image_url || fallbackCover;

  return (
    <Card
      hover
      className={`group flex flex-col overflow-hidden bg-white ${className}`}
      onClick={onClick}
    >
      {/* 16:9 Photography Container */}
      <div className="relative aspect-[16/9] w-full overflow-hidden bg-cream">
        <img
          src={imageSrc}
          alt={event.name}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-charcoal/60 via-transparent to-transparent opacity-60" />

        {/* Status Badge */}
        <div className="absolute top-3 left-3">
          <Badge variant={event.status || "active"} size="sm">
            {event.status || "Active"}
          </Badge>
        </div>

        {/* Photo count pill */}
        <div className="absolute bottom-2.5 right-3 rounded-md bg-charcoal/70 px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur-sm">
          {photoCount.toLocaleString()} {photoCount === 1 ? "photo" : "photos"}
        </div>
      </div>

      {/* Card Content Area */}
      <div className="flex flex-1 flex-col p-4">
        <h3 className="font-serif text-base font-bold text-charcoal group-hover:text-forest transition-colors truncate">
          {event.name}
        </h3>

        {/* Metadata Details */}
        <div className="mt-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-warm-gray font-body">
          <span className="flex items-center gap-1">
            <svg className="w-3.5 h-3.5 text-sage" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            {formattedDate}
          </span>

          {event.location && (
            <span className="flex items-center gap-1 truncate max-w-[140px]">
              <svg className="w-3.5 h-3.5 text-sage" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              {event.location}
            </span>
          )}

          {guestCount > 0 && (
            <span className="flex items-center gap-1">
              <span>👥</span>
              {guestCount} guests
            </span>
          )}
        </div>

        {/* Card Footer Actions */}
        <div className="mt-4 pt-3 border-t border-warm-border-light flex items-center justify-between gap-2">
          {/* Action pills */}
          <div className="flex items-center gap-1">
            {onOpenPhotos && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenPhotos();
                }}
                className="rounded-lg p-1.5 text-warm-gray hover:text-forest hover:bg-cream transition-colors"
                title="View Photos"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <polyline points="21 15 16 10 5 21" />
                </svg>
              </button>
            )}

            {onOpenQR && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenQR();
                }}
                className="rounded-lg p-1.5 text-warm-gray hover:text-forest hover:bg-cream transition-colors"
                title="Guest QR Code"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="7" height="7" />
                  <rect x="14" y="3" width="7" height="7" />
                  <rect x="3" y="14" width="7" height="7" />
                  <rect x="14" y="14" width="7" height="7" />
                </svg>
              </button>
            )}

            {onOpenSettings && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenSettings();
                }}
                className="rounded-lg p-1.5 text-warm-gray hover:text-forest hover:bg-cream transition-colors"
                title="Event Settings"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="3" />
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                </svg>
              </button>
            )}

            {onDelete && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
                className="rounded-lg p-1.5 text-warm-gray hover:text-danger hover:bg-danger-bg transition-colors"
                title="Delete Event"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                </svg>
              </button>
            )}
          </div>

          {/* Primary Action Button */}
          {isDesktop && onSelectAndScan ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onSelectAndScan();
              }}
              className="rounded-xl bg-forest hover:bg-forest-hover px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-colors flex items-center gap-1.5"
            >
              <span>Select & Scan</span>
              <span>→</span>
            </button>
          ) : (
            <span className="text-xs font-semibold text-forest group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
              <span>Open Event</span>
              <span>→</span>
            </span>
          )}
        </div>
      </div>
    </Card>
  );
};
