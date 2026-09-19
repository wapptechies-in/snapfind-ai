import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import DashboardLayout from "../../layouts/DashboardLayout";
import { EventHeader } from "../../components/events/EventHeader";
import { Alert, Button, Card, Input, LoadingSpinner } from "../../components/common";
import { PhotoGrid } from "../../components/events/PhotoGrid";
import { PhotoUploadModal } from "../../components/events/PhotoUploadModal";
import { PhotoViewer } from "../../components/viewer/PhotoViewer";
import { eventsApi, photosApi } from "../../services/api";
import type { Photo, SnapEvent } from "../../types";

export default function EventPhotos() {
  const { id } = useParams<{ id: string }>();
  const [event, setEvent] = useState<SnapEvent | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  const loadData = useCallback(async () => {
    if (!id) return;
    try {
      const [eventData, photosData] = await Promise.all([
        eventsApi.getById(id),
        photosApi.getByEventId(id),
      ]);
      setEvent(eventData);
      setPhotos(photosData);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading) {
    return (
      <DashboardLayout title="Event Photos">
        <LoadingSpinner message="Loading photo gallery..." />
      </DashboardLayout>
    );
  }

  if (!event) {
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

  const filteredPhotos = photos.filter((p) =>
    p.filename.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <DashboardLayout title={`${event.name} — Photos`}>
      <EventHeader event={event} />

      {/* Storage Status Info */}
      <div className="mb-6 flex items-center justify-between rounded-lg border border-hairline bg-panel2/50 p-3 text-xs text-dim">
        <div className="flex items-center gap-2">
          <span className="rounded bg-emerald-500/20 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-400">
            OBJECT STORAGE
          </span>
          <span>
            Photos are stored securely in S3/MinIO with automatic 1920px web derivatives, thumbnails, and real-time AI face recognition indexing.
          </span>
        </div>
      </div>

      {notice && (
        <div className="mb-6">
          <Alert type="info" onClose={() => setNotice(null)}>
            {notice}
          </Alert>
        </div>
      )}

      {/* Photo Toolbar */}
      <Card className="p-4 mb-6 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="w-full sm:w-72">
          <Input
            placeholder="Search photos by filename..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-panel2"
          />
        </div>

        <div className="flex items-center justify-between w-full sm:w-auto gap-4 text-xs text-dim">
          <span>
            Showing <strong className="text-cloud">{filteredPhotos.length}</strong> of{" "}
            {photos.length} photos
          </span>
          <Button
            size="sm"
            variant="primary"
            onClick={() => setIsUploadModalOpen(true)}
          >
            <span>+</span> Upload Photos
          </Button>
        </div>
      </Card>

      {/* Modular Responsive Photo Grid */}
      <PhotoGrid
        photos={filteredPhotos}
        onPhotoClick={(index) => setSelectedPhotoIndex(index)}
        emptyTitle="No photos found"
        emptyDescription="No photos match your current search query."
        emptyActionLabel="Clear Search"
        onEmptyAction={() => setSearch("")}
      />

      {/* Fullscreen Photo Lightbox */}
      {selectedPhotoIndex !== null && (
        <PhotoViewer
          photos={filteredPhotos}
          currentIndex={selectedPhotoIndex}
          isOpen={selectedPhotoIndex !== null}
          onClose={() => setSelectedPhotoIndex(null)}
          onNavigate={(newIdx) => setSelectedPhotoIndex(newIdx)}
        />
      )}

      {/* Phase 6 Direct-to-Storage Uploader Modal */}
      <PhotoUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        eventId={event.id}
        eventName={event.name}
        onUploadSuccess={loadData}
      />
    </DashboardLayout>
  );
}
