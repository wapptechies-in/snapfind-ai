import React, { useState } from "react";
import DashboardLayout from "../layouts/DashboardLayout";
import { Alert, Button, Card, Input, Textarea, Toggle } from "../components/common";
import { useAuth } from "../context/AuthContext";

export default function Profile() {
  const { user } = useAuth();

  const [studioName, setStudioName] = useState(user?.studio_name || "Marlowe Light Studio");
  const [photographerName, setPhotographerName] = useState("Alex Marlowe");
  const [email, setEmail] = useState(user?.email || "alex@marlowelight.com");
  const [phone, setPhone] = useState("+1 (555) 234-8901");
  const [location, setLocation] = useState("San Francisco, CA");
  const [bio, setBio] = useState(
    "Commercial and luxury wedding photography specializing in natural light and candid portraits."
  );
  const [cameraBody, setCameraBody] = useState("Sony Alpha A7 IV / Canon EOS R5");

  // Preferences
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [guestDownloadAlerts, setGuestDownloadAlerts] = useState(true);
  const [autoWatermarkOriginals, setAutoWatermarkOriginals] = useState(false);

  const [toast, setToast] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      setToast("Profile and studio preferences updated successfully (MOCK).");
      setTimeout(() => setToast(null), 3000);
    }, 400);
  };

  return (
    <DashboardLayout title="Photographer Profile">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Mock Badge Notice */}
        <div className="flex items-center justify-between rounded-lg border border-hairline bg-panel2/50 p-3 text-xs text-dim">
          <div className="flex items-center gap-2">
            <span className="rounded bg-violet/20 px-1.5 py-0.5 text-[10px] font-semibold text-violet-light">
              MOCK PROFILE
            </span>
            <span>
              Photographer profile settings and subscription metrics. Real cloud synchronization activates in later phases.
            </span>
          </div>
        </div>

        {toast && (
          <Alert type="success" onClose={() => setToast(null)}>
            {toast}
          </Alert>
        )}

        {/* Subscription & Storage Metric Header */}
        <div className="grid gap-4 sm:grid-cols-3">
          <Card className="p-5 space-y-1">
            <span className="text-[11px] font-medium text-dim">Account Plan</span>
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold text-cloud">Pro Studio</span>
              <span className="rounded-full bg-good/15 text-good px-2 py-0.5 text-[10px] font-bold">
                Active
              </span>
            </div>
            <p className="text-[11px] text-dim">Unlimited galleries & AI indexing</p>
          </Card>

          <Card className="p-5 space-y-2 sm:col-span-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-dim">Cloud Storage Quota</span>
              <span className="font-mono text-cloud font-semibold">
                34.2 GB / 2,000 GB (1.7% used)
              </span>
            </div>
            <div className="h-2 w-full rounded-full bg-panel2 overflow-hidden border border-hairline">
              <div className="h-full rounded-full bg-violet" style={{ width: "1.7%" }} />
            </div>
            <p className="text-[10px] text-dim">
              Local derivative thumbnails take 90% less cloud bandwidth.
            </p>
          </Card>
        </div>

        {/* Studio Details Form */}
        <form onSubmit={handleSave} className="space-y-6">
          <Card className="p-6 space-y-5">
            <div className="border-b border-hairline pb-4">
              <h3 className="text-base font-semibold text-cloud">Studio & Contact Information</h3>
              <p className="text-xs text-dim mt-0.5">
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
                label="Phone Number"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />

              <Input
                label="Primary Operating Location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="City, State, Country"
              />

              <Input
                label="Primary Camera Hardware / Gear"
                value={cameraBody}
                onChange={(e) => setCameraBody(e.target.value)}
              />
            </div>

            <Textarea
              label="Studio Bio & Overview"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell clients about your photography style..."
            />
          </Card>

          {/* Preferences Card */}
          <Card className="p-6 space-y-4">
            <div className="border-b border-hairline pb-4">
              <h3 className="text-base font-semibold text-cloud">Notification & Workflow Preferences</h3>
              <p className="text-xs text-dim mt-0.5">
                Configure notifications and default event behaviors.
              </p>
            </div>

            <div className="divide-y divide-hairline space-y-1">
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

            <div className="pt-4 border-t border-hairline flex items-center justify-end gap-3">
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

