import React, { useEffect, useState } from "react";
import { Button, Card } from "../components/common";
import { useApp } from "../state/store";
import { authApi } from "../api/auth";

export const Settings: React.FC = () => {
  const { user, settings, updateSettings, refreshRecentSessions, refreshProfile } = useApp();

  const [apiUrl, setApiUrl] = useState(settings.apiBaseUrl);
  const [concurrency, setConcurrency] = useState(settings.concurrency);
  const [saved, setSaved] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [platform, setPlatform] = useState<string>("Loading...");
  const [version, setVersion] = useState<string>("0.1.0");

  // Profile fields
  const [studioName, setStudioName] = useState(user?.studio_name || "");
  const [displayName, setDisplayName] = useState(user?.display_name || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [location, setLocation] = useState(user?.location || "");
  const [website, setWebsite] = useState(user?.website || "");
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);

  // Notification prefs
  const [emailNotifications, setEmailNotifications] = useState(user?.email_notifications ?? true);
  const [guestDownloadAlerts, setGuestDownloadAlerts] = useState(user?.guest_download_alerts ?? true);
  const [autoWatermark, setAutoWatermark] = useState(user?.auto_watermark ?? false);

  // Password change
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwSaving, setPwSaving] = useState(false);
  const [pwSuccess, setPwSuccess] = useState<string | null>(null);
  const [pwError, setPwError] = useState<string | null>(null);

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

  // Sync profile fields when user changes
  useEffect(() => {
    if (user) {
      setStudioName(user.studio_name || "");
      setDisplayName(user.display_name || "");
      setPhone(user.phone || "");
      setLocation(user.location || "");
      setWebsite(user.website || "");
      setEmailNotifications(user.email_notifications ?? true);
      setGuestDownloadAlerts(user.guest_download_alerts ?? true);
      setAutoWatermark(user.auto_watermark ?? false);
    }
  }, [user]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({
      apiBaseUrl: apiUrl,
      concurrency,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSaving(true);
    setProfileError(null);
    setProfileSuccess(null);
    try {
      await authApi.updateProfile({
        studio_name: studioName,
        display_name: displayName,
        phone,
        location,
        website,
        email_notifications: emailNotifications,
        guest_download_alerts: guestDownloadAlerts,
        auto_watermark: autoWatermark,
      });
      await refreshProfile();
      setProfileSuccess("Studio profile updated successfully.");
      setTimeout(() => setProfileSuccess(null), 3000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to save profile.";
      setProfileError(msg);
    } finally {
      setProfileSaving(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwError(null);
    setPwSuccess(null);
    if (newPassword !== confirmPassword) {
      setPwError("New passwords do not match.");
      return;
    }
    if (newPassword.length < 8) {
      setPwError("New password must be at least 8 characters.");
      return;
    }
    setPwSaving(true);
    try {
      const result = await authApi.changePassword({
        current_password: currentPassword,
        new_password: newPassword,
      });
      setPwSuccess(result.message || "Password changed successfully.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => setPwSuccess(null), 4000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to change password.";
      setPwError(msg);
    } finally {
      setPwSaving(false);
    }
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
        <h2 className="text-2xl font-serif font-bold text-soft-white tracking-tight">Desktop Settings</h2>
        <p className="text-xs text-muted mt-1">
          Configure API connection, upload streaming concurrency, and inspect logs.
        </p>
      </div>

      {/* Studio Profile — Editable */}
      <Card className="p-6 sm:p-7 bg-slate-panel border-slate-800 shadow-sm">
        <div className="border-b border-slate-800 pb-4 mb-5">
          <h3 className="text-base font-serif font-bold text-soft-white">Studio Profile</h3>
          <p className="text-xs text-muted mt-0.5">
            This info appears on event landing pages and guest QR placards.
          </p>
        </div>

        {profileSuccess && (
          <div className="mb-4 rounded-xl bg-gold/10 border border-gold/30 px-3.5 py-2.5 text-xs text-gold font-medium">
            {profileSuccess}
          </div>
        )}
        {profileError && (
          <div className="mb-4 rounded-xl bg-coral/10 border border-coral/30 px-3.5 py-2.5 text-xs text-coral font-medium">
            {profileError}
          </div>
        )}

        <form onSubmit={handleProfileSave} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-soft-white mb-1">Studio Brand Name *</label>
              <input
                type="text"
                required
                value={studioName}
                onChange={(e) => setStudioName(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-700/80 bg-midnight text-soft-white text-xs focus:border-gold focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-soft-white mb-1">Lead Photographer Name</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your full name"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-700/80 bg-midnight text-soft-white text-xs focus:border-gold focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-soft-white mb-1">Phone / WhatsApp</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 43210"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-700/80 bg-midnight text-soft-white text-xs focus:border-gold focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-soft-white mb-1">City, State, Country</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Chennai, Tamil Nadu, India"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-700/80 bg-midnight text-soft-white text-xs focus:border-gold focus:outline-none"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-soft-white mb-1">Studio Website</label>
              <input
                type="url"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="https://yourstudio.com"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-700/80 bg-midnight text-soft-white text-xs focus:border-gold focus:outline-none"
              />
            </div>
          </div>

          {/* Notification Prefs */}
          <div className="pt-4 border-t border-slate-800 space-y-3">
            <h4 className="text-xs font-semibold text-soft-white uppercase tracking-wider">Notification Preferences</h4>
            {[
              { label: "Email Notifications on First Scan", value: emailNotifications, onChange: setEmailNotifications },
              { label: "Guest Download Alerts (weekly digest)", value: guestDownloadAlerts, onChange: setGuestDownloadAlerts },
              { label: "Auto-apply Studio Watermark to Previews", value: autoWatermark, onChange: setAutoWatermark },
            ].map(({ label, value, onChange }) => (
              <label key={label} className="flex items-center justify-between cursor-pointer">
                <span className="text-xs text-muted">{label}</span>
                <button
                  type="button"
                  onClick={() => onChange(!value)}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${value ? "bg-gold" : "bg-slate-700"}`}
                >
                  <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-midnight transition-transform ${value ? "translate-x-4.5" : "translate-x-1"}`} />
                </button>
              </label>
            ))}
          </div>

          <div className="pt-4 flex justify-end">
            <Button type="submit" size="md" variant="primary" disabled={profileSaving} className="font-semibold shadow-sm">
              {profileSaving ? "Saving..." : "Save Profile"}
            </Button>
          </div>
        </form>
      </Card>

      {/* Password Change */}
      <Card className="p-6 sm:p-7 bg-slate-panel border-slate-800 shadow-sm">
        <div className="border-b border-slate-800 pb-4 mb-5">
          <h3 className="text-base font-serif font-bold text-soft-white">Change Password</h3>
          <p className="text-xs text-muted mt-0.5">Use a strong password of at least 8 characters.</p>
        </div>

        {pwSuccess && (
          <div className="mb-4 rounded-xl bg-gold/10 border border-gold/30 px-3.5 py-2.5 text-xs text-gold font-medium">
            {pwSuccess}
          </div>
        )}
        {pwError && (
          <div className="mb-4 rounded-xl bg-coral/10 border border-coral/30 px-3.5 py-2.5 text-xs text-coral font-medium">
            {pwError}
          </div>
        )}

        <form onSubmit={handlePasswordChange} className="space-y-4 max-w-md">
          {[
            { label: "Current Password", value: currentPassword, onChange: setCurrentPassword },
            { label: "New Password (min. 8 chars)", value: newPassword, onChange: setNewPassword },
            { label: "Confirm New Password", value: confirmPassword, onChange: setConfirmPassword },
          ].map(({ label, value, onChange }) => (
            <div key={label}>
              <label className="block text-xs font-medium text-soft-white mb-1">{label}</label>
              <input
                type="password"
                required
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-700/80 bg-midnight text-soft-white text-xs focus:border-gold focus:outline-none"
              />
            </div>
          ))}
          <Button type="submit" size="md" variant="secondary" disabled={pwSaving} className="border-slate-700 bg-midnight text-soft-white font-semibold hover:border-gold">
            {pwSaving ? "Updating..." : "Update Password"}
          </Button>
        </form>
      </Card>

      {/* Account Info (read-only) */}
      <Card className="p-6 sm:p-7 bg-slate-panel border-slate-800 shadow-sm">
        <h3 className="text-base font-serif font-bold text-soft-white mb-4">Account Information</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div>
            <span className="text-muted uppercase text-[10px] tracking-wider font-semibold">Studio Name</span>
            <p className="text-soft-white font-medium mt-1">{user?.studio_name || "Demo Studio"}</p>
          </div>
          <div>
            <span className="text-muted uppercase text-[10px] tracking-wider font-semibold">Email Address</span>
            <p className="text-soft-white font-medium mt-1">{user?.email || "demo@snapfind.ai"}</p>
          </div>
          <div>
            <span className="text-muted uppercase text-[10px] tracking-wider font-semibold">User ID</span>
            <p className="text-muted font-mono mt-1">{user?.id || "usr_demo"}</p>
          </div>
        </div>
      </Card>

      {/* Network & Concurrency Settings Form */}
      <Card className="p-6 sm:p-7 bg-slate-panel border-slate-800 shadow-sm">
        <h3 className="text-base font-serif font-bold text-soft-white mb-4">Upload Engine & Network</h3>

        <form onSubmit={handleSave} className="space-y-5">
          <div>
            <label className="block text-xs font-medium text-soft-white mb-1">
              FastAPI Backend Endpoint URL
            </label>
            <input
              type="text"
              value={apiUrl}
              onChange={(e) => setApiUrl(e.target.value)}
              placeholder="http://localhost:8000"
              className="w-full max-w-lg px-3.5 py-2 rounded-xl border border-slate-700/80 bg-midnight text-soft-white text-xs font-mono focus:border-gold focus:outline-none"
            />
            <p className="text-[11px] text-muted mt-1">
              Default is http://localhost:8000. For cloud deployment, enter your custom staging or production URL.
            </p>
          </div>

          <div>
            <div className="flex items-center justify-between max-w-lg mb-1">
              <label className="text-xs font-medium text-soft-white">
                Concurrent Upload Streams
              </label>
              <span className="font-mono text-xs font-bold text-gold">
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
              className="w-full max-w-lg accent-gold cursor-pointer"
            />
            <p className="text-[11px] text-muted mt-1">
              Recommended: 4 streams for high-speed fiber; 2 streams for mobile hotspots.
            </p>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <Button type="submit" size="md" variant="primary" className="font-semibold shadow-sm">
              {saved ? "Settings Saved! ✓" : "Save Settings"}
            </Button>
          </div>
        </form>
      </Card>

      {/* Photographer Plan & Quotas */}
      <Card className="p-6 sm:p-7 bg-slate-panel border-slate-800 shadow-sm">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-base font-serif font-bold text-soft-white">Studio Subscription & Quotas</h3>
            <p className="text-xs text-muted mt-0.5">
              Account plan limits for {user?.email || "Photographer"}
            </p>
          </div>
          <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-gold/10 text-gold border border-gold/30 uppercase tracking-wider">
            {user?.subscription_tier || "PRO"} Plan
          </span>
        </div>

        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-midnight border border-slate-800">
            <span className="text-muted block text-[11px]">Active Events Allowance:</span>
            <span className="text-soft-white font-serif font-bold text-base mt-0.5 block">
              {user?.max_active_events ?? 50} Active Events Max
            </span>
          </div>
          <div className="p-4 rounded-xl bg-midnight border border-slate-800">
            <span className="text-muted block text-[11px]">Photos per Event:</span>
            <span className="text-soft-white font-serif font-bold text-base mt-0.5 block">
              {user?.max_photos_per_event ?? 5000} Photos Max
            </span>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between pt-3 border-t border-slate-800">
          <span className="text-[11px] text-muted">To upgrade plan or change billing:</span>
          <Button
            size="sm"
            variant="secondary"
            className="border-slate-700 bg-midnight text-soft-white hover:border-gold"
            onClick={() => {
              const frontendUrl =
                (import.meta as any).env?.VITE_FRONTEND_URL ||
                (import.meta as any).env?.VITE_STUDIO_URL ||
                (settings.apiBaseUrl?.includes("localhost") || settings.apiBaseUrl?.includes("127.0.0.1")
                  ? "http://localhost:5173"
                  : "https://studio.snapfind.ai");
              const url = `${frontendUrl.replace(/\/+$/, "")}/subscription`;
              if (window.desktopAPI) {
                window.desktopAPI.openExternal(url);
              } else {
                window.open(url, "_blank");
              }
            }}
          >
            Manage Billing on Web Portal ↗
          </Button>
        </div>
      </Card>

      {/* Local Storage & Cache */}
      <Card className="p-6 sm:p-7 bg-slate-panel border-slate-800 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-serif font-bold text-soft-white">Local Cache & Storage</h3>
            <p className="text-xs text-muted mt-0.5">
              SnapFind Desktop never copies full images to disk cache. Session states are stored in your OS application data folder.
            </p>
          </div>
          <Button size="sm" variant="danger" onClick={handleClearCache}>
            Clear Local Cache
          </Button>
        </div>
      </Card>

      {/* Application Logs */}
      <Card className="p-6 sm:p-7 bg-slate-panel border-slate-800 shadow-sm">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-base font-serif font-bold text-soft-white">Application Logs</h3>
            <p className="text-xs text-muted mt-0.5">
              Sanitized operational logs. Passwords, secrets, and authorization tokens are strictly redacted.
            </p>
          </div>
          <Button size="sm" variant="secondary" onClick={fetchLogs} className="border-slate-700 bg-midnight text-soft-white hover:border-gold">
            Refresh Logs
          </Button>
        </div>

        <div className="mt-3 p-3.5 rounded-xl bg-midnight font-mono text-[11px] text-soft-white/80 max-h-56 overflow-y-auto space-y-1 border border-slate-800">
          {logs.length === 0 ? (
            <p className="text-muted italic">No log entries available.</p>
          ) : (
            logs.map((line, idx) => <div key={idx}>{line}</div>)
          )}
        </div>

        <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-[11px] text-muted font-mono">
          <span>Platform: {platform}</span>
          <span>SnapFind Desktop v{version}</span>
        </div>
      </Card>
    </div>
  );
};
