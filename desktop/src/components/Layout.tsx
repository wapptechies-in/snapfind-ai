import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useApp } from "../state/store";
import { BrandMark, BotanicalLeaves } from "@snapfind/ui";
import { BackendStatusBadge } from "./BackendStatusBadge";

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
}

export const Layout: React.FC<LayoutProps> = ({ children, title }) => {
  const location = useLocation();
  const { user, logout } = useApp();

  const navItems = [
    {
      label: "Home",
      path: "/",
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
      ),
    },
    {
      label: "Events",
      path: "/events",
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
      ),
    },
    {
      label: "Capture & Upload",
      path: "/scan",
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="17 8 12 3 7 8" />
          <line x1="12" y1="3" x2="12" y2="15" />
        </svg>
      ),
    },
    {
      label: "Processing",
      path: "/processing",
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3" />
          <path d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32 1.41 1.41M2 12h2m16 0h2M4.93 19.07l1.41-1.41m11.32-11.32 1.41-1.41" />
        </svg>
      ),
    },
    {
      label: "Bookings",
      path: "/bookings",
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
          <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
          <path d="m9 14 2 2 4-4" />
        </svg>
      ),
    },
    {
      label: "Subscription",
      path: "/subscription",
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="5" width="20" height="14" rx="2" />
          <line x1="2" y1="10" x2="22" y2="10" />
        </svg>
      ),
    },
    {
      label: "Settings",
      path: "/settings",
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
      ),
    },
  ];

  const displayName = user?.display_name || user?.studio_name || "Jebastin";

  return (
    <div className="flex h-screen w-screen bg-[#FAF8F5] text-[#1A1C1A] select-none overflow-hidden font-body">
      {/* Synchronized Left Sidebar */}
      <aside className="relative w-64 flex-shrink-0 flex flex-col border-r border-[#E7E3DC] bg-[#FAF8F5] overflow-hidden">
        {/* Brand Header */}
        <div className="flex h-20 items-center px-5 flex-shrink-0">
          <BrandMark size="md" showTagline={true} />
        </div>

        {/* Navigation Items (7 items exactly matching Web) */}
        <nav className="flex-1 px-3 py-2 space-y-1.5 overflow-y-auto z-10">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path || (item.path !== "/" && location.pathname.startsWith(item.path));
            return (
              <Link
                key={item.label}
                to={item.path}
                className={`flex items-center gap-3.5 rounded-xl px-3.5 py-2.5 text-xs transition-all duration-150 active:scale-[0.97] cursor-pointer ${
                  isActive
                    ? "bg-[#E2EBE2] text-[#1E3A2F] font-semibold shadow-sm"
                    : "text-[#555C56] hover:bg-[#F3EFE9] hover:text-[#1E3A2F]"
                }`}
              >
                <span className={`transition-colors ${isActive ? "text-[#1E3A2F]" : "text-[#737A74]"}`}>
                  {item.icon}
                </span>
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Decorative Botanical Leaves in Bottom-Left Corner */}
        <div className="absolute -bottom-8 -left-8 z-0 pointer-events-none opacity-40">
          <BotanicalLeaves width={160} height={160} />
        </div>

        {/* User Profile Tray at Bottom */}
        <div className="relative z-10 p-3.5 border-t border-[#E7E3DC] bg-[#FAF8F5]/90 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full overflow-hidden border-2 border-[#E7E3DC] shadow-sm flex-shrink-0 bg-white flex items-center justify-center">
              <span className="text-sm font-serif font-bold text-[#1E3A2F]">
                {displayName.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-serif font-bold text-[#1A1C1A] truncate leading-tight">
                {displayName}
              </p>
              <p className="text-[10px] text-[#737A74] truncate">
                Photographer
              </p>
              <div className="mt-1">
                <span className="inline-block px-2 py-0.5 rounded-full bg-[#1E3A2F] text-white text-[9px] font-bold uppercase tracking-wider shadow-xs">
                  Studio Pro
                </span>
              </div>
            </div>
            <button
              onClick={() => logout()}
              title="Sign Out"
              className="p-1.5 rounded-lg text-[#737A74] hover:text-[#C2413A] hover:bg-red-50 transition-colors active:scale-95"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Synchronized Header */}
        <header className="h-16 px-6 border-b border-[#E7E3DC] bg-[#FAF8F5]/90 backdrop-blur-md flex items-center justify-between flex-shrink-0">
          {/* Left Title */}
          <div className="flex items-center gap-3">
            <h1 className="text-base font-serif font-bold text-[#1A1C1A] truncate">
              {title || "Dashboard"}
            </h1>
          </div>

          {/* Centered Search Pill */}
          <div className="flex-1 max-w-md mx-4">
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#737A74]">
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </span>
              <input
                type="text"
                placeholder="Search events, clients, photos..."
                className="w-full pl-9 pr-4 py-1.5 rounded-full bg-white border border-[#E7E3DC] text-xs text-[#1A1C1A] placeholder-[#8C948D] focus:outline-none focus:border-[#1E3A2F] shadow-xs transition-colors"
              />
            </div>
          </div>

          {/* Right Action Icons & Profile Info */}
          <div className="flex items-center gap-3 flex-shrink-0">
            {/* Share Button */}
            <button
              title="Share"
              className="p-2 rounded-full text-[#555C56] hover:bg-white hover:text-[#1E3A2F] border border-transparent hover:border-[#E7E3DC] transition-all active:scale-95 shadow-xs"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                <polyline points="16 6 12 2 8 6" />
                <line x1="12" y1="2" x2="12" y2="15" />
              </svg>
            </button>

            {/* Notification Bell */}
            <button
              title="Notifications"
              className="relative p-2 rounded-full text-[#555C56] hover:bg-white hover:text-[#1E3A2F] border border-transparent hover:border-[#E7E3DC] transition-all active:scale-95 shadow-xs"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-[#FAF8F5]" />
            </button>

            {/* Message Bubble */}
            <button
              title="Messages"
              className="p-2 rounded-full text-[#555C56] hover:bg-white hover:text-[#1E3A2F] border border-transparent hover:border-[#E7E3DC] transition-all active:scale-95 shadow-xs"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </button>

            <BackendStatusBadge />

            {/* User Profile Chip */}
            <div className="hidden lg:flex items-center gap-2 pl-2 border-l border-[#E7E3DC]">
              <div className="h-8 w-8 rounded-full overflow-hidden border border-[#E7E3DC] bg-white flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-serif font-bold text-[#1E3A2F]">
                  {displayName.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="text-left leading-tight">
                <p className="text-xs font-serif font-bold text-[#1A1C1A] truncate max-w-[100px]">
                  {displayName}
                </p>
                <p className="text-[10px] text-[#737A74]">
                  Photographer
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* View Content */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 bg-[#FAF8F5]">
          {children}
        </main>
      </div>
    </div>
  );
};
