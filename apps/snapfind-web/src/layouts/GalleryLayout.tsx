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
    <div className="min-h-screen bg-[#07090D] text-cloud flex flex-col font-sans selection:bg-violet selection:text-white">
      {/* Sticky Gallery Header */}
      <header className="sticky top-0 z-40 w-full border-b border-white/10 bg-[#07090D]/80 backdrop-blur-md px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <Link
          to={`/event/${token}`}
          className="flex items-center gap-3 text-left group"
        >
          <div className="h-8 w-8 rounded-full bg-violet/20 border border-violet/30 flex items-center justify-center text-xs font-serif font-bold text-violet-light group-hover:scale-105 transition-transform">
            ✦
          </div>
          <div>
            <h1 className="text-sm font-semibold tracking-tight text-white group-hover:text-violet-light transition-colors">
              {event?.name || "Event Gallery"}
            </h1>
            <p className="text-[11px] text-zinc-400">
              {event?.eventType || "Photography"} • {event?.date || "September 2026"}
            </p>
          </div>
        </Link>

        {/* Action Header Items */}
        <div className="flex items-center gap-3">
          {activeAction !== "gallery" ? (
            <Link
              to={`/event/${token}`}
              className="flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 hover:bg-white/10 px-3.5 py-1.5 text-xs font-medium text-zinc-300 hover:text-white transition-all"
            >
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
              <span>Back to Gallery</span>
            </Link>
          ) : (
            <Link
              to={`/event/${token}/search`}
              className="flex items-center gap-2 rounded-full bg-gradient-to-r from-violet to-violet-light hover:brightness-110 px-4 py-1.5 text-xs font-semibold text-white shadow-lg shadow-violet/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
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
      <footer className="border-t border-white/5 bg-[#050608] py-8 px-4 text-center text-xs text-zinc-500">
        <div className="max-w-md mx-auto space-y-2">
          <p className="font-serif tracking-wider uppercase text-[11px] text-zinc-400">
            Powered by SnapFind AI
          </p>
          <p className="text-[11px]">
            Scan. Find. Relive. Private event gallery secured with facial recognition technology.
          </p>
          <p className="text-[10px] text-zinc-600 pt-2">
            © 2026 SnapFind AI Inc. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};
