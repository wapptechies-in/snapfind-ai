import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import DashboardLayout from "../../layouts/DashboardLayout";
import { EventHeader } from "../../components/events/EventHeader";
import { Alert, Button, Card, LoadingSpinner, Toggle } from "../../components/common";
import { eventsApi } from "../../services/api";
import type { EventSettings as SettingsType, SnapEvent } from "../../types";

export default function EventSettings() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [event, setEvent] = useState<SnapEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [togglingStatus, setTogglingStatus] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Settings state
  const [settings, setSettings] = useState<SettingsType>({
    galleryVisibility: true,
    faceSearch: true,
    downloads: true,
    originalDownloads: false,
    watermark: true,
    eventExpiry: false,
    expiryDate: "",
    paywallEnabled: false,
    photoPrice: 4.99,
    galleryUnlockPrice: 29.99,
    currency: "USD",
  });

  useEffect(() => {
    async function loadEvent() {
      if (!id) return;
      setLoading(true);
      try {
        const found = await eventsApi.getById(id);
        if (found) {
          setEvent(found);
          if (found.settings) {
            setSettings(found.settings);
          }
        }
      } finally {
        setLoading(false);
      }
    }
    loadEvent();
  }, [id]);

  if (loading) {
    return (
      <DashboardLayout title="Event Settings">
        <LoadingSpinner message="Loading event settings..." />
      </DashboardLayout>
    );
  }

  if (!event) {
    return (
      <DashboardLayout title="Event Not Found">
        <Card className="p-12 text-center">
          <p className="text-sm text-dim">Event not found.</p>
          <Link to="/events" className="mt-4 inline-block">
            <Button size="sm">Back to Events</Button>
          </Link>
        </Card>
      </DashboardLayout>
    );
  }

  const handleToggle = (key: keyof SettingsType, value: boolean) => {
    setSettings((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleToggleStatus = async () => {
    if (!event) return;
    const currentlyActive = event.isActive ?? (event.status?.toLowerCase() === "active");
    const nextActive = !currentlyActive;
    setTogglingStatus(true);
    setError(null);
    try {
      const updated = await eventsApi.toggleActive(event.id, nextActive);
      setEvent(updated);
      setToast(`Event successfully marked as ${nextActive ? "Active" : "Inactive"}.`);
      setTimeout(() => setToast(null), 3000);
    } catch {
      setError("Failed to update event status. Please try again.");
    } finally {
      setTogglingStatus(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const updated = await eventsApi.updateSettings(event.id, settings);
      setEvent(updated);
      setToast("Event settings saved successfully.");
      setTimeout(() => setToast(null), 3000);
    } catch {
      setError("Failed to save event settings. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const toggleItems: Array<{
    key: keyof SettingsType;
    label: string;
    description: string;
  }> = [
    {
      key: "galleryVisibility",
      label: "Gallery Visibility",
      description: "Allow guests to open and browse the public gallery via QR code or link.",
    },
    {
      key: "faceSearch",
      label: "Face Search (Find My Photos)",
      description: "Enable AI-powered selfie search for attendees in this event gallery.",
    },
    {
      key: "downloads",
      label: "Web Photo Downloads",
      description: "Allow guests to download web-optimized photos directly to their devices.",
    },
    {
      key: "originalDownloads",
      label: "Original High-Res RAW/JPEG Downloads",
      description: "Allow attendees to request and download maximum quality originals.",
    },
    {
      key: "watermark",
      label: "Watermark Protection",
      description: "Apply photographer studio watermark onto web preview images.",
    },
    {
      key: "eventExpiry",
      label: "Event Expiry",
      description: "Automatically close public access after a specified expiration date.",
    },
  ];

  const handleDelete = async () => {
    if (!event) return;
    setDeleting(true);
    setError(null);
    try {
      await eventsApi.delete(event.id);
      navigate("/events");
    } catch {
      setError("Failed to delete event. Please check your connection and try again.");
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const isCurrentActive = event.isActive ?? (event.status?.toLowerCase() === "active");

  return (
    <DashboardLayout title={`${event.name} — Settings`}>
      <EventHeader event={event} />

      {toast && (
        <div className="mb-6">
          <Alert type="success" onClose={() => setToast(null)}>
            {toast}
          </Alert>
        </div>
      )}

      {error && (
        <div className="mb-6">
          <Alert type="error" onClose={() => setError(null)}>
            {error}
          </Alert>
        </div>
      )}

      <div className="max-w-4xl space-y-6">
        {/* Event Status: Active / Inactive Card */}
        <Card className={`p-6 border-l-4 transition-all bg-surface border-warm-beige shadow-sm ${isCurrentActive ? "border-l-forest" : "border-l-amber-500"}`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5">
                <h3 className="text-base font-serif font-bold text-charcoal">Event Status</h3>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider ${
                  isCurrentActive
                    ? "bg-forest/10 text-forest border border-forest/20"
                    : "bg-amber-500/10 text-amber-700 border border-amber-500/20"
                }`}>
                  {isCurrentActive ? "● Active" : "⏸ Inactive"}
                </span>
              </div>
              <p className="text-xs text-charcoal-muted mt-1.5 max-w-xl leading-relaxed">
                {isCurrentActive
                  ? "This event is currently Active. Attendees can scan the QR code, view the public gallery, and run selfie searches."
                  : "This event is currently Inactive. The public QR link displays 'This event is currently unavailable'. All photos remain safe and manageable in your dashboard."}
              </p>
            </div>
            <button
              type="button"
              disabled={togglingStatus}
              onClick={handleToggleStatus}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer active:scale-95 ${
                isCurrentActive
                  ? "bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100"
                  : "bg-forest text-white hover:bg-forest-light"
              }`}
            >
              {togglingStatus ? (
                <span>Updating status...</span>
              ) : isCurrentActive ? (
                <>
                  <span>⏸ Mark as Inactive</span>
                </>
              ) : (
                <>
                  <span>▶ Activate Event</span>
                </>
              )}
            </button>
          </div>
        </Card>

        <form onSubmit={handleSave} className="space-y-6">
          <Card className="p-6 divide-y divide-warm-beige bg-surface border-warm-beige shadow-sm">
            <div className="pb-4">
              <h3 className="text-base font-serif font-semibold text-charcoal">Gallery Controls & Policies</h3>
              <p className="text-xs text-charcoal-muted mt-0.5">
                Customize attendee permissions, search availability, and protection rules.
              </p>
            </div>

          <div className="py-4 space-y-2">
            {toggleItems.map((item) => (
              <Toggle
                key={item.key}
                label={item.label}
                description={item.description}
                checked={!!settings[item.key]}
                onChange={(checked) => handleToggle(item.key, checked)}
              />
            ))}

            {/* Conditional Expiry Date */}
            {settings.eventExpiry && (
              <div className="pt-3 pl-2 border-l-2 border-forest space-y-1.5 mt-2">
                <label className="text-xs font-medium text-charcoal">
                  Expiration Date
                </label>
                <input
                  type="date"
                  value={settings.expiryDate || ""}
                  onChange={(e) =>
                    setSettings((prev) => ({ ...prev, expiryDate: e.target.value }))
                  }
                  className="rounded-lg border border-warm-beige bg-cream px-3 py-2 text-xs text-charcoal outline-none focus:border-forest"
                />
              </div>
            )}
          </div>

          {/* Monetization & Guest Paywall (Phase 9) */}
          <div className="py-4 space-y-4">
            <div>
              <h4 className="text-sm font-bold text-charcoal flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-amber-500" />
                Monetization & Guest Paywall (Phase 9)
              </h4>
              <p className="text-xs text-charcoal-muted mt-0.5">
                Earn revenue by selling full-resolution original downloads directly to guests.
              </p>
            </div>

            <Toggle
              label="Enable Guest Digital Paywall"
              description="Require guests to purchase full-resolution unwatermarked photos. Web previews remain free to browse."
              checked={settings.paywallEnabled || false}
              onChange={(val) => handleToggle("paywallEnabled" as keyof SettingsType, val)}
            />

            {settings.paywallEnabled && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 pb-1 border-t border-warm-beige">
                <div>
                  <label className="block text-xs text-charcoal-muted mb-1 font-medium">Price per Photo</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.50"
                    value={settings.photoPrice ?? 4.99}
                    onChange={(e) =>
                      setSettings((prev) => ({ ...prev, photoPrice: parseFloat(e.target.value) || 0 }))
                    }
                    className="w-full rounded-lg border border-warm-beige bg-cream px-3 py-2 text-xs text-charcoal focus:border-forest focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs text-charcoal-muted mb-1 font-medium">All Gallery Unlock Price</label>
                  <input
                    type="number"
                    step="0.01"
                    min="1.00"
                    value={settings.galleryUnlockPrice ?? 29.99}
                    onChange={(e) =>
                      setSettings((prev) => ({ ...prev, galleryUnlockPrice: parseFloat(e.target.value) || 0 }))
                    }
                    className="w-full rounded-lg border border-warm-beige bg-cream px-3 py-2 text-xs text-charcoal focus:border-forest focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs text-charcoal-muted mb-1 font-medium">Currency</label>
                  <select
                    value={settings.currency || "USD"}
                    onChange={(e) =>
                      setSettings((prev) => ({ ...prev, currency: e.target.value }))
                    }
                    className="w-full rounded-lg border border-warm-beige bg-cream px-3 py-2 text-xs text-charcoal focus:border-forest focus:outline-none"
                  >
                    <option value="USD">USD ($)</option>
                    <option value="INR">INR (₹)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          <div className="pt-4 flex items-center justify-end gap-3">
            <Link to={`/events/${event.id}`}>
              <Button type="button" variant="ghost">
                Discard Changes
              </Button>
            </Link>
            <Button type="submit" loading={saving} variant="primary">
              Save Settings
            </Button>
          </div>
        </Card>
      </form>

      {/* Danger Zone: Permanent Deletion */}
      <Card className="p-6 mt-8 border border-danger/30 bg-danger/5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-serif font-bold text-danger flex items-center gap-2">
              <svg className="w-5 h-5 text-danger" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Danger Zone — Delete Event
            </h3>
            <p className="text-xs text-charcoal-muted mt-1 max-w-xl leading-relaxed">
              Permanently remove this event from your studio. This deletes all uploaded photos, MinIO storage objects, web derivatives, thumbnails, and AI facial recognition indexes. This action cannot be reversed.
            </p>
          </div>
          <div>
            {!showDeleteConfirm ? (
              <Button
                type="button"
                variant="danger"
                onClick={() => setShowDeleteConfirm(true)}
                className="shrink-0 font-semibold active:scale-95 transition-all"
              >
                Delete Event
              </Button>
            ) : (
              <div className="flex flex-col sm:items-end gap-2">
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setShowDeleteConfirm(false);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    variant="danger"
                    size="sm"
                    loading={deleting}
                    onClick={handleDelete}
                    className="font-bold shadow-sm"
                  >
                    Confirm Permanent Delete
                  </Button>
                </div>
                <span className="text-[11px] text-danger font-medium">
                  Are you absolutely sure? Click confirm to proceed.
                </span>
              </div>
            )}
          </div>
        </div>
      </Card>
      </div>
    </DashboardLayout>
  );
}
