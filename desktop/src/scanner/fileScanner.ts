import type { ScanProgress, ScanResult } from "../../electron/preload";

export const fileScanner = {
  async selectFolder(): Promise<string | null> {
    if (window.desktopAPI) {
      return window.desktopAPI.openFolderDialog();
    }
    // Browser fallback prompt
    return window.prompt("Enter local photo folder path:", "D:/Photography/Events/Wedding-2026");
  },

  async scanFolder(
    folderPath: string,
    onProgress?: (progress: ScanProgress) => void
  ): Promise<ScanResult> {
    if (window.desktopAPI) {
      return window.desktopAPI.scanFolder(folderPath, onProgress);
    }

    // Mock browser fallback for test preview
    const sampleFiles = Array.from({ length: 45 }, (_, i) => ({
      filename: `IMG_${1000 + i}.JPG`,
      path: `${folderPath}/IMG_${1000 + i}.JPG`,
      size: 4 * 1024 * 1024 + (i * 12345),
      extension: ".jpg",
      modifiedTime: Date.now() - i * 100000,
      checksum: `mock_chk_${i}`,
      isSupported: true,
      isDuplicate: i === 3 || i === 7,
    }));

    return {
      folderPath,
      folderName: folderPath.split(/[/\\]/).filter(Boolean).pop() || "Photos",
      totalFiles: 47,
      supportedCount: 45,
      unsupportedCount: 2,
      duplicateCount: 2,
      readyCount: 43,
      totalBytes: sampleFiles.reduce((sum, f) => sum + f.size, 0),
      files: sampleFiles,
    };
  },

  async cancel(): Promise<void> {
    if (window.desktopAPI) {
      await window.desktopAPI.cancelScan();
    }
  },
};
