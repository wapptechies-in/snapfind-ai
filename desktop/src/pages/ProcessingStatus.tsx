import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Badge, Button, Card, LoadingSpinner, ProgressBar } from "../components/common";
import { processingApi } from "../api/processing";
import { useApp } from "../state/store";
import type { ProcessingStatus as ProcessingStatusType } from "../types";

export const ProcessingStatus: React.FC = () => {
  const { selectedEvent } = useApp();
  const [statusData, setStatusData] = useState<ProcessingStatusType | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!selectedEvent) return;

    let isMounted = true;

    async function fetchStatus() {
      try {
        const res = await processingApi.getStatus(selectedEvent!.id);
        if (isMounted) {
          setStatusData(res);
          setLoading(false);
        }
      } catch (err) {
        console.error("Failed to fetch processing status:", err);
      }
    }

    fetchStatus();

    // Poll every 2500ms
    const interval = setInterval(fetchStatus, 2500);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [selectedEvent]);

  const handleStart = async () => {
    if (!selectedEvent) return;
    setActionLoading("start");
    try {
      const res = await processingApi.startProcessing(selectedEvent.id);
      setMessage(res.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReprocess = async () => {
    if (!selectedEvent) return;
    if (!window.confirm("Reprocess all event photos from scratch? This will clear existing vectors and re-run face embeddings.")) {
      return;
    }
    setActionLoading("reprocess");
    try {
      const res = await processingApi.reprocessEvent(selectedEvent.id);
      setMessage(res.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleRetryFailed = async () => {
    if (!selectedEvent) return;
    setActionLoading("retry");
    try {
      const res = await processingApi.retryFailed(selectedEvent.id);
      setMessage(res.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancel = async () => {
    if (!selectedEvent) return;
    setActionLoading("cancel");
    try {
      const res = await processingApi.cancel(selectedEvent.id);
      setMessage(res.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleOpenGallery = async () => {
    if (!selectedEvent) return;
    const galleryUrl = `http://localhost:5173/event/${selectedEvent.public_token}/gallery`;
    if (window.desktopAPI) {
      await window.desktopAPI.openExternal(galleryUrl);
    } else {
      window.open(galleryUrl, "_blank");
    }
  };

  const handleCopyLink = async () => {
    if (!selectedEvent) return;
    const galleryUrl = `http://localhost:5173/event/${selectedEvent.public_token}`;
    await navigator.clipboard.writeText(galleryUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!selectedEvent) {
    return (
      <div className="max-w-xl mx-auto py-12 text-center">
        <Card className="p-8">
          <div className="text-3xl mb-3">⚡</div>
          <h3 className="text-base font-bold text-white">No Event Selected</h3>
          <p className="text-xs text-dim mt-1">
            Please select an event to monitor its background AI processing pipeline.
          </p>
          <Link to="/events" className="mt-5 inline-block">
            <Button variant="primary" size="md">
              Select Event →
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  if (loading && !statusData) {
    return (
      <div className="max-w-xl mx-auto py-12 text-center">
        <LoadingSpinner message="Connecting to server AI processing pipeline..." />
      </div>
    );
  }

  const isProcessing = statusData?.status === "processing" || statusData?.status === "queued";
  const hasFailed = (statusData?.failed || 0) > 0;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Event Header */}
      <div className="p-5 rounded-2xl border border-slate-800 bg-slate flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
        <div>
          <span className="text-[10px] text-gold font-bold uppercase tracking-wider">
            Server AI Processing Monitor
          </span>
          <h2 className="text-lg font-bold text-soft-white mt-0.5">{selectedEvent.name}</h2>
          <p className="text-xs text-cool-gray font-mono">
            Token: {selectedEvent.public_token} &middot; Async workers active
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button size="sm" variant="secondary" onClick={handleCopyLink}>
            {copied ? "Link Copied! ✓" : "Copy Gallery Link"}
          </Button>
          <Button size="sm" variant="primary" onClick={handleOpenGallery}>
            Open Event Gallery ↗
          </Button>
        </div>
      </div>

      {/* Message alert */}
      {message && (
        <div className="p-3.5 rounded-xl border border-gold/20 bg-slate text-xs text-gold flex items-center justify-between shadow-sm">
          <span>{message}</span>
          <button onClick={() => setMessage(null)} className="text-cool-gray hover:text-soft-white cursor-pointer">
            ✕
          </button>
        </div>
      )}

      {/* Pipeline Overview Card */}
      {statusData && (
        <Card className="p-6 bg-slate border-slate-800 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-800">
            <div>
              <h3 className="text-base font-bold text-soft-white">Server-Side Pipeline Status</h3>
              <p className="text-xs text-cool-gray mt-0.5">
                Derivative generation, facial landmark detection, 512-d embeddings, and vector indexing
              </p>
            </div>

            <Badge variant={statusData.progressPercent === 100 ? "completed" : isProcessing ? "processing" : "neutral"}>
              Stage: {statusData.currentStage}
            </Badge>
          </div>

          {/* Counts Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 my-6">
            <div className="p-4 rounded-xl border border-slate-800 bg-midnight text-center">
              <p className="text-xs text-cool-gray font-medium">Total Photos</p>
              <p className="text-2xl font-bold text-soft-white font-mono mt-1">
                {statusData.totalPhotos.toLocaleString()}
              </p>
            </div>

            <div className="p-4 rounded-xl border border-slate-800 bg-midnight text-center">
              <p className="text-xs text-cool-gray font-medium">Processed</p>
              <p className="text-2xl font-bold text-sage font-mono mt-1">
                {statusData.processed.toLocaleString()}
              </p>
            </div>

            <div className="p-4 rounded-xl border border-slate-800 bg-midnight text-center">
              <p className="text-xs text-cool-gray font-medium">Remaining</p>
              <p className="text-2xl font-bold text-cool-gray font-mono mt-1">
                {statusData.remaining.toLocaleString()}
              </p>
            </div>

            <div className={`p-4 rounded-xl border text-center ${hasFailed ? "border-coral/30 bg-coral/10" : "border-slate-800 bg-midnight"}`}>
              <p className={`text-xs font-medium ${hasFailed ? "text-coral" : "text-cool-gray"}`}>Failed</p>
              <p className={`text-2xl font-bold font-mono mt-1 ${hasFailed ? "text-coral" : "text-cool-gray"}`}>
                {statusData.failed.toLocaleString()}
              </p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-soft-white">Overall Processing Completion</span>
              <span className="font-mono text-gold font-bold">
                {statusData.progressPercent}%
              </span>
            </div>
            <ProgressBar
              percent={statusData.progressPercent}
              variant={hasFailed ? "danger" : statusData.progressPercent === 100 ? "success" : "primary"}
            />
          </div>

          {/* Action Controls */}
          <div className="mt-6 pt-5 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-cool-gray">
              Background jobs run asynchronously outside the web browser.
            </p>

            <div className="flex items-center gap-2">
              {statusData.remaining > 0 && !isProcessing && (
                <Button size="sm" variant="primary" disabled={actionLoading !== null} onClick={handleStart}>
                  {actionLoading === "start" ? "Starting..." : "Start Processing"}
                </Button>
              )}

              <Button size="sm" variant="secondary" disabled={actionLoading !== null} onClick={handleReprocess}>
                {actionLoading === "reprocess" ? "Dispatching..." : "Reprocess All Photos"}
              </Button>

              {hasFailed && (
                <Button size="sm" variant="danger" disabled={actionLoading !== null} onClick={handleRetryFailed}>
                  {actionLoading === "retry" ? "Retrying..." : `Retry Failed (${statusData.failed})`}
                </Button>
              )}

              {isProcessing && (
                <Button size="sm" variant="secondary" disabled={actionLoading !== null} onClick={handleCancel}>
                  {actionLoading === "cancel" ? "Cancelling..." : "Cancel"}
                </Button>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Pipeline Stages Breakdown */}
      {statusData && (
        <Card className="p-6 bg-slate border-slate-800 shadow-sm">
          <h3 className="text-sm font-bold text-soft-white mb-4">Pipeline Execution Stages</h3>

          <div className="space-y-3">
            {statusData.stages.map((stage) => {
              const isCompleted = stage.status === "Completed";
              const isStageProcessing = stage.status === "Processing";
              const isStageFailed = stage.status === "Failed";

              return (
                <div
                  key={stage.name}
                  className="flex items-center justify-between p-3.5 rounded-xl border border-slate-800 bg-midnight/50"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold ${
                        isCompleted
                          ? "bg-sage/20 text-sage"
                          : isStageProcessing
                          ? "bg-gold/20 text-gold animate-pulse"
                          : isStageFailed
                          ? "bg-coral/20 text-coral"
                          : "bg-slate text-cool-gray border border-slate-800"
                      }`}
                    >
                      {isCompleted ? "✓" : isStageProcessing ? "⟳" : isStageFailed ? "✕" : "•"}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-soft-white">{stage.name}</p>
                      {stage.detail && <p className="text-xs text-cool-gray mt-0.5">{stage.detail}</p>}
                    </div>
                  </div>

                  <span
                    className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                      isCompleted
                        ? "text-sage bg-sage/10"
                        : isStageProcessing
                        ? "text-gold bg-gold/10 animate-pulse font-semibold"
                        : isStageFailed
                        ? "text-coral bg-coral/10 font-semibold"
                        : "text-cool-gray bg-slate border border-slate-800"
                    }`}
                  >
                    {stage.status}
                  </span>
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
};
