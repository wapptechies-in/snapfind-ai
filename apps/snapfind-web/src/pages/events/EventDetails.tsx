import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import DashboardLayout from "../../layouts/DashboardLayout";
import { EventHeader } from "../../components/events/EventHeader";
import { Button, Card, LoadingSpinner } from "../../components/common";
import { eventsApi, guestsApi } from "../../services/api";
import type { MarketingLead, SnapEvent } from "../../types";

export default function EventDetails() {
  const { id } = useParams<{ id: string }>();
  const [event, setEvent] = useState<SnapEvent | null>(null);
  const [leads, setLeads] = useState<MarketingLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function loadData() {
      if (!id) return;
      setLoading(true);
      try {
        const found = await eventsApi.getById(id);
        setEvent(found);

        try {
          const leadsList = await guestsApi.listLeads(id);
          setLeads(leadsList || []);
        } catch {
          setLeads([]);
        }
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [id]);

  if (loading) {
    return (
      <DashboardLayout title="Event Details">
        <LoadingSpinner message="Loading event details..." />
      </DashboardLayout>
    );
  }

  if (!event) {
    return (
      <DashboardLayout title="Event Not Found">
        <Card className="p-12 text-center">
          <h2 className="text-base font-semibold text-cloud">Event Not Found</h2>
          <p className="mt-1 text-xs text-dim">The requested event ID could not be located.</p>
          <div className="mt-4">
            <Link to="/events">
              <Button size="sm">Back to Events</Button>
            </Link>
          </div>
        </Card>
      </DashboardLayout>
    );
  }

  const galleryUrl = `${window.location.origin}/event/${event.token}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(galleryUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExportLeadsCSV = () => {
    if (leads.length === 0) return;
    const header = "Name,WhatsApp Number,Email,Opted-In Date,Source\n";
    const rows = leads
      .map(
        (l) =>
          `"${l.full_name.replace(/"/g, '""')}","${l.whatsapp_number}","${l.email || ""}","${l.opted_in_at || l.created_at}","${l.source || ""}"`
      )
      .join("\n");
    const blob = new Blob([header + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const safeName = event.name.toLowerCase().replace(/[^a-z0-9]+/g, "_");
    a.download = `leads_${safeName}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const statCards = [
    { label: "Photo Count", value: event.photoCount.toLocaleString() },
    { label: "Guest Registrations", value: (event.total_registrations || 0).toLocaleString() },
    { label: "Selfie Searches", value: (event.searches || 0).toLocaleString() },
    { label: "Matches Found", value: (event.total_matches_found || 0).toLocaleString() },
    { label: "WhatsApp Delivered", value: (event.total_whatsapp_sent || 0).toLocaleString() },
    { label: "Marketing Leads", value: (event.total_marketing_consents || leads.length).toLocaleString() },
  ];

  return (
    <DashboardLayout title={event.name}>
      <EventHeader event={event} />

      <div className="grid gap-6 lg:grid-cols-12">
        {/* Left Column: Metrics & Leads (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5">
            {statCards.map((stat) => (
              <Card key={stat.label} className="p-4 bg-white border-studio-sand shadow-xs">
                <p className="text-[11px] font-semibold text-studio-muted uppercase tracking-wider">{stat.label}</p>
                <p className="mt-2 text-2xl font-serif font-bold text-studio-charcoal">{stat.value}</p>
              </Card>
            ))}
          </div>

          {/* Description & Notes */}
          <Card className="p-6 space-y-3 bg-white border-studio-sand shadow-xs">
            <h3 className="font-serif text-base font-semibold text-studio-charcoal">Gallery Details</h3>
            <p className="text-xs leading-relaxed text-studio-muted">
              {event.description || "No description specified for this event."}
            </p>
            <div className="pt-3 border-t border-studio-sand grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-studio-muted">Venue: </span>
                <span className="text-studio-charcoal font-semibold">{event.location || "Not specified"}</span>
              </div>
              <div>
                <span className="text-studio-muted">Event Date: </span>
                <span className="text-studio-charcoal font-semibold">{event.date || "Not specified"}</span>
              </div>
            </div>
          </Card>

          {/* Marketing Leads Section */}
          <Card className="p-6 space-y-4 bg-white border-studio-sand shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-serif text-base font-semibold text-studio-charcoal flex items-center gap-2">
                  <span>🎯 Client Marketing Leads</span>
                  <span className="px-2.5 py-0.5 rounded-full bg-studio-cream border border-studio-sand text-studio-forest text-[10px] font-mono font-bold">
                    {leads.length}
                  </span>
                </h3>
                <p className="text-xs text-studio-muted mt-0.5">
                  Guests who provided verified contact information during QR access.
                </p>
              </div>

              {leads.length > 0 && (
                <Button size="sm" variant="secondary" onClick={handleExportLeadsCSV} className="text-xs gap-1.5 self-start sm:self-auto font-medium">
                  <svg className="w-3.5 h-3.5 text-studio-forest" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Export CSV
                </Button>
              )}
            </div>

            {leads.length === 0 ? (
              <div className="p-6 rounded-2xl bg-studio-cream/40 border border-studio-sand text-center space-y-1.5">
                <p className="text-xs font-semibold text-studio-charcoal">No Marketing Opt-ins Yet</p>
                <p className="text-[11px] text-studio-muted max-w-sm mx-auto">
                  When guests register via your Event QR and check "Photographer Updates", their verified contact information will appear here.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-studio-sand">
                <table className="w-full text-left text-xs">
                  <thead className="bg-studio-cream/60 border-b border-studio-sand text-studio-muted uppercase text-[10px] tracking-wider font-semibold">
                    <tr>
                      <th className="px-4 py-3">Guest Name</th>
                      <th className="px-4 py-3">WhatsApp</th>
                      <th className="px-4 py-3">Email</th>
                      <th className="px-4 py-3">Opted In</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-studio-sand/60">
                    {leads.map((lead) => (
                      <tr key={lead.id} className="hover:bg-studio-cream/30 transition-colors">
                        <td className="px-4 py-3 font-medium text-studio-charcoal">{lead.full_name}</td>
                        <td className="px-4 py-3 font-mono text-studio-forest font-semibold">{lead.whatsapp_number}</td>
                        <td className="px-4 py-3 text-studio-muted">{lead.email || "—"}</td>
                        <td className="px-4 py-3 text-studio-muted">{lead.opted_in_at ? new Date(lead.opted_in_at).toLocaleDateString() : "Recent"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          {/* Quick Tab Shortcuts */}
          <Card className="p-6 bg-white border-studio-sand shadow-xs">
            <h3 className="font-serif text-base font-semibold text-studio-charcoal mb-3">Quick Navigation</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <Link
                to={`/events/${event.id}/photos`}
                className="flex items-center justify-between p-3.5 rounded-xl border border-studio-sand bg-studio-cream/30 hover:border-studio-forest/40 hover:bg-studio-cream/60 transition-all cursor-pointer group"
              >
                <div>
                  <p className="font-semibold text-studio-charcoal group-hover:text-studio-forest transition-colors">Manage Photos</p>
                  <p className="text-[11px] text-studio-muted">Browse, filter, and inspect photos</p>
                </div>
                <span className="text-studio-muted group-hover:text-studio-forest">→</span>
              </Link>
              <Link
                to={`/events/${event.id}/processing`}
                className="flex items-center justify-between p-3.5 rounded-xl border border-studio-sand bg-studio-cream/30 hover:border-studio-forest/40 hover:bg-studio-cream/60 transition-all cursor-pointer group"
              >
                <div>
                  <p className="font-semibold text-studio-charcoal group-hover:text-studio-forest transition-colors">Processing Pipeline</p>
                  <p className="text-[11px] text-studio-muted">Thumbnails, face embeddings & upload</p>
                </div>
                <span className="text-studio-muted group-hover:text-studio-forest">→</span>
              </Link>
              <Link
                to={`/events/${event.id}/qr`}
                className="flex items-center justify-between p-3.5 rounded-xl border border-studio-sand bg-studio-cream/30 hover:border-studio-forest/40 hover:bg-studio-cream/60 transition-all cursor-pointer group"
              >
                <div>
                  <p className="font-semibold text-studio-charcoal group-hover:text-studio-forest transition-colors">QR Code & Shortlinks</p>
                  <p className="text-[11px] text-studio-muted">Print QR cards and share gallery</p>
                </div>
                <span className="text-studio-muted group-hover:text-studio-forest">→</span>
              </Link>
              <Link
                to={`/events/${event.id}/settings`}
                className="flex items-center justify-between p-3.5 rounded-xl border border-studio-sand bg-studio-cream/30 hover:border-studio-forest/40 hover:bg-studio-cream/60 transition-all cursor-pointer group"
              >
                <div>
                  <p className="font-semibold text-studio-charcoal group-hover:text-studio-forest transition-colors">Event Settings</p>
                  <p className="text-[11px] text-studio-muted">Visibility, face search, and branding</p>
                </div>
                <span className="text-studio-muted group-hover:text-studio-forest">→</span>
              </Link>
            </div>
          </Card>
        </div>

        {/* Right Column: Public Share & QR Preview (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="p-6 space-y-4 bg-white border-studio-sand shadow-xs">
            <h3 className="font-serif text-base font-semibold text-studio-charcoal">Client Share URL</h3>
            <p className="text-xs text-studio-muted leading-relaxed">
              Share this link or QR code with attendees so they can register and find their photos.
            </p>

            <div className="flex items-center gap-2 rounded-xl border border-studio-sand bg-studio-cream/40 p-2.5">
              <code className="flex-1 font-mono text-xs text-studio-charcoal truncate">
                {galleryUrl}
              </code>
              <button
                onClick={handleCopyLink}
                className="rounded-lg px-2.5 py-1 text-xs font-semibold bg-white border border-studio-sand text-studio-forest hover:bg-studio-cream transition-colors cursor-pointer"
              >
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <Link to={`/event/${event.token}/gallery`} target="_blank" className="flex-1">
                <Button size="sm" variant="primary" className="w-full font-semibold shadow-xs">
                  Open Client Gallery ↗
                </Button>
              </Link>
              <Link to={`/events/${event.id}/qr`}>
                <Button size="sm" variant="secondary">
                  Full QR
                </Button>
              </Link>
            </div>
          </Card>

          {/* Mini QR Card */}
          <Card className="p-6 text-center space-y-3 bg-white border-studio-sand shadow-xs">
            <div className="inline-block p-4 rounded-2xl bg-studio-cream border border-studio-sand shadow-xs">
              <svg className="h-32 w-32" viewBox="0 0 100 100" fill="#1E3A2F">
                <path d="M0 0h30v30H0zM5 5h20v20H5zM10 10h10v10H10zM70 0h30v30H70zM75 5h20v20H75zM80 10h10v10H80zM0 70h30v30H0zM5 75h20v20H5zM10 80h10v10H10zM35 10h5v10h-5zM45 5h10v5h-10zM50 15h15v5H50zM35 25h10v15H35zM50 30h5v10h-5zM60 25h10v10H60zM75 35h15v10H75zM10 35h10v10H10zM25 40h5v15h-5zM35 50h20v5H35zM60 45h5v20H60zM70 50h10v15H70zM85 55h15v10H85zM35 60h5v20h-5zM45 70h15v5H45zM50 80h10v15H50zM65 75h10v20H65zM80 75h15v5H80zM75 90h20v5H75z" />
              </svg>
            </div>
            <div>
              <p className="font-serif text-sm font-semibold text-studio-charcoal">{event.name}</p>
              <p className="text-[11px] font-mono text-studio-forest font-semibold mt-0.5">Token: {event.token}</p>
            </div>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
