import React from "react";
import { Link } from "react-router-dom";
import type { SnapEvent } from "../types";

interface GalleryLayoutProps {
  event?: SnapEvent | null;
  children: React.ReactNode;
  activeAction?: "gallery" | "search" | "results";
}

export const GalleryLayout: React.FC<GalleryLayoutProps> = ({
  event,
  children,
  activeAction = "gallery",
}) => {
  const token = event?.token || "ABC123";

  return (
    <div className="min-h-screen bg-cream text-charcoal flex flex-col font-sans selection:bg-forest selection:text-white">
      {/* Sticky Gallery Header */}
      <header className="sticky top-0 z-40 w-full border-b border-warm-beige bg-surface/90 backdrop-blur-md px-4 sm:px-8 py-3.5 flex items-center justify-between shadow-sm">
        <Link
          to={`/event/${token}`}
          className="flex items-center gap-3 text-left group"
        >
          <div className="h-8 w-8 rounded-full bg-forest/10 border border-forest/20 flex items-center justify-center text-xs font-serif font-bold text-forest group-hover:scale-105 transition-transform">
            ✦
          </div>
          <div>
            <h1 className="text-sm font-serif font-semibold tracking-tight text-charcoal group-hover:text-forest transition-colors">
              {event?.name || "Event Gallery"}
            </h1>
            <p className="text-[11px] text-charcoal-muted">
              {event?.eventType || "Photography"} • {event?.date || "Event Date"}
            </p>
          </div>
        </Link>

        {/* Action Header Items */}
        <div className="flex items-center gap-3">
          {activeAction !== "gallery" ? (
            <Link
              to={`/event/${token}/gallery`}
              className="flex items-center gap-1.5 rounded-full border border-warm-beige bg-cream hover:bg-surface px-4 py-1.5 text-xs font-medium text-charcoal transition-all shadow-sm"
            >
              <svg className="h-3.5 w-3.5 text-charcoal-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
              <span>Back to Gallery</span>
            </Link>
          ) : (
            <Link
              to={`/event/${token}/search`}
              className="flex items-center gap-2 rounded-full bg-forest hover:bg-forest-light px-4 py-1.5 text-xs font-semibold text-white shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="8" r="4" />
                <path d="M6 20v-2a6 6 0 0112 0v2" />
              </svg>
              <span>Find My Photos</span>
            </Link>
          )}
        </div>
      </header>

      {/* Main Experience Content */}
      <main className="flex-1 flex flex-col">{children}</main>

      {/* Luxury Minimalist Footer */}
      <footer className="border-t border-warm-beige bg-surface py-8 px-4 text-center text-xs text-charcoal-muted">
        <div className="max-w-md mx-auto space-y-2">
          <p className="font-serif tracking-wider uppercase text-[11px] text-forest font-bold">
            SnapFind Studio
          </p>
          <p className="text-[11px] text-charcoal-muted">
            Every Moment Finds You. Private event gallery secured with facial recognition technology.
          </p>
          <p className="text-[10px] text-charcoal-muted/70 pt-2">
            © 2026 SnapFind Studio. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};
