import { useEffect, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { eventsApi, adminApi, billingApi } from "../services/api";
import { BrandMark } from "@snapfind/ui";
import type { SnapEvent } from "../types";
import type { SubscriptionStatus } from "@snapfind/types";

interface SidebarProps {
  onNavigate?: () => void;
}

export default function Sidebar({ onNavigate }: SidebarProps) {
  const { user, logout, isAdmin } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [pendingApprovals, setPendingApprovals] = useState<number>(0);
  const [events, setEvents] = useState<SnapEvent[]>([]);
  const [sub, setSub] = useState<SubscriptionStatus | null>(null);
  const [selectedEventId, setSelectedEventId] = useState<string>(() => {
    return localStorage.getItem("snapfind_active_event_id") || "";
  });

  useEffect(() => {
    let isMounted = true;
    billingApi.getSubscription().then((res) => {
      if (isMounted) setSub(res);
    }).catch(() => {});
    return () => {
      isMounted = false;
    };
  }, [location.pathname]);

  const usedBytes = sub?.used_storage_bytes ?? 0;
  const maxBytes = sub?.max_storage_bytes ?? (9 * 1024 * 1024 * 1024);
  const usedGB = (usedBytes / (1024 * 1024 * 1024)).toFixed(2);
  const maxGB = (maxBytes / (1024 * 1024 * 1024)).toFixed(1);
  const storagePercent = Math.min(100, Math.round((usedBytes / maxBytes) * 100));
  const remainingGB = Math.max(0, (maxBytes - usedBytes) / (1024 * 1024 * 1024)).toFixed(1);
  const isTrial = sub?.is_trial_edition !== false;

  useEffect(() => {
    let isMounted = true;
    eventsApi.list().then((data) => {
      if (isMounted && Array.isArray(data) && data.length > 0) {
        setEvents(data);
        if (!selectedEventId) {
          setSelectedEventId(data[0].id);
          localStorage.setItem("snapfind_active_event_id", data[0].id);
        }
      }
    }).catch(() => {});
    return () => {
      isMounted = false;
    };
  }, [selectedEventId]);

  const activeEvent = events.find((e) => e.id === selectedEventId) || events[0] || null;

  useEffect(() => {
    if (isAdmin) {
      adminApi.getSummary().then((res) => {
        if (res?.pending_approvals !== undefined) {
          setPendingApprovals(res.pending_approvals);
        }
      }).catch(() => {});
    }
  }, [isAdmin, location.pathname]);

  const navItems = [
    {
      label: "Dashboard",
      to: "/dashboard",
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="7" rx="1.5" />
          <rect x="14" y="3" width="7" height="7" rx="1.5" />
          <rect x="14" y="14" width="7" height="7" rx="1.5" />
          <rect x="3" y="14" width="7" height="7" rx="1.5" />
        </svg>
      ),
    },
    {
      label: "Events",
      to: "/events",
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
      label: "Photos & Upload",
      to: activeEvent ? `/events/${activeEvent.id}/photos` : "/events",
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="17 8 12 3 7 8" />
          <line x1="12" y1="3" x2="12" y2="15" />
        </svg>
      ),
    },
    {
      label: "AI Processing",
      to: activeEvent ? `/events/${activeEvent.id}/processing` : "/events",
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3" />
          <path d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32 1.41 1.41M2 12h2m16 0h2M4.93 19.07l1.41-1.41m11.32-11.32 1.41-1.41" />
        </svg>
      ),
    },
    {
      label: "Bookings",
      to: "/bookings",
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
          <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
          <path d="m9 14 2 2 4-4" />
        </svg>
      ),
    },
    {
      label: "Storage & Plan",
      to: "/subscription",
      badge: "9 GB Free",
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="5" width="20" height="14" rx="2" />
          <line x1="2" y1="10" x2="22" y2="10" />
        </svg>
      ),
    },
    {
      label: "Settings",
      to: "/settings",
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
      ),
    },
  ];

  const displayName = user?.display_name || user?.studio_name || "Alex";

  return (
    <aside className="relative flex h-full w-64 flex-col border-r border-[#1F293D] bg-[#0B1220] select-none font-sans flex-shrink-0 overflow-hidden">
      {/* Brand Header */}
      <div className="flex h-20 items-center px-6 flex-shrink-0 border-b border-[#151D2E]">
        <BrandMark size="md" showTagline={true} />
      </div>

      {/* Main Navigation (Midnight Navy background, subtle Champagne Gold active state) */}
      <nav className="flex-1 px-3.5 py-4 space-y-1.5 overflow-y-auto z-10">
        {navItems.map((item) => {
          const isActive = location.pathname === item.to || (item.to !== "/dashboard" && location.pathname.startsWith(item.to));
          return (
            <NavLink
              key={item.label}
              to={item.to}
              onClick={onNavigate}
              className={`flex items-center gap-3.5 rounded-xl px-3.5 py-2.5 text-xs transition-all duration-150 active:scale-[0.98] cursor-pointer ${
                isActive
                  ? "bg-[#D6A84F]/15 text-[#D6A84F] font-semibold border border-[#D6A84F]/30 shadow-[0_0_15px_rgba(214,168,79,0.15)]"
                  : "text-[#A8B0BE] hover:bg-[#151D2E] hover:text-[#F7F5F0]"
              }`}
            >
              <span className={`transition-colors ${isActive ? "text-[#D6A84F]" : "text-[#7A8394]"}`}>
                {item.icon}
              </span>
              <span className="truncate">{item.label}</span>
              {"badge" in item && item.badge && (
                <span className="ml-auto text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-[#D6A84F]/20 text-[#D6A84F] border border-[#D6A84F]/30">
                  {item.badge}
                </span>
              )}
            </NavLink>
          );
        })}

        {/* Admin Approvals Link if Admin */}
        {isAdmin && (
          <div className="pt-3 mt-3 border-t border-[#1F293D]">
            <NavLink
              to="/admin/approvals"
              onClick={onNavigate}
              className={({ isActive }) =>
                `flex items-center justify-between rounded-xl px-3.5 py-2.5 text-xs transition-all duration-150 active:scale-[0.98] cursor-pointer ${
                  isActive
                    ? "bg-[#D6A84F]/15 text-[#D6A84F] font-semibold border border-[#D6A84F]/30"
                    : "text-[#A8B0BE] hover:bg-[#151D2E] hover:text-[#F7F5F0]"
                }`
              }
            >
              <div className="flex items-center gap-3.5">
                <svg className="w-4 h-4 text-[#D6A84F]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  <path d="m9 12 2 2 4-4" />
                </svg>
                <span>Admin Approvals</span>
              </div>
              {pendingApprovals > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-[#D6A84F]/20 text-[#D6A84F] text-[10px] font-bold border border-[#D6A84F]/30">
                  {pendingApprovals}
                </span>
              )}
            </NavLink>
          </div>
        )}
      </nav>

      {/* Live Trial Storage Meter (Zero-Overage 9.0 GB Guard) */}
      <div className="mx-3.5 mb-2.5 p-3 rounded-xl bg-[#0E1626] border border-[#1F293D] text-xs">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[11px] font-medium text-[#A8B0BE] flex items-center gap-1.5">
            <span className={`w-1.5 h-1.5 rounded-full ${storagePercent >= 90 ? "bg-[#E87961] animate-ping" : storagePercent >= 75 ? "bg-[#E6A23C]" : "bg-[#8FA382]"}`} />
            {isTrial ? "Trial Storage (9 GB)" : "Cloud Storage"}
          </span>
          <span className="text-[10px] font-mono text-[#D6A84F] font-semibold">
            {usedGB}/{maxGB} GB
          </span>
        </div>
        <div className="w-full bg-[#151D2E] h-1.5 rounded-full overflow-hidden border border-[#1F293D]">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              storagePercent >= 90 ? "bg-[#E87961]" : storagePercent >= 75 ? "bg-[#E6A23C]" : "bg-[#D6A84F]"
            }`}
            style={{ width: `${Math.max(3, storagePercent)}%` }}
          />
        </div>
        <div className="flex items-center justify-between text-[9px] text-[#7A8394] font-mono mt-1">
          <span>{storagePercent}% used</span>
          <span className="text-[#8FA382] font-medium">{remainingGB} GB left</span>
        </div>
      </div>

      {/* User Profile Tray at Bottom (Midnight / Deep Slate container, Soft White text, Gold tier badge) */}
      <div className="relative z-10 p-3.5 border-t border-[#1F293D] bg-[#0E1626]/90 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className="h-10 w-10 rounded-full overflow-hidden border border-[#D6A84F]/40 shadow-sm flex-shrink-0 bg-[#151D2E] flex items-center justify-center">
            {user?.avatar_url ? (
              <img src={user.avatar_url} alt={displayName} className="h-full w-full object-cover" />
            ) : (
              <span className="text-sm font-serif font-bold text-[#D6A84F]">
                {displayName.charAt(0).toUpperCase()}
              </span>
            )}
          </div>

          {/* User Details */}
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-[#F7F5F0] truncate leading-tight">
              {displayName}
            </p>
            <p className="text-[10px] text-[#A8B0BE] truncate">
              Photographer
            </p>
            <div className="mt-1">
              <span className="inline-block px-2 py-0.5 rounded-full bg-[#D6A84F]/15 text-[#D6A84F] border border-[#D6A84F]/30 text-[9px] font-bold uppercase tracking-wider">
                {isTrial ? "Free Trial (9 GB)" : "Studio Pro"}
              </span>
            </div>
          </div>

          {/* Quick Logout */}
          <button
            onClick={() => {
              logout();
              navigate("/login");
            }}
            title="Sign Out"
            className="p-1.5 rounded-lg text-[#7A8394] hover:text-[#E87961] hover:bg-[#151D2E] transition-colors active:scale-95"
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
  );
}
