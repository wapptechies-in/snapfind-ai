import React, { useCallback, useEffect, useState } from "react";
import type { Photo } from "../../types";

interface PhotoViewerProps {
  photos: Photo[];
  currentIndex: number;
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (newIndex: number) => void;
  onDownload?: (photo: Photo) => void;
  onDelete?: (photo: Photo) => Promise<void> | void;
  onSetCover?: (photo: Photo) => Promise<void> | void;
  isCover?: boolean;
  isFavorite?: boolean;
  onToggleFavorite?: (photo: Photo) => void;
}

export const PhotoViewer: React.FC<PhotoViewerProps> = ({
  photos,
  currentIndex,
  isOpen,
  onClose,
  onNavigate,
  onDownload,
  onDelete,
  onSetCover,
  isCover,
  isFavorite,
  onToggleFavorite,
}) => {
  const [downloadNotice, setDownloadNotice] = useState<string | null>(null);
  const [coverNotice, setCoverNotice] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handlePrev = useCallback(() => {
    onNavigate((currentIndex - 1 + photos.length) % photos.length);
  }, [currentIndex, onNavigate, photos.length]);

  const handleNext = useCallback(() => {
    onNavigate((currentIndex + 1) % photos.length);
  }, [currentIndex, onNavigate, photos.length]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") handlePrev();
      if (e.key === "ArrowRight") handleNext();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose, handlePrev, handleNext]);

  if (!isOpen || photos.length === 0) return null;

  const currentPhoto = photos[currentIndex] || photos[0];
  const initialImg = currentPhoto?.url || currentPhoto?.thumbnailUrl || (currentPhoto as any)?.thumbnail_url;
  const [currentImgSrc, setCurrentImgSrc] = useState(initialImg);

  useEffect(() => {
    const src = currentPhoto?.url || currentPhoto?.thumbnailUrl || (currentPhoto as any)?.thumbnail_url;
    setCurrentImgSrc(src);
  }, [currentPhoto]);

  const handleDownload = () => {
    if (onDownload) {
      onDownload(currentPhoto);
    } else {
      setDownloadNotice(`Downloading ${currentPhoto.filename}... (MOCK)`);
      setTimeout(() => setDownloadNotice(null), 2500);
    }
  };

  const handleDelete = async () => {
    if (!onDelete) return;
    setIsDeleting(true);
    try {
      await onDelete(currentPhoto);
      setShowDeleteConfirm(false);
    } catch {
      // Handled by parent
    } finally {
      setIsDeleting(false);
    }
  };

  const handleMakeCover = async () => {
    if (!onSetCover) return;
    try {
      await onSetCover(currentPhoto);
      setCoverNotice("Set as Event Cover! ★");
      setTimeout(() => setCoverNotice(null), 3000);
    } catch {
      setCoverNotice("Failed to update cover.");
      setTimeout(() => setCoverNotice(null), 3000);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-black/95 text-white backdrop-blur-md select-none animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-label={`Photo viewer for ${currentPhoto.filename}`}
    >
      {/* Top Header Controls */}
      <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-b from-black/80 to-transparent z-10">
        <div className="flex items-center gap-3">
          <span className="text-xs text-zinc-400 font-mono">
            {currentIndex + 1} / {photos.length}
          </span>
          <span className="text-sm font-medium text-zinc-200 truncate max-w-xs md:max-w-md">
            {currentPhoto.filename}
          </span>
          {isCover && (
            <span className="rounded-full px-2 py-0.5 text-xs font-semibold bg-violet/30 text-violet-light border border-violet/40">
              ★ Cover
            </span>
          )}
          {currentPhoto.matchConfidence !== undefined && (
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-semibold border ${
                currentPhoto.matchConfidence >= 85
                  ? "bg-good/20 text-good border-good/30"
                  : "bg-amber-500/20 text-amber-300 border-amber-500/30"
              }`}
            >
              {currentPhoto.matchConfidence}% match
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          {coverNotice && (
            <span className="text-xs text-violet-light font-medium animate-fade-in bg-violet/20 border border-violet/40 px-2.5 py-1 rounded-md">
              {coverNotice}
            </span>
          )}
          {downloadNotice && (
            <span className="text-xs text-good font-medium animate-fade-in bg-good/15 border border-good/30 px-2.5 py-1 rounded-md">
              {downloadNotice}
            </span>
          )}

          {/* Favorite Button */}
          {onToggleFavorite && (
            <button
              onClick={() => onToggleFavorite(currentPhoto)}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all focus:outline-none ${
                isFavorite
                  ? "bg-rose-500/20 text-rose-400 border border-rose-500/40 hover:bg-rose-500/30"
                  : "bg-white/10 hover:bg-white/20 text-zinc-300 hover:text-white border border-white/15"
              }`}
              title={isFavorite ? "Remove from Favorites" : "Add to Favorites"}
            >
              <svg
                className={`h-4 w-4 ${isFavorite ? "fill-rose-500 text-rose-500" : "fill-none text-current"}`}
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                />
              </svg>
              <span className="hidden sm:inline">{isFavorite ? "Favorited" : "Favorite"}</span>
            </button>
          )}

          {/* Set as Event Cover Button */}
          {onSetCover && (
            <button
              onClick={handleMakeCover}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all focus:outline-none ${
                isCover
                  ? "bg-violet text-white ring-1 ring-violet/50 cursor-default"
                  : "bg-white/10 hover:bg-violet/40 text-zinc-200 hover:text-white border border-white/15"
              }`}
              title="Set this photo as the event's cover image"
            >
              <span>★</span>
              <span className="hidden sm:inline">{isCover ? "Cover Photo" : "Set as Cover"}</span>
            </button>
          )}

          <button
            onClick={handleDownload}
            className="flex items-center gap-2 rounded-lg bg-white/10 hover:bg-white/20 px-3.5 py-1.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-white/40"
            title="Download high-resolution image"
            aria-label="Download image"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            <span className="hidden sm:inline">Download</span>
          </button>

          {/* Permanent Delete Action */}
          {onDelete && (
            <div className="relative">
              {!showDeleteConfirm ? (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="flex items-center gap-1.5 rounded-lg bg-red-500/15 hover:bg-red-500/30 text-red-400 border border-red-500/30 px-3 py-1.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-red-500/50"
                  title="Delete this photo permanently"
                  aria-label="Delete photo"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  <span className="hidden sm:inline">Delete</span>
                </button>
              ) : (
                <div className="flex items-center gap-1.5 bg-red-950/90 border border-red-500/50 rounded-lg p-1 animate-fade-in shadow-xl">
                  <span className="text-[11px] text-red-200 px-2 font-medium">Permanently delete?</span>
                  <button
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="px-2 py-1 rounded bg-red-600 hover:bg-red-500 text-white text-[11px] font-bold transition-all active:scale-95"
                  >
                    {isDeleting ? "..." : "Delete"}
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[11px] transition-all"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          )}

          <button
            onClick={onClose}
            className="rounded-lg p-2 text-zinc-400 hover:text-white hover:bg-white/10 transition-colors focus:outline-none focus:ring-2 focus:ring-white/40"
            title="Close viewer (Esc)"
            aria-label="Close photo viewer"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Main Image Area with Prev/Next buttons */}
      <div className="relative flex-1 flex items-center justify-center p-4">
        {/* Previous Button */}
        {photos.length > 1 && (
          <button
            onClick={handlePrev}
            className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/50 text-white/75 hover:text-white hover:bg-black/80 transition-all z-10 focus:outline-none focus:ring-2 focus:ring-white/40"
            aria-label="Previous photo"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        )}

        {/* The Photo */}
        <div className="max-h-full max-w-full flex items-center justify-center">
          <img
            src={currentImgSrc}
            alt={currentPhoto.filename}
            className="max-h-[82vh] max-w-[92vw] object-contain rounded-lg shadow-2xl transition-opacity duration-200"
            onError={() => {
              if (currentPhoto.thumbnailUrl && currentImgSrc !== currentPhoto.thumbnailUrl) {
                setCurrentImgSrc(currentPhoto.thumbnailUrl);
              }
            }}
          />
        </div>

        {/* Next Button */}
        {photos.length > 1 && (
          <button
            onClick={handleNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/50 text-white/75 hover:text-white hover:bg-black/80 transition-all z-10 focus:outline-none focus:ring-2 focus:ring-white/40"
            aria-label="Next photo"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        )}
      </div>

      {/* Bottom Info Bar */}
      <div className="px-6 py-3 bg-gradient-to-t from-black/80 to-transparent flex items-center justify-between text-xs text-zinc-400">
        <div className="flex items-center gap-4">
          <span>Dimensions: {currentPhoto.width || 1600} × {currentPhoto.height || 1067}</span>
          <span>Uploaded: {new Date(currentPhoto.uploadedAt || currentPhoto.createdAt || Date.now()).toLocaleDateString()}</span>
        </div>
        <div className="hidden sm:flex items-center gap-2 text-[11px] text-zinc-500">
          <span>Use</span>
          <kbd className="px-1.5 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-zinc-300">←</kbd>
          <kbd className="px-1.5 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-zinc-300">→</kbd>
          <span>to navigate,</span>
          <kbd className="px-1.5 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-zinc-300">Esc</kbd>
          <span>to close</span>
        </div>
      </div>
    </div>
  );
};
