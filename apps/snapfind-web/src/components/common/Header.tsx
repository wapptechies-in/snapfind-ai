import React from "react";
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
  return (
    <header className="flex h-16 items-center justify-between border-b border-hairline px-4 md:px-8 bg-base/80 backdrop-blur-sm sticky top-0 z-20">
      <div className="flex items-center gap-3">
        {onOpenMobileMenu && (
          <button
            className="rounded-md p-2 text-dim hover:bg-panel2 md:hidden transition-colors focus:outline-none focus:ring-2 focus:ring-violet/50"
            onClick={onOpenMobileMenu}
            aria-label="Open sidebar menu"
          >
            <svg
              className="h-5 w-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
            >
              <path d="M3 6h18M3 12h18M3 18h18" />
            </svg>
          </button>
        )}
        <h1 className="text-lg font-semibold tracking-tight text-cloud">{title}</h1>
      </div>

      <div className="flex items-center gap-3">
        {actions}
        <BackendStatusBadge />
      </div>
    </header>
  );
};

