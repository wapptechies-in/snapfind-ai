import React from "react";
import type { Photo } from "../../types";

interface PhotoCardProps {
  photo: Photo;
  onClick?: () => void;
  selectable?: boolean;
  selected?: boolean;
  onToggleSelect?: (photoId: string) => void;
  showConfidence?: boolean;
  aspectRatio?: "3/2" | "4/3" | "square";
}

export const PhotoCard: React.FC<PhotoCardProps> = ({
  photo,
  onClick,
  selectable = false,
  selected = false,
  onToggleSelect,
  showConfidence = false,
  aspectRatio = "4/3",
}) => {
  const aspectClass =
    aspectRatio === "3/2"
      ? "aspect-[3/2]"
      : aspectRatio === "square"
      ? "aspect-square"
      : "aspect-[4/3]";

  return (
    <div
      onClick={onClick}
      className={`group relative ${aspectClass} rounded-xl overflow-hidden bg-panel2 border transition-all cursor-pointer shadow-md select-none ${
        selected
          ? "border-violet ring-2 ring-violet/40"
          : "border-hairline hover:border-violet/50"
      }`}
    >
      <img
        src={photo.thumbnailUrl}
        alt={photo.filename}
        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        loading="lazy"
      />

      {/* Select Checkbox (if enabled) */}
      {selectable && (
        <button
          type="button"
          aria-label={`Select ${photo.filename}`}
          onClick={(e) => {
            e.stopPropagation();
            if (onToggleSelect) onToggleSelect(photo.id);
          }}
          className={`absolute top-2.5 right-2.5 h-6 w-6 rounded-md border flex items-center justify-center transition-all z-10 ${
            selected
              ? "bg-violet border-violet text-white"
              : "bg-black/60 border-white/20 hover:bg-black/80 text-transparent"
          }`}
        >
          <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
            <path d="M5 13l4 4L19 7" />
          </svg>
        </button>
      )}

      {/* Match Confidence Badge */}
      {showConfidence && photo.matchConfidence !== undefined && (
        <div className="absolute top-2.5 left-2.5 z-10">
          <span
            className={`rounded-md px-2 py-0.5 text-[10px] font-bold backdrop-blur-sm border shadow-sm ${
              photo.matchConfidence >= 85
                ? "bg-black/75 border-good/40 text-good"
                : "bg-black/75 border-amber-500/40 text-amber-300"
            }`}
          >
            {photo.matchConfidence}% match
          </span>
        </div>
      )}

      {/* Bottom overlay filename label */}
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-between p-2.5">
        <span className="text-[11px] text-zinc-200 truncate font-mono">
          {photo.filename}
        </span>
        <span className="text-[10px] text-violet-light font-medium shrink-0 ml-1">
          View
        </span>
      </div>
    </div>
  );
};

