import React, { useCallback, useEffect, useState } from "react";
import type { Photo } from "../../types";

interface PhotoViewerProps {
  photos: Photo[];
  currentIndex: number;
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (newIndex: number) => void;
  onDownload?: (photo: Photo) => void;
}

export const PhotoViewer: React.FC<PhotoViewerProps> = ({
  photos,
  currentIndex,
  isOpen,
  onClose,
  onNavigate,
  onDownload,
}) => {
  const [downloadNotice, setDownloadNotice] = useState<string | null>(null);

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

  const handleDownload = () => {
    if (onDownload) {
      onDownload(currentPhoto);
    } else {
      setDownloadNotice(`Downloading ${currentPhoto.filename}... (MOCK)`);
      setTimeout(() => setDownloadNotice(null), 2500);
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
          {downloadNotice && (
            <span className="text-xs text-good font-medium animate-fade-in bg-good/15 border border-good/30 px-2.5 py-1 rounded-md">
              {downloadNotice}
            </span>
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
            src={currentPhoto.url}
            alt={currentPhoto.filename}
            className="max-h-[82vh] max-w-[92vw] object-contain rounded-lg shadow-2xl transition-opacity duration-200"
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
          <span>Uploaded: {new Date(currentPhoto.uploadedAt).toLocaleDateString()}</span>
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
