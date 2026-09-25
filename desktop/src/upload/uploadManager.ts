import { getApiBaseUrl } from "../api/client";
import { uploadsApi } from "../api/uploads";
import { sessionStorage } from "../storage/sessionStorage";
import type { LocalUploadSession, UploadQueueItem } from "../types";

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

export type UploadListener = (session: LocalUploadSession, stats: UploadStats) => void;

export class UploadManager {
  private session: LocalUploadSession;
  private concurrency: number;
  private isPaused: boolean = false;
  private isCancelled: boolean = false;
  private activeUploadsCount: number = 0;
  private listeners: Set<UploadListener> = new Set();

  // Speed and ETA calculation
  private lastBytesMeasurement: number = 0;
  private lastTimeMeasurement: number = Date.now();
  private currentSpeedMBps: number = 0;
  private speedWindow: number[] = [];
  private speedIntervalId?: NodeJS.Timeout;

  constructor(session: LocalUploadSession, concurrency: number = 4) {
    this.session = session;
    this.concurrency = Math.max(1, Math.min(8, concurrency));
  }

  public getSession(): LocalUploadSession {
    return this.session;
  }

  public subscribe(listener: UploadListener): () => void {
    this.listeners.add(listener);
    listener(this.session, this.getStats());
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    const stats = this.getStats();
    for (const listener of this.listeners) {
      listener(this.session, stats);
    }
  }

  public getStats(): UploadStats {
    let uploadedBytes = 0;
    let uploadedCount = 0;
    let failedCount = 0;
    let currentFilename: string | undefined;

    for (const item of this.session.items) {
      if (item.status === "uploaded") {
        uploadedBytes += item.fileSize;
        uploadedCount++;
      } else if (item.status === "uploading") {
        uploadedBytes += item.bytesUploaded;
        if (!currentFilename) currentFilename = item.filename;
      } else if (item.status === "failed") {
        failedCount++;
      }
    }

    const totalCount = this.session.items.length;
    const remainingCount = totalCount - uploadedCount - failedCount;
    const totalBytes = this.session.totalBytes || 1;
    const overallPercent = Math.min(100, Math.round((uploadedBytes / totalBytes) * 100));

    let eta: number | null = null;
    const remainingBytes = Math.max(0, totalBytes - uploadedBytes);
    if (this.currentSpeedMBps > 0.05 && remainingBytes > 0) {
      eta = Math.round(remainingBytes / (this.currentSpeedMBps * 1024 * 1024));
    }

    return {
      speedMBps: this.currentSpeedMBps,
      estimatedRemainingSeconds: eta,
      uploadedBytes,
      totalBytes,
      uploadedCount,
      failedCount,
      remainingCount,
      totalCount,
      overallPercent,
      currentFilename,
      isPaused: this.isPaused,
      isCancelled: this.isCancelled,
      isFinished: uploadedCount + failedCount >= totalCount && this.activeUploadsCount === 0,
    };
  }

  public async start(): Promise<void> {
    this.isPaused = false;
    this.isCancelled = false;
    this.session.status = "active";
    this.startSpeedTracker();

    // Persist initial state
    await sessionStorage.save(this.session);

    // Initial batch initialization of presigned URLs
    await this.ensurePresignedUrls();

    // Pump worker pool
    this.pump();
  }

  public pause(): void {
    this.isPaused = true;
    this.session.status = "paused";
    this.stopSpeedTracker();
    this.notify();
    sessionStorage.save(this.session);
  }

  public resume(): void {
    if (this.isCancelled) return;
    this.isPaused = false;
    this.session.status = "active";
    this.startSpeedTracker();
    this.pump();
  }

  public async cancel(): Promise<void> {
    this.isCancelled = true;
    this.isPaused = false;
    this.session.status = "cancelled";
    this.stopSpeedTracker();

    for (const item of this.session.items) {
      if (item.status === "pending" || item.status === "uploading") {
        item.status = "cancelled";
      }
    }

    try {
      await uploadsApi.cancelSession(this.session.id);
    } catch {
      // ignore
    }

    this.notify();
    await sessionStorage.save(this.session);
  }

  public async retryFailed(): Promise<void> {
    for (const item of this.session.items) {
      if (item.status === "failed") {
        item.status = "pending";
        item.errorMessage = undefined;
        item.progressPercent = 0;
        item.bytesUploaded = 0;
      }
    }
    await this.start();
  }

  private startSpeedTracker() {
    this.stopSpeedTracker();
    this.lastBytesMeasurement = this.getStats().uploadedBytes;
    this.lastTimeMeasurement = Date.now();

    this.speedIntervalId = setInterval(() => {
      const now = Date.now();
      const currentBytes = this.getStats().uploadedBytes;
      const timeDeltaSec = (now - this.lastTimeMeasurement) / 1000;

      if (timeDeltaSec >= 0.5) {
        const bytesDelta = Math.max(0, currentBytes - this.lastBytesMeasurement);
        const instantMBps = bytesDelta / (1024 * 1024 * timeDeltaSec);

        this.speedWindow.push(instantMBps);
        if (this.speedWindow.length > 5) {
          this.speedWindow.shift();
        }

        const avgSpeed = this.speedWindow.reduce((a, b) => a + b, 0) / this.speedWindow.length;
        this.currentSpeedMBps = Math.round(avgSpeed * 10) / 10;
        this.lastBytesMeasurement = currentBytes;
        this.lastTimeMeasurement = now;
        this.notify();
      }
    }, 1000);
  }

  private stopSpeedTracker() {
    if (this.speedIntervalId) {
      clearInterval(this.speedIntervalId);
      this.speedIntervalId = undefined;
    }
    this.currentSpeedMBps = 0;
  }

  private async ensurePresignedUrls(): Promise<void> {
    const uninitialized = this.session.items.filter(
      (item) => item.status === "pending" && !item.uploadUrl
    );

    if (uninitialized.length === 0) return;

    // Batch initialize up to 50 at a time
    const batchSize = 50;
    for (let i = 0; i < uninitialized.length; i += batchSize) {
      if (this.isCancelled || this.isPaused) break;
      const chunk = uninitialized.slice(i, i + batchSize);

      try {
        const payload = chunk.map((item) => ({
          filename: item.filename,
          fileSize: item.fileSize,
          mimeType: item.mimeType || "image/jpeg",
          checksum: item.checksum,
        }));

        const res = await uploadsApi.batchInit(this.session.id, payload);

        for (const resItem of res.items) {
          const matching = chunk.find((c) => c.filename === resItem.filename && !c.photoId);
          if (matching) {
            matching.photoId = resItem.photoId;
            let fullUrl = resItem.uploadUrl || "";
            if (fullUrl.startsWith("/")) {
              fullUrl = `${getApiBaseUrl()}${fullUrl}`;
            }
            matching.uploadUrl = fullUrl;
            matching.uploadHeaders = resItem.headers || {};
            matching.storageKey = resItem.storageKey;
          }
        }
      } catch (err) {
        console.error("Batch init error:", err);
      }
    }
  }

  private pump(): void {
    if (this.isPaused || this.isCancelled) return;

    while (this.activeUploadsCount < this.concurrency) {
      const nextItem = this.session.items.find(
        (item) => item.status === "pending" && item.uploadUrl
      );

      if (!nextItem) {
        // Check if any items are uninitialized
        const needsUrls = this.session.items.some((i) => i.status === "pending" && !i.uploadUrl);
        if (needsUrls) {
          this.ensurePresignedUrls().then(() => this.pump());
        }
        break;
      }

      this.activeUploadsCount++;
      this.uploadItem(nextItem).finally(() => {
        this.activeUploadsCount--;
        this.pump();
      });
    }

    if (this.activeUploadsCount === 0) {
      const pendingOrUploading = this.session.items.some(
        (i) => i.status === "pending" || i.status === "uploading"
      );

      if (!pendingOrUploading) {
        this.finalizeSession();
      }
    }
  }

  private async uploadItem(item: UploadQueueItem): Promise<void> {
    item.status = "uploading";
    item.progressPercent = 0;
    item.bytesUploaded = 0;
    this.notify();

    try {
      if (window.desktopAPI) {
        // Real streaming direct PUT upload via Electron main process
        const res = await window.desktopAPI.uploadBinaryStream(
          item.filePath || item.filename,
          item.uploadUrl!,
          item.mimeType || "image/jpeg",
          item.uploadHeaders || {},
          (sent: number, total: number) => {
            if (this.isCancelled || this.isPaused) return;
            item.bytesUploaded = sent;
            item.progressPercent = Math.round((sent / total) * 100);
            this.notify();
          }

        );

        if (!res.success) {
          throw new Error(res.error || "Storage upload stream failed");
        }
      } else {
        // Simulated upload progress in browser dev mode
        await new Promise((r) => setTimeout(r, 400));
        item.bytesUploaded = item.fileSize;
        item.progressPercent = 100;
      }

      // Signal upload completion to FastAPI backend (triggers Celery background worker)
      if (item.photoId) {
        await uploadsApi.uploadComplete(item.photoId);
      }

      item.status = "uploaded";
      item.progressPercent = 100;
      item.bytesUploaded = item.fileSize;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      item.retryCount++;
      if (item.retryCount <= 2 && !this.isCancelled) {
        // Retry item
        item.status = "pending";
      } else {
        item.status = "failed";
        item.errorMessage = msg;
      }
    }

    this.notify();
    await sessionStorage.save(this.session);
  }

  private async finalizeSession(): Promise<void> {
    this.stopSpeedTracker();
    const stats = this.getStats();

    if (stats.failedCount === 0) {
      this.session.status = "completed";
      try {
        await uploadsApi.completeSession(this.session.id);
      } catch {
        // ignore
      }
    } else {
      this.session.status = "paused";
    }

    this.notify();
    await sessionStorage.save(this.session);
  }
}
