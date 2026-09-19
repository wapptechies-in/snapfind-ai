import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { GalleryLayout } from "../../layouts/GalleryLayout";
import { Button, LoadingSpinner } from "../../components/common";
import { PhotoViewer } from "../../components/viewer/PhotoViewer";
import { eventsApi, photosApi } from "../../services/api";
import type { Photo, SnapEvent } from "../../types";

export default function CustomerGallery() {
  const { token } = useParams<{ token: string }>();
  const [event, setEvent] = useState<SnapEvent | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null);

  useEffect(() => {
    async function loadGallery() {
      if (!token) return;
      setLoading(true);
      try {
        const eventData = await eventsApi.getByToken(token);
        if (eventData) {
          setEvent(eventData);
          const photoData = await photosApi.getByEventId(eventData.id);
          setPhotos(photoData);
        }
      } finally {
        setLoading(false);
      }
    }
    loadGallery();
  }, [token]);

  if (loading) {
    return (
      <GalleryLayout activeAction="gallery">
        <LoadingSpinner message="Loading private event gallery..." className="min-h-[60vh]" />
      </GalleryLayout>
    );
  }

  if (!event) {
    return (
      <GalleryLayout activeAction="gallery">
        <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 text-center">
          <div className="h-12 w-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-xl text-zinc-400 mb-4">
            ✕
          </div>
          <h2 className="text-xl font-bold text-white">Event Gallery Not Found</h2>
          <p className="mt-1 text-sm text-zinc-400 max-w-sm">
            Please check the QR code or link you received and try again.
          </p>
        </div>
      </GalleryLayout>
    );
  }

  return (
    <GalleryLayout event={event} activeAction="gallery">
      {/* Hero Header Section */}
      <section className="relative overflow-hidden border-b border-white/10 bg-gradient-to-b from-[#0e1219] to-[#07090D] px-4 py-16 sm:px-8 sm:py-24 text-center">
        <div className="max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-violet/30 bg-violet/10 px-3.5 py-1 text-xs font-semibold text-violet-light">
            <span>✨</span>
            <span>Private Event Collection</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-serif font-bold tracking-tight text-white leading-tight">
            {event.name}
          </h1>

          <p className="text-sm sm:text-base text-zinc-400">
            {event.eventType} Photography • {new Date(event.date).toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric" })}
          </p>
          <p className="text-xs text-zinc-500">{event.location}</p>

          {/* Primary Find My Photos Hero CTA */}
          <div className="pt-6">
            <Link to={`/event/${event.token}/search`}>
              <button className="group relative inline-flex items-center gap-3 rounded-full bg-gradient-to-r from-violet to-violet-light px-7 py-3.5 text-sm sm:text-base font-semibold text-white shadow-xl shadow-violet/25 transition-all hover:scale-105 active:scale-95">
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="8" r="4" />
                  <path d="M6 20v-2a6 6 0 0112 0v2" />
                </svg>
                <span>Find My Photos</span>
                <span className="text-white/70 group-hover:translate-x-0.5 transition-transform">→</span>
              </button>
            </Link>
            <p className="text-[11px] text-zinc-500 mt-2">
              Upload a quick selfie to discover every photo you appear in
            </p>
          </div>
        </div>
      </section>

      {/* Gallery Section */}
      <section className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-8 py-10">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold text-white">Event Photos</h2>
            <p className="text-xs text-zinc-400">
              Browse the complete collection ({photos.length} photos)
            </p>
          </div>

          <Link to={`/event/${event.token}/search`}>
            <Button size="sm" variant="outline" className="border-white/15 text-zinc-300 hover:text-white">
              Selfie Search
            </Button>
          </Link>
        </div>

        {/* Responsive Photo Grid with Masonry/Grid feel */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
          {photos.map((photo, index) => (
            <div
              key={photo.id}
              onClick={() => setSelectedPhotoIndex(index)}
              className="group relative aspect-[3/2] sm:aspect-[4/3] rounded-xl overflow-hidden bg-zinc-900 cursor-pointer border border-white/5 hover:border-violet/40 transition-all shadow-lg"
            >
              <img
                src={photo.thumbnailUrl}
                alt={photo.filename}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                <span className="text-xs font-medium text-zinc-200 truncate">
                  View Photo
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Fullscreen Photo Lightbox */}
      {selectedPhotoIndex !== null && (
        <PhotoViewer
          photos={photos}
          currentIndex={selectedPhotoIndex}
          isOpen={selectedPhotoIndex !== null}
          onClose={() => setSelectedPhotoIndex(null)}
          onNavigate={(newIdx) => setSelectedPhotoIndex(newIdx)}
        />
      )}
    </GalleryLayout>
  );
}

