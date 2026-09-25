import React from "react";

export const SplashScreen: React.FC = () => {
  return (
    <div className="relative flex h-screen w-screen items-center justify-center overflow-hidden bg-[#070B13] text-cloud">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(124,108,246,0.26),_transparent_30%),radial-gradient(circle_at_bottom_right,_rgba(61,214,140,0.18),_transparent_24%),linear-gradient(135deg,#070B13_0%,#0D1320_35%,#0A0F1A_100%)]" />
      <div className="absolute inset-0 opacity-30 [background-image:linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px)] [background-size:32px_32px]" />

      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="h-72 w-72 rounded-full bg-violet/20 blur-3xl animate-float-slow" />
      </div>

      <div className="relative z-10 flex flex-col items-center text-center">
        <div className="relative mb-6 flex h-20 w-20 items-center justify-center rounded-[28px] border border-violet/40 bg-gradient-to-br from-violet via-indigo-500 to-violet-light shadow-[0_0_40px_rgba(124,108,246,0.45)]">
          <div className="absolute inset-2 rounded-[20px] border border-white/20" />
          <span className="text-2xl font-black tracking-tight text-white">SF</span>
          <div className="absolute -inset-3 rounded-[32px] border border-violet/40 animate-pulse-ring" />
        </div>

        <div className="mb-3 text-[11px] font-semibold uppercase tracking-[0.35em] text-violet-light/80">
          SnapFind AI
        </div>
        <h1 className="text-3xl font-black tracking-tight text-white sm:text-4xl">
          Initializing Studio Flow
        </h1>
        <p className="mt-3 max-w-md text-sm text-dim">
          Syncing events, warming AI pipeline, and preparing your local photo workspace.
        </p>

        <div className="mt-7 w-full max-w-sm">
          <div className="mb-2 flex items-center justify-between text-[10px] font-semibold uppercase tracking-[0.2em] text-dim">
            <span>System status</span>
            <span className="text-violet-light">Running</span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full border border-hairline bg-panel2/80">
            <div className="h-full w-2/3 rounded-full bg-gradient-to-r from-violet via-violet-light to-good animate-[loading-bar_2.2s_ease-in-out_infinite]" />
          </div>
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-2 text-[10px] font-medium uppercase tracking-[0.18em] text-dim">
          {['AI indexing', 'Event sync', 'Photo queue'].map((item) => (
            <span
              key={item}
              className="rounded-full border border-hairline bg-white/5 px-3 py-1.5 backdrop-blur-sm"
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
