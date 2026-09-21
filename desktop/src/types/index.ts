/**
 * TypeScript Interfaces for SnapFind Desktop.
 * Status: IMPLEMENTED (Phase 8)
 */

export interface User {
  id: string;
  email: string;
  studio_name: string;
  created_at: string;
}

export interface Photographer {
  id: string;
  name: string;
  email: string;
  slug: string;
}

export interface SnapEvent {
  id: string;
  name: string;
  slug: string;
  date: string;
  location: string;
  cover_image_url?: string;
  photo_count: number;
  public_token: string;
  status: "Draft" | "Active" | "Archived" | "Processing";
}

export interface LocalScannedFile {
  filename: string;
  path: string;
  size: number;
  extension: string;
  modifiedTime: number;
  checksum?: string;
  isSupported: boolean;
  isDuplicate?: boolean;
}

export interface ScanProgress {
  scanned: number;
  supported: number;
  unsupported: number;
  duplicates: number;
  ready: number;
  totalBytes: number;
  currentFile?: string;
}

export interface ScanResult {
  folderPath: string;
  folderName: string;
  totalFiles: number;
  supportedCount: number;
  unsupportedCount: number;
  duplicateCount: number;
  readyCount: number;
  totalBytes: number;
  files: LocalScannedFile[];
}

export interface DesktopAPI {
  openFolderDialog: () => Promise<string | null>;
  scanFolder: (
    folderPath: string,
    onProgress?: (progress: ScanProgress) => void
  ) => Promise<ScanResult>;
  cancelScan: () => Promise<void>;
  uploadBinaryStream: (
    filePath: string,
    uploadUrl: string,
    contentType: string,
    headers?: Record<string, string>,
    onProgress?: (sent: number, total: number) => void
  ) => Promise<{ success: boolean; error?: string }>;
  saveUploadSession: (sessionData: Record<string, unknown>) => Promise<boolean>;
  loadUploadSession: (sessionId: string) => Promise<Record<string, unknown> | null>;
  listUploadSessions: () => Promise<Record<string, unknown>[]>;
  deleteUploadSession: (sessionId: string) => Promise<boolean>;
  openExternal: (url: string) => Promise<void>;
  log: (level: string, message: string) => Promise<void>;
  getLogs: () => Promise<string[]>;
  getPlatform: () => Promise<string>;
  getVersion: () => Promise<string>;
}

export interface UploadQueueItem {
  id: string; // unique local ID
  photoId?: string; // assigned by backend
  filename: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  checksum?: string;
  status: "pending" | "uploading" | "uploaded" | "failed" | "cancelled";
  progressPercent: number;
  bytesUploaded: number;
  uploadUrl?: string;
  storageKey?: string;
  errorMessage?: string;
  retryCount: number;
}

export interface LocalUploadSession {
  id: string;
  eventId: string;
  eventName: string;
  folderPath: string;
  status: "active" | "completed" | "paused" | "cancelled";
  totalFiles: number;
  uploadedFiles: number;
  failedFiles: number;
  totalBytes: number;
  bytesUploaded: number;
  createdAt: string;
  updatedAt: string;
  items: UploadQueueItem[];
}

export interface ProcessingStage {
  name: string;
  status: "Completed" | "Processing" | "Waiting" | "Failed";
  detail?: string;
}

export interface ProcessingStatus {
  eventId: string;
  status: string;
  totalPhotos: number;
  processed: number;
  remaining: number;
  failed: number;
  progressPercent: number;
  currentStage: string;
  stages: ProcessingStage[];
}

export interface AppSettings {
  apiBaseUrl: string;
  concurrency: number; // 1 to 8
  autoStartProcessing: boolean;
}
