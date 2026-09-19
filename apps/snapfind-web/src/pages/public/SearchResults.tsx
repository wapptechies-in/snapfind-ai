import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { GalleryLayout } from "../../layouts/GalleryLayout";
import { Alert, Button, Card, LoadingSpinner } from "../../components/common";
import { PhotoViewer } from "../../components/viewer/PhotoViewer";
import { eventsApi } from "../../services/api";
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

  useEffect(() => {
    async function loadResults() {
      if (!token) return;
      setLoading(true);
      try {
        const eventData = await eventsApi.getByToken(token);
        setEvent(eventData);

        // Retrieve search result from session storage
        const saved = sessionStorage.getItem("snapfind_last_search");
        if (saved) {
          const parsed = JSON.parse(saved);
          setResults(parsed);
          // Default select all strong matches
          setSelectedIds(parsed.strongMatches.map((p: Photo) => p.id));
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

  const allPhotos = [...results.strongMatches, ...results.possibleMatches];

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

  const handleDownloadSelected = () => {
    if (selectedIds.length === 0) return;
    setToast(`Downloading ${selectedIds.length} selected photos in high resolution... (MOCK)`);
    setTimeout(() => setToast(null), 3500);
  };

  return (
    <GalleryLayout event={event} activeAction="results">
      <div className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-8 py-8 space-y-8">
        {toast && <Alert type="success" onClose={() => setToast(null)}>{toast}</Alert>}

        {/* Results Hero Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-good/15 text-good px-3 py-0.5 text-xs font-semibold mb-2">
              <span>✓</span>
              <span>Search Complete</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-white">
              We found {results.totalMatches} possible matches
            </h1>
            <p className="text-xs text-zinc-400 mt-1">
              Based on facial similarity matching from your uploaded selfie
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link to={`/event/${token}/search`}>
              <Button size="sm" variant="secondary" className="border-white/10 text-xs">
                Take another selfie
              </Button>
            </Link>
            <Link to={`/event/${token}`}>
              <Button size="sm" variant="outline" className="border-white/10 text-xs">
                Full Gallery
              </Button>
            </Link>
          </div>
        </div>

        {/* Batch Actions Bar */}
        <Card className="p-4 bg-[#0D1016] border-white/10 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={handleSelectAll}
              className="text-xs font-medium text-violet-light hover:text-white transition-colors"
            >
              {selectedIds.length === allPhotos.length ? "Deselect All" : "Select All"}
            </button>
            <span className="text-zinc-600">•</span>
            <span className="text-xs text-zinc-400">
              <strong className="text-white">{selectedIds.length}</strong> of {allPhotos.length} selected
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="primary"
              disabled={selectedIds.length === 0}
              onClick={handleDownloadSelected}
              className="gap-2 text-xs"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Download Selected ({selectedIds.length})
            </Button>
          </div>
        </Card>

        {/* Section 1: Strong Matches */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold text-white">Strong Matches</h2>
            <span className="rounded-full bg-good/15 text-good border border-good/30 px-2 py-0.5 text-[11px] font-semibold">
              High Confidence (85%+)
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5">
            {results.strongMatches.map((photo) => {
              const isSelected = selectedIds.includes(photo.id);
              const globalIdx = allPhotos.findIndex((p) => p.id === photo.id);

              return (
                <div
                  key={photo.id}
                  className={`group relative aspect-[4/3] rounded-xl overflow-hidden bg-zinc-900 border transition-all cursor-pointer shadow-lg ${
                    isSelected ? "border-violet ring-2 ring-violet/40" : "border-white/10 hover:border-white/30"
                  }`}
                >
                  <img
                    src={photo.thumbnailUrl}
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
                    className="absolute top-2.5 right-2.5 h-6 w-6 rounded-md bg-black/60 border border-white/20 flex items-center justify-center cursor-pointer transition-colors hover:bg-black/80"
                  >
                    {isSelected && (
                      <span className="text-xs font-bold text-violet-light">✓</span>
                    )}
                  </div>

                  {/* Match Confidence Badge */}
                  <div className="absolute top-2.5 left-2.5">
                    <span className="rounded-md bg-black/75 backdrop-blur-sm border border-good/40 text-good px-2 py-0.5 text-[10px] font-bold">
                      {photo.matchConfidence}% match
                    </span>
                  </div>

                  <div
                    onClick={() => setViewerIndex(globalIdx)}
                    className="absolute inset-x-0 bottom-0 p-2.5 bg-gradient-to-t from-black/80 to-transparent flex items-end justify-between text-[11px] text-zinc-300"
                  >
                    <span className="truncate">{photo.filename}</span>
                    <span className="text-violet-light font-medium text-[10px]">View</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Section 2: Possible Matches */}
        <div className="space-y-4 pt-4 border-t border-white/10">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold text-white">Possible Matches</h2>
            <span className="rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 px-2 py-0.5 text-[11px] font-semibold">
              Moderate Confidence
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5">
            {results.possibleMatches.map((photo) => {
              const isSelected = selectedIds.includes(photo.id);
              const globalIdx = allPhotos.findIndex((p) => p.id === photo.id);

              return (
                <div
                  key={photo.id}
                  className={`group relative aspect-[4/3] rounded-xl overflow-hidden bg-zinc-900 border transition-all cursor-pointer shadow-lg ${
                    isSelected ? "border-violet ring-2 ring-violet/40" : "border-white/10 hover:border-white/30"
                  }`}
                >
                  <img
                    src={photo.thumbnailUrl}
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
                    className="absolute top-2.5 right-2.5 h-6 w-6 rounded-md bg-black/60 border border-white/20 flex items-center justify-center cursor-pointer transition-colors hover:bg-black/80"
                  >
                    {isSelected && (
                      <span className="text-xs font-bold text-violet-light">✓</span>
                    )}
                  </div>

                  {/* Match Confidence Badge */}
                  <div className="absolute top-2.5 left-2.5">
                    <span className="rounded-md bg-black/75 backdrop-blur-sm border border-amber-500/40 text-amber-300 px-2 py-0.5 text-[10px] font-bold">
                      {photo.matchConfidence}% match
                    </span>
                  </div>

                  <div
                    onClick={() => setViewerIndex(globalIdx)}
                    className="absolute inset-x-0 bottom-0 p-2.5 bg-gradient-to-t from-black/80 to-transparent flex items-end justify-between text-[11px] text-zinc-300"
                  >
                    <span className="truncate">{photo.filename}</span>
                    <span className="text-violet-light font-medium text-[10px]">View</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
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

