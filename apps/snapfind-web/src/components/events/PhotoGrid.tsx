import React from "react";
import { PhotoCard } from "./PhotoCard";
import { EmptyState } from "../common";
import type { Photo } from "../../types";

interface PhotoGridProps {
  photos: Photo[];
  onPhotoClick: (index: number) => void;
  selectable?: boolean;
  selectedIds?: string[];
  onToggleSelect?: (photoId: string) => void;
  showConfidence?: boolean;
  coverImageUrl?: string | null;
  onSetCover?: (photo: Photo) => void;
  onDeletePhoto?: (photo: Photo) => void;
  onToggleGalleryVisibility?: (photo: Photo) => void;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyActionLabel?: string;
  onEmptyAction?: () => void;
  columns?: string;
}

export const PhotoGrid: React.FC<PhotoGridProps> = ({
  photos,
  onPhotoClick,
  selectable = false,
  selectedIds = [],
  onToggleSelect,
  showConfidence = false,
  coverImageUrl,
  onSetCover,
  onDeletePhoto,
  onToggleGalleryVisibility,
  emptyTitle = "No photos found",
  emptyDescription = "No photos match your current selection or search criteria.",
  emptyActionLabel,
  onEmptyAction,
  columns = "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5",
}) => {
  if (photos.length === 0) {
    return (
      <EmptyState
        title={emptyTitle}
        description={emptyDescription}
        actionLabel={emptyActionLabel}
        onAction={onEmptyAction}
      />
    );
  }

  return (
    <div className={`grid ${columns} gap-3.5 sm:gap-4`}>
      {photos.map((photo, index) => {
        // Check if photo URL or webUrl matches event cover
        const isCover =
          !!coverImageUrl &&
          (photo.url === coverImageUrl ||
            photo.thumbnailUrl === coverImageUrl ||
            (coverImageUrl.includes(photo.id)));

        return (
          <PhotoCard
            key={photo.id}
            photo={photo}
            onClick={() => onPhotoClick(index)}
            selectable={selectable}
            selected={selectedIds.includes(photo.id)}
            onToggleSelect={onToggleSelect}
            showConfidence={showConfidence}
            isCover={isCover}
            onSetCover={onSetCover}
            onDelete={onDeletePhoto}
            onToggleGalleryVisibility={onToggleGalleryVisibility}
          />
        );
      })}
    </div>
  );
};
