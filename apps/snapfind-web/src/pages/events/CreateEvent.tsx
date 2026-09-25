import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import DashboardLayout from "../../layouts/DashboardLayout";
import { Alert, Badge, Button, Card, Input, Select, Textarea } from "../../components/common";
import { eventsApi } from "../../services/api";
import type { EventType } from "../../types";

const defaultCovers = [
  { label: "Wedding / Couple", url: "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=80" },
  { label: "Sports & Athletics", url: "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=1200&q=80" },
  { label: "Corporate & Tech Summit", url: "https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1200&q=80" },
  { label: "Birthday & Party", url: "https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&w=1200&q=80" },
  { label: "Family Portrait", url: "https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=1200&q=80" },
];

export default function CreateEvent() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [eventType, setEventType] = useState<EventType>("Wedding");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [coverSource, setCoverSource] = useState<"preset" | "upload">("preset");
  const [coverImage, setCoverImage] = useState(defaultCovers[0].url);
  const [customCoverUrl, setCustomCoverUrl] = useState<string | null>(null);
  const [coverFileName, setCoverFileName] = useState<string | null>(null);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

      const res = await eventsApi.uploadCover(file);
      setCustomCoverUrl(res.url);
      setCoverImage(res.url);
      setCoverSource("upload");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg || "Failed to upload custom cover image.");
    } finally {
      setUploadingCover(false);
    }
  };

  const handleRemoveCustomCover = () => {
    setCustomCoverUrl(null);
    setCoverFileName(null);
    setCoverImage(defaultCovers[0].url);
    setCoverSource("preset");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Please enter an event name.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const created = await eventsApi.create({
        name,
        eventType,
        date,
        location: location || "Venue unspecified",
        description,
        coverImage,
      });
      navigate(`/events/${created.id}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Could not create event. Please check your plan quota or try again.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout title="Create Event">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Breadcrumb Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs text-charcoal-muted mb-1">
              <Link to="/events" className="hover:text-charcoal">Events</Link>
              <span>/</span>
              <span className="text-charcoal font-medium">Create</span>
            </div>
            <h2 className="text-xl font-serif font-bold tracking-tight text-charcoal">Create New Event</h2>
          </div>
          <Link to="/events">
            <Button variant="secondary" size="sm">
              Cancel
            </Button>
          </Link>
        </div>

        {error && <Alert type="error">{error}</Alert>}

        <div className="grid gap-8 lg:grid-cols-12 items-start">
          {/* Left Form: 7 cols */}
          <Card className="p-6 lg:col-span-7 bg-surface border-warm-beige shadow-sm">
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Event Name *"
                placeholder="e.g. John & Mary Wedding, Annual Gala 2026"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Select
                  label="Event Type"
                  value={eventType}
                  onChange={(e) => setEventType(e.target.value as EventType)}
                  options={[
                    { value: "Wedding", label: "Wedding" },
                    { value: "Marriage", label: "Marriage" },
                    { value: "Birthday", label: "Birthday" },
                    { value: "Sports", label: "Sports" },
                    { value: "Family", label: "Family" },
                    { value: "Corporate", label: "Corporate" },
                    { value: "College/School", label: "College / School" },
                    { value: "Candid", label: "Candid" },
                    { value: "Nature", label: "Nature" },
                    { value: "Other", label: "Other" },
                  ]}
                />

                <Input
                  label="Event Date *"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                />
              </div>

              <Input
                label="Location / Venue"
                placeholder="e.g. Grand Plaza Ballroom, New York"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />

              <Textarea
                label="Description"
                placeholder="Brief summary or client notes for this photo collection..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />

              {/* Cover Photo Controls */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-charcoal">
                    Cover Image
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
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {defaultCovers.map((cov) => (
                      <button
                        key={cov.label}
                        type="button"
                        onClick={() => {
                          setCoverImage(cov.url);
                          setCustomCoverUrl(null);
                        }}
                        className={`relative rounded-lg overflow-hidden border-2 h-20 text-left transition-all ${
                          coverImage === cov.url
                            ? "border-forest ring-2 ring-forest/30"
                            : "border-transparent opacity-70 hover:opacity-100"
                        }`}
                      >
                        <img src={cov.url} alt="" className="h-full w-full object-cover" />
                        <span className="absolute inset-x-0 bottom-0 bg-black/75 px-1.5 py-0.5 text-[10px] text-white font-medium truncate">
                          {cov.label}
                        </span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {customCoverUrl ? (
                      <div className="relative rounded-xl border border-forest/30 bg-cream p-3 flex items-center gap-3">
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
                              ✓ Uploaded
                            </span>
                          </div>
                          <p className="text-[11px] text-charcoal-muted truncate mt-0.5">
                            This custom photo will be used on event cards and the guest gallery.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={handleRemoveCustomCover}
                          className="px-2.5 py-1 text-xs text-danger hover:underline rounded-lg transition-colors cursor-pointer"
                        >
                          Remove
                        </button>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center border-2 border-dashed border-warm-beige hover:border-forest rounded-xl p-6 cursor-pointer bg-cream/40 hover:bg-cream/80 transition-all text-center group">
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
                            <span>Uploading custom cover image to cloud storage...</span>
                          </div>
                        ) : (
                          <>
                            <div className="w-9 h-9 rounded-full bg-forest/10 text-forest flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                                <circle cx="8.5" cy="8.5" r="1.5" />
                                <polyline points="21 15 16 10 5 21" />
                              </svg>
                            </div>
                            <span className="text-xs font-semibold text-charcoal">
                              Upload custom cover photo
                            </span>
                            <span className="text-[10px] text-charcoal-muted mt-0.5">
                              JPEG, PNG, or WebP up to 10MB
                            </span>
                          </>
                        )}
                      </label>
                    )}
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-warm-beige flex items-center justify-end gap-3">
                <Link to="/events">
                  <Button type="button" variant="ghost">
                    Cancel
                  </Button>
                </Link>
                <Button type="submit" loading={loading} variant="primary">
                  Create Event
                </Button>
              </div>
            </form>
          </Card>

          {/* Right Live Preview: 5 cols */}
          <div className="lg:col-span-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-charcoal-muted">
                Live Card Preview
              </h3>
              <span className="text-[10px] text-forest font-medium">Real-time</span>
            </div>

            <Card className="overflow-hidden border-warm-beige bg-surface shadow-md">
              <div className="relative h-48 w-full bg-cream overflow-hidden">
                <img
                  src={coverImage}
                  alt="Preview"
                  className="h-full w-full object-cover"
                />
                <div className="absolute top-3 left-3">
                  <Badge variant="Active">Active</Badge>
                </div>
                <div className="absolute top-3 right-3">
                  <span className="rounded-md bg-black/65 backdrop-blur-sm px-2 py-0.5 text-[11px] font-medium text-white">
                    {eventType}
                  </span>
                </div>
              </div>

              <div className="p-5">
                <h4 className="text-base font-serif font-bold text-charcoal">
                  {name || "Untitled Event Name"}
                </h4>
                <p className="mt-1 text-xs text-charcoal-muted flex items-center gap-1.5">
                  <span>📅</span> {date || "Select Date"}
                  <span className="text-warm-beige">•</span>
                  <span>📍</span> {location || "Venue location"}
                </p>
                <p className="mt-3 text-xs text-charcoal-muted line-clamp-2">
                  {description || "No description provided yet."}
                </p>

                <div className="mt-5 pt-3 border-t border-warm-beige flex items-center justify-between text-xs text-charcoal-muted">
                  <span>
                    <strong className="text-charcoal font-semibold">0</strong> Photos
                  </span>
                  <span className="text-[11px] text-forest font-medium">
                    Shortlink generated upon saving
                  </span>
                </div>
              </div>
            </Card>

            <div className="rounded-2xl border border-warm-beige bg-surface p-4 text-xs text-charcoal-muted space-y-2 shadow-sm">
              <p className="font-semibold text-charcoal">What happens next?</p>
              <ul className="list-disc list-inside space-y-1 text-[11px]">
                <li>A unique QR token will be assigned to this gallery.</li>
                <li>You can access Photos, Processing, QR, and Settings tabs.</li>
                <li>Your clients can scan the QR code to find their photos.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

