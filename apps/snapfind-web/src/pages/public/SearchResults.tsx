import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { GalleryLayout } from "../../layouts/GalleryLayout";
import { Alert, Button, Card, LoadingSpinner } from "../../components/common";
import { PhotoViewer } from "../../components/viewer/PhotoViewer";
import { eventsApi, photosApi } from "../../services/api";
import type { Photo, SearchResult, SnapEvent } from "../../types";

export default function SearchResults() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();

  const [event, setEvent] = useState<SnapEvent | null>(null);
  const [results, setResults] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);

  // WhatsApp Delivery Status
  const [whatsAppSent, setWhatsAppSent] = useState(false);
  const [whatsAppPhone, setWhatsAppPhone] = useState<string | null>(null);
  const [directWaUrl, setDirectWaUrl] = useState<string | null>(null);

  useEffect(() => {
    async function loadResults() {
      if (!token) return;
      setLoading(true);
      try {
        const eventData = await eventsApi.getByToken(token);
        setEvent(eventData);

        // Check WhatsApp notification state
        const sent = sessionStorage.getItem("snapfind_whatsapp_sent") === "true";
        const phone = sessionStorage.getItem("snapfind_whatsapp_phone");
        const directUrl = sessionStorage.getItem("snapfind_whatsapp_direct_url");
        setWhatsAppSent(sent);
        setWhatsAppPhone(phone);
        if (directUrl) {
          setDirectWaUrl(directUrl);
        } else if (phone) {
          const cleanPhone = phone.replace(/\D/g, "");
          const waText = encodeURIComponent(`Hi! 📸 Here is my photo gallery from ${eventData?.name || "the event"}: ${window.location.href}`);
          setDirectWaUrl(`https://wa.me/${cleanPhone}?text=${waText}`);
        }

        // Retrieve search result from session storage
        const saved = sessionStorage.getItem("snapfind_last_search");
        if (saved) {
          const parsed = JSON.parse(saved);
          setResults(parsed);
          // Default select all strong matches
          setSelectedIds((parsed.strongMatches || []).map((p: Photo) => p.id));
        } else {
          // If navigated directly without searching, redirect to search
          navigate(`/event/${token}/search`);
        }
      } finally {
        setLoading(false);
      }
    }
    loadResults();
  }, [token, navigate]);

  if (loading || !results) {
    return (
      <GalleryLayout activeAction="results">
        <LoadingSpinner message="Retrieving facial match results..." className="min-h-[60vh]" />
      </GalleryLayout>
    );
  }

  const allPhotos = [...(results.strongMatches || []), ...(results.possibleMatches || [])];

  const handleToggleSelect = (photoId: string) => {
    setSelectedIds((prev) =>
      prev.includes(photoId) ? prev.filter((id) => id !== photoId) : [...prev, photoId]
    );
  };

  const handleSelectAll = () => {
    if (selectedIds.length === allPhotos.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(allPhotos.map((p) => p.id));
    }
  };

  const handleDownloadSelected = async () => {
    if (selectedIds.length === 0 || downloading) return;
    setDownloading(true);
    try {
      setToast(`Packaging ${selectedIds.length} photos into a ZIP archive...`);
      await photosApi.downloadZip(selectedIds, "web");
      setToast(`Successfully downloaded ZIP with ${selectedIds.length} matched photos!`);
    } catch (err: any) {
      console.error("ZIP download failed:", err);
      setToast(`Error creating ZIP download: ${err?.message || "Please try again."}`);
    } finally {
      setDownloading(false);
      setTimeout(() => setToast(null), 5000);
    }
  };

  return (
    <GalleryLayout event={event} activeAction="results">
      <div className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-8 py-8 space-y-8">
        {toast && <Alert type="success" onClose={() => setToast(null)}>{toast}</Alert>}

        {/* WhatsApp Delivery Confirmation Banner */}
        {whatsAppSent && whatsAppPhone && (
          <div className="p-4 rounded-2xl bg-forest/5 border border-forest/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs text-charcoal">
            <div className="flex items-center gap-3">
              <span className="text-xl">📲</span>
              <div>
                <strong className="text-forest font-semibold">Gallery link sent to WhatsApp!</strong>
                <p className="text-[11px] text-warm-gray mt-0.5">
                  A direct link to these results has been queued for <span className="font-mono text-charcoal font-semibold">{whatsAppPhone}</span>.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2.5 self-start sm:self-auto">
              {directWaUrl && (
                <a
                  href={directWaUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-forest hover:bg-forest-light text-cream font-semibold text-xs transition-colors shadow-sm"
                >
                  <span>💬</span>
                  <span>Open in WhatsApp</span>
                </a>
              )}
              <span className="text-[11px] font-semibold uppercase tracking-wider text-forest shrink-0 hidden sm:inline">
                Delivered ✓
              </span>
            </div>
          </div>
        )}

        {/* Results Hero Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-warm-beige">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-forest/10 text-forest px-3 py-0.5 text-xs font-semibold mb-2">
              <span>✓</span>
              <span>Search Complete</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-charcoal">
              We found {results.totalMatches ?? allPhotos.length} matched {(results.totalMatches ?? allPhotos.length) === 1 ? "photo" : "photos"}
            </h1>
            <p className="text-xs text-warm-gray mt-1">
              Based on facial similarity matching from your uploaded selfie
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link to={`/event/${token}/search`}>
              <Button size="sm" variant="secondary" className="border-warm-beige text-xs">
                Take another selfie
              </Button>
            </Link>
            <Link to={`/event/${token}/gallery`}>
              <Button size="sm" variant="outline" className="border-warm-beige text-xs">
                Full Gallery
              </Button>
            </Link>
          </div>
        </div>

        {/* Zero Matches State */}
        {allPhotos.length === 0 ? (
          <Card className="p-8 sm:p-12 bg-white border-warm-beige text-center space-y-4 max-w-lg mx-auto shadow-sm">
            <div className="h-16 w-16 rounded-full bg-sand-light border border-warm-beige flex items-center justify-center text-3xl mx-auto text-forest">
              🔍
            </div>
            <div className="space-y-1">
              <h2 className="text-lg font-serif font-bold text-charcoal">No Face Matches Found</h2>
              <p className="text-xs text-warm-gray leading-relaxed">
                We couldn't detect your face in the photos uploaded for this event so far.
              </p>
            </div>
            <div className="p-3.5 rounded-xl bg-cream border border-warm-beige text-left text-xs text-warm-gray space-y-1">
              <p className="font-semibold text-charcoal">Quick Tips:</p>
              <ul className="list-disc list-inside space-y-0.5 text-[11px]">
                <li>Retake your selfie with brighter front-facing light.</li>
                <li>Make sure dark sunglasses, masks, or hats are removed.</li>
                <li>The photographer may still be uploading the rest of the album.</li>
              </ul>
            </div>
            <div className="pt-2 flex flex-col sm:flex-row gap-2 justify-center">
              <Link to={`/event/${token}/search`}>
                <Button variant="primary" size="sm" className="w-full sm:w-auto">
                  Try Another Selfie
                </Button>
              </Link>
              <Link to={`/event/${token}/gallery`}>
                <Button variant="secondary" size="sm" className="w-full sm:w-auto border-warm-beige">
                  Browse All Photos ({event?.photoCount || 0})
                </Button>
              </Link>
            </div>
          </Card>
        ) : (
          <>
            {/* Batch Actions Bar */}
            <Card className="p-4 bg-white border-warm-beige flex flex-wrap items-center justify-between gap-3 shadow-sm">
              <div className="flex items-center gap-3">
                <button
                  onClick={handleSelectAll}
                  className="text-xs font-semibold text-forest hover:text-forest-light transition-colors"
                >
                  {selectedIds.length === allPhotos.length ? "Deselect All" : "Select All"}
                </button>
                <span className="text-warm-gray/40">•</span>
                <span className="text-xs text-warm-gray">
                  <strong className="text-charcoal">{selectedIds.length}</strong> of {allPhotos.length} selected
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="primary"
                  disabled={selectedIds.length === 0 || downloading}
                  onClick={handleDownloadSelected}
                  className="gap-2 text-xs"
                >
                  {downloading ? (
                    <>
                      <svg className="animate-spin h-3.5 w-3.5 text-cream" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      <span>Downloading ZIP...</span>
                    </>
                  ) : (
                    <>
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      <span>Download Selected ({selectedIds.length})</span>
                    </>
                  )}
                </Button>
              </div>
            </Card>

            {/* Section 1: Strong Matches */}
            {results.strongMatches && results.strongMatches.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-serif font-bold text-charcoal">Strong Matches</h2>
                  <span className="rounded-full bg-forest/10 text-forest border border-forest/20 px-2.5 py-0.5 text-[11px] font-semibold">
                    High Confidence ({results.strongMatches.length})
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5">
                  {results.strongMatches.map((photo) => {
                    const isSelected = selectedIds.includes(photo.id);
                    const globalIdx = allPhotos.findIndex((p) => p.id === photo.id);

                    return (
                      <div
                        key={photo.id}
                        className={`group relative aspect-[4/3] rounded-xl overflow-hidden bg-sand-light border transition-all cursor-pointer shadow-sm ${
                          isSelected ? "border-forest ring-2 ring-forest/30" : "border-warm-beige hover:border-forest/40"
                        }`}
                      >
                        <img
                          src={photo.thumbnailUrl || photo.url}
                          alt={photo.filename}
                          onClick={() => setViewerIndex(globalIdx)}
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                          loading="lazy"
                        />

                        {/* Checkbox Trigger */}
                        <div
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleSelect(photo.id);
                          }}
                          className={`absolute top-2.5 right-2.5 h-6 w-6 rounded-md flex items-center justify-center cursor-pointer transition-colors ${
                            isSelected
                              ? "bg-forest text-cream border border-forest"
                              : "bg-white/80 backdrop-blur-sm border border-warm-beige hover:bg-white text-forest"
                          }`}
                        >
                          {isSelected && (
                            <span className="text-xs font-bold leading-none">✓</span>
                          )}
                        </div>

                        {/* Match Confidence Badge */}
                        {photo.matchConfidence && (
                          <div className="absolute top-2.5 left-2.5">
                            <span className="rounded-md bg-forest/90 backdrop-blur-sm text-cream px-2 py-0.5 text-[10px] font-semibold shadow-sm">
                              {photo.matchConfidence}% match
                            </span>
                          </div>
                        )}

                        <div
                          onClick={() => setViewerIndex(globalIdx)}
                          className="absolute inset-x-0 bottom-0 p-2.5 bg-gradient-to-t from-charcoal/80 to-transparent flex items-end justify-between text-[11px] text-cream"
                        >
                          <span className="truncate">{photo.filename}</span>
                          <span className="text-champagne font-semibold text-[10px]">View</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Section 2: Possible Matches */}
            {results.possibleMatches && results.possibleMatches.length > 0 && (
              <div className="space-y-4 pt-4 border-t border-warm-beige">
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-serif font-bold text-charcoal">Possible Matches</h2>
                  <span className="rounded-full bg-sand-light text-warm-gray border border-warm-beige px-2.5 py-0.5 text-[11px] font-semibold">
                    Moderate Confidence ({results.possibleMatches.length})
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5">
                  {results.possibleMatches.map((photo) => {
                    const isSelected = selectedIds.includes(photo.id);
                    const globalIdx = allPhotos.findIndex((p) => p.id === photo.id);

                    return (
                      <div
                        key={photo.id}
                        className={`group relative aspect-[4/3] rounded-xl overflow-hidden bg-sand-light border transition-all cursor-pointer shadow-sm ${
                          isSelected ? "border-forest ring-2 ring-forest/30" : "border-warm-beige hover:border-forest/40"
                        }`}
                      >
                        <img
                          src={photo.thumbnailUrl || photo.url}
                          alt={photo.filename}
                          onClick={() => setViewerIndex(globalIdx)}
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                          loading="lazy"
                        />

                        {/* Checkbox Trigger */}
                        <div
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleSelect(photo.id);
                          }}
                          className={`absolute top-2.5 right-2.5 h-6 w-6 rounded-md flex items-center justify-center cursor-pointer transition-colors ${
                            isSelected
                              ? "bg-forest text-cream border border-forest"
                              : "bg-white/80 backdrop-blur-sm border border-warm-beige hover:bg-white text-forest"
                          }`}
                        >
                          {isSelected && (
                            <span className="text-xs font-bold leading-none">✓</span>
                          )}
                        </div>

                        {photo.matchConfidence && (
                          <div className="absolute top-2.5 left-2.5">
                            <span className="rounded-md bg-charcoal/80 backdrop-blur-sm text-sand-light px-2 py-0.5 text-[10px] font-semibold">
                              {photo.matchConfidence}% match
                            </span>
                          </div>
                        )}

                        <div
                          onClick={() => setViewerIndex(globalIdx)}
                          className="absolute inset-x-0 bottom-0 p-2.5 bg-gradient-to-t from-charcoal/80 to-transparent flex items-end justify-between text-[11px] text-cream"
                        >
                          <span className="truncate">{photo.filename}</span>
                          <span className="text-champagne font-semibold text-[10px]">View</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}

        {/* Photographer CTA Banner (Configurable via event.show_company_cta) */}
        {event?.show_company_cta && (
          <div className="p-6 rounded-2xl bg-white border border-warm-beige flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
            <div className="space-y-1 text-center sm:text-left">
              <h3 className="text-base font-serif font-bold text-charcoal">Loving your event photos?</h3>
              <p className="text-xs text-warm-gray">
                Book this photographer for your next wedding, birthday, or corporate event!
              </p>
            </div>
            {event.show_contact_button && (
              <a
                href={event.location ? `https://wa.me/?text=Hi%2C+I+saw+your+photos+from+${encodeURIComponent(event.name)}+and+would+like+to+inquire` : "#"}
                target="_blank"
                rel="noreferrer"
              >
                <Button variant="primary" size="md" className="shrink-0 shadow-sm text-xs">
                  Inquire with Photographer
                </Button>
              </a>
            )}
          </div>
        )}

        {/* SnapFind Branding Footer (Configurable via event.show_snapfind_branding) */}
        {event?.show_snapfind_branding !== false && (
          <div className="text-center pt-8 pb-4 space-y-1 border-t border-warm-beige">
            <p className="text-xs text-warm-gray font-serif">
              Powered by <strong className="text-charcoal font-sans">SnapFind Studio</strong>
            </p>
            <p className="text-[11px] text-warm-gray/70">Every Moment Finds You</p>
          </div>
        )}
      </div>

      {/* Fullscreen Photo Lightbox */}
      {viewerIndex !== null && (
        <PhotoViewer
          photos={allPhotos}
          currentIndex={viewerIndex}
          isOpen={viewerIndex !== null}
          onClose={() => setViewerIndex(null)}
          onNavigate={(newIdx) => setViewerIndex(newIdx)}
        />
      )}
    </GalleryLayout>
  );
}
