import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import DashboardLayout from "../../layouts/DashboardLayout";
import { EventHeader } from "../../components/events/EventHeader";
import { Button, Card, LoadingSpinner } from "../../components/common";
import { ProcessingProgress } from "../../components/events/ProcessingProgress";
import { eventsApi, photosApi } from "../../services/api";
import type { ProcessingJob, SnapEvent } from "../../types";

export default function EventProcessing() {
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
      <DashboardLayout title="Photo Processing">
        <LoadingSpinner message="Checking background pipeline status..." />
      </DashboardLayout>
    );
  }

  if (!event || !job) {
    return (
      <DashboardLayout title="Event Not Found">
        <Card className="p-12 text-center">
          <p className="text-sm text-dim">Event could not be found.</p>
          <Link to="/events" className="mt-4 inline-block">
            <Button size="sm">Back to Events</Button>
          </Link>
        </Card>
      </DashboardLayout>
    );
  }

  const isProcessing = job.status === "processing" || job.status === "queued" || job.status === "running";
  const hasFailedPhotos = typeof job.failed === "number" && job.failed > 0;
  const hasPendingPhotos = ((job.remaining ?? 0) > 0) && !isProcessing;

  return (
    <DashboardLayout title={`${event.name} — Processing`}>
      <EventHeader event={event} />

      {/* Live Pipeline Status Banner */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-warm-beige bg-surface p-3.5 text-xs text-charcoal-muted shadow-sm">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-forest/10 px-2.5 py-0.5 text-[11px] font-semibold text-forest">
            <span className="h-1.5 w-1.5 rounded-full bg-forest animate-ping" />
            LIVE PIPELINE
          </span>
          <span className="text-charcoal font-medium">
            Async worker pool active &middot; Derivatives &amp; vector embeddings
          </span>
        </div>
        <div className="flex items-center gap-3 text-charcoal-muted text-[11px]">
          <span>Polling live every 2.5s</span>
          <span>&middot;</span>
          <span>Updated {lastUpdated.toLocaleTimeString()}</span>
          <button
            onClick={() => id && fetchJobStatus(id)}
            className="text-forest hover:underline font-semibold transition-colors cursor-pointer"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Feedback Message */}
      {feedback && (
        <div
          className={`mb-6 p-3.5 rounded-xl border text-xs flex items-center justify-between shadow-sm ${
            feedback.type === "success"
              ? "bg-forest/10 border-forest/20 text-forest"
              : "bg-danger/10 border-danger/20 text-danger"
          }`}
        >
          <span>{feedback.text}</span>
          <button
            onClick={() => setFeedback(null)}
            className="text-charcoal-muted hover:text-charcoal ml-3 text-sm cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Pipeline Action Controls */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 p-5 rounded-2xl border border-warm-beige bg-surface shadow-sm">
        <div>
          <h4 className="text-sm font-serif font-semibold text-charcoal">Pipeline Controls</h4>
          <p className="text-xs text-charcoal-muted mt-0.5">
            Trigger batch inference, re-generate derivatives, or retry failed items.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {hasPendingPhotos && (
            <Button
              size="sm"
              variant="primary"
              disabled={actionLoading !== null}
              onClick={handleStart}
            >
              {actionLoading === "start" ? "Starting..." : "Start Processing"}
            </Button>
          )}

          <Button
            size="sm"
            variant="secondary"
            disabled={actionLoading !== null}
            onClick={handleReprocess}
          >
            {actionLoading === "reprocess" ? "Dispatching..." : "Reprocess All Photos"}
          </Button>

          {hasFailedPhotos && (
            <Button
              size="sm"
              variant="danger"
              disabled={actionLoading !== null}
              onClick={handleRetryFailed}
            >
              {actionLoading === "retry" ? "Retrying..." : `Retry Failed (${job.failed})`}
            </Button>
          )}

          {isProcessing && (
            <Button
              size="sm"
              variant="secondary"
              disabled={actionLoading !== null}
              onClick={handleCancel}
            >
              {actionLoading === "cancel" ? "Cancelling..." : "Cancel"}
            </Button>
          )}
        </div>
      </div>

      <ProcessingProgress job={job} />
    </DashboardLayout>
  );
}
