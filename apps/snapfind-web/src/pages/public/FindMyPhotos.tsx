import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { GalleryLayout } from "../../layouts/GalleryLayout";
import { Alert, Button, Card, LoadingSpinner } from "../../components/common";
import { eventsApi, searchApi } from "../../services/api";
import type { SnapEvent } from "../../types";

export default function FindMyPhotos() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [event, setEvent] = useState<SnapEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    async function loadEvent() {
      if (!token) return;
      try {
        const found = await eventsApi.getByToken(token);
        setEvent(found);
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

    try {
      // Simulate frontend AI search processing
      const results = await searchApi.searchBySelfie(token, selectedFile);
      // Store search results in session storage for the results page
      sessionStorage.setItem("snapfind_last_search", JSON.stringify(results));
      navigate(`/event/${token}/results`);
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Could not complete face search. Please try again.";
      setError(msg);
      setSearching(false);
    }
  };

  if (loading) {
    return (
      <GalleryLayout activeAction="search">
        <LoadingSpinner message="Loading search interface..." className="min-h-[60vh]" />
      </GalleryLayout>
    );
  }

  return (
    <GalleryLayout event={event} activeAction="search">
      <div className="flex-1 flex items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-lg space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-white">
              Find My Photos
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400">
              Upload a clear selfie containing only your face to find your photos.
            </p>
          </div>

          {error && <Alert type="error">{error}</Alert>}

          <Card className="p-6 sm:p-8 bg-[#0D1016] border-white/10 space-y-6">
            {/* Upload Area */}
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="user"
                onChange={handleFileChange}
                className="hidden"
                id="selfie-file-input"
              />

              {previewUrl ? (
                <div className="flex flex-col items-center space-y-4">
                  <div className="relative h-44 w-44 rounded-full overflow-hidden border-4 border-violet shadow-2xl bg-zinc-900">
                    <img
                      src={previewUrl}
                      alt="Selfie Preview"
                      className="h-full w-full object-cover"
                    />
                    <div className="absolute inset-0 bg-violet/10 pointer-events-none" />
                  </div>
                  <div className="text-center space-y-1">
                    <p className="text-xs font-semibold text-white truncate max-w-xs">
                      {selectedFile?.name}
                    </p>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-xs text-violet-light hover:text-white transition-colors"
                    >
                      Change photo
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="group flex flex-col items-center justify-center p-8 rounded-2xl border-2 border-dashed border-white/15 hover:border-violet/60 bg-white/[0.02] hover:bg-white/[0.04] transition-all cursor-pointer text-center"
                >
                  <div className="h-16 w-16 rounded-full bg-violet/15 group-hover:bg-violet/25 text-violet-light flex items-center justify-center mb-3 transition-colors">
                    <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                      <circle cx="12" cy="13" r="4" />
                    </svg>
                  </div>
                  <p className="text-sm font-semibold text-white">
                    Tap to upload or take a selfie
                  </p>
                  <p className="text-xs text-zinc-500 mt-1">
                    JPEG, PNG, or WebP up to 10MB
                  </p>
                </div>
              )}
            </div>

            {/* Selfie Tips / Guidelines */}
            <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/5 space-y-2 text-xs text-zinc-400">
              <p className="font-semibold text-zinc-300">Selfie Guidelines:</p>
              <ul className="space-y-1 text-[11px] list-disc list-inside">
                <li>Make sure your face is clearly lit and centered.</li>
                <li>Remove dark sunglasses, masks, or wide-brim hats.</li>
                <li>Ensure only one person is in the selfie frame.</li>
              </ul>
            </div>

            {/* Search Button */}
            <div>
              <Button
                variant="primary"
                size="lg"
                disabled={!selectedFile || searching}
                loading={searching}
                onClick={handleSearch}
                className="w-full text-base py-3 font-semibold rounded-full shadow-lg shadow-violet/25"
              >
                {searching ? "Scanning event photos..." : "Find My Photos"}
              </Button>
            </div>

            <div className="text-center">
              <Link
                to={`/event/${token}`}
                className="text-xs text-zinc-400 hover:text-white transition-colors"
              >
                ← Back to complete event gallery
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </GalleryLayout>
  );
}

