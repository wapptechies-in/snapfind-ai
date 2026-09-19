import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import DashboardLayout from "../../layouts/DashboardLayout";
import { EventHeader } from "../../components/events/EventHeader";
import { Alert, Button, Card, LoadingSpinner, Toggle } from "../../components/common";
import { eventsApi } from "../../services/api";
import type { EventSettings as SettingsType, SnapEvent } from "../../types";

export default function EventSettings() {
  const { id } = useParams<{ id: string }>();
  const [event, setEvent] = useState<SnapEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const updated = await eventsApi.updateSettings(event.id, settings);
      setEvent(updated);
      setToast("Event settings saved successfully (MOCK).");
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

      <form onSubmit={handleSave} className="max-w-4xl space-y-6">
        <Card className="p-6 divide-y divide-hairline">
          <div className="pb-4">
            <h3 className="text-base font-semibold text-cloud">Gallery Controls & Policies</h3>
            <p className="text-xs text-dim mt-0.5">
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
              <div className="pt-3 pl-2 border-l-2 border-violet space-y-1.5 mt-2">
                <label className="text-xs font-medium text-cloud">
                  Expiration Date
                </label>
                <input
                  type="date"
                  value={settings.expiryDate || ""}
                  onChange={(e) =>
                    setSettings((prev) => ({ ...prev, expiryDate: e.target.value }))
                  }
                  className="rounded-lg border border-hairline bg-base px-3 py-2 text-xs text-cloud outline-none focus:border-violet"
                />
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
    </DashboardLayout>
  );
}
