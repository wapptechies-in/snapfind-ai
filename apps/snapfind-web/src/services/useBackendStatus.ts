import { useEffect, useState } from "react";
import { api } from "../services/api";

export type BackendStatus = "checking" | "connected" | "offline";

/**
 * Polls the backend health check and reports connection status.
 * Status: IMPLEMENTED
 */
export function useBackendStatus(pollMs = 15000) {
  const [status, setStatus] = useState<BackendStatus>("checking");

  useEffect(() => {
    let cancelled = false;

    async function check() {
      try {
        await api.getHealth();
        if (!cancelled) setStatus("connected");
      } catch {
        if (!cancelled) setStatus("offline");
      }
    }

    check();
    const interval = setInterval(check, pollMs);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [pollMs]);

  return status;
}
