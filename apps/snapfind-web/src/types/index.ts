/**
 * SnapFind Web Application — Core Domain Types
 * Phase 3: Frontend Foundation & Architecture
 */

export type EventType =
  | "Wedding"
  | "Marriage"
  | "Birthday"
  | "Sports"
  | "Family"
  | "Corporate"
  | "College/School"
  | "Candid"
  | "Nature"
  | "Other";

export type EventStatus =
  | "Active"
  | "Processing"
  | "Draft"
  | "Expired"
  | "Archived"
  | "active"
  | "processing"
  | "completed";

export interface DashboardSummary {
  totalEvents: number;
  totalPhotos: number;
  activeEvents: number;
  photoSearches: number;
  downloads: number;
}

export interface EventSettings {
  galleryVisibility: boolean;
  faceSearch: boolean;
  downloads: boolean;
  originalDownloads: boolean;
  watermark: boolean;
  eventExpiry: boolean;
  expiryDate?: string;
}

export interface Photo {
  id: string;
  eventId: string;
  filename: string;
  originalFilename?: string;
  url: string;
  thumbnailUrl: string;
  width?: number;
  height?: number;
  fileSize?: number;
  mimeType?: string;
  uploadStatus?: "pending" | "uploading" | "uploaded" | "failed";
  processingStatus?: "pending" | "processing" | "completed" | "failed";
  uploadedAt: string;
  matchConfidence?: number; // 0 to 100 percentage for selfie search
}

export interface SnapEvent {
  id: string;
  token: string; // Public QR short code / token (e.g. "ABC123", "WED2026")
  name: string;
  eventType: EventType;
  date: string; // YYYY-MM-DD
  location: string;
  description: string;
  coverImage: string;
  status: EventStatus;
  photoCount: number;
  photos?: number; // legacy alias
  galleryViews: number;
  searches: number;
  downloads: number;
  createdAt: string;
  settings: EventSettings;
}

export interface ProcessingStage {
  name: string;
  status: "Completed" | "Processing" | "Waiting" | "Failed";
  detail?: string;
}

export interface ProcessingJob {
  eventId: string;
  totalPhotos: number;
  processed: number;
  remaining: number;
  progressPercent: number;
  currentStage: string;
  stages: ProcessingStage[];
}

export interface DashboardStats {
  totalEvents: number;
  totalPhotos: number;
  activeEvents: number;
  processingJobs: number;
  galleryViews: number;
  photoSearches: number;
  downloads: number;
}

export interface SearchResult {
  token: string;
  selfiePreviewUrl?: string;
  totalMatches: number;
  strongMatches: Photo[];
  possibleMatches: Photo[];
}

// User / Auth representation
export interface User {
  id: string;
  email: string;
  studio_name: string;
  created_at: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}
