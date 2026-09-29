import React, { useCallback, useEffect, useState } from "react";
import type { Photo } from "../types";

interface PhotoViewerProps {
  photos: Photo[];
  currentIndex?: number;
  initialIndex?: number;
  isOpen?: boolean;
  onClose: () => void;
  onNavigate?: (newIdx: number) => void;
  onDownload?: (photo: Photo) => void;
  onDelete?: (photo: Photo) => Promise<void>;
}

export const PhotoViewer: React.FC<PhotoViewerProps> = ({
  photos,
  currentIndex: controlledIndex,
  initialIndex = 0,
  isOpen = true,
  onClose,
  onNavigate,
  onDownload,
  onDelete,
}) => {
  const [internalIndex, setInternalIndex] = useState(initialIndex);
  const activeIndex = controlledIndex !== undefined ? controlledIndex : internalIndex;
  const [isDeleting, setIsDeleting] = useState(false);

  const currentPhoto = photos[activeIndex];

  const handlePrev = useCallback(() => {
    const nextIdx = activeIndex > 0 ? activeIndex - 1 : photos.length - 1;
    setInternalIndex(nextIdx);
    onNavigate?.(nextIdx);
  }, [activeIndex, photos.length, onNavigate]);

  const handleNext = useCallback(() => {
    const nextIdx = activeIndex < photos.length - 1 ? activeIndex + 1 : 0;
    setInternalIndex(nextIdx);
    onNavigate?.(nextIdx);
  }, [activeIndex, photos.length, onNavigate]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") handlePrev();
      if (e.key === "ArrowRight") handleNext();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleNext, handlePrev, onClose]);

  if (!isOpen || !currentPhoto) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-midnight/95 select-none animate-fade-in">
      {/* Top Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-panel/90 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <p className="text-sm font-semibold text-soft-white truncate max-w-sm">
            {currentPhoto.filename}
          </p>
          <span className="text-xs font-mono text-muted">
            {activeIndex + 1} / {photos.length}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {onDownload && (
            <button
              onClick={() => onDownload(currentPhoto)}
              className="p-2 rounded-lg bg-midnight text-muted hover:text-gold hover:border-gold/30 border border-slate-700 transition-colors cursor-pointer"
              title="Download photo"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
            </button>
          )}

          {onDelete && (
            <button
              disabled={isDeleting}
              onClick={async () => {
                if (window.confirm("Delete this photo?")) {
                  setIsDeleting(true);
                  try {
                    await onDelete(currentPhoto);
                  } finally {
                    setIsDeleting(false);
                  }
                }
              }}
              className="p-2 rounded-lg bg-coral/10 text-coral hover:bg-coral/20 border border-coral/30 transition-colors cursor-pointer"
              title="Delete photo"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              </svg>
            </button>
          )}

          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-midnight text-muted hover:text-soft-white border border-slate-700 transition-colors cursor-pointer text-base leading-none"
            title="Close viewer (Esc)"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Main Preview */}
      <div className="relative flex-1 flex items-center justify-center p-4 overflow-hidden">
        {photos.length > 1 && (
          <button
            onClick={handlePrev}
            className="absolute left-6 z-10 p-3 rounded-full bg-slate-panel/80 hover:bg-slate-panel text-soft-white hover:text-gold transition-all cursor-pointer backdrop-blur-sm border border-slate-700 hover:scale-105 active:scale-95"
            title="Previous (Left Arrow)"
          >
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
        )}

        <img
          src={currentPhoto.url || currentPhoto.thumbnailUrl}
          alt={currentPhoto.filename}
          className="max-h-full max-w-full object-contain rounded-lg shadow-2xl transition-transform duration-200"
        />

        {photos.length > 1 && (
          <button
            onClick={handleNext}
            className="absolute right-6 z-10 p-3 rounded-full bg-slate-panel/80 hover:bg-slate-panel text-soft-white hover:text-gold transition-all cursor-pointer backdrop-blur-sm border border-slate-700 hover:scale-105 active:scale-95"
            title="Next (Right Arrow)"
          >
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        )}
      </div>

      {/* Bottom Info */}
      <div className="px-6 py-3 border-t border-slate-800 bg-slate-panel/90 flex items-center justify-between text-xs text-muted">
        <span>Uploaded to cloud storage</span>
        <span>Keyboard: ← / → Navigate, Esc Close</span>
      </div>
    </div>
  );
};
