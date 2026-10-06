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

function optimizeSelfieForSearch(file: File): Promise<File> {
  return new Promise((resolve) => {
    // If file is already small (under 400KB), return directly
    if (file.size <= 400 * 1024) {
      resolve(file);
      return;
    }

    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const MAX_SIZE = 800; // Optimal resolution for InsightFace detection & pgvector search
      let { width, height } = img;
      if (width > MAX_SIZE || height > MAX_SIZE) {
        if (width > height) {
          height = Math.round((height * MAX_SIZE) / width);
          width = MAX_SIZE;
        } else {
          width = Math.round((width * MAX_SIZE) / height);
          height = MAX_SIZE;
        }
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve(file);
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            resolve(file);
            return;
          }
          const cleanName = file.name.replace(/\.[^.]+$/, ".jpg");
          const optimizedFile = new File([blob], cleanName, {
            type: "image/jpeg",
            lastModified: Date.now(),
          });
          resolve(optimizedFile);
        },
        "image/jpeg",
        0.85
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(file);
    };
    img.src = objectUrl;
  });
}

  const handleSearch = async () => {
    if (!selectedFile || !token) {
      setError("Please select or upload a selfie first.");
      return;
    }

    setSearching(true);
    setError(null);
    setProgressPercent(10);
    setSearchStatusText("Optimizing selfie for instant AI search...");

    try {
      // Downscale 10MB raw phone selfie to ~70KB for ultrafast upload and minimal server load
      const uploadPayload = await optimizeSelfieForSearch(selectedFile);
      setProgressPercent(25);
      setSearchStatusText("Connecting to secure face pipeline...");

      // 1. Submit async background job (non-blocking)
      const jobResponse = await searchApi.searchAsync(token, uploadPayload);
      const jobId = jobResponse.jobId || jobResponse.job_id;
      if (!jobId || jobId === "null") {
        throw new Error("Could not initialize face search job.");
      }

      setProgressPercent(45);
      setSearchStatusText("Scanning event photos for matching faces...");

      // 2. Poll job status until completed or failed
      const maxAttempts = 40; // ~50 seconds max
      let attempts = 0;
      let completedJob: { totalMatches?: number; strongMatches?: unknown[]; possibleMatches?: unknown[]; status?: string; errorMessage?: string } | null = null;

      while (attempts < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, attempts === 0 ? 800 : 1200));
        attempts++;

        try {
          const statusData = await searchApi.getJobStatus(jobId);
          if (statusData.status === "processing") {
            setProgressPercent(Math.min(50 + attempts * 4, 88));
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
        } catch (pollErr: unknown) {
          const msg = pollErr instanceof Error ? pollErr.message : "";
          if (attempts > 5 && !msg.includes("Failed to check")) {
            throw pollErr;
          }
        }
      }

      if (!completedJob) {
        // Fallback to synchronous search if job polling timed out
        setSearchStatusText("Finalizing results directly...");
        const syncResults = await searchApi.searchBySelfie(token, uploadPayload);
        completedJob = {
          totalMatches: syncResults.totalMatches,
          strongMatches: syncResults.strongMatches,
          possibleMatches: syncResults.possibleMatches,
        };
      }

      // Format results
      const formatted = normalizeSearchResult(token, previewUrl || "", {
        totalMatches: completedJob.totalMatches,
        strongMatches: completedJob.strongMatches as unknown as Parameters<typeof normalizeSearchResult>[2]["strongMatches"],
        possibleMatches: completedJob.possibleMatches as unknown as Parameters<typeof normalizeSearchResult>[2]["possibleMatches"],
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
          const waRecord = waRes as unknown as Record<string, unknown>;
          const directUrl = (waRecord?.direct_share_url as string | undefined) || (waRecord?.directShareUrl as string | undefined);
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
            <h1 className="text-2xl sm:text-3xl font-bold text-[#0B1220]">
              Find My Photos
            </h1>
            <p className="text-xs sm:text-sm text-[#6B7280]">
              Upload a clear selfie containing only your face to find your photos.
            </p>
          </div>

          {/* Guest Registration Banner if guest is recognized */}
          {guest ? (
            <div className="px-4 py-2.5 rounded-xl bg-white border border-[#D6A84F]/30 flex items-center justify-between text-xs text-[#0B1220] shadow-xs">
              <span className="flex items-center gap-1.5 truncate">
                <span>👤</span>
                <span>Searching as <strong className="font-semibold text-[#0B1220]">{guest.full_name}</strong></span>
              </span>
              <span className="text-[11px] font-mono text-[#D6A84F] font-bold shrink-0">
                {guest.whatsapp_number}
              </span>
            </div>
          ) : (
            <div className="px-4 py-3 rounded-xl bg-white border border-[#E8E2D8] flex items-center justify-between text-xs text-[#0B1220] shadow-xs">
              <span>Want photos sent to your WhatsApp?</span>
              <Link
                to={`/event/${token}`}
                className="text-[#D6A84F] font-bold hover:underline"
              >
                Register here →
              </Link>
            </div>
          )}

          {error && <Alert type="error">{error}</Alert>}

          <Card className="p-6 sm:p-8 bg-white border-[#E8E2D8] space-y-6 shadow-sm">
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
                  <div className="relative h-44 w-44 rounded-full overflow-hidden border-4 border-[#D6A84F] shadow-xl bg-[#FAF8F3]">
                    <img
                      src={previewUrl}
                      alt="Selfie Preview"
                      className="h-full w-full object-cover"
                    />
                    <div className="absolute inset-0 bg-[#D6A84F]/5 pointer-events-none" />
                  </div>
                  <div className="text-center space-y-1">
                    <p className="text-xs font-semibold text-[#0B1220] truncate max-w-xs">
                      {selectedFile?.name}
                    </p>
                    <div className="flex items-center gap-3 justify-center text-xs">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="text-[#D6A84F] hover:underline transition-colors cursor-pointer font-semibold"
                      >
                        Retake selfie
                      </button>
                      <span className="text-[#DCD5C9]">•</span>
                      <button
                        type="button"
                        onClick={() => document.getElementById("gallery-file-input")?.click()}
                        className="text-[#D6A84F] hover:underline transition-colors cursor-pointer font-semibold"
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
                      className="flex flex-col items-center justify-center p-6 rounded-2xl border border-[#D6A84F]/40 bg-[#D6A84F]/5 hover:bg-[#D6A84F]/10 hover:border-[#D6A84F] transition-all cursor-pointer text-center group active:scale-95 shadow-xs"
                    >
                      <div className="h-12 w-12 rounded-full bg-[#D6A84F]/15 group-hover:bg-[#D6A84F]/25 text-[#D6A84F] flex items-center justify-center mb-2 transition-colors">
                        <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                          <circle cx="12" cy="13" r="4" />
                        </svg>
                      </div>
                      <p className="text-sm font-bold text-[#0B1220]">📸 Take Camera Selfie</p>
                      <p className="text-[11px] text-[#6B7280] mt-1">Open mobile front camera</p>
                    </button>

                    <button
                      type="button"
                      onClick={() => document.getElementById("gallery-file-input")?.click()}
                      className="flex flex-col items-center justify-center p-6 rounded-2xl border border-[#E8E2D8] bg-[#FAF8F3] hover:bg-white hover:border-[#D6A84F]/40 transition-all cursor-pointer text-center group active:scale-95 shadow-xs"
                    >
                      <div className="h-12 w-12 rounded-full bg-white border border-[#E8E2D8] text-[#6B7280] flex items-center justify-center mb-2 transition-colors">
                        <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                          <circle cx="8.5" cy="8.5" r="1.5" />
                          <polyline points="21 15 16 10 5 21" />
                        </svg>
                      </div>
                      <p className="text-sm font-bold text-[#0B1220]">📁 Choose Photo</p>
                      <p className="text-[11px] text-[#6B7280] mt-1">Upload from phone gallery</p>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Selfie Tips / Guidelines */}
            <div className="p-3.5 rounded-xl bg-[#FAF8F3] border border-[#E8E2D8] space-y-2 text-xs text-[#6B7280]">
              <p className="font-bold text-[#0B1220]">Selfie Guidelines:</p>
              <ul className="space-y-1 text-[11px] list-disc list-inside">
                <li>Make sure your face is clearly lit and centered.</li>
                <li>Remove dark sunglasses, masks, or wide-brim hats.</li>
                <li>Ensure only one person is in the selfie frame.</li>
              </ul>
            </div>

            {/* Searching Progress Indicator */}
            {searching && (
              <div className="p-4 rounded-xl bg-[#D6A84F]/10 border border-[#D6A84F]/30 space-y-2 text-center animate-fade-in shadow-xs">
                <div className="flex items-center justify-between text-xs text-[#0B1220] mb-1">
                  <span>{searchStatusText}</span>
                  <span className="font-mono font-bold text-[#D6A84F]">{progressPercent}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-[#FAF8F3] overflow-hidden border border-[#E8E2D8]">
                  <div
                    className="h-full bg-gradient-to-r from-[#D6A84F]/80 to-[#D6A84F] transition-all duration-300 rounded-full"
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
                className="w-full text-base py-3 font-bold rounded-xl shadow-xs"
              >
                {searching ? "Finding your photos..." : "Find My Photos"}
              </Button>
            </div>

            <div className="text-center">
              <Link
                to={`/event/${token}`}
                className="text-xs text-[#6B7280] hover:text-[#0B1220] transition-colors"
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
