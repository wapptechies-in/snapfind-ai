import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useApp } from "../state/store";
import { BrandMark } from "@snapfind/ui";
import { BackendStatusBadge } from "./BackendStatusBadge";

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
}

export const Layout: React.FC<LayoutProps> = ({ children, title }) => {
  const location = useLocation();
  const { user, logout, events, subscription } = useApp();

  const safeEvents = Array.isArray(events) ? events : [];

  const navItems = [
    {
      label: "Dashboard",
      path: "/",
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="9" rx="1" />
          <rect x="14" y="3" width="7" height="5" rx="1" />
          <rect x="14" y="12" width="7" height="9" rx="1" />
          <rect x="3" y="16" width="7" height="5" rx="1" />
        </svg>
      ),
    },
    {
      label: "Events",
      path: "/events",
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
      ),
      badge: safeEvents.length > 0 ? String(safeEvents.length) : undefined,
    },
    {
      label: "Capture & Scan",
      path: "/scan",
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
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
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3" />
          <path d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32 1.41 1.41M2 12h2m16 0h2M4.93 19.07l1.41-1.41m11.32-11.32 1.41-1.41" />
        </svg>
      ),
    },
    {
      label: "Bookings",
      path: "/bookings",
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
          <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
          <path d="m9 14 2 2 4-4" />
        </svg>
      ),
    },
    {
      label: "Analytics",
      path: "/analytics",
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="20" x2="18" y2="10" />
          <line x1="12" y1="20" x2="12" y2="4" />
          <line x1="6" y1="20" x2="6" y2="14" />
        </svg>
      ),
    },
    {
      label: "Storage & Plan",
      path: "/subscription",
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
          <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
          <line x1="12" y1="22.08" x2="12" y2="12" />
        </svg>
      ),
      badge: "9 GB Free",
    },
    {
      label: "Settings",
      path: "/settings",
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
      ),
    },
  ];

  const displayName = user?.display_name || user?.studio_name || "Jebastin";
  const usedBytes = subscription?.used_storage_bytes || 0;
  const maxBytes = subscription?.max_storage_bytes || (9 * 1024 * 1024 * 1024);
  const usedGB = (usedBytes / (1024 * 1024 * 1024)).toFixed(2);
  const maxGB = (maxBytes / (1024 * 1024 * 1024)).toFixed(1);
  const storagePercent = Math.min(100, Math.round((usedBytes / maxBytes) * 100));
  const remainingGB = Math.max(0, (maxBytes - usedBytes) / (1024 * 1024 * 1024)).toFixed(1);

  return (
    <div className="flex h-screen w-screen bg-[#0B1220] text-[#F7F5F0] select-none overflow-hidden font-sans">
      {/* Synchronized Left Sidebar */}
      <aside className="relative w-64 flex-shrink-0 flex flex-col border-r border-[#1E283D] bg-[#0B1220] overflow-hidden">
        {/* Brand Header */}
        <div className="flex h-18 items-center px-5 flex-shrink-0 border-b border-[#1E283D]">
          <BrandMark size="md" showTagline={true} />
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto z-10">
          <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-[#A8B0BE]/60">
            Navigation
          </div>
          {navItems.map((item) => {
            const isActive = location.pathname === item.path || (item.path !== "/" && location.pathname.startsWith(item.path));
            return (
              <Link
                key={item.label}
                to={item.path}
                className={`flex items-center justify-between rounded-xl px-3.5 py-2.5 text-xs transition-all duration-150 active:scale-[0.98] cursor-pointer ${
                  isActive
                    ? "bg-[#D6A84F]/12 text-[#D6A84F] font-bold shadow-xs border-l-2 border-[#D6A84F]"
                    : "text-[#A8B0BE] hover:bg-[#151D2E] hover:text-[#F7F5F0]"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={`transition-colors ${isActive ? "text-[#D6A84F]" : "text-[#A8B0BE]"}`}>
                    {item.icon}
                  </span>
                  <span className="truncate">{item.label}</span>
                </div>
                {item.badge && (
                  <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold font-mono bg-[#151D2E] text-[#D6A84F] border border-[#232F48]">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Trial Storage Meter Box */}
        <div className="mx-3 mb-2 p-3 rounded-xl bg-[#151D2E]/90 border border-[#1E283D] shadow-xs">
          <div className="flex items-center justify-between text-[11px] mb-1.5">
            <span className="font-bold text-[#F7F5F0] flex items-center gap-1.5">
              <span className={`h-2 w-2 rounded-full ${storagePercent >= 90 ? "bg-[#E87961] animate-ping" : storagePercent >= 75 ? "bg-[#E6A23C]" : "bg-[#8FA382]"}`} />
              Trial Storage
            </span>
            <span className="font-mono text-[#D6A84F] font-bold text-[10px]">{usedGB} / {maxGB} GB</span>
          </div>
          <div className="w-full bg-[#0B1220] h-1.5 rounded-full overflow-hidden border border-[#1E283D]">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                storagePercent >= 90 ? "bg-[#E87961]" : storagePercent >= 75 ? "bg-[#E6A23C]" : "bg-gradient-to-r from-[#D6A84F] to-[#8FA382]"
              }`}
              style={{ width: `${Math.max(2, storagePercent)}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[9px] text-[#A8B0BE] mt-1.5 font-medium">
            <span>Unlimited Events</span>
            <span>{remainingGB} GB left</span>
          </div>
        </div>

        {/* User Profile Tray at Bottom */}
        <div className="relative z-10 p-3.5 border-t border-[#1E283D] bg-[#0B1220]/95 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full overflow-hidden border border-[#232F48] shadow-sm flex-shrink-0 bg-[#151D2E] flex items-center justify-center">
              <span className="text-sm font-bold text-[#D6A84F]">
                {displayName.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-[#F7F5F0] truncate leading-tight">
                {displayName}
              </p>
              <p className="text-[10px] text-[#A8B0BE] truncate">
                Photographer
              </p>
              <div className="mt-1">
                <span className="inline-block px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-[#8FA382]/20 text-[#8FA382] border border-[#8FA382]/30">
                  Free Trial (9 GB)
                </span>
              </div>
            </div>
            <button
              onClick={() => logout()}
              title="Sign Out"
              className="p-1.5 rounded-lg text-[#A8B0BE] hover:text-[#E87961] hover:bg-[#151D2E] transition-colors active:scale-95 cursor-pointer"
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
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-[#0B1220]">
        {/* Synchronized Header */}
        <header className="h-18 px-6 border-b border-[#1E283D] bg-[#0B1220]/95 backdrop-blur-md flex items-center justify-between flex-shrink-0">
          {/* Left Title */}
          <div className="flex items-center gap-3">
            <h1 className="text-base font-bold text-[#F7F5F0] truncate">
              {title || "Dashboard"}
            </h1>
          </div>

          {/* Centered Search Pill */}
          <div className="flex-1 max-w-md mx-6">
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#D6A84F]">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </span>
              <input
                type="text"
                placeholder="Search people, events, moments..."
                className="w-full pl-10 pr-4 py-2 rounded-xl bg-[#0F1624] border border-[#232F48] text-xs text-[#F7F5F0] placeholder-[#6E788B] focus:outline-none focus:border-[#D6A84F] focus:ring-1 focus:ring-[#D6A84F]/40 shadow-xs transition-colors"
              />
            </div>
          </div>

          {/* Right Action Icons & Profile Info */}
          <div className="flex items-center gap-3 flex-shrink-0">
            {/* Share Button */}
            <button
              title="Share"
              className="p-2 rounded-xl text-[#A8B0BE] hover:bg-[#151D2E] hover:text-[#D6A84F] border border-[#232F48] transition-all active:scale-95 shadow-xs cursor-pointer"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                <polyline points="16 6 12 2 8 6" />
                <line x1="12" y1="2" x2="12" y2="15" />
              </svg>
            </button>

            {/* Notification Bell with Coral Indicator */}
            <button
              title="Notifications"
              className="relative p-2 rounded-xl text-[#A8B0BE] hover:bg-[#151D2E] hover:text-[#D6A84F] border border-[#232F48] transition-all active:scale-95 shadow-xs cursor-pointer"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-[#E87961] ring-2 ring-[#0B1220]" />
            </button>

            <BackendStatusBadge />

            {/* User Profile Chip */}
            <div className="hidden lg:flex items-center gap-2.5 pl-3 border-l border-[#1E283D]">
              <div className="h-8 w-8 rounded-full overflow-hidden border border-[#232F48] bg-[#151D2E] flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-bold text-[#D6A84F]">
                  {displayName.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="text-left leading-tight">
                <p className="text-xs font-bold text-[#F7F5F0] truncate max-w-[100px]">
                  {displayName}
                </p>
                <p className="text-[10px] text-[#A8B0BE]">
                  Photographer
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* View Workspace */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 bg-[#0B1220] sf-ambient-bg">
          {children}
        </main>
      </div>
    </div>
  );
};
