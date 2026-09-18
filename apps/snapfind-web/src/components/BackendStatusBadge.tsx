import { useBackendStatus } from "../services/useBackendStatus";

const config = {
  checking: { label: "Checking backend…", dot: "bg-dim" },
  connected: { label: "Backend Status: Connected", dot: "bg-good" },
  offline: { label: "Backend Status: Offline", dot: "bg-bad" },
};

export default function BackendStatusBadge() {
  const status = useBackendStatus();
  const c = config[status];

  return (
    <div className="flex items-center gap-2 rounded-full border border-hairline bg-panel2 px-3 py-1.5 text-xs text-dim">
      <span className={`h-1.5 w-1.5 rounded-full ${c.dot}`} />
      {c.label}
    </div>
  );
}
