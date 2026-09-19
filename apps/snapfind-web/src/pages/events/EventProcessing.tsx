import { useEffect, useState } from "react";
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

  useEffect(() => {
    async function loadData() {
      if (!id) return;
      setLoading(true);
      try {
        const [eventData, jobData] = await Promise.all([
          eventsApi.getById(id),
          photosApi.getProcessingJob(id),
        ]);
        setEvent(eventData);
        setJob(jobData);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [id]);

  if (loading) {
    return (
      <DashboardLayout title="Photo Processing">
        <LoadingSpinner message="Checking pipeline status..." />
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

  return (
    <DashboardLayout title={`${event.name} — Processing`}>
      <EventHeader event={event} />

      {/* Mock Notice */}
      <div className="mb-6 flex items-center justify-between rounded-lg border border-hairline bg-panel2/50 p-3 text-xs text-dim">
        <div className="flex items-center gap-2">
          <span className="rounded bg-violet/20 px-1.5 py-0.5 text-[10px] font-semibold text-violet-light">
            MOCK PIPELINE
          </span>
          <span>
            This interface illustrates the background photo processing pipeline that will be executed by the SnapFind Desktop Processor and AI service.
          </span>
        </div>
      </div>

      <ProcessingProgress job={job} />
    </DashboardLayout>
  );
}
