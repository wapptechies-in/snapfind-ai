/**
 * TypeScript Interfaces for SnapFind Desktop.
 * Unified with @snapfind/types
 */

export * from "@snapfind/types";

export interface ScannedFile {
  filename: string;
  path: string;
  size: number;
  extension: string;
  modifiedTime: number;
  checksum: string;
  isSupported: boolean;
  isDuplicate: boolean;
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
  files: ScannedFile[];
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
