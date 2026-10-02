import React from "react";
import type { Photo } from "../../types";

interface PhotoCardProps {
  photo: Photo;
  onClick?: () => void;
  selectable?: boolean;
  selected?: boolean;
  onToggleSelect?: (photoId: string) => void;
  showConfidence?: boolean;
  isCover?: boolean;
  onSetCover?: (photo: Photo) => void;
  onDelete?: (photo: Photo) => void;
  onToggleGalleryVisibility?: (photo: Photo) => void;
  aspectRatio?: "3/2" | "4/3" | "square";
}

export const PhotoCard: React.FC<PhotoCardProps> = ({
  photo,
  onClick,
  selectable = false,
  selected = false,
  onToggleSelect,
  showConfidence = false,
  isCover = false,
  onSetCover,
  onDelete,
  onToggleGalleryVisibility,
  aspectRatio = "4/3",
}) => {
  const isPublic = Boolean(photo.isPublicGallery || photo.is_public_gallery);
  const aspectClass =
    aspectRatio === "3/2"
      ? "aspect-[3/2]"
      : aspectRatio === "square"
      ? "aspect-square"
      : "aspect-[4/3]";

  const initialSrc = photo.thumbnailUrl || (photo as any).thumbnail_url || photo.url;
  const [imgSrc, setImgSrc] = React.useState(initialSrc);
  const [loadFailed, setLoadFailed] = React.useState(!initialSrc);

  React.useEffect(() => {
    const src = photo.thumbnailUrl || (photo as any).thumbnail_url || photo.url;
    setImgSrc(src);
    setLoadFailed(!src);
  }, [photo.thumbnailUrl, (photo as any).thumbnail_url, photo.url]);

  const handleImageError = () => {
    if (photo.url && imgSrc !== photo.url) {
      setImgSrc(photo.url);
    } else {
      setLoadFailed(true);
    }
  };

  return (
    <div
      onClick={onClick}
      className={`group relative ${aspectClass} rounded-xl overflow-hidden bg-panel2 border transition-all cursor-pointer shadow-md select-none ${
        selected
          ? "border-violet ring-2 ring-violet/50 shadow-violet/10"
          : "border-hairline hover:border-violet/40 hover:shadow-lg hover:shadow-black/40"
      }`}
    >
      {!loadFailed && imgSrc ? (
        <img
          src={imgSrc}
          alt={photo.filename}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
          onError={handleImageError}
        />
      ) : (
        <div className="h-full w-full flex flex-col items-center justify-center bg-slate-900/80 p-3 text-center border border-slate-800">
          <svg className="w-8 h-8 text-gold/40 mb-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span className="text-[11px] font-mono text-slate-300 max-w-full truncate px-1" title={photo.filename}>
            {photo.filename}
          </span>
        </div>
      )}

      {/* Select Checkbox (always clickable or hoverable) */}
      <button
        type="button"
        aria-label={`Select ${photo.filename}`}
        onClick={(e) => {
          e.stopPropagation();
          if (onToggleSelect) onToggleSelect(photo.id);
        }}
        className={`absolute top-2.5 right-2.5 h-6 w-6 rounded-md border flex items-center justify-center transition-all z-10 ${
          selected
            ? "bg-violet border-violet text-white shadow-md scale-105"
            : selectable
            ? "bg-black/60 border-white/30 text-transparent hover:border-white hover:bg-black/80"
            : "opacity-0 group-hover:opacity-100 bg-black/60 border-white/30 text-transparent hover:border-white hover:bg-black/80"
        }`}
      >
        <svg className={`h-3.5 w-3.5 ${selected ? "text-white" : "text-transparent"}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
          <path d="M5 13l4 4L19 7" />
        </svg>
      </button>

      {/* Badges container in top-left */}
      <div className="absolute top-2.5 left-2.5 z-10 flex flex-col gap-1 items-start">
        {/* Cover Photo Badge */}
        {isCover && (
          <span className="rounded-md px-2 py-0.5 text-[10px] font-bold backdrop-blur-md border shadow-sm bg-violet/90 border-violet text-white flex items-center gap-1">
            <span>★</span> Cover
          </span>
        )}

        {/* Public Gallery Badge */}
        {isPublic && (
          <span className="rounded-md px-2 py-0.5 text-[10px] font-bold backdrop-blur-md border shadow-sm bg-emerald-600/90 border-emerald-500 text-white flex items-center gap-1">
            <span>🌐</span> Public
          </span>
        )}

        {/* Match Confidence Badge */}
        {showConfidence && photo.matchConfidence !== undefined && (
          <span
            className={`rounded-md px-2 py-0.5 text-[10px] font-bold backdrop-blur-sm border shadow-sm ${
              photo.matchConfidence >= 85
                ? "bg-black/75 border-good/40 text-good"
                : "bg-black/75 border-amber-500/40 text-amber-300"
            }`}
          >
            {photo.matchConfidence}% match
          </span>
        )}
      </div>

      {/* Quick Action overlay buttons on hover */}
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-between p-2.5">
        <span className="text-[11px] text-zinc-200 truncate font-mono max-w-[130px]">
          {photo.filename}
        </span>

        <div className="flex items-center gap-1.5 shrink-0 ml-1">
          {onToggleGalleryVisibility && (
            <button
              type="button"
              title={
                isPublic
                  ? "Remove from Customer Public Gallery"
                  : "Show in Customer Public Gallery"
              }
              onClick={(e) => {
                e.stopPropagation();
                onToggleGalleryVisibility(photo);
              }}
              className={`px-1.5 py-0.5 rounded text-[10px] font-semibold border transition-all ${
                isPublic
                  ? "bg-emerald-600/80 hover:bg-red-600/80 text-white border-emerald-400"
                  : "bg-black/60 hover:bg-emerald-600/90 text-zinc-300 hover:text-white border-white/20"
              }`}
            >
              {isPublic ? "🌐 Public" : "+ Public"}
            </button>
          )}

          {onSetCover && !isCover && (
            <button
              type="button"
              title="Set as Event Cover"
              onClick={(e) => {
                e.stopPropagation();
                onSetCover(photo);
              }}
              className="p-1 rounded bg-black/60 hover:bg-violet text-white/80 hover:text-white border border-white/20 text-[10px] transition-all"
            >
              ★ Cover
            </button>
          )}

          {onDelete && (
            <button
              type="button"
              title="Delete Photo"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(photo);
              }}
              className="p-1 rounded bg-black/60 hover:bg-red-600 text-white/80 hover:text-white border border-white/20 transition-all"
            >
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}

          <span className="text-[10px] text-violet-light font-medium px-1">
            View
          </span>
        </div>
      </div>
    </div>
  );
};
