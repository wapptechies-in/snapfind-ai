import React, { useState } from "react";
import DashboardLayout from "../layouts/DashboardLayout";
import { Alert, Button, Card, Input, Textarea, Toggle } from "../components/common";
import { useAuth } from "../context/AuthContext";
import { authApi } from "../services/api/auth";

export default function Profile() {
  const { user, refreshProfile } = useAuth();

  const [studioName, setStudioName] = useState(user?.studio_name || "");
  const [photographerName, setPhotographerName] = useState(user?.display_name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [location, setLocation] = useState(user?.location || "");
  const [bio, setBio] = useState(user?.bio || "");

  // Preferences
  const [emailNotifications, setEmailNotifications] = useState(user?.email_notifications ?? true);
  const [guestDownloadAlerts, setGuestDownloadAlerts] = useState(user?.guest_download_alerts ?? true);
  const [autoWatermarkOriginals, setAutoWatermarkOriginals] = useState(user?.auto_watermark ?? false);

  const [toast, setToast] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveError(null);
    setToast(null);
    try {
      await authApi.updateProfile({
        studio_name: studioName,
        display_name: photographerName,
        phone,
        location,
        bio,
        email_notifications: emailNotifications,
        guest_download_alerts: guestDownloadAlerts,
        auto_watermark: autoWatermarkOriginals,
      });
      await refreshProfile();
      setToast("Profile saved successfully.");
      setTimeout(() => setToast(null), 3000);
    } catch (err: unknown) {
      setSaveError(err instanceof Error ? err.message : "Failed to save profile.");
    } finally {
      setSaving(false);
    }
  };

  // Storage display — derive from subscription tier
  const planName = user?.subscription_tier
    ? user.subscription_tier.charAt(0).toUpperCase() + user.subscription_tier.slice(1).toLowerCase()
    : "Free";

  return (
    <DashboardLayout title="Photographer Profile">
      <div className="max-w-4xl mx-auto space-y-6">

        {toast && (
          <Alert type="success" onClose={() => setToast(null)}>
            {toast}
          </Alert>
        )}

        {saveError && (
          <Alert type="error" onClose={() => setSaveError(null)}>
            {saveError}
          </Alert>
        )}

        {/* Subscription & Storage Metric Header */}
        <div className="grid gap-4 sm:grid-cols-3">
          <Card className="p-5 space-y-1 bg-slate-panel border-slate-800 shadow-sm">
            <span className="text-[11px] font-medium text-muted uppercase tracking-wider">Account Plan</span>
            <div className="flex items-center gap-2">
              <span className="text-xl font-serif font-bold text-soft-white">{planName}</span>
              <span className="rounded-full bg-gold/15 text-gold px-2.5 py-0.5 text-[10px] font-bold border border-gold/30">
                Active
              </span>
            </div>
            <p className="text-[11px] text-muted">
              {user?.max_active_events != null
                ? `${user.max_active_events} active events max`
                : "Unlimited galleries & AI indexing"}
            </p>
          </Card>

          <Card className="p-5 space-y-2 sm:col-span-2 bg-slate-panel border-slate-800 shadow-sm">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-muted">Photos Usage</span>
              <span className="font-mono text-soft-white font-semibold">
                {user?.max_photos_per_event != null
                  ? `${user.max_photos_per_event.toLocaleString()} photos / event`
                  : "Unlimited"}
              </span>
            </div>
            <div className="h-2 w-full rounded-full bg-midnight overflow-hidden border border-slate-800">
              <div className="h-full rounded-full bg-gold" style={{ width: "40%" }} />
            </div>
            <p className="text-[10px] text-muted">
              Local derivative thumbnails take 90% less cloud bandwidth.
            </p>
          </Card>
        </div>

        {/* Studio Details Form */}
        <form onSubmit={handleSave} className="space-y-6">
          <Card className="p-6 sm:p-7 space-y-5 bg-slate-panel border-slate-800 shadow-sm">
            <div className="border-b border-slate-800 pb-4">
              <h3 className="text-base font-serif font-bold text-soft-white">Studio & Contact Information</h3>
              <p className="text-xs text-muted mt-0.5">
                This branding appears on your event gallery landing pages and client QR placards.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Studio Brand Name *"
                value={studioName}
                onChange={(e) => setStudioName(e.target.value)}
                required
              />

              <Input
                label="Lead Photographer Name *"
                value={photographerName}
                onChange={(e) => setPhotographerName(e.target.value)}
                required
              />

              <Input
                label="Public Contact Email *"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />

              <Input
                label="Phone Number (WhatsApp)"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />

              <Input
                label="Primary Operating Location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="City, State, Country"
              />
            </div>

            <Textarea
              label="Studio Bio & Overview"
              value={bio}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setBio(e.target.value)}
              placeholder="Tell clients about your photography style..."
            />
          </Card>

          {/* Preferences Card */}
          <Card className="p-6 sm:p-7 space-y-4 bg-slate-panel border-slate-800 shadow-sm">
            <div className="border-b border-slate-800 pb-4">
              <h3 className="text-base font-serif font-bold text-soft-white">Notification & Workflow Preferences</h3>
              <p className="text-xs text-muted mt-0.5">
                Configure notifications and default event behaviors.
              </p>
            </div>

            <div className="divide-y divide-slate-800 space-y-1">
              <Toggle
                label="Email Notifications on First Scan"
                description="Receive an email notice when attendees first scan the QR code at an event."
                checked={emailNotifications}
                onChange={setEmailNotifications}
              />

              <Toggle
                label="Guest Download Alerts"
                description="Receive weekly digest summaries of guest search volume and high-res downloads."
                checked={guestDownloadAlerts}
                onChange={setGuestDownloadAlerts}
              />

              <Toggle
                label="Auto-apply Studio Watermark to Web Previews"
                description="Embed subtle studio logo watermarks onto public gallery thumbnails by default."
                checked={autoWatermarkOriginals}
                onChange={setAutoWatermarkOriginals}
              />
            </div>

            <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
              <Button type="submit" loading={saving} variant="primary">
                Save Profile Changes
              </Button>
            </div>
          </Card>
        </form>
      </div>
    </DashboardLayout>
  );
}
