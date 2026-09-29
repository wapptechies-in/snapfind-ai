import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Badge, Button, Card, ProgressBar } from "../components/common";
import { fileScanner } from "../scanner/fileScanner";
import { useApp } from "../state/store";
import { UploadConfirmModal } from "./UploadConfirmModal";
import type { ScanProgress } from "../types";

export const FolderScan: React.FC = () => {
  const navigate = useNavigate();
  const { selectedEvent, scanResult, setScanResult, subscription } = useApp();

  const [scanning, setScanning] = useState(false);
  const [progress, setProgress] = useState<ScanProgress | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [fileFilter, setFileFilter] = useState<"all" | "ready" | "duplicates" | "unsupported">("all");

  const usedStorageBytes = subscription?.used_storage_bytes || 0;
  const maxStorageBytes = subscription?.max_storage_bytes || (9 * 1024 * 1024 * 1024);
  const remainingStorageBytes = Math.max(0, maxStorageBytes - usedStorageBytes);
  const isOverStorageLimit = scanResult ? (scanResult.totalBytes + usedStorageBytes > maxStorageBytes) : false;

  const handleSelectAndScan = async () => {
    const folder = await fileScanner.selectFolder();
    if (!folder) return;

    setScanning(true);
    setProgress({
      scanned: 0,
      supported: 0,
      unsupported: 0,
      duplicates: 0,
      ready: 0,
      totalBytes: 0,
    });

    try {
      const result = await fileScanner.scanFolder(folder, (p) => {
        setProgress(p);
      });
      setScanResult(result);
    } catch (err) {
      console.error("Scanning failed:", err);
    } finally {
      setScanning(false);
    }
  };

  const handleCancelScan = async () => {
    await fileScanner.cancel();
    setScanning(false);
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  if (!selectedEvent) {
    return (
      <div className="max-w-xl mx-auto py-12 text-center">
        <Card className="p-8 bg-slate border-slate-800 shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-gold/10 text-gold flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
            </svg>
          </div>
          <h3 className="text-base font-bold text-soft-white">No Destination Event Selected</h3>
          <p className="text-xs text-cool-gray mt-1">
            Please choose which client event you want to upload photographs to before scanning a folder.
          </p>
          <Link to="/events" className="mt-5 inline-block">
            <Button variant="primary" size="md">
              Select Event First →
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  const files = scanResult?.files || [];
  const filteredFiles = files.filter((f) => {
    if (fileFilter === "ready") return f.isSupported && !f.isDuplicate;
    if (fileFilter === "duplicates") return f.isDuplicate;
    if (fileFilter === "unsupported") return !f.isSupported;
    return true;
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Event Header Banner */}
      <div className="p-4 rounded-xl border border-slate-800 bg-slate flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
        <div>
          <span className="text-[10px] text-gold font-bold uppercase tracking-wider">
            Uploading to Destination
          </span>
          <h2 className="text-base font-bold text-soft-white mt-0.5">{selectedEvent.name}</h2>
          <p className="text-xs text-cool-gray font-mono">
            Event Date: {selectedEvent.date} &middot; Current Photos in Cloud: {selectedEvent.photo_count}
          </p>
        </div>

        <Link to="/events">
          <Button size="sm" variant="secondary">
            Switch Event
          </Button>
        </Link>
      </div>

      {/* Action Bar: Select Folder & Scan */}
      <Card className="p-6 bg-slate border-slate-800 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-soft-white">Local Photo Folder Scanner</h3>
            <p className="text-xs text-cool-gray mt-0.5">
              Select a local folder on your computer or external SSD to recursively scan for images.
            </p>
            {scanResult && (
              <p className="text-xs text-gold font-mono mt-1 font-semibold">
                Folder: {scanResult.folderPath}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2">
            {scanning ? (
              <Button size="md" variant="danger" onClick={handleCancelScan}>
                Cancel Scan
              </Button>
            ) : (
              <Button size="md" variant="primary" onClick={handleSelectAndScan}>
                {scanResult ? "Scan Another Folder" : "Select Local Folder & Scan"}
              </Button>
            )}
          </div>
        </div>

        {/* Live Scanning Progress Indicator */}
        {scanning && progress && (
          <div className="mt-6 pt-5 border-t border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-soft-white font-medium flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-gold animate-ping" />
                Scanning: {progress.currentFile || "Reading directories..."}
              </span>
              <span className="font-mono text-gold font-bold">
                {progress.scanned.toLocaleString()} files inspected
              </span>
            </div>
            <ProgressBar percent={50} variant="primary" />
          </div>
        )}
      </Card>

      {/* Scan Results Breakdown Grid */}
      {scanResult && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="p-4 rounded-xl border border-slate-800 bg-midnight text-center">
              <p className="text-xs text-cool-gray font-medium">Total Files</p>
              <p className="text-2xl font-bold text-soft-white font-mono mt-1">
                {scanResult.totalFiles.toLocaleString()}
              </p>
            </div>

            <div className="p-4 rounded-xl border border-slate-800 bg-midnight text-center">
              <p className="text-xs text-cool-gray font-medium">Supported Images</p>
              <p className="text-2xl font-bold text-soft-white font-mono mt-1">
                {scanResult.supportedCount.toLocaleString()}
              </p>
            </div>

            <div className="p-4 rounded-xl border border-slate-800 bg-midnight text-center">
              <p className="text-xs text-cool-gray font-medium">Duplicates</p>
              <p className="text-2xl font-bold text-coral font-mono mt-1">
                {scanResult.duplicateCount.toLocaleString()}
              </p>
            </div>

            <div className="p-4 rounded-xl border border-slate-800 bg-midnight text-center">
              <p className="text-xs text-cool-gray font-medium">Unsupported</p>
              <p className="text-2xl font-bold text-cool-gray font-mono mt-1">
                {scanResult.unsupportedCount.toLocaleString()}
              </p>
            </div>

            <div className="p-4 rounded-xl border border-gold/30 bg-gold/10 text-center">
              <p className="text-xs text-gold font-semibold">Ready to Upload</p>
              <p className="text-2xl font-bold text-gold font-mono mt-1">
                {scanResult.readyCount.toLocaleString()}
              </p>
              <p className="text-[11px] text-gold/80 font-mono mt-0.5">
                {formatBytes(scanResult.totalBytes)}
              </p>
            </div>
          </div>

          {/* Trial Storage Over-Quota Warning */}
          {isOverStorageLimit && (
            <div className="p-4 rounded-xl border border-red-500/40 bg-red-950/40 flex items-start gap-3.5 text-xs shadow-sm">
              <span className="text-xl flex-shrink-0">⚠️</span>
              <div>
                <p className="font-bold text-red-200">Trial Storage Limit Protection Active</p>
                <p className="mt-1 text-red-300/90 leading-relaxed">
                  This batch requires <span className="font-mono font-bold text-white">{formatBytes(scanResult.totalBytes)}</span>, but your remaining trial quota is only <span className="font-mono font-bold text-white">{formatBytes(remainingStorageBytes)}</span> (of 9.0 GB allocated).
                  Uploads are strictly stopped at 9.0 GB to guarantee 100% zero cloud overage charges on Cloudflare R2. Please select a smaller folder or delete older event photos to proceed.
                </p>
              </div>
            </div>
          )}

          {/* Safety Notice & Upload CTA */}
          <div className="p-4 rounded-xl border border-slate-800 bg-slate flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🛡️</span>
              <div>
                <p className="text-xs font-bold text-soft-white">Original Files Untouched</p>
                <p className="text-[11px] text-cool-gray">
                  SnapFind Desktop will only stream-upload copies to storage. Your local originals are never deleted or modified.
                </p>
              </div>
            </div>

            <Button
              size="lg"
              variant={isOverStorageLimit ? "secondary" : "primary"}
              disabled={scanResult.readyCount === 0 || isOverStorageLimit}
              onClick={() => setIsConfirmOpen(true)}
            >
              {isOverStorageLimit ? "⚠️ Exceeds 9.0 GB Quota" : `Start Batch Upload (${scanResult.readyCount} Photos) →`}
            </Button>
          </div>

          {/* Files List Table */}
          <Card className="p-5 bg-slate border-slate-800 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
              <h4 className="text-sm font-bold text-soft-white">Scanned Files Preview</h4>

              <div className="flex items-center gap-1 bg-midnight p-1 rounded-lg border border-slate-800 text-xs">
                <button
                  onClick={() => setFileFilter("all")}
                  className={`px-2.5 py-1 rounded font-medium cursor-pointer transition-colors ${
                    fileFilter === "all" ? "bg-gold text-midnight font-bold" : "text-cool-gray hover:text-soft-white"
                  }`}
                >
                  All ({files.length})
                </button>
                <button
                  onClick={() => setFileFilter("ready")}
                  className={`px-2.5 py-1 rounded font-medium cursor-pointer transition-colors ${
                    fileFilter === "ready" ? "bg-gold text-midnight font-bold" : "text-cool-gray hover:text-soft-white"
                  }`}
                >
                  Ready ({scanResult.readyCount})
                </button>
                <button
                  onClick={() => setFileFilter("duplicates")}
                  className={`px-2.5 py-1 rounded font-medium cursor-pointer transition-colors ${
                    fileFilter === "duplicates" ? "bg-gold text-midnight font-bold" : "text-cool-gray hover:text-soft-white"
                  }`}
                >
                  Duplicates ({scanResult.duplicateCount})
                </button>
                <button
                  onClick={() => setFileFilter("unsupported")}
                  className={`px-2.5 py-1 rounded font-medium cursor-pointer transition-colors ${
                    fileFilter === "unsupported" ? "bg-gold text-midnight font-bold" : "text-cool-gray hover:text-soft-white"
                  }`}
                >
                  Unsupported ({scanResult.unsupportedCount})
                </button>
              </div>
            </div>

            <div className="max-h-72 overflow-y-auto divide-y divide-hairline mt-2">
              {filteredFiles.slice(0, 100).map((file, idx) => (
                <div key={idx} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                  <div className="overflow-hidden">
                    <p className="font-mono text-soft-white truncate">{file.filename}</p>
                    <p className="text-[10px] text-cool-gray font-mono truncate">{file.path}</p>
                  </div>

                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="font-mono text-cool-gray">{formatBytes(file.size)}</span>
                    {file.isDuplicate ? (
                      <Badge variant="failed">Duplicate</Badge>
                    ) : file.isSupported ? (
                      <Badge variant="active">Ready</Badge>
                    ) : (
                      <Badge variant="neutral">Unsupported</Badge>
                    )}
                  </div>
                </div>
              ))}
              {filteredFiles.length > 100 && (
                <div className="py-3 text-center text-xs text-cool-gray font-mono">
                  + {filteredFiles.length - 100} more files
                </div>
              )}
            </div>
          </Card>
        </>
      )}

      {/* Confirmation Modal */}
      {scanResult && (
        <UploadConfirmModal
          isOpen={isConfirmOpen}
          onClose={() => setIsConfirmOpen(false)}
          event={selectedEvent}
          scanResult={scanResult}
          onConfirm={() => {
            setIsConfirmOpen(false);
            navigate("/uploads");
          }}
        />
      )}
    </div>
  );
};
