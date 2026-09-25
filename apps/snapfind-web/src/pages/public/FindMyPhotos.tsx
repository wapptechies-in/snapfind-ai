import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { GalleryLayout } from "../../layouts/GalleryLayout";
import { Alert, Button, Card, LoadingSpinner } from "../../components/common";
import { eventsApi, guestsApi, normalizeSearchResult, searchApi } from "../../services/api";
import type { Guest, SnapEvent } from "../../types";

export default function FindMyPhotos() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [event, setEvent] = useState<SnapEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Registered guest info
  const [guest, setGuest] = useState<Guest | null>(null);

  // Search State
  const [searching, setSearching] = useState(false);
  const [searchStatusText, setSearchStatusText] = useState<string>("Preparing search...");
  const [progressPercent, setProgressPercent] = useState<number>(0);

  useEffect(() => {
    async function loadEvent() {
      if (!token) return;
      try {
        const found = await eventsApi.getByToken(token);
        setEvent(found);

        // Check if guest is already registered
        const stored = localStorage.getItem(`snapfind_guest_${token}`);
        if (stored) {
          try {
            setGuest(JSON.parse(stored));
          } catch {
            localStorage.removeItem(`snapfind_guest_${token}`);
          }
        }
      } finally {
        setLoading(false);
      }
    }
    loadEvent();
  }, [token]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate MIME type
    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file (JPEG, PNG, or WebP).");
      return;
    }

    // Validate size (limit to 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError("Image file size must be less than 10MB.");
      return;
    }

    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  };

  const handleSearch = async () => {
    if (!selectedFile || !token) {
      setError("Please select or upload a selfie first.");
      return;
    }

    setSearching(true);
    setError(null);
    setProgressPercent(15);
    setSearchStatusText("Uploading selfie to secure face pipeline...");

    try {
      // 1. Submit async background job (non-blocking)
      const jobResponse = await searchApi.searchAsync(token, selectedFile);
      const jobId = jobResponse.jobId || jobResponse.job_id;
      if (!jobId || jobId === "null") {
        throw new Error("Could not initialize face search job.");
      }

      setProgressPercent(35);
      setSearchStatusText("Scanning event photos for matching faces...");

      // 2. Poll job status until completed or failed
      const maxAttempts = 40; // ~60 seconds max
      let attempts = 0;
      let completedJob: any = null;

      while (attempts < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, 1400));
        attempts++;

        try {
          const statusData = await searchApi.getJobStatus(jobId);
          if (statusData.status === "processing") {
            setProgressPercent(Math.min(40 + attempts * 3, 85));
            setSearchStatusText("Analyzing facial features & computing similarity...");
          } else if (statusData.status === "completed") {
            completedJob = statusData;
            setProgressPercent(100);
            setSearchStatusText("Matches found! Preparing your gallery...");
            break;
          } else if (statusData.status === "failed") {
            const raw = statusData.errorMessage || "Face search could not be completed.";
            throw new Error(raw.replace(/^\d{3}:\s*/, ""));
          }
        } catch (pollErr: any) {
          if (attempts > 5 && !pollErr?.message?.includes("Failed to check")) {
            throw pollErr;
          }
        }
      }

      if (!completedJob) {
        // Fallback to synchronous search if job polling timed out
        setSearchStatusText("Finalizing results directly...");
        const syncResults = await searchApi.searchBySelfie(token, selectedFile);
        completedJob = {
          totalMatches: syncResults.totalMatches,
          strongMatches: syncResults.strongMatches,
          possibleMatches: syncResults.possibleMatches,
        };
      }

      // Format results
      const formatted = normalizeSearchResult(token, previewUrl || "", {
        totalMatches: completedJob.totalMatches,
        strongMatches: completedJob.strongMatches,
        possibleMatches: completedJob.possibleMatches,
      });

      // Save search results in session storage
      sessionStorage.setItem("snapfind_last_search", JSON.stringify(formatted));

      // 3. WhatsApp delivery if transactional consent is active
      if (guest && guest.consent_whatsapp_transactional) {
        try {
          const resultsUrl = `${window.location.origin}/event/${token}/results`;
          const waRes = await guestsApi.sendWhatsApp(guest.id, {
            message_type: "transactional",
            results_url: resultsUrl,
          });
          sessionStorage.setItem("snapfind_whatsapp_sent", "true");
          sessionStorage.setItem("snapfind_whatsapp_phone", guest.whatsapp_number);
          const directUrl = (waRes as any)?.direct_share_url || (waRes as any)?.directShareUrl;
          if (directUrl) {
            sessionStorage.setItem("snapfind_whatsapp_direct_url", directUrl);
          }
        } catch (waErr) {
          console.warn("WhatsApp notification trigger skipped or failed:", waErr);
          sessionStorage.setItem("snapfind_whatsapp_sent", "false");
        }
      } else {
        sessionStorage.setItem("snapfind_whatsapp_sent", "false");
      }

      navigate(`/event/${token}/results`);
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Could not complete face search. Please try again.";
      setError(msg);
      setSearching(false);
      setProgressPercent(0);
    }
  };

  if (loading) {
    return (
      <GalleryLayout activeAction="search">
        <LoadingSpinner message="Loading search interface..." className="min-h-[60vh]" />
      </GalleryLayout>
    );
  }

  if (event && (event.isActive === false || event.status?.toLowerCase() === "inactive")) {
    return (
      <GalleryLayout activeAction="search">
        <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 text-center">
          <div className="h-16 w-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-3xl text-amber-400 mb-4 shadow-inner">
            ⏸
          </div>
          <h2 className="text-2xl font-bold text-white">This event is currently unavailable</h2>
          <p className="mt-2 text-sm text-zinc-400 max-w-md">
            The organizer has temporarily marked this event as Inactive. Photos cannot be searched at this time.
          </p>
        </div>
      </GalleryLayout>
    );
  }

  return (
    <GalleryLayout event={event} activeAction="search">
      <div className="flex-1 flex items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-lg space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-charcoal">
              Find My Photos
            </h1>
            <p className="text-xs sm:text-sm text-charcoal-muted">
              Upload a clear selfie containing only your face to find your photos.
            </p>
          </div>

          {/* Guest Registration Banner if guest is recognized */}
          {guest ? (
            <div className="px-4 py-2.5 rounded-xl bg-forest/10 border border-forest/20 flex items-center justify-between text-xs text-charcoal shadow-sm">
              <span className="flex items-center gap-1.5 truncate">
                <span>👤</span>
                <span>Searching as <strong className="text-charcoal font-semibold">{guest.full_name}</strong></span>
              </span>
              <span className="text-[11px] font-mono text-forest font-semibold shrink-0">
                {guest.whatsapp_number}
              </span>
            </div>
          ) : (
            <div className="px-4 py-3 rounded-xl bg-surface border border-warm-beige flex items-center justify-between text-xs text-charcoal shadow-sm">
              <span>Want photos sent to your WhatsApp?</span>
              <Link
                to={`/event/${token}`}
                className="text-forest font-semibold hover:underline"
              >
                Register here →
              </Link>
            </div>
          )}

          {error && <Alert type="error">{error}</Alert>}

          <Card className="p-6 sm:p-8 bg-surface border-warm-beige space-y-6 shadow-md">
            {/* Upload Area */}
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="user"
                onChange={handleFileChange}
                className="hidden"
                id="camera-selfie-input"
              />
              <input
                id="gallery-file-input"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />

              {previewUrl ? (
                <div className="flex flex-col items-center space-y-4">
                  <div className="relative h-44 w-44 rounded-full overflow-hidden border-4 border-forest shadow-xl bg-cream">
                    <img
                      src={previewUrl}
                      alt="Selfie Preview"
                      className="h-full w-full object-cover"
                    />
                    <div className="absolute inset-0 bg-forest/5 pointer-events-none" />
                  </div>
                  <div className="text-center space-y-1">
                    <p className="text-xs font-semibold text-charcoal truncate max-w-xs">
                      {selectedFile?.name}
                    </p>
                    <div className="flex items-center gap-3 justify-center text-xs">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="text-forest hover:underline transition-colors cursor-pointer font-medium"
                      >
                        Retake selfie
                      </button>
                      <span className="text-warm-beige">•</span>
                      <button
                        type="button"
                        onClick={() => document.getElementById("gallery-file-input")?.click()}
                        className="text-forest hover:underline transition-colors cursor-pointer font-medium"
                      >
                        Choose different photo
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex flex-col items-center justify-center p-6 rounded-2xl border border-forest/30 bg-forest/5 hover:bg-forest/10 hover:border-forest transition-all cursor-pointer text-center group active:scale-95 shadow-sm"
                    >
                      <div className="h-12 w-12 rounded-full bg-forest/10 group-hover:bg-forest/20 text-forest flex items-center justify-center mb-2 transition-colors">
                        <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                          <circle cx="12" cy="13" r="4" />
                        </svg>
                      </div>
                      <p className="text-sm font-bold text-charcoal">📸 Take Camera Selfie</p>
                      <p className="text-[11px] text-charcoal-muted mt-1">Open mobile front camera</p>
                    </button>

                    <button
                      type="button"
                      onClick={() => document.getElementById("gallery-file-input")?.click()}
                      className="flex flex-col items-center justify-center p-6 rounded-2xl border border-warm-beige bg-cream/60 hover:bg-cream hover:border-forest/40 transition-all cursor-pointer text-center group active:scale-95 shadow-sm"
                    >
                      <div className="h-12 w-12 rounded-full bg-surface border border-warm-beige text-charcoal-muted flex items-center justify-center mb-2 transition-colors">
                        <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                          <circle cx="8.5" cy="8.5" r="1.5" />
                          <polyline points="21 15 16 10 5 21" />
                        </svg>
                      </div>
                      <p className="text-sm font-bold text-charcoal">📁 Choose Photo</p>
                      <p className="text-[11px] text-charcoal-muted mt-1">Upload from phone gallery</p>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Selfie Tips / Guidelines */}
            <div className="p-3.5 rounded-xl bg-cream border border-warm-beige space-y-2 text-xs text-charcoal-muted">
              <p className="font-semibold text-charcoal">Selfie Guidelines:</p>
              <ul className="space-y-1 text-[11px] list-disc list-inside">
                <li>Make sure your face is clearly lit and centered.</li>
                <li>Remove dark sunglasses, masks, or wide-brim hats.</li>
                <li>Ensure only one person is in the selfie frame.</li>
              </ul>
            </div>

            {/* Searching Progress Indicator */}
            {searching && (
              <div className="p-4 rounded-xl bg-forest/10 border border-forest/20 space-y-2 text-center animate-fade-in shadow-sm">
                <div className="flex items-center justify-between text-xs text-charcoal mb-1">
                  <span>{searchStatusText}</span>
                  <span className="font-mono font-bold text-forest">{progressPercent}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-cream overflow-hidden border border-warm-beige">
                  <div
                    className="h-full bg-gradient-to-r from-forest via-sage to-forest transition-all duration-300 rounded-full"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
            )}

            {/* Search Button */}
            <div>
              <Button
                variant="primary"
                size="lg"
                disabled={!selectedFile || searching}
                loading={searching}
                onClick={handleSearch}
                className="w-full text-base py-3 font-semibold rounded-full shadow-sm"
              >
                {searching ? "Finding your photos..." : "Find My Photos"}
              </Button>
            </div>

            <div className="text-center">
              <Link
                to={`/event/${token}`}
                className="text-xs text-charcoal-muted hover:text-charcoal transition-colors"
              >
                ← Back to event landing
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </GalleryLayout>
  );
}
