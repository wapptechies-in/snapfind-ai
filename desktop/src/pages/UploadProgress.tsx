import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Badge, Button, Card, ProgressBar } from "../components/common";
import { useApp } from "../state/store";
import type { LocalUploadSession } from "../types";
import type { UploadStats } from "../upload/uploadManager";

export const UploadProgress: React.FC = () => {
  const navigate = useNavigate();
  const { uploadManager } = useApp();

  const [session, setSession] = useState<LocalUploadSession | null>(
    uploadManager ? uploadManager.getSession() : null
  );
  const [stats, setStats] = useState<UploadStats | null>(
    uploadManager ? uploadManager.getStats() : null
  );
  const [filter, setFilter] = useState<"all" | "uploading" | "pending" | "uploaded" | "failed">("all");

  useEffect(() => {
    if (!uploadManager) return;

    const unsubscribe = uploadManager.subscribe((updatedSession, updatedStats) => {
      setSession({ ...updatedSession });
      setStats({ ...updatedStats });
    });

    return () => {
      unsubscribe();
    };
  }, [uploadManager]);

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  const formatEta = (seconds: number | null): string => {
    if (seconds === null || seconds < 0) return "--";
    if (seconds < 60) return `${seconds}s`;
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}m ${s}s`;
  };

  if (!uploadManager || !session || !stats) {
    return (
      <div className="max-w-xl mx-auto py-12 text-center">
        <Card className="p-8 bg-white border-studio-sand shadow-sm">
          <div className="text-3xl mb-3">🚀</div>
          <h3 className="text-base font-serif font-bold text-charcoal">No Active Upload Session</h3>
          <p className="text-xs text-charcoal-muted mt-1">
            There is currently no upload running. Select an event and scan a photo folder to start uploading.
          </p>
          <div className="mt-5 flex justify-center gap-3">
            <Link to="/events">
              <Button variant="primary" size="md">
                Select Event →
              </Button>
            </Link>
            <Link to="/">
              <Button variant="secondary" size="md">
                Dashboard
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  const items = session.items || [];
  const filteredItems = items.filter((item) => {
    if (filter === "uploading") return item.status === "uploading";
    if (filter === "pending") return item.status === "pending";
    if (filter === "uploaded") return item.status === "uploaded";
    if (filter === "failed") return item.status === "failed";
    return true;
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Upload Header Overview Card */}
      <Card className="p-6 bg-surface border-warm-beige shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-warm-beige">
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-base font-serif font-bold text-charcoal">{session.eventName}</h2>
              <Badge
                variant={
                  stats.isFinished
                    ? "completed"
                    : stats.isPaused
                    ? "neutral"
                    : stats.isCancelled
                    ? "failed"
                    : "active"
                }
              >
                {stats.isFinished
                  ? "UPLOAD COMPLETE"
                  : stats.isPaused
                  ? "PAUSED"
                  : stats.isCancelled
                  ? "CANCELLED"
                  : "UPLOADING"}
              </Badge>
            </div>
            <p className="text-xs text-charcoal-muted font-mono mt-0.5 truncate max-w-xl">
              Source: {session.folderPath}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            {!stats.isFinished && !stats.isCancelled && (
              <>
                {stats.isPaused ? (
                  <Button size="sm" variant="primary" onClick={() => uploadManager.resume()}>
                    ▶ Resume Upload
                  </Button>
                ) : (
                  <Button size="sm" variant="secondary" onClick={() => uploadManager.pause()}>
                    ⏸ Pause
                  </Button>
                )}

                <Button size="sm" variant="danger" onClick={() => uploadManager.cancel()}>
                  Cancel
                </Button>
              </>
            )}

            {stats.failedCount > 0 && (
              <Button size="sm" variant="danger" onClick={() => uploadManager.retryFailed()}>
                Retry Failed ({stats.failedCount})
              </Button>
            )}

            <Button
              size="sm"
              variant="primary"
              onClick={() => navigate("/processing")}
            >
              Server AI Pipeline →
            </Button>
          </div>
        </div>

        {/* Counts Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 my-6">
          <div className="p-4 rounded-xl border border-warm-beige bg-cream text-center">
            <p className="text-xs text-charcoal-muted font-medium">Uploaded Photos</p>
            <p className="text-2xl font-bold text-forest font-mono mt-1">
              {stats.uploadedCount.toLocaleString()}
            </p>
            <p className="text-[11px] text-charcoal-muted mt-0.5">
              of {stats.totalCount.toLocaleString()}
            </p>
          </div>

          <div className="p-4 rounded-xl border border-warm-beige bg-cream text-center">
            <p className="text-xs text-charcoal-muted font-medium">Remaining Queue</p>
            <p className="text-2xl font-bold text-charcoal-muted font-mono mt-1">
              {stats.remainingCount.toLocaleString()}
            </p>
            <p className="text-[11px] text-charcoal-muted mt-0.5">pending streams</p>
          </div>

          <div className="p-4 rounded-xl border border-warm-beige bg-cream text-center">
            <p className="text-xs text-charcoal-muted font-medium">Current Speed</p>
            <p className="text-2xl font-bold text-forest font-mono mt-1">
              {stats.speedMBps} MB/s
            </p>
            <p className="text-[11px] text-charcoal-muted mt-0.5">Direct Storage PUT</p>
          </div>

          <div className="p-4 rounded-xl border border-warm-beige bg-cream text-center">
            <p className="text-xs text-charcoal-muted font-medium">Estimated Remaining</p>
            <p className="text-2xl font-bold text-charcoal font-mono mt-1">
              {formatEta(stats.estimatedRemainingSeconds)}
            </p>
            <p className="text-[11px] text-charcoal-muted mt-0.5">
              {formatBytes(stats.uploadedBytes)} / {formatBytes(stats.totalBytes)}
            </p>
          </div>
        </div>

        {/* Progress Bar & Current File */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-charcoal">
              {stats.currentFilename ? `Streaming: ${stats.currentFilename}` : "Upload Progress"}
            </span>
            <span className="font-mono text-forest font-bold">
              {stats.overallPercent}%
            </span>
          </div>
          <ProgressBar
            percent={stats.overallPercent}
            variant={stats.failedCount > 0 ? "danger" : stats.overallPercent === 100 ? "success" : "primary"}
          />
        </div>
      </Card>

      {/* Queue Table */}
      <Card className="p-5 bg-surface border-warm-beige shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-warm-beige">
          <h4 className="text-sm font-serif font-semibold text-charcoal">Upload Queue Items</h4>

          <div className="flex items-center gap-1 bg-cream p-1 rounded-lg border border-warm-beige text-xs">
            <button
              onClick={() => setFilter("all")}
              className={`px-2.5 py-1 rounded font-medium cursor-pointer transition-colors ${
                filter === "all" ? "bg-forest text-white" : "text-charcoal-muted hover:text-charcoal"
              }`}
            >
              All ({items.length})
            </button>
            <button
              onClick={() => setFilter("uploading")}
              className={`px-2.5 py-1 rounded font-medium cursor-pointer transition-colors ${
                filter === "uploading" ? "bg-forest text-white" : "text-charcoal-muted hover:text-charcoal"
              }`}
            >
              Uploading
            </button>
            <button
              onClick={() => setFilter("pending")}
              className={`px-2.5 py-1 rounded font-medium cursor-pointer transition-colors ${
                filter === "pending" ? "bg-forest text-white" : "text-charcoal-muted hover:text-charcoal"
              }`}
            >
              Waiting
            </button>
            <button
              onClick={() => setFilter("uploaded")}
              className={`px-2.5 py-1 rounded font-medium cursor-pointer transition-colors ${
                filter === "uploaded" ? "bg-forest text-white" : "text-charcoal-muted hover:text-charcoal"
              }`}
            >
              Uploaded ({stats.uploadedCount})
            </button>
            <button
              onClick={() => setFilter("failed")}
              className={`px-2.5 py-1 rounded font-medium cursor-pointer transition-colors ${
                filter === "failed" ? "bg-forest text-white" : "text-charcoal-muted hover:text-charcoal"
              }`}
            >
              Failed ({stats.failedCount})
            </button>
          </div>
        </div>

        <div className="max-h-96 overflow-y-auto divide-y divide-warm-beige mt-2">
          {filteredItems.slice(0, 100).map((item) => {
            return (
              <div
                key={item.id}
                className="py-2.5 flex items-center justify-between gap-3 text-xs"
              >
                <div className="overflow-hidden flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-charcoal font-medium truncate">
                      {item.filename}
                    </span>
                    {item.retryCount > 0 && (
                      <span className="text-[10px] text-charcoal-muted font-mono">
                        (attempt {item.retryCount + 1})
                      </span>
                    )}
                  </div>
                  {item.errorMessage && (
                    <p className="text-[10px] text-danger mt-0.5 truncate">{item.errorMessage}</p>
                  )}
                </div>

                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className="font-mono text-charcoal-muted">{formatBytes(item.fileSize)}</span>

                  {item.status === "uploaded" && (
                    <span className="inline-flex items-center gap-1 text-forest font-semibold">
                      <span>✓</span> Uploaded
                    </span>
                  )}
                  {item.status === "uploading" && (
                    <span className="inline-flex items-center gap-1.5 text-forest font-semibold animate-pulse">
                      <span className="h-1.5 w-1.5 rounded-full bg-forest animate-ping" />
                      {item.progressPercent}%
                    </span>
                  )}
                  {item.status === "pending" && (
                    <span className="text-charcoal-muted">Waiting</span>
                  )}
                  {item.status === "failed" && (
                    <span className="text-danger font-semibold">✕ Failed</span>
                  )}
                </div>
              </div>
            );
          })}
          {filteredItems.length > 100 && (
            <div className="py-3 text-center text-xs text-charcoal-muted font-mono">
              + {filteredItems.length - 100} more items
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};
