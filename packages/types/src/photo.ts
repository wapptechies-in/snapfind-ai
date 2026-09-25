export interface Photo {
  id: string;
  eventId?: string;
  event_id?: string;
  filename: string;
  originalFilename?: string;
  original_filename?: string;
  url: string;
  thumbnailUrl?: string;
  thumbnail_url?: string;
  width?: number;
  height?: number;
  fileSize?: number;
  file_size?: number;
  mimeType?: string;
  mime_type?: string;
  faceCount?: number;
  face_count?: number;
  status?: string;
  tags?: string[];
  createdAt?: string;
  created_at?: string;
  uploadedAt?: string;
  matchConfidence?: number;
  folderId?: string | null;
  folder_id?: string | null;
  folderName?: string | null;
  uploadStatus?: "pending" | "uploading" | "uploaded" | "failed";
  processingStatus?: "pending" | "processing" | "completed" | "failed";
  isPublicGallery?: boolean;
  is_public_gallery?: boolean;
}

export interface EventFolder {
  id: string;
  eventId: string;
  name: string;
  photoCount: number;
  createdAt: string;
}

export interface FaceDetection {
  id: string;
  photoId: string;
  boundingBox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  confidence: number;
  embeddingId?: string;
}

export interface PhotoFilter {
  eventId?: string;
  folderId?: string;
  tag?: string;
  search?: string;
  hasFaces?: boolean;
  sortBy?: "newest" | "oldest" | "faces";
  limit?: number;
  offset?: number;
}

