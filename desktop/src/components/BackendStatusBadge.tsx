import React, { useEffect, useState } from "react";
import { useApp } from "../state/store";

export const BackendStatusBadge: React.FC = () => {
  const { settings } = useApp();
  const [isOnline, setIsOnline] = useState<boolean | null>(null);

  useEffect(() => {
    let active = true;
    const check = async () => {
      try {
        const url = settings?.apiBaseUrl || "http://127.0.0.1:8000";
        const res = await fetch(`${url}/health`, { method: "GET" }).catch(() => null);
        if (active) setIsOnline(Boolean(res && res.ok));
      } catch {
        if (active) setIsOnline(false);
      }
    };
    check();
    const interval = setInterval(check, 15000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [settings?.apiBaseUrl]);

  return (
    <div className="flex items-center gap-1.5 rounded-full border border-[#E7E3DC] bg-white px-2.5 py-1 text-[11px] text-[#555C56] shadow-xs">
      <span
        className={`h-2 w-2 rounded-full ${
          isOnline === null
            ? "bg-amber-400 animate-pulse"
            : isOnline
            ? "bg-[#2D7A4F] animate-pulse"
            : "bg-red-500"
        }`}
      />
      <span>{isOnline === null ? "Checking..." : isOnline ? "Live" : "Offline"}</span>
    </div>
  );
};
