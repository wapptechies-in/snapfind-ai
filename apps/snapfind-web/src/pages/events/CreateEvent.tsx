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
  const [coverImage, setCoverImage] = useState(defaultCovers[0].url);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    } catch {
      setError("Could not create event. Please try again.");
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
            <div className="flex items-center gap-2 text-xs text-dim mb-1">
              <Link to="/events" className="hover:text-cloud">Events</Link>
              <span>/</span>
              <span className="text-cloud">Create</span>
            </div>
            <h2 className="text-xl font-bold tracking-tight text-cloud">Create New Event</h2>
          </div>
          <Link to="/events">
            <Button variant="secondary" size="sm">
              Cancel
            </Button>
          </Link>
        </div>

        {/* Mock notice */}
        <div className="flex items-center gap-2 rounded-lg border border-hairline bg-panel2/50 px-3.5 py-2.5 text-xs text-dim">
          <span className="rounded bg-violet/20 px-1.5 py-0.5 text-[10px] font-semibold text-violet-light">
            MOCK
          </span>
          <span>
            Event creation is handled in local frontend state for Phase 3. PostgreSQL persistence connects in later phases.
          </span>
        </div>

        {error && <Alert type="error">{error}</Alert>}

        <div className="grid gap-8 lg:grid-cols-12 items-start">
          {/* Left Form: 7 cols */}
          <Card className="p-6 lg:col-span-7">
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

              <div>
                <label className="block text-xs font-medium text-dim mb-2">
                  Preset Cover Image
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {defaultCovers.map((cov) => (
                    <button
                      key={cov.label}
                      type="button"
                      onClick={() => setCoverImage(cov.url)}
                      className={`relative rounded-lg overflow-hidden border-2 h-20 text-left transition-all ${
                        coverImage === cov.url
                          ? "border-violet ring-2 ring-violet/20"
                          : "border-transparent opacity-60 hover:opacity-100"
                      }`}
                    >
                      <img src={cov.url} alt="" className="h-full w-full object-cover" />
                      <span className="absolute inset-x-0 bottom-0 bg-black/75 px-1.5 py-0.5 text-[10px] text-white font-medium truncate">
                        {cov.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-hairline flex items-center justify-end gap-3">
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
              <h3 className="text-xs font-bold uppercase tracking-wider text-dim">
                Live Card Preview
              </h3>
              <span className="text-[10px] text-violet-light font-medium">Real-time</span>
            </div>

            <Card className="overflow-hidden border-violet/30 shadow-xl">
              <div className="relative h-48 w-full bg-panel2 overflow-hidden">
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
                <h4 className="text-base font-bold text-cloud">
                  {name || "Untitled Event Name"}
                </h4>
                <p className="mt-1 text-xs text-dim flex items-center gap-1.5">
                  <span>📅</span> {date || "Select Date"}
                  <span className="text-hairline">•</span>
                  <span>📍</span> {location || "Venue location"}
                </p>
                <p className="mt-3 text-xs text-dim line-clamp-2">
                  {description || "No description provided yet."}
                </p>

                <div className="mt-5 pt-3 border-t border-hairline flex items-center justify-between text-xs text-dim">
                  <span>
                    <strong className="text-cloud font-semibold">0</strong> Photos
                  </span>
                  <span className="text-[11px] text-violet-light">
                    Shortlink generated upon saving
                  </span>
                </div>
              </div>
            </Card>

            <div className="rounded-lg border border-hairline bg-panel p-4 text-xs text-dim space-y-2">
              <p className="font-semibold text-cloud">What happens next?</p>
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

