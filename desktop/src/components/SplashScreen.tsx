import React from "react";

export const SplashScreen: React.FC = () => {
  return (
    <div className="relative flex h-screen w-screen items-center justify-center overflow-hidden bg-[#0B1220] text-[#F7F5F0]">
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(214,168,79,0.12),_transparent_40%),radial-gradient(circle_at_bottom_right,_rgba(95,165,139,0.08),_transparent_30%),linear-gradient(135deg,#0B1220_0%,#151D2E_50%,#0B1220_100%)]" />
      <div className="absolute inset-0 opacity-20 [background-image:linear-gradient(rgba(214,168,79,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(214,168,79,0.05)_1px,transparent_1px)] [background-size:32px_32px]" />

      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="h-72 w-72 rounded-full bg-gold/10 blur-3xl animate-float-slow" />
      </div>

      <div className="relative z-10 flex flex-col items-center text-center px-6">
        {/* Luxury Gold Camera / Aperture Brand Symbol */}
        <div className="relative mb-6 flex h-20 w-20 items-center justify-center rounded-[24px] border border-gold/30 bg-gradient-to-br from-slate-panel via-midnight to-slate-panel shadow-[0_0_35px_rgba(214,168,79,0.25)]">
          <div className="absolute inset-2 rounded-[18px] border border-gold/20" />
          <svg className="w-9 h-9 text-gold" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
            <circle cx="12" cy="13" r="4" />
          </svg>
          <div className="absolute -inset-2.5 rounded-[28px] border border-gold/20 animate-pulse" />
        </div>

        <div className="mb-2 text-[11px] font-bold uppercase tracking-[0.35em] text-gold">
          SnapFind AI
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-soft-white sm:text-3xl">
          Professional Photography Studio
        </h1>
        <p className="mt-2.5 max-w-md text-xs sm:text-sm text-muted leading-relaxed">
          Syncing events, warming AI facial indexing, and preparing your high-performance workspace.
        </p>

        <div className="mt-7 w-full max-w-sm">
          <div className="mb-2 flex items-center justify-between text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">
            <span>System status</span>
            <span className="text-sage flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-sage animate-ping" />
              Connected
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full border border-slate-700 bg-midnight">
            <div className="h-full w-2/3 rounded-full bg-gradient-to-r from-gold via-gold-light to-sage animate-[loading-bar_2.2s_ease-in-out_infinite]" />
          </div>
        </div>

        <div className="mt-7 flex flex-wrap items-center justify-center gap-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
          {["AI Face Indexing", "Local RAW Scan", "MinIO Cloud Sync"].map((item) => (
            <span
              key={item}
              className="rounded-full border border-slate-800 bg-slate-panel/70 px-3 py-1.5 backdrop-blur-sm"
            >
              {item}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SplashScreen;
