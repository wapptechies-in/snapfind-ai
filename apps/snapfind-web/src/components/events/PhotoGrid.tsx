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
      {photos.map((photo, index) => (
        <PhotoCard
          key={photo.id}
          photo={photo}
          onClick={() => onPhotoClick(index)}
          selectable={selectable}
          selected={selectedIds.includes(photo.id)}
          onToggleSelect={onToggleSelect}
          showConfidence={showConfidence}
        />
      ))}
    </div>
  );
};

