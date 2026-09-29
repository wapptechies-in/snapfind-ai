import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { EventHeader } from "../../components/events/EventHeader";
import { Button, Card, LoadingSpinner } from "../../components/common";
import { QRPanel } from "../../components/events/QRPanel";
import { eventsApi } from "../../api";
import type { SnapEvent } from "../../types";

export const EventQR: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [event, setEvent] = useState<SnapEvent | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadEvent() {
      if (!id) return;
      setLoading(true);
      try {
        const found = await eventsApi.getById(id);
        setEvent(found);
      } catch (err) {
        console.error("Failed to load event for QR:", err);
      } finally {
        setLoading(false);
      }
    }
    loadEvent();
  }, [id]);

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <LoadingSpinner message="Generating QR code preview..." />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="max-w-4xl mx-auto py-8">
        <Card className="p-12 text-center bg-slate-panel border border-slate-800">
          <p className="text-sm text-muted">Event not found.</p>
          <Link to="/events" className="mt-4 inline-block">
            <Button size="sm">Back to Events</Button>
          </Link>
        </Card>
      </div>
    );
  }

  const handleRegenerateToken = async (newToken: string) => {
    const updated = await eventsApi.update(event.id, { token: newToken });
    setEvent(updated);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      <EventHeader event={event} />
      <QRPanel event={event} onRegenerateToken={handleRegenerateToken} />
    </div>
  );
};
export default EventQR;
