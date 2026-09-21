import { contextBridge, ipcRenderer } from "electron";

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

const desktopAPI: DesktopAPI = {
  openFolderDialog: () => ipcRenderer.invoke("dialog:openFolder"),

  scanFolder: async (folderPath, onProgress) => {
    const listener = (_event: Electron.IpcRendererEvent, data: ScanProgress) => {
      if (onProgress) onProgress(data);
    };
    ipcRenderer.on("scanner:progress", listener);
    try {
      return await ipcRenderer.invoke("scanner:scanFolder", folderPath);
    } finally {
      ipcRenderer.removeListener("scanner:progress", listener);
    }
  },

  cancelScan: () => ipcRenderer.invoke("scanner:cancel"),

  uploadBinaryStream: async (filePath, uploadUrl, contentType, headers = {}, onProgress) => {
    const channel = `upload:progress:${filePath}`;
    const listener = (_event: Electron.IpcRendererEvent, sent: number, total: number) => {
      if (onProgress) onProgress(sent, total);
    };
    ipcRenderer.on(channel, listener);
    try {
      return await ipcRenderer.invoke(
        "upload:streamBinary",
        filePath,
        uploadUrl,
        contentType,
        headers
      );
    } finally {
      ipcRenderer.removeListener(channel, listener);
    }
  },

  saveUploadSession: (sessionData) => ipcRenderer.invoke("storage:saveSession", sessionData),
  loadUploadSession: (sessionId) => ipcRenderer.invoke("storage:loadSession", sessionId),
  listUploadSessions: () => ipcRenderer.invoke("storage:listSessions"),
  deleteUploadSession: (sessionId) => ipcRenderer.invoke("storage:deleteSession", sessionId),
  openExternal: (url) => ipcRenderer.invoke("shell:openExternal", url),
  log: (level, message) => ipcRenderer.invoke("app:log", level, message),
  getLogs: () => ipcRenderer.invoke("app:getLogs"),
  getPlatform: () => ipcRenderer.invoke("app:getPlatform"),
  getVersion: () => ipcRenderer.invoke("app:getVersion"),
};

contextBridge.exposeInMainWorld("desktopAPI", desktopAPI);
