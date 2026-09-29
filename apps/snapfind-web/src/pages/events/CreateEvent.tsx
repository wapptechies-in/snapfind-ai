import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import DashboardLayout from "../../layouts/DashboardLayout";
import { Alert, Badge, Button, Card, Input, Select, Textarea } from "../../components/common";
import { eventsApi } from "../../services/api";
import type { EventType } from "../../types";

const defaultCovers = [
  {
    url: "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=80",
    label: "Classic Wedding",
  },
  {
    url: "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=1200&q=80",
    label: "Reception Evening",
  },
  {
    url: "https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?auto=format&fit=crop&w=1200&q=80",
    label: "Outdoor Celebration",
  },
  {
    url: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1200&q=80",
    label: "Corporate Summit",
  },
  {
    url: "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?auto=format&fit=crop&w=1200&q=80",
    label: "Festival / Party",
  },
  {
    url: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1200&q=80",
    label: "Concert Lights",
  },
];

export default function CreateEvent() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [eventType, setEventType] = useState<EventType>("Wedding");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [coverImage, setCoverImage] = useState(defaultCovers[0].url);

  // Custom Cover Upload State
  const [coverSource, setCoverSource] = useState<"preset" | "upload">("preset");
  const [customCoverUrl, setCustomCoverUrl] = useState<string | null>(null);
  const [coverFileName, setCoverFileName] = useState<string | null>(null);
  const [uploadingCover, setUploadingCover] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please select an image file (JPEG, PNG, or WebP).");
      return;
    }

    try {
      setUploadingCover(true);
      setError(null);
      const res = await eventsApi.uploadCover(file);
      setCustomCoverUrl(res.url);
      setCoverImage(res.url);
      setCoverFileName(file.name);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to upload cover image.";
      setError(msg);
    } finally {
      setUploadingCover(false);
    }
  };

  const handleRemoveCustomCover = () => {
    setCustomCoverUrl(null);
    setCoverFileName(null);
    setCoverImage(defaultCovers[0].url);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const newEvent = await eventsApi.create({
        name: name.trim(),
        eventType,
        date,
        location: location.trim() || undefined,
        description: description.trim() || undefined,
        coverImage,
      });

      navigate(`/events/${newEvent.id}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to create event. Please try again.";
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
            <div className="flex items-center gap-2 text-xs text-muted mb-1">
              <Link to="/events" className="hover:text-soft-white">Events</Link>
              <span>/</span>
              <span className="text-soft-white font-medium">Create</span>
            </div>
            <h2 className="text-xl font-serif font-bold tracking-tight text-soft-white">Create New Event</h2>
          </div>
          <Link to="/events">
            <Button variant="secondary" size="sm" className="border-slate-700 bg-midnight text-soft-white hover:border-gold">
              Cancel
            </Button>
          </Link>
        </div>

        {error && <Alert type="error">{error}</Alert>}

        <div className="grid gap-8 lg:grid-cols-12 items-start">
          {/* Left Form: 7 cols */}
          <Card className="p-6 lg:col-span-7 bg-slate-panel border-slate-800 shadow-sm">
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
                  <label className="block text-xs font-medium text-soft-white">
                    Cover Image
                  </label>
                  <div className="flex items-center bg-midnight border border-slate-800 rounded-lg p-0.5 text-xs">
                    <button
                      type="button"
                      onClick={() => setCoverSource("preset")}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all cursor-pointer ${
                        coverSource === "preset"
                          ? "bg-gold text-midnight font-bold shadow-sm"
                          : "text-muted hover:text-soft-white"
                      }`}
                    >
                      Presets
                    </button>
                    <button
                      type="button"
                      onClick={() => setCoverSource("upload")}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all cursor-pointer ${
                        coverSource === "upload"
                          ? "bg-gold text-midnight font-bold shadow-sm"
                          : "text-muted hover:text-soft-white"
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
                        className={`relative rounded-lg overflow-hidden border-2 h-20 text-left transition-all cursor-pointer ${
                          coverImage === cov.url
                            ? "border-gold ring-2 ring-gold/40"
                            : "border-transparent opacity-70 hover:opacity-100"
                        }`}
                      >
                        <img src={cov.url} alt="" className="h-full w-full object-cover" />
                        <span className="absolute inset-x-0 bottom-0 bg-midnight/80 px-1.5 py-0.5 text-[10px] text-soft-white font-medium truncate">
                          {cov.label}
                        </span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {customCoverUrl ? (
                      <div className="relative rounded-xl border border-gold/30 bg-midnight p-3 flex items-center gap-3">
                        <img
                          src={customCoverUrl}
                          alt="Custom Cover"
                          className="w-20 h-14 object-cover rounded-lg border border-slate-800 flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-semibold text-soft-white truncate">
                              {coverFileName || "Custom Cover Image"}
                            </span>
                            <span className="px-1.5 py-0.5 rounded bg-gold/15 text-gold font-mono text-[9px] font-medium">
                              ✓ Uploaded
                            </span>
                          </div>
                          <p className="text-[11px] text-muted truncate mt-0.5">
                            This custom photo will be used on event cards and the guest gallery.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={handleRemoveCustomCover}
                          className="px-2.5 py-1 text-xs text-coral hover:underline rounded-lg transition-colors cursor-pointer"
                        >
                          Remove
                        </button>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-700 hover:border-gold rounded-xl p-6 cursor-pointer bg-midnight/40 hover:bg-midnight/70 transition-all text-center group">
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          className="hidden"
                          onChange={handleFileChange}
                          disabled={uploadingCover}
                        />
                        {uploadingCover ? (
                          <div className="flex items-center gap-2 text-gold text-xs py-2">
                            <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <circle cx="12" cy="12" r="10" strokeDasharray="32" strokeDashoffset="12" />
                            </svg>
                            <span>Uploading custom cover image to cloud storage...</span>
                          </div>
                        ) : (
                          <>
                            <div className="w-9 h-9 rounded-full bg-gold/10 text-gold flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                                <circle cx="8.5" cy="8.5" r="1.5" />
                                <polyline points="21 15 16 10 5 21" />
                              </svg>
                            </div>
                            <span className="text-xs font-semibold text-soft-white">
                              Upload custom cover photo
                            </span>
                            <span className="text-[10px] text-muted mt-0.5">
                              JPEG, PNG, or WebP up to 10MB
                            </span>
                          </>
                        )}
                      </label>
                    )}
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
                <Link to="/events">
                  <Button type="button" variant="ghost" className="text-muted hover:text-soft-white">
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
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted">
                Live Card Preview
              </h3>
              <span className="text-[10px] text-gold font-medium">Real-time</span>
            </div>

            <Card className="overflow-hidden border-slate-800 bg-slate-panel shadow-md">
              <div className="relative h-48 w-full bg-midnight overflow-hidden">
                <img
                  src={coverImage}
                  alt="Preview"
                  className="h-full w-full object-cover"
                />
                <div className="absolute top-3 left-3">
                  <Badge variant="Active">Active</Badge>
                </div>
                <div className="absolute top-3 right-3">
                  <span className="rounded-md bg-midnight/80 backdrop-blur-sm px-2 py-0.5 text-[11px] font-medium text-soft-white border border-slate-800">
                    {eventType}
                  </span>
                </div>
              </div>

              <div className="p-5">
                <h4 className="text-base font-serif font-bold text-soft-white">
                  {name || "Untitled Event Name"}
                </h4>
                <p className="mt-1 text-xs text-muted flex items-center gap-1.5">
                  <span>📅</span> {date || "Select Date"}
                  <span className="text-slate-700">•</span>
                  <span>📍</span> {location || "Venue location"}
                </p>
                <p className="mt-3 text-xs text-muted line-clamp-2">
                  {description || "No description provided yet."}
                </p>

                <div className="mt-5 pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-muted">
                  <span>
                    <strong className="text-soft-white font-semibold">0</strong> Photos
                  </span>
                  <span className="text-[11px] text-gold font-medium">
                    Shortlink generated upon saving
                  </span>
                </div>
              </div>
            </Card>

            <div className="rounded-2xl border border-slate-800 bg-slate-panel p-4 text-xs text-muted space-y-2 shadow-sm">
              <p className="font-semibold text-soft-white">What happens next?</p>
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
