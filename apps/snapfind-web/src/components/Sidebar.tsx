import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: "grid" },
  { to: "/events", label: "Events", icon: "calendar" },
  { to: "/events/evt_1/photos", label: "Photos", icon: "image" },
  { to: "/events/evt_1/processing", label: "Processing", icon: "cpu" },
  { to: "/events/evt_1/qr", label: "QR Codes", icon: "qr" },
  { to: "/events/evt_1/settings", label: "Settings", icon: "settings" },
  { to: "/profile", label: "Profile", icon: "user" },
];

function Icon({ name }: { name: string }) {
  const common = "h-[18px] w-[18px]";
  switch (name) {
    case "grid":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
          <rect x="3" y="3" width="8" height="8" rx="1.5" /><rect x="13" y="3" width="8" height="8" rx="1.5" />
          <rect x="3" y="13" width="8" height="8" rx="1.5" /><rect x="13" y="13" width="8" height="8" rx="1.5" />
        </svg>
      );
    case "calendar":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
          <rect x="3" y="5" width="18" height="16" rx="2" /><path d="M8 3v4M16 3v4M3 10h18" />
        </svg>
      );
    case "image":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
          <rect x="3" y="4" width="18" height="16" rx="2" /><circle cx="9" cy="10" r="2" /><path d="M21 16l-5.5-5.5L5 21" />
        </svg>
      );
    case "cpu":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
          <rect x="6" y="6" width="12" height="12" rx="1.5" /><path d="M9 2v3M15 2v3M9 19v3M15 19v3M2 9h3M2 15h3M19 9h3M19 15h3" />
        </svg>
      );
    case "qr":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
          <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
          <rect x="3" y="14" width="7" height="7" /><path d="M14 14h3v3h-3zM19 14h2M14 19h2M19 19h2" />
        </svg>
      );
    case "settings":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
          <circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09a1.65 1.65 0 00-1-1.51 1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06A1.65 1.65 0 004.6 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06A1.65 1.65 0 009 4.6a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09c0 .68.39 1.29 1 1.51.61.25 1.31.13 1.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06c-.46.51-.58 1.21-.33 1.82.22.61.83 1 1.51 1H21a2 2 0 010 4h-.09c-.68 0-1.29.39-1.51 1z" />
        </svg>
      );
    case "user":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
          <circle cx="12" cy="7" r="4" /><path d="M6 21v-2a4 4 0 014-4h4a4 4 0 014 4v2" />
        </svg>
      );
    default:
      return null;
  }
}

export default function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    if (onNavigate) onNavigate();
    navigate("/login");
  };

  return (
    <aside className="flex h-full w-64 flex-col border-r border-hairline bg-panel select-none">
      {/* Brand Header */}
      <div className="flex h-16 items-center justify-between border-b border-hairline px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet text-xs font-bold text-white shadow-sm">
            S
          </div>
          <div>
            <span className="block text-sm font-semibold tracking-tight text-cloud">
              SnapFind AI
            </span>
            <span className="block text-[10px] text-violet-light font-medium uppercase tracking-wider">
              Web Portal
            </span>
          </div>
        </div>
        <span className="rounded bg-violet/15 text-violet-light px-1.5 py-0.5 text-[9px] font-semibold">
          MOCK
        </span>
      </div>

      {/* Photographer Studio Card */}
      <NavLink
        to="/profile"
        onClick={onNavigate}
        className="mx-3 mt-4 mb-2 block rounded-lg border border-hairline bg-panel2/60 p-3 hover:border-violet/40 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <div className="h-7 w-7 rounded-full bg-violet/20 flex items-center justify-center text-xs font-bold text-violet-light">
            {user?.studio_name ? user.studio_name.charAt(0) : "M"}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-cloud truncate">
              {user?.studio_name || "Marlowe Light Studio"}
            </p>
            <p className="text-[10px] text-dim truncate">
              {user?.email || "photographer@example.com"}
            </p>
          </div>
          <span className="text-[10px] text-violet-light font-medium">Pro</span>
        </div>
      </NavLink>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-3 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={onNavigate}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                isActive
                  ? "bg-violet/15 text-violet-light font-medium"
                  : "text-dim hover:bg-panel2 hover:text-cloud"
              }`
            }
          >
            <Icon name={item.icon} />
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* Footer Profile & Logout */}
      <div className="border-t border-hairline p-3 space-y-1">
        <NavLink
          to="/event/ABC123"
          target="_blank"
          className="flex items-center justify-between rounded-lg px-3 py-2 text-xs text-dim hover:bg-panel2 hover:text-cloud transition-colors"
        >
          <span className="flex items-center gap-2">
            <span>🌐</span> Preview Customer Gallery
          </span>
          <span className="text-[10px] text-violet-light">↗</span>
        </NavLink>

        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm text-dim hover:bg-panel2 hover:text-bad transition-colors"
        >
          <svg className="h-[18px] w-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" />
          </svg>
          Logout
        </button>
      </div>
    </aside>
  );
}
