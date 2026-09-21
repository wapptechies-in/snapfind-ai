import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Badge, Button, Card, ProgressBar } from "../components/common";
import { fileScanner } from "../scanner/fileScanner";
import { useApp } from "../state/store";
import { UploadConfirmModal } from "./UploadConfirmModal";
import type { ScanProgress } from "../types";

export const FolderScan: React.FC = () => {
  const navigate = useNavigate();
  const { selectedEvent, scanResult, setScanResult } = useApp();

  const [scanning, setScanning] = useState(false);
  const [progress, setProgress] = useState<ScanProgress | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [fileFilter, setFileFilter] = useState<"all" | "ready" | "duplicates" | "unsupported">("all");

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
        <Card className="p-8">
          <div className="text-3xl mb-3">📁</div>
          <h3 className="text-base font-bold text-white">No Destination Event Selected</h3>
          <p className="text-xs text-dim mt-1">
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
      <div className="p-4 rounded-xl border border-hairline bg-panel2/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <span className="text-[10px] text-violet-light font-bold uppercase tracking-wider">
            Uploading to Destination
          </span>
          <h2 className="text-base font-bold text-white mt-0.5">{selectedEvent.name}</h2>
          <p className="text-xs text-dim font-mono">
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
      <Card className="p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-semibold text-cloud">Local Photo Folder Scanner</h3>
            <p className="text-xs text-dim mt-0.5">
              Select a local folder on your computer or external SSD to recursively scan for images.
            </p>
            {scanResult && (
              <p className="text-xs text-violet-light font-mono mt-1">
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
          <div className="mt-6 pt-5 border-t border-hairline space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-cloud font-medium flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-violet-light animate-ping" />
                Scanning: {progress.currentFile || "Reading directories..."}
              </span>
              <span className="font-mono text-violet-light font-bold">
                {progress.scanned.toLocaleString()} files inspected
              </span>
            </div>
            <ProgressBar percent={50} variant="violet" />
          </div>
        )}
      </Card>

      {/* Scan Results Breakdown Grid */}
      {scanResult && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="p-4 rounded-xl border border-hairline bg-panel2/40 text-center">
              <p className="text-xs text-dim font-medium">Total Files</p>
              <p className="text-2xl font-bold text-cloud font-mono mt-1">
                {scanResult.totalFiles.toLocaleString()}
              </p>
            </div>

            <div className="p-4 rounded-xl border border-hairline bg-panel2/40 text-center">
              <p className="text-xs text-dim font-medium">Supported Images</p>
              <p className="text-2xl font-bold text-cloud font-mono mt-1">
                {scanResult.supportedCount.toLocaleString()}
              </p>
            </div>

            <div className="p-4 rounded-xl border border-hairline bg-panel2/40 text-center">
              <p className="text-xs text-dim font-medium">Duplicates</p>
              <p className="text-2xl font-bold text-violet-light font-mono mt-1">
                {scanResult.duplicateCount.toLocaleString()}
              </p>
            </div>

            <div className="p-4 rounded-xl border border-hairline bg-panel2/40 text-center">
              <p className="text-xs text-dim font-medium">Unsupported</p>
              <p className="text-2xl font-bold text-dim font-mono mt-1">
                {scanResult.unsupportedCount.toLocaleString()}
              </p>
            </div>

            <div className="p-4 rounded-xl border border-good/40 bg-good/10 text-center">
              <p className="text-xs text-good font-semibold">Ready to Upload</p>
              <p className="text-2xl font-bold text-good font-mono mt-1">
                {scanResult.readyCount.toLocaleString()}
              </p>
              <p className="text-[11px] text-good/80 font-mono mt-0.5">
                {formatBytes(scanResult.totalBytes)}
              </p>
            </div>
          </div>

          {/* Safety Notice & Upload CTA */}
          <div className="p-4 rounded-xl border border-hairline bg-panel flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🛡️</span>
              <div>
                <p className="text-xs font-bold text-cloud">Original Files Untouched</p>
                <p className="text-[11px] text-dim">
                  SnapFind Desktop will only stream-upload copies to MinIO/S3. Your local originals are never deleted or renamed.
                </p>
              </div>
            </div>

            <Button
              size="lg"
              variant="primary"
              disabled={scanResult.readyCount === 0}
              onClick={() => setIsConfirmOpen(true)}
            >
              Start Batch Upload ({scanResult.readyCount} Photos) →
            </Button>
          </div>

          {/* Files List Table */}
          <Card className="p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-hairline">
              <h4 className="text-sm font-semibold text-cloud">Scanned Files Preview</h4>

              <div className="flex items-center gap-1 bg-panel2 p-1 rounded-lg border border-hairline text-xs">
                <button
                  onClick={() => setFileFilter("all")}
                  className={`px-2.5 py-1 rounded font-medium cursor-pointer ${
                    fileFilter === "all" ? "bg-panel text-white" : "text-dim hover:text-cloud"
                  }`}
                >
                  All ({files.length})
                </button>
                <button
                  onClick={() => setFileFilter("ready")}
                  className={`px-2.5 py-1 rounded font-medium cursor-pointer ${
                    fileFilter === "ready" ? "bg-panel text-good" : "text-dim hover:text-cloud"
                  }`}
                >
                  Ready ({scanResult.readyCount})
                </button>
                <button
                  onClick={() => setFileFilter("duplicates")}
                  className={`px-2.5 py-1 rounded font-medium cursor-pointer ${
                    fileFilter === "duplicates" ? "bg-panel text-violet-light" : "text-dim hover:text-cloud"
                  }`}
                >
                  Duplicates ({scanResult.duplicateCount})
                </button>
                <button
                  onClick={() => setFileFilter("unsupported")}
                  className={`px-2.5 py-1 rounded font-medium cursor-pointer ${
                    fileFilter === "unsupported" ? "bg-panel text-dim" : "text-dim hover:text-cloud"
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
                    <p className="font-mono text-cloud truncate">{file.filename}</p>
                    <p className="text-[10px] text-dim font-mono truncate">{file.path}</p>
                  </div>

                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="font-mono text-dim">{formatBytes(file.size)}</span>
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
                <div className="py-3 text-center text-xs text-dim font-mono">
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
