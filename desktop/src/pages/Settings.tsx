import React, { useEffect, useState } from "react";
import { Button, Card } from "../components/common";
import { useApp } from "../state/store";

export const Settings: React.FC = () => {
  const { user, settings, updateSettings, refreshRecentSessions } = useApp();

  const [apiUrl, setApiUrl] = useState(settings.apiBaseUrl);
  const [concurrency, setConcurrency] = useState(settings.concurrency);
  const [saved, setSaved] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [platform, setPlatform] = useState<string>("Loading...");
  const [version, setVersion] = useState<string>("0.1.0");

  const fetchLogs = React.useCallback(async () => {
    if (window.desktopAPI) {
      const lines = await window.desktopAPI.getLogs();
      setLogs(lines);
      const plat = await window.desktopAPI.getPlatform();
      setPlatform(plat);
      const ver = await window.desktopAPI.getVersion();
      setVersion(ver);
    } else {
      setLogs([
        "[INFO] SnapFind Desktop web preview mode",
        "[INFO] Connected to backend: " + settings.apiBaseUrl,
      ]);
      setPlatform("Browser / Vite Preview");
    }
  }, [settings.apiBaseUrl]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);


  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({
      apiBaseUrl: apiUrl,
      concurrency,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleClearCache = async () => {
    if (!window.confirm("Clear local upload session cache? Active upload history will be cleared from this machine.")) {
      return;
    }
    localStorage.clear();
    await refreshRecentSessions();
    alert("Local session cache cleared.");
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h2 className="text-xl font-bold text-white tracking-tight">Desktop Settings</h2>
        <p className="text-xs text-dim mt-0.5">
          Configure API connection, upload streaming concurrency, and inspect logs.
        </p>
      </div>

      {/* Account Info */}
      <Card className="p-6">
        <h3 className="text-sm font-semibold text-cloud mb-4">Photographer Account</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div>
            <span className="text-dim">Studio Name</span>
            <p className="text-cloud font-medium mt-0.5">{user?.studio_name || "Demo Studio"}</p>
          </div>
          <div>
            <span className="text-dim">Email Address</span>
            <p className="text-cloud font-medium mt-0.5">{user?.email || "demo@snapfind.ai"}</p>
          </div>
          <div>
            <span className="text-dim">User ID</span>
            <p className="text-dim font-mono mt-0.5">{user?.id || "usr_demo"}</p>
          </div>
        </div>
      </Card>

      {/* Network & Concurrency Settings Form */}
      <Card className="p-6">
        <h3 className="text-sm font-semibold text-cloud mb-4">Upload Engine & Network</h3>

        <form onSubmit={handleSave} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-cloud mb-1">
              FastAPI Backend Endpoint URL
            </label>
            <input
              type="text"
              value={apiUrl}
              onChange={(e) => setApiUrl(e.target.value)}
              placeholder="http://localhost:8000"
              className="w-full max-w-lg px-3 py-2 rounded-lg border border-hairline bg-panel2 text-cloud text-xs font-mono focus:border-violet focus:outline-none"
            />
            <p className="text-[11px] text-dim mt-1">
              Default is http://localhost:8000. For cloud deployment, enter your custom staging or production URL.
            </p>
          </div>

          <div>
            <div className="flex items-center justify-between max-w-lg mb-1">
              <label className="text-xs font-semibold text-cloud">
                Concurrent Upload Streams
              </label>
              <span className="font-mono text-xs font-bold text-violet-light">
                {concurrency} simultaneous uploads
              </span>
            </div>
            <input
              type="range"
              min="1"
              max="8"
              step="1"
              value={concurrency}
              onChange={(e) => setConcurrency(Number(e.target.value))}
              className="w-full max-w-lg accent-violet cursor-pointer"
            />
            <p className="text-[11px] text-dim mt-1">
              Recommended: 4 streams for high-speed fiber; 2 streams for mobile hotspots.
            </p>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <Button type="submit" size="md" variant="primary">
              {saved ? "Settings Saved! ✓" : "Save Settings"}
            </Button>
          </div>
        </form>
      </Card>

      {/* Local Storage & Cache */}
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-cloud">Local Cache & Storage</h3>
            <p className="text-xs text-dim mt-0.5">
              SnapFind Desktop never copies full images to disk cache. Session states are stored in your OS application data folder.
            </p>
          </div>
          <Button size="sm" variant="danger" onClick={handleClearCache}>
            Clear Local Cache
          </Button>
        </div>
      </Card>

      {/* Application Logs */}
      <Card className="p-6">
        <div className="flex items-center justify-between pb-3 border-b border-hairline">
          <div>
            <h3 className="text-sm font-semibold text-cloud">Application Logs</h3>
            <p className="text-xs text-dim mt-0.5">
              Sanitized operational logs. Passwords, secrets, and authorization tokens are strictly redacted.
            </p>
          </div>
          <Button size="sm" variant="secondary" onClick={fetchLogs}>
            Refresh Logs
          </Button>
        </div>

        <div className="mt-3 p-3 rounded-lg bg-panel2 font-mono text-[11px] text-dim max-h-56 overflow-y-auto space-y-1">
          {logs.length === 0 ? (
            <p className="text-dim italic">No log entries available.</p>
          ) : (
            logs.map((line, idx) => <div key={idx}>{line}</div>)
          )}
        </div>

        <div className="mt-4 pt-3 border-t border-hairline/60 flex items-center justify-between text-[11px] text-dim font-mono">
          <span>Platform: {platform}</span>
          <span>SnapFind Desktop v{version}</span>
        </div>
      </Card>
    </div>
  );
};
