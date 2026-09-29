import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { EventHeader } from "../../components/events/EventHeader";
import { Button, Card, LoadingSpinner } from "../../components/common";
import { eventsApi, guestsApi } from "../../api";
import type { MarketingLead, SnapEvent } from "../../types";

export const EventDetails: React.FC = () => {
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
      } catch (err) {
        console.error("Failed to load event details:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [id]);

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <LoadingSpinner message="Loading event details..." />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="max-w-4xl mx-auto py-8">
        <Card className="p-12 text-center bg-slate-panel border border-slate-800">
          <h2 className="text-base font-semibold text-soft-white">Event Not Found</h2>
          <p className="mt-1 text-xs text-muted">The requested event ID could not be located.</p>
          <div className="mt-4">
            <Link to="/events">
              <Button size="sm">Back to Events</Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  const galleryUrl = `http://localhost:5173/event/${event.token}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(galleryUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenClientGallery = (e: React.MouseEvent) => {
    e.preventDefault();
    const url = `http://localhost:5173/event/${event.token}/gallery`;
    if (window.desktopAPI?.openExternal) {
      window.desktopAPI.openExternal(url);
    } else {
      window.open(url, "_blank");
    }
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
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      <EventHeader event={event} />

      <div className="grid gap-6 lg:grid-cols-12">
        {/* Left Column: Metrics & Leads (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5">
            {statCards.map((stat) => (
              <Card key={stat.label} className="p-4 bg-slate-panel border-slate-800 shadow-sm">
                <p className="text-[11px] font-semibold text-muted uppercase tracking-wider">{stat.label}</p>
                <p className="mt-2 text-2xl font-serif font-bold text-soft-white">{stat.value}</p>
              </Card>
            ))}
          </div>

          {/* Description & Notes */}
          <Card className="p-6 space-y-3 bg-slate-panel border-slate-800 shadow-sm">
            <h3 className="font-serif text-base font-semibold text-soft-white">Gallery Details</h3>
            <p className="text-xs leading-relaxed text-muted">
              {event.description || "No description specified for this event."}
            </p>
            <div className="pt-3 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-muted">Venue: </span>
                <span className="text-soft-white font-semibold">{event.location || "Not specified"}</span>
              </div>
              <div>
                <span className="text-muted">Event Date: </span>
                <span className="text-soft-white font-semibold">{event.date || "Not specified"}</span>
              </div>
            </div>
          </Card>

          {/* Marketing Leads Section */}
          <Card className="p-6 space-y-4 bg-slate-panel border-slate-800 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-serif text-base font-semibold text-soft-white flex items-center gap-2">
                  <span>🎯 Client Marketing Leads</span>
                  <span className="px-2.5 py-0.5 rounded-full bg-midnight border border-slate-800 text-gold text-[10px] font-mono font-bold">
                    {leads.length}
                  </span>
                </h3>
                <p className="text-xs text-muted mt-0.5">
                  Guests who provided verified contact information during QR access.
                </p>
              </div>

              {leads.length > 0 && (
                <Button size="sm" variant="secondary" onClick={handleExportLeadsCSV} className="text-xs gap-1.5 self-start sm:self-auto font-medium border-slate-700 bg-midnight text-soft-white hover:border-gold">
                  <svg className="w-3.5 h-3.5 text-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Export CSV
                </Button>
              )}
            </div>

            {leads.length === 0 ? (
              <div className="p-6 rounded-2xl bg-midnight/40 border border-slate-800 text-center space-y-1.5">
                <p className="text-xs font-semibold text-soft-white">No Marketing Opt-ins Yet</p>
                <p className="text-[11px] text-muted max-w-sm mx-auto">
                  When guests register via your Event QR and check "Photographer Updates", their verified contact information will appear here.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-slate-800">
                <table className="w-full text-left text-xs">
                  <thead className="bg-midnight/80 border-b border-slate-800 text-muted uppercase text-[10px] tracking-wider font-semibold">
                    <tr>
                      <th className="px-4 py-3">Guest Name</th>
                      <th className="px-4 py-3">WhatsApp</th>
                      <th className="px-4 py-3">Email</th>
                      <th className="px-4 py-3">Opted In</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {leads.map((lead) => (
                      <tr key={lead.id} className="hover:bg-midnight/40 transition-colors">
                        <td className="px-4 py-3 font-medium text-soft-white">{lead.full_name}</td>
                        <td className="px-4 py-3 font-mono text-gold font-semibold">{lead.whatsapp_number}</td>
                        <td className="px-4 py-3 text-muted">{lead.email || "—"}</td>
                        <td className="px-4 py-3 text-muted">{lead.opted_in_at ? new Date(lead.opted_in_at).toLocaleDateString() : "Recent"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          {/* Quick Tab Shortcuts */}
          <Card className="p-6 bg-slate-panel border-slate-800 shadow-sm">
            <h3 className="font-serif text-base font-semibold text-soft-white mb-3">Quick Navigation</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <Link
                to={`/events/${event.id}/photos`}
                className="flex items-center justify-between p-3.5 rounded-xl border border-slate-800 bg-midnight/50 hover:border-gold/40 hover:bg-midnight transition-all cursor-pointer group"
              >
                <div>
                  <p className="font-semibold text-soft-white group-hover:text-gold transition-colors">Manage Photos</p>
                  <p className="text-[11px] text-muted">Browse, filter, and inspect photos</p>
                </div>
                <span className="text-muted group-hover:text-gold">→</span>
              </Link>
              <Link
                to={`/events/${event.id}/processing`}
                className="flex items-center justify-between p-3.5 rounded-xl border border-slate-800 bg-midnight/50 hover:border-gold/40 hover:bg-midnight transition-all cursor-pointer group"
              >
                <div>
                  <p className="font-semibold text-soft-white group-hover:text-gold transition-colors">Processing Pipeline</p>
                  <p className="text-[11px] text-muted">Thumbnails, face embeddings & upload</p>
                </div>
                <span className="text-muted group-hover:text-gold">→</span>
              </Link>
              <Link
                to={`/events/${event.id}/qr`}
                className="flex items-center justify-between p-3.5 rounded-xl border border-slate-800 bg-midnight/50 hover:border-gold/40 hover:bg-midnight transition-all cursor-pointer group"
              >
                <div>
                  <p className="font-semibold text-soft-white group-hover:text-gold transition-colors">QR Code & Shortlinks</p>
                  <p className="text-[11px] text-muted">Print QR cards and share gallery</p>
                </div>
                <span className="text-muted group-hover:text-gold">→</span>
              </Link>
              <Link
                to={`/events/${event.id}/settings`}
                className="flex items-center justify-between p-3.5 rounded-xl border border-slate-800 bg-midnight/50 hover:border-gold/40 hover:bg-midnight transition-all cursor-pointer group"
              >
                <div>
                  <p className="font-semibold text-soft-white group-hover:text-gold transition-colors">Event Settings</p>
                  <p className="text-[11px] text-muted">Visibility, face search, and branding</p>
                </div>
                <span className="text-muted group-hover:text-gold">→</span>
              </Link>
            </div>
          </Card>
        </div>

        {/* Right Column: Public Share & QR Preview (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="p-6 space-y-4 bg-slate-panel border-slate-800 shadow-sm">
            <h3 className="font-serif text-base font-semibold text-soft-white">Client Share URL</h3>
            <p className="text-xs text-muted leading-relaxed">
              Share this link or QR code with attendees so they can register and find their photos.
            </p>

            <div className="flex items-center gap-2 rounded-xl border border-slate-800 bg-midnight p-2.5">
              <code className="flex-1 font-mono text-xs text-soft-white truncate">
                {galleryUrl}
              </code>
              <button
                onClick={handleCopyLink}
                className="rounded-lg px-2.5 py-1 text-xs font-semibold bg-slate-panel border border-slate-700 text-gold hover:bg-midnight transition-colors cursor-pointer"
              >
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={handleOpenClientGallery}
                className="flex-1 inline-flex items-center justify-center font-semibold rounded-lg transition-colors duration-150 border focus:outline-none focus:ring-2 focus:ring-offset-2 bg-gold text-midnight hover:bg-gold-light border-gold px-3 py-1.5 text-xs cursor-pointer"
              >
                Open Client Gallery ↗
              </button>
              <Link to={`/events/${event.id}/qr`}>
                <Button size="sm" variant="secondary" className="border-slate-700 bg-midnight text-soft-white hover:border-gold">
                  Full QR
                </Button>
              </Link>
            </div>
          </Card>

          {/* Mini QR Card */}
          <Card className="p-6 text-center space-y-3 bg-slate-panel border-slate-800 shadow-sm">
            <div className="inline-block p-4 rounded-2xl bg-white border border-slate-800 shadow-xs">
              <svg className="h-32 w-32" viewBox="0 0 100 100" fill="#0B1220">
                <path d="M0 0h30v30H0zM5 5h20v20H5zM10 10h10v10H10zM70 0h30v30H70zM75 5h20v20H75zM80 10h10v10H80zM0 70h30v30H0zM5 75h20v20H5zM10 80h10v10H10zM35 10h5v10h-5zM45 5h10v5h-10zM50 15h15v5H50zM35 25h10v15H35zM50 30h5v10h-5zM60 25h10v10H60zM75 35h15v10H75zM10 35h10v10H10zM25 40h5v15h-5zM35 50h20v5H35zM60 45h5v20H60zM70 50h10v15H70zM85 55h15v10H85zM35 60h5v20h-5zM45 70h15v5H45zM50 80h10v15H50zM65 75h10v20H65zM80 75h15v5H80zM75 90h20v5H75z" />
              </svg>
            </div>
            <div>
              <p className="font-serif text-sm font-semibold text-soft-white">{event.name}</p>
              <p className="text-[11px] font-mono text-gold font-semibold mt-0.5">Token: {event.token}</p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
export default EventDetails;
