import React, { useState } from "react";
import { Button, Modal } from "../components/common";
import { uploadsApi } from "../api/uploads";
import { useApp } from "../state/store";
import { UploadManager } from "../upload/uploadManager";
import type { LocalUploadSession, ScanResult, SnapEvent, UploadQueueItem } from "../types";

interface UploadConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: SnapEvent;
  scanResult: ScanResult;
  onConfirm: () => void;
}

export const UploadConfirmModal: React.FC<UploadConfirmModalProps> = ({
  isOpen,
  onClose,
  event,
  scanResult,
  onConfirm,
}) => {
  const { setUploadManager, settings, refreshRecentSessions } = useApp();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [consentGiven, setConsentGiven] = useState(false);

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const handleStart = async () => {
    setLoading(true);
    setError(null);

    try {
      // 1. Create upload session in FastAPI backend
      const sessionRes = await uploadsApi.createSession(
        event.id,
        `Desktop Upload — ${scanResult.folderName}`,
        scanResult.readyCount,
        scanResult.totalBytes
      );

      // 2. Prepare queue items from ready files
      const readyFiles = scanResult.files.filter((f) => f.isSupported && !f.isDuplicate);
      const queueItems: UploadQueueItem[] = readyFiles.map((file, idx) => {
        const ext = file.extension.toLowerCase();
        let mime = "image/jpeg";
        if (ext === ".png") mime = "image/png";
        if (ext === ".webp") mime = "image/webp";

        return {
          id: `queue_${idx}_${Date.now()}`,
          filename: file.filename,
          filePath: file.path,
          fileSize: file.size,
          mimeType: mime,
          checksum: file.checksum,
          status: "pending",
          progressPercent: 0,
          bytesUploaded: 0,
          retryCount: 0,
        };
      });

      // 3. Construct local upload session
      const localSession: LocalUploadSession = {
        id: sessionRes.id,
        eventId: event.id,
        eventName: event.name,
        folderPath: scanResult.folderPath,
        status: "active",
        totalFiles: queueItems.length,
        uploadedFiles: 0,
        failedFiles: 0,
        totalBytes: scanResult.totalBytes,
        bytesUploaded: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        items: queueItems,
      };

      // 4. Instantiate manager and start uploading
      const manager = new UploadManager(localSession, settings.concurrency);
      setUploadManager(manager);
      await manager.start();

      await refreshRecentSessions();
      onConfirm();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to initialize upload session";
      setError(msg);
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Confirm Batch Upload">
      <div className="space-y-4">
        {error && (
          <div className="p-3 rounded-xl border border-coral/30 bg-coral/10 text-xs text-coral">
            {error}
          </div>
        )}

        <div className="p-4 rounded-xl border border-slate-800 bg-midnight space-y-2 text-xs">
          <div className="flex justify-between py-1 border-b border-slate-800">
            <span className="text-muted">Destination Event:</span>
            <span className="font-semibold text-soft-white">{event.name}</span>
          </div>
          <div className="flex justify-between py-1 border-b border-slate-800">
            <span className="text-muted">Local Source Folder:</span>
            <span className="font-mono text-soft-white truncate max-w-[200px]" title={scanResult.folderPath}>
              {scanResult.folderName}
            </span>
          </div>
          <div className="flex justify-between py-1 border-b border-slate-800">
            <span className="text-muted">Ready Photographs:</span>
            <span className="font-mono font-bold text-gold">
              {scanResult.readyCount.toLocaleString()} files
            </span>
          </div>
          <div className="flex justify-between py-1 border-b border-slate-800">
            <span className="text-muted">Total Payload Size:</span>
            <span className="font-mono font-bold text-gold">
              {formatBytes(scanResult.totalBytes)}
            </span>
          </div>
          <div className="flex justify-between py-1">
            <span className="text-muted">Worker Concurrency:</span>
            <span className="font-mono text-soft-white">{settings.concurrency} streams simultaneously</span>
          </div>
        </div>

        <div className="p-3.5 rounded-xl border border-gold/30 bg-gold/5 space-y-2">
          <p className="text-[11px] text-soft-white leading-relaxed font-medium">
            <strong>Privacy & Storage Notice:</strong> Selected photographs will be uploaded directly to secure staging cloud storage for AI facial detection, embedding generation, and guest gallery delivery. Your local original files on your drive will remain untouched and never modified or deleted.
          </p>
          <label className="flex items-start gap-2.5 pt-1 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={consentGiven}
              onChange={(e) => setConsentGiven(e.target.checked)}
              className="mt-0.5 rounded border-slate-700 bg-midnight text-gold focus:ring-gold cursor-pointer"
            />
            <span className="text-xs text-soft-white font-medium">
              I understand and consent to uploading these selected images to cloud storage for AI processing and gallery publishing.
            </span>
          </label>
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
          <Button variant="secondary" size="md" onClick={onClose} disabled={loading} className="border-slate-700 bg-midnight text-soft-white hover:border-gold">
            Cancel
          </Button>
          <Button variant="primary" size="md" onClick={handleStart} disabled={loading || !consentGiven}>
            {loading ? "Starting..." : "Start Upload Now"}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
