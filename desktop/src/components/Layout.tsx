import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useApp } from "../state/store";

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
}

export const Layout: React.FC<LayoutProps> = ({ children, title }) => {
  const location = useLocation();
  const { user, logout, selectedEvent, uploadManager, settings } = useApp();

  const uploadStats = uploadManager?.getStats();

  const navItems = [
    { label: "Dashboard", path: "/", icon: "📊" },
    { label: "Events", path: "/events", icon: "📁" },
    { label: "Scan Folder", path: "/scan", icon: "🔍" },
    { label: "Upload Queue", path: "/uploads", icon: "🚀", badge: uploadStats?.remainingCount },
    { label: "Server Pipeline", path: "/processing", icon: "⚡" },
    { label: "Settings", path: "/settings", icon: "⚙️" },
  ];

  return (
    <div className="flex h-screen w-screen bg-base text-cloud select-none overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 flex-shrink-0 flex flex-col border-r border-hairline bg-panel">
        {/* Brand */}
        <div className="p-5 border-b border-hairline flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-violet to-violet-light flex items-center justify-center font-bold text-white shadow-md shadow-violet/20">
              SF
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-tight text-white flex items-center gap-1.5">
                SnapFind <span className="text-violet-light font-normal text-xs">Desktop</span>
              </h1>
              <p className="text-[10px] text-dim tracking-wider uppercase">Photo Agent v0.1</p>
            </div>
          </div>
          <span className="px-1.5 py-0.5 rounded bg-panel2 border border-hairline text-[10px] font-mono text-dim">
            MAC / WIN
          </span>
        </div>

        {/* Selected Event Context Pill */}
        {selectedEvent && (
          <div className="mx-3 mt-3 p-2.5 rounded-lg border border-violet/30 bg-violet/10">
            <p className="text-[10px] uppercase font-semibold tracking-wider text-violet-light">
              Active Event
            </p>
            <p className="text-xs font-semibold text-cloud truncate mt-0.5">
              {selectedEvent.name}
            </p>
          </div>
        )}

        {/* Navigation Items */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                  isActive
                    ? "bg-violet text-white shadow-sm"
                    : "text-dim hover:text-cloud hover:bg-panel2"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-sm">{item.icon}</span>
                  <span>{item.label}</span>
                </div>
                {typeof item.badge === "number" && item.badge > 0 && (
                  <span className="px-1.5 py-0.5 text-[10px] font-mono rounded-full bg-violet-light/20 text-white font-bold">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* In-Flight Upload Mini Widget */}
        {uploadStats && !uploadStats.isFinished && (
          <div className="m-3 p-3 rounded-xl border border-hairline bg-panel2/60">
            <div className="flex items-center justify-between text-[11px] font-medium mb-1.5">
              <span className="text-violet-light flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-violet-light animate-ping" />
                Uploading Batch
              </span>
              <span className="font-mono text-cloud font-semibold">
                {uploadStats.overallPercent}%
              </span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-panel overflow-hidden border border-hairline">
              <div
                className="h-full bg-violet transition-all duration-300"
                style={{ width: `${uploadStats.overallPercent}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[10px] text-dim mt-2">
              <span>{uploadStats.speedMBps} MB/s</span>
              <span>
                {uploadStats.uploadedCount}/{uploadStats.totalCount} files
              </span>
            </div>
          </div>
        )}

        {/* User Profile & Logout */}
        <div className="p-3 border-t border-hairline bg-panel2/30 flex items-center justify-between">
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="h-7 w-7 rounded-full bg-hairline flex items-center justify-center text-xs font-semibold text-dim">
              {user?.studio_name ? user.studio_name.slice(0, 1).toUpperCase() : "P"}
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-semibold text-cloud truncate">
                {user?.studio_name || "Photographer"}
              </p>
              <p className="text-[10px] text-dim truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={logout}
            title="Log Out"
            className="p-1.5 text-dim hover:text-bad rounded-lg hover:bg-panel2 transition-colors cursor-pointer text-xs"
          >
            🚪
          </button>
        </div>
      </aside>

      {/* Main Content Pane */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Top Header */}
        <header className="h-14 border-b border-hairline bg-panel/40 px-6 flex items-center justify-between backdrop-blur-sm flex-shrink-0">
          <div>
            <h2 className="text-sm font-semibold text-cloud">{title || "Dashboard"}</h2>
          </div>

          <div className="flex items-center gap-4 text-xs text-dim">
            <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-panel2 border border-hairline">
              <span className="h-2 w-2 rounded-full bg-good animate-pulse" />
              <span className="font-mono text-[11px] text-cloud">{settings.apiBaseUrl}</span>
            </div>
            <span className="text-[11px] text-dim font-mono">
              Worker Pool: {settings.concurrency} concurrent
            </span>
          </div>
        </header>

        {/* Screen Content Body */}
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
};
