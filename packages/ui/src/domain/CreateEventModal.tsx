import React, { useState } from "react";
import { Button } from "../primitives/Button";
import { Modal } from "../primitives/Modal";
import { Alert } from "../primitives/Feedback";
import type { CreateEventPayload, EventType, SnapEvent } from "@snapfind/types";

export interface CreateEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: CreateEventPayload) => Promise<SnapEvent>;
  onUploadCover?: (file: File) => Promise<{ url: string; storageKey?: string }>;
  onCreated?: (event: SnapEvent) => void;
}

export const defaultCoverPresets = [
  {
    label: "Wedding & Couple",
    type: "Wedding",
    url: "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&q=80",
  },
  {
    label: "Corporate & Tech",
    type: "Corporate",
    url: "https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=800&q=80",
  },
  {
    label: "Birthday & Party",
    type: "Birthday",
    url: "https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&w=800&q=80",
  },
  {
    label: "Sports & Athletics",
    type: "Sports",
    url: "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=800&q=80",
  },
  {
    label: "Family & Portrait",
    type: "Family",
    url: "https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=800&q=80",
  },
  {
    label: "Candid & Street",
    type: "Candid",
    url: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=800&q=80",
  },
];

export const defaultEventTypes: EventType[] = [
  "Wedding",
  "Marriage",
  "Birthday",
  "Corporate",
  "Sports",
  "Family",
  "College/School",
  "Candid",
  "Nature",
  "Other",
];

export const CreateEventModal: React.FC<CreateEventModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  onUploadCover,
  onCreated,
}) => {
  const [name, setName] = useState("");
  const [eventType, setEventType] = useState<EventType>("Wedding");
  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [coverSource, setCoverSource] = useState<"preset" | "upload">("preset");
  const [coverImage, setCoverImage] = useState(defaultCoverPresets[0].url);
  const [customCoverUrl, setCustomCoverUrl] = useState<string | null>(null);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [coverFileName, setCoverFileName] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleTypeSelect = (type: EventType) => {
    setEventType(type);
    if (!customCoverUrl) {
      const matched = defaultCoverPresets.find(
        (c) => c.type.toLowerCase() === type.toLowerCase()
      );
      if (matched) {
        setCoverImage(matched.url);
      }
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowed = ["image/jpeg", "image/png", "image/webp"];
    if (!allowed.includes(file.type)) {
      setError("Please select a JPEG, PNG, or WebP image.");
      return;
    }

    try {
      setUploadingCover(true);
      setError(null);
      setCoverFileName(file.name);

      let uploadedUrl: string;
      if (onUploadCover) {
        const res = await onUploadCover(file);
        uploadedUrl = res.url;
      } else {
        const formData = new FormData();
        formData.append("file", file);
        const host = typeof window !== "undefined" && window.location.hostname ? window.location.hostname : "127.0.0.1";
        const res = await fetch(`http://${host}:8000/api/v1/events/upload-cover`, {
          method: "POST",
          body: formData,
        });
        if (!res.ok) {
          throw new Error("Failed to upload custom cover image.");
        }
        const data = await res.json();
        uploadedUrl = data.url;
      }

      setCustomCoverUrl(uploadedUrl);
      setCoverImage(uploadedUrl);
      setCoverSource("upload");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg || "Error uploading cover image.");
    } finally {
      setUploadingCover(false);
    }
  };

  const handleRemoveCustomCover = () => {
    setCustomCoverUrl(null);
    setCoverFileName(null);
    const matched = defaultCoverPresets.find(
      (c) => c.type.toLowerCase() === eventType.toLowerCase()
    );
    setCoverImage(matched ? matched.url : defaultCoverPresets[0].url);
    setCoverSource("preset");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Please enter an event name.");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const created = await onSubmit({
        name: name.trim(),
        eventType,
        date,
        location: location.trim(),
        description: description.trim(),
        coverImage,
      });

      // Reset form
      setName("");
      setLocation("");
      setDescription("");
      setCustomCoverUrl(null);
      setCoverFileName(null);
      setCoverSource("preset");
      onClose();

      if (onCreated) {
        onCreated(created);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg || "Failed to create event. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create New Event" maxWidth="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <Alert type="error" onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Event Name */}
        <div>
          <label className="block text-xs font-semibold text-charcoal mb-1">
            Event Title <span className="text-forest">*</span>
          </label>
          <input
            type="text"
            required
            placeholder="e.g. Maya & Arjun Wedding Gala"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-warm-beige bg-cream text-sm text-charcoal focus:border-forest focus:outline-none transition-colors"
          />
        </div>

        {/* Event Type & Date */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-charcoal mb-1">Event Category</label>
            <select
              value={eventType}
              onChange={(e) => handleTypeSelect(e.target.value as EventType)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-warm-beige bg-cream text-sm text-charcoal focus:border-forest focus:outline-none transition-colors cursor-pointer"
            >
              {defaultEventTypes.map((t) => (
                <option key={t} value={t} className="bg-surface text-charcoal">
                  {t}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-charcoal mb-1">Event Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-warm-beige bg-cream text-sm text-charcoal focus:border-forest focus:outline-none transition-colors"
            />
          </div>
        </div>

        {/* Location */}
        <div>
          <label className="block text-xs font-semibold text-charcoal mb-1">Location / Venue</label>
          <input
            type="text"
            placeholder="e.g. Grand Palace Convention Centre, Mumbai"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-warm-beige bg-cream text-sm text-charcoal focus:border-forest focus:outline-none transition-colors"
          />
        </div>

        {/* Cover Photo: Preset vs Upload Switch */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-semibold text-charcoal">
              Event Cover Photo
            </label>
            <div className="flex items-center bg-cream border border-warm-beige rounded-lg p-0.5 text-xs">
              <button
                type="button"
                onClick={() => setCoverSource("preset")}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
                  coverSource === "preset"
                    ? "bg-forest text-white shadow-sm font-semibold"
                    : "text-charcoal-muted hover:text-charcoal"
                }`}
              >
                Presets
              </button>
              <button
                type="button"
                onClick={() => setCoverSource("upload")}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
                  coverSource === "upload"
                    ? "bg-forest text-white shadow-sm font-semibold"
                    : "text-charcoal-muted hover:text-charcoal"
                }`}
              >
                Custom Upload
              </button>
            </div>
          </div>

          {coverSource === "preset" ? (
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {defaultCoverPresets.map((preset) => {
                const isSelected = coverImage === preset.url;
                return (
                  <button
                    type="button"
                    key={preset.type}
                    onClick={() => {
                      setCoverImage(preset.url);
                      setCustomCoverUrl(null);
                    }}
                    className={`relative group rounded-xl overflow-hidden aspect-video border transition-all cursor-pointer ${
                      isSelected
                        ? "border-forest ring-2 ring-forest/40 scale-102"
                        : "border-warm-beige hover:border-forest/60 opacity-80 hover:opacity-100"
                    }`}
                  >
                    <img
                      src={preset.url}
                      alt={preset.label}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 flex items-end p-1 text-[9px] font-semibold text-white truncate">
                      {preset.type}
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="space-y-2">
              {customCoverUrl ? (
                <div className="relative rounded-xl border border-forest/30 bg-cream p-2.5 flex items-center gap-3">
                  <img
                    src={customCoverUrl}
                    alt="Custom Cover"
                    className="w-20 h-14 object-cover rounded-lg border border-warm-beige flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-semibold text-charcoal truncate">
                        {coverFileName || "Custom Cover Image"}
                      </span>
                      <span className="px-1.5 py-0.5 rounded bg-forest/10 text-forest font-mono text-[9px] font-medium">
                        ✓ Selected
                      </span>
                    </div>
                    <p className="text-[11px] text-charcoal-muted truncate mt-0.5">
                      This custom photo will be set as the main cover of this event gallery.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleRemoveCustomCover}
                    className="px-2.5 py-1 text-xs text-danger hover:underline cursor-pointer transition-colors"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center border-2 border-dashed border-warm-beige hover:border-forest rounded-xl p-4 cursor-pointer bg-cream/50 hover:bg-cream transition-all text-center group">
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={handleFileChange}
                    disabled={uploadingCover}
                  />
                  {uploadingCover ? (
                    <div className="flex items-center gap-2 text-forest text-xs py-2">
                      <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" strokeDasharray="32" strokeDashoffset="12" />
                      </svg>
                      <span>Uploading custom cover image...</span>
                    </div>
                  ) : (
                    <>
                      <div className="w-8 h-8 rounded-full bg-forest/10 text-forest flex items-center justify-center mb-1 group-hover:scale-110 transition-transform">
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                          <circle cx="8.5" cy="8.5" r="1.5" />
                          <polyline points="21 15 16 10 5 21" />
                        </svg>
                      </div>
                      <span className="text-xs font-semibold text-charcoal">
                        Click or drag cover image here
                      </span>
                      <span className="text-[10px] text-charcoal-muted mt-0.5">
                        Supports JPEG, PNG, or WebP (max 10MB)
                      </span>
                    </>
                  )}
                </label>
              )}
            </div>
          )}
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-semibold text-charcoal mb-1">
            Description <span className="text-charcoal-muted font-normal">(Optional)</span>
          </label>
          <textarea
            rows={2}
            placeholder="Notes about ceremony timing, access PIN, or photographer team..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3.5 py-2 rounded-xl border border-warm-beige bg-cream text-xs text-charcoal focus:border-forest focus:outline-none transition-colors resize-none"
          />
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-warm-beige">
          <Button type="button" variant="ghost" size="sm" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" size="sm" loading={loading}>
            Create Event
          </Button>
        </div>
      </form>
    </Modal>
  );
};

