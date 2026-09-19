import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import DashboardLayout from "../../layouts/DashboardLayout";
import { EventHeader } from "../../components/events/EventHeader";
import { Button, Card, LoadingSpinner } from "../../components/common";
import { QRPanel } from "../../components/events/QRPanel";
import { eventsApi } from "../../services/api";
import type { SnapEvent } from "../../types";

export default function EventQR() {
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
      } finally {
        setLoading(false);
      }
    }
    loadEvent();
  }, [id]);

  if (loading) {
    return (
      <DashboardLayout title="QR Management">
        <LoadingSpinner message="Generating QR code preview..." />
      </DashboardLayout>
    );
  }

  if (!event) {
    return (
      <DashboardLayout title="Event Not Found">
        <Card className="p-12 text-center">
          <p className="text-sm text-dim">Event not found.</p>
          <Link to="/events" className="mt-4 inline-block">
            <Button size="sm">Back to Events</Button>
          </Link>
        </Card>
      </DashboardLayout>
    );
  }

  const handleRegenerateToken = async (newToken: string) => {
    const updated = await eventsApi.update(event.id, { token: newToken });
    setEvent(updated);
  };

  return (
    <DashboardLayout title={`${event.name} — QR Management`}>
      <EventHeader event={event} />

      <QRPanel event={event} onRegenerateToken={handleRegenerateToken} />
    </DashboardLayout>
  );
}
