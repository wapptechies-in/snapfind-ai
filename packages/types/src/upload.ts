export interface LocalScannedFile {
  filename: string;
  path: string;
  size: number;
  extension: string;
  modifiedTime: number;
  checksum?: string;
  isSupported?: boolean;
  isDuplicate?: boolean;
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
  scannedAt?: string;
  files: LocalScannedFile[];
}

export interface UploadQueueItem {
  id: string;
  photoId?: string;
  filename: string;
  filePath?: string;
  fileSize: number;
  mimeType?: string;
  checksum?: string;
  status: "pending" | "uploading" | "uploaded" | "failed" | "cancelled";
  progress?: number;
  progressPercent: number;
  bytesUploaded: number;
  uploadUrl?: string;
  uploadHeaders?: Record<string, string>;
  storageKey?: string;
  s3Key?: string;
  errorMessage?: string;
  error?: string;
  retryCount: number;
  folderId?: string | null;
  file?: any;
}

export interface LocalUploadSession {
  id: string;
  eventId: string;
  eventName: string;
  folderId?: string | null;
  folderPath?: string;
  status: "active" | "idle" | "in_progress" | "paused" | "completed" | "cancelled" | "failed" | string;
  totalFiles: number;
  uploadedFiles: number;
  failedFiles?: number;
  totalBytes: number;
  bytesUploaded: number;
  createdAt: string;
  updatedAt: string;
  items: UploadQueueItem[];
  concurrency?: number;
}

export interface UploadStats {
  speedMBps: number;
  estimatedRemainingSeconds: number | null;
  uploadedBytes: number;
  totalBytes: number;
  uploadedCount: number;
  failedCount: number;
  remainingCount: number;
  totalCount: number;
  overallPercent: number;
  currentFilename?: string;
  isPaused: boolean;
  isCancelled: boolean;
  isFinished: boolean;
}

