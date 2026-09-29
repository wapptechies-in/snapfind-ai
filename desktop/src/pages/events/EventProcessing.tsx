import React, { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { EventHeader } from "../../components/events/EventHeader";
import { Button, Card, LoadingSpinner } from "../../components/common";
import { ProcessingProgress } from "../../components/events/ProcessingProgress";
import { eventsApi, photosApi } from "../../api";
import type { ProcessingJob, SnapEvent } from "../../types";

export const EventProcessing: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [event, setEvent] = useState<SnapEvent | null>(null);
  const [job, setJob] = useState<ProcessingJob | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const fetchJobStatus = useCallback(async (eventId: string) => {
    try {
      const jobData = await photosApi.getProcessingJob(eventId);
      setJob(jobData);
      setLastUpdated(new Date());
      return jobData;
    } catch (err) {
      console.warn("Error updating processing job status:", err);
    }
  }, []);

  // Initial load
  useEffect(() => {
    async function loadInitialData() {
      if (!id) return;
      setLoading(true);
      try {
        const [eventData, jobData] = await Promise.all([
          eventsApi.getById(id),
          photosApi.getProcessingJob(id),
        ]);
        setEvent(eventData);
        setJob(jobData);
        setLastUpdated(new Date());
      } catch (err) {
        console.error("Error loading processing data:", err);
      } finally {
        setLoading(false);
      }
    }
    loadInitialData();
  }, [id]);

  // Real-time polling every 2.5s
  useEffect(() => {
    if (!id) return;
    const interval = setInterval(() => {
      fetchJobStatus(id);
    }, 2500);

    return () => clearInterval(interval);
  }, [id, fetchJobStatus]);

  const handleStart = async () => {
    if (!id) return;
    setActionLoading("start");
    setFeedback(null);
    try {
      const res = await photosApi.startProcessing(id);
      setFeedback({ type: "success", text: res.message || "Processing started" });
      await fetchJobStatus(id);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to start processing";
      setFeedback({ type: "error", text: msg });
    } finally {
      setActionLoading(null);
    }
  };

  const handleReprocess = async () => {
    if (!id) return;
    if (!window.confirm("Are you sure you want to re-process all photos? This will re-calculate derivatives and facial embeddings.")) {
      return;
    }
    setActionLoading("reprocess");
    setFeedback(null);
    try {
      const res = await photosApi.reprocessEvent(id);
      setFeedback({ type: "success", text: res.message || "Reprocessing started" });
      await fetchJobStatus(id);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to trigger re-processing";
      setFeedback({ type: "error", text: msg });
    } finally {
      setActionLoading(null);
    }
  };

  const handleRetryFailed = async () => {
    if (!id) return;
    setActionLoading("retry");
    setFeedback(null);
    try {
      const res = await photosApi.retryFailedPhotos(id);
      setFeedback({ type: "success", text: res.message || "Retrying failed photos" });
      await fetchJobStatus(id);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to retry photos";
      setFeedback({ type: "error", text: msg });
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancel = async () => {
    if (!id) return;
    setActionLoading("cancel");
    setFeedback(null);
    try {
      const res = await photosApi.cancelProcessing(id);
      setFeedback({ type: "success", text: res.message || "Processing cancelled" });
      await fetchJobStatus(id);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to cancel processing";
      setFeedback({ type: "error", text: msg });
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <LoadingSpinner message="Checking background pipeline status..." />
      </div>
    );
  }

  if (!event || !job) {
    return (
      <div className="max-w-4xl mx-auto py-8">
        <Card className="p-12 text-center bg-slate-panel border border-slate-800">
          <p className="text-sm text-muted">Event could not be found.</p>
          <Link to="/events" className="mt-4 inline-block">
            <Button size="sm">Back to Events</Button>
          </Link>
        </Card>
      </div>
    );
  }

  const isProcessing = job.status === "processing" || job.status === "queued" || job.status === "running";
  const hasFailedPhotos = typeof job.failed === "number" && job.failed > 0;
  const hasPendingPhotos = ((job.remaining ?? 0) > 0) && !isProcessing;

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      <EventHeader event={event} />

      {/* Live Pipeline Status Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-panel p-3.5 text-xs text-muted shadow-sm">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-gold/10 px-2.5 py-0.5 text-[11px] font-semibold text-gold">
            <span className="h-1.5 w-1.5 rounded-full bg-gold animate-ping" />
            AI Pipeline Engine: Active
          </span>
          <span>•</span>
          <span className="text-soft-white font-medium">Automatic face clustering and web derivatives enabled</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-muted">
            Updated {lastUpdated.toLocaleTimeString()}
          </span>
          <button
            onClick={() => id && fetchJobStatus(id)}
            className="text-[11px] text-gold hover:underline cursor-pointer"
          >
            Refresh
          </button>
        </div>
      </div>

      {feedback && (
        <div
          className={`p-3.5 rounded-xl text-xs font-semibold flex items-center justify-between animate-fade-in ${
            feedback.type === "success"
              ? "bg-sage/15 text-sage border border-sage/30"
              : "bg-coral/15 text-coral border border-coral/30"
          }`}
        >
          <span>{feedback.text}</span>
          <button
            onClick={() => setFeedback(null)}
            className="text-muted hover:text-soft-white cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Action Controls Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl border border-slate-800 bg-slate-panel">
        <div className="flex items-center gap-2">
          {hasPendingPhotos && (
            <Button
              variant="primary"
              size="sm"
              loading={actionLoading === "start"}
              onClick={handleStart}
            >
              Start Processing ({job.remaining} photos)
            </Button>
          )}

          {isProcessing && (
            <Button
              variant="danger"
              size="sm"
              loading={actionLoading === "cancel"}
              onClick={handleCancel}
            >
              Cancel Pipeline
            </Button>
          )}

          {hasFailedPhotos && (
            <Button
              variant="secondary"
              size="sm"
              loading={actionLoading === "retry"}
              onClick={handleRetryFailed}
              className="text-coral hover:text-coral border-coral/30"
            >
              Retry Failed ({job.failed})
            </Button>
          )}

          <Button
            variant="ghost"
            size="sm"
            loading={actionLoading === "reprocess"}
            onClick={handleReprocess}
            disabled={isProcessing}
          >
            Force Re-process All Photos
          </Button>
        </div>

        <Link to={`/events/${id}/photos`}>
          <Button variant="secondary" size="sm">
            View Photo Gallery →
          </Button>
        </Link>
      </div>

      {/* Pipeline Progress Component */}
      <ProcessingProgress job={job} />
    </div>
  );
};
export default EventProcessing;
