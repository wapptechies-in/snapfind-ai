import { useEffect, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { eventsApi, adminApi } from "../services/api";
import { BrandMark } from "@snapfind/ui";
import { BotanicalLeaves } from "@snapfind/ui";
import type { SnapEvent } from "../types";

interface SidebarProps {
  onNavigate?: () => void;
}

export default function Sidebar({ onNavigate }: SidebarProps) {
  const { user, logout, isAdmin } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [pendingApprovals, setPendingApprovals] = useState<number>(0);
  const [events, setEvents] = useState<SnapEvent[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>(() => {
    return localStorage.getItem("snapfind_active_event_id") || "";
  });

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
  }, []);

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
      label: "Home",
      to: "/dashboard",
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
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
      label: "Capture & Upload",
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
      label: "Processing",
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
      label: "Subscription",
      to: "/subscription",
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

  const displayName = user?.display_name || user?.studio_name || "Jebastin";

  return (
    <aside className="relative flex h-full w-64 flex-col border-r border-[#E7E3DC] bg-[#FAF8F5] select-none font-sans flex-shrink-0 overflow-hidden">
      {/* Brand Header */}
      <div className="flex h-20 items-center px-5 flex-shrink-0">
        <BrandMark size="md" showTagline={true} />
      </div>

      {/* Main Navigation (7 synchronized items matching reference) */}
      <nav className="flex-1 px-3 py-2 space-y-1.5 overflow-y-auto z-10">
        {navItems.map((item) => {
          const isActive = location.pathname === item.to || (item.to !== "/dashboard" && location.pathname.startsWith(item.to));
          return (
            <NavLink
              key={item.label}
              to={item.to}
              onClick={onNavigate}
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
            </NavLink>
          );
        })}

        {/* Admin Approvals Link if Admin */}
        {isAdmin && (
          <div className="pt-3 mt-3 border-t border-[#E7E3DC]">
            <NavLink
              to="/admin/approvals"
              onClick={onNavigate}
              className={({ isActive }) =>
                `flex items-center justify-between rounded-xl px-3.5 py-2.5 text-xs transition-all duration-150 active:scale-[0.97] cursor-pointer ${
                  isActive
                    ? "bg-[#E2EBE2] text-[#1E3A2F] font-semibold"
                    : "text-[#555C56] hover:bg-[#F3EFE9] hover:text-[#1E3A2F]"
                }`
              }
            >
              <div className="flex items-center gap-3.5">
                <svg className="w-4 h-4 text-amber-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  <path d="m9 12 2 2 4-4" />
                </svg>
                <span>Admin Approvals</span>
              </div>
              {pendingApprovals > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold">
                  {pendingApprovals}
                </span>
              )}
            </NavLink>
          </div>
        )}
      </nav>

      {/* Decorative Botanical Foliage in Bottom-Left Corner */}
      <div className="absolute -bottom-8 -left-8 z-0 pointer-events-none opacity-40">
        <BotanicalLeaves width={160} height={160} />
      </div>

      {/* User Profile Tray at Bottom (Matching Reference: Avatar, Jebastin, Photographer, Studio Pro badge) */}
      <div className="relative z-10 p-3.5 border-t border-[#E7E3DC] bg-[#FAF8F5]/90 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className="h-10 w-10 rounded-full overflow-hidden border-2 border-[#E7E3DC] shadow-sm flex-shrink-0 bg-white flex items-center justify-center">
            {user?.avatar_url ? (
              <img src={user.avatar_url} alt={displayName} className="h-full w-full object-cover" />
            ) : (
              <span className="text-sm font-serif font-bold text-[#1E3A2F]">
                {displayName.charAt(0).toUpperCase()}
              </span>
            )}
          </div>

          {/* User Details */}
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

          {/* Quick Logout or Settings */}
          <button
            onClick={() => {
              logout();
              navigate("/login");
            }}
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
  );
}
