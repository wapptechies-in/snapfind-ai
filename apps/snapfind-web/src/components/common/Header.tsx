import React from "react";
import { useAuth } from "../../context/AuthContext";
import BackendStatusBadge from "../BackendStatusBadge";

interface HeaderProps {
  title: string;
  onOpenMobileMenu?: () => void;
  actions?: React.ReactNode;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  onOpenMobileMenu,
  actions,
}) => {
  const { user } = useAuth();
  const displayName = user?.display_name || user?.studio_name || "Alex";

  return (
    <header className="flex h-16 items-center justify-between border-b border-[#1F293D] px-4 md:px-8 bg-[#0B1220]/95 backdrop-blur-md sticky top-0 z-20 select-none">
      {/* Left: Mobile Menu & Title */}
      <div className="flex items-center gap-3">
        {onOpenMobileMenu && (
          <button
            className="rounded-lg p-2 text-[#A8B0BE] hover:bg-[#151D2E] hover:text-[#F7F5F0] md:hidden transition-colors focus:outline-none"
            onClick={onOpenMobileMenu}
            aria-label="Open sidebar menu"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 6h18M3 12h18M3 18h18" />
            </svg>
          </button>
        )}
        <h1 className="text-base font-bold text-[#F7F5F0] hidden sm:block truncate tracking-tight">
          {title}
        </h1>
      </div>

      {/* Center: Luxury Search Bar Pill */}
      <div className="flex-1 max-w-md mx-4">
        <div className="relative">
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#D6A84F]">
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </span>
          <input
            type="text"
            placeholder="Search events, clients, moments..."
            className="w-full pl-9 pr-4 py-1.5 rounded-full bg-[#151D2E] border border-[#232F48] text-xs text-[#F7F5F0] placeholder-[#6E788B] focus:outline-none focus:border-[#D6A84F] focus:ring-1 focus:ring-[#D6A84F]/40 shadow-inner transition-all"
          />
        </div>
      </div>

      {/* Right: Quick Action Controls + Profile Info */}
      <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
        {actions}

        {/* Share Button */}
        <button
          title="Share Portal"
          className="p-2 rounded-full text-[#A8B0BE] hover:bg-[#151D2E] hover:text-[#D6A84F] border border-transparent hover:border-[#232F48] transition-all active:scale-95"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
            <polyline points="16 6 12 2 8 6" />
            <line x1="12" y1="2" x2="12" y2="15" />
          </svg>
        </button>

        {/* Notification Bell with Warm Coral Indicator Dot */}
        <button
          title="Notifications"
          className="relative p-2 rounded-full text-[#A8B0BE] hover:bg-[#151D2E] hover:text-[#F7F5F0] border border-transparent hover:border-[#232F48] transition-all active:scale-95"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-[#E87961] ring-2 ring-[#0B1220]" />
        </button>

        {/* Message / Chat Bubble */}
        <button
          title="Messages & Client Chat"
          className="p-2 rounded-full text-[#A8B0BE] hover:bg-[#151D2E] hover:text-[#F7F5F0] border border-transparent hover:border-[#232F48] transition-all active:scale-95"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        </button>

        {/* Status Indicator */}
        <BackendStatusBadge />

        {/* User Profile Pill */}
        <div className="hidden lg:flex items-center gap-2 pl-2 border-l border-[#1F293D]">
          <div className="h-8 w-8 rounded-full overflow-hidden border border-[#D6A84F]/40 bg-[#151D2E] flex items-center justify-center flex-shrink-0">
            {user?.avatar_url ? (
              <img src={user.avatar_url} alt={displayName} className="h-full w-full object-cover" />
            ) : (
              <span className="text-xs font-serif font-bold text-[#D6A84F]">
                {displayName.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <div className="hidden xl:block text-left">
            <p className="text-xs font-semibold text-[#F7F5F0] leading-none">{displayName}</p>
            <p className="text-[10px] text-[#A8B0BE] mt-0.5 leading-none">Photographer</p>
          </div>
        </div>
      </div>
    </header>
  );
};
