import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import QRCode from "qrcode";
import { GalleryLayout } from "../../layouts/GalleryLayout";
import { Alert, Button, LoadingSpinner } from "../../components/common";
import { PhotoViewer } from "../../components/viewer/PhotoViewer";
import { billingApi, eventsApi, photosApi } from "../../services/api";
import type { Photo, SnapEvent } from "../../types";

export default function CustomerGallery() {
  const { token } = useParams<{ token: string }>();
  const [event, setEvent] = useState<SnapEvent | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null);

  // Favoriting System with localStorage persistence
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<"all" | "favorites">("all");

  // Share Modal & ZIP Download State
  const [showShareModal, setShowShareModal] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [downloadingZip, setDownloadingZip] = useState(false);
  const [toastNotice, setToastNotice] = useState<string | null>(null);

  // Phase 9: Guest Paywall & Digital Purchase State
  const [downloadToken, setDownloadToken] = useState<string | null>(() => {
    return token ? localStorage.getItem(`snapfind_dl_token_${token}`) : null;
  });
  const [unlockedGallery, setUnlockedGallery] = useState<boolean>(() => {
    return token ? localStorage.getItem(`snapfind_unlocked_${token}`) === "true" : false;
  });
  const [purchasedPhotoIds, setPurchasedPhotoIds] = useState<string[]>(() => {
    try {
      const data = token ? localStorage.getItem(`snapfind_purchased_photos_${token}`) : null;
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  });

  const [showPaywallModal, setShowPaywallModal] = useState(false);
  const [paywallTargetPhoto, setPaywallTargetPhoto] = useState<Photo | null>(null);
  const [paywallType, setPaywallType] = useState<"photo" | "gallery">("photo");
  const [guestEmail, setGuestEmail] = useState("");
  const [isProcessingCheckout, setIsProcessingCheckout] = useState(false);

  const qrCanvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    async function loadGallery() {
      if (!token) return;
      setLoading(true);
      try {
        const eventData = await eventsApi.getByToken(token);
        if (eventData) {
          setEvent(eventData);
          try {
            const publicRes = await eventsApi.getPublicPhotos(eventData.public_token || eventData.token || token);
            setPhotos(publicRes?.items || []);
          } catch (photoErr) {
            console.error("Failed to load public photos:", photoErr);
            setPhotos([]);
          }

          // Restore saved favorites for this specific event
          try {
            const savedFavs = localStorage.getItem(`snapfind_fav_${eventData.id}`);
            if (savedFavs) {
              setFavoriteIds(JSON.parse(savedFavs));
            }
          } catch {
            // Ignore parse errors
          }
        }
      } finally {
        setLoading(false);
      }
    }
    loadGallery();
  }, [token]);

  // Render QR Code in Share Modal
  useEffect(() => {
    if (showShareModal && qrCanvasRef.current) {
      const shareUrl = window.location.href;
      QRCode.toCanvas(
        qrCanvasRef.current,
        shareUrl,
        {
          width: 180,
          margin: 1.5,
          color: {
            dark: "#0F1117",
            light: "#FFFFFF",
          },
          errorCorrectionLevel: "H",
        },
        (error) => {
          if (error) console.error("Error rendering QR code canvas:", error);
        }
      );
    }
  }, [showShareModal]);

  const toggleFavorite = (photoId: string) => {
    setFavoriteIds((prev) => {
      const updated = prev.includes(photoId)
        ? prev.filter((id) => id !== photoId)
        : [...prev, photoId];
      if (event) {
        localStorage.setItem(`snapfind_fav_${event.id}`, JSON.stringify(updated));
      }
      return updated;
    });
  };

  const handleCopyLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 3000);
  };

  const handleDownloadAllZip = async () => {
    if (!event || downloadingZip) return;
    setDownloadingZip(true);
    try {
      setToastNotice(`Packaging all ${photos.length} photos into a ZIP archive...`);
      await eventsApi.downloadAllZip(event.token || event.id, "web");
      setToastNotice(`Successfully downloaded event photos (.zip)!`);
    } catch (err: unknown) {
      console.error("ZIP download failed:", err);
      const msg = err instanceof Error ? err.message : "Please try again.";
      setToastNotice(`Error downloading ZIP: ${msg}`);
    } finally {
      setDownloadingZip(false);
      setTimeout(() => setToastNotice(null), 5000);
    }
  };

  const handleDownloadFavoritesZip = async () => {
    if (favoriteIds.length === 0 || downloadingZip) return;
    setDownloadingZip(true);
    try {
      setToastNotice(`Packaging ${favoriteIds.length} favorite photos into a ZIP archive...`);
      await photosApi.downloadZip(favoriteIds, "web");
      setToastNotice(`Successfully downloaded ${favoriteIds.length} favorite photos!`);
    } catch (err: unknown) {
      console.error("Favorites ZIP download failed:", err);
      const msg = err instanceof Error ? err.message : "Please try again.";
      setToastNotice(`Error downloading ZIP: ${msg}`);
    } finally {
      setDownloadingZip(false);
      setTimeout(() => setToastNotice(null), 5000);
    }
  };

  const handleDownloadPhoto = async (photo: Photo) => {
    if (!event) return;

    const isPaywalled = event.settings?.paywallEnabled || event.paywallEnabled;
    const isUnlocked = unlockedGallery || purchasedPhotoIds.includes(photo.id);

    if (isPaywalled && !isUnlocked) {
      setPaywallTargetPhoto(photo);
      setPaywallType("photo");
      setShowPaywallModal(true);
      return;
    }

    try {
      setToastNotice(`Preparing high-res download for ${photo.filename}...`);
      const res = await photosApi.getPhotoUrl(photo.id, "original", true, downloadToken || undefined);
      if (res?.url) {
        window.open(res.url, "_blank");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Download failed.";
      alert(msg);
    }
  };

  const handleCompleteGuestCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!event || !guestEmail.trim()) return;

    setIsProcessingCheckout(true);
    try {
      const res = await billingApi.guestCheckout({
        eventId: event.id,
        photoId: paywallType === "photo" && paywallTargetPhoto ? paywallTargetPhoto.id : null,
        customerEmail: guestEmail.trim(),
        purchaseType: paywallType,
      });

      setDownloadToken(res.download_token);
      localStorage.setItem(`snapfind_dl_token_${event.token}`, res.download_token);

      if (paywallType === "gallery") {
        setUnlockedGallery(true);
        localStorage.setItem(`snapfind_unlocked_${event.token}`, "true");
        setToastNotice("Full gallery unlocked! You can now download all original high-res photos.");
      } else if (paywallTargetPhoto) {
        const nextIds = [...purchasedPhotoIds, paywallTargetPhoto.id];
        setPurchasedPhotoIds(nextIds);
        localStorage.setItem(`snapfind_purchased_photos_${event.token}`, JSON.stringify(nextIds));
        setToastNotice(`Photo ${paywallTargetPhoto.filename} unlocked! Downloading...`);

        // Trigger immediate download
        const urlRes = await photosApi.getPhotoUrl(paywallTargetPhoto.id, "original", true, res.download_token);
        if (urlRes?.url) {
          window.open(urlRes.url, "_blank");
        }
      }

      setShowPaywallModal(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Checkout failed.";
      alert(msg);
    } finally {
      setIsProcessingCheckout(false);
    }
  };

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

  if (event.isActive === false || event.status?.toLowerCase() === "inactive") {
    return (
      <GalleryLayout activeAction="gallery">
        <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 text-center">
          <div className="h-16 w-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-3xl text-amber-400 mb-4 shadow-inner">
            ⏸
          </div>
          <h2 className="text-2xl font-bold text-white">This event is currently unavailable</h2>
          <p className="mt-2 text-sm text-zinc-400 max-w-md">
            The organizer has temporarily marked this event as Inactive. Photos cannot be browsed or searched at this time.
          </p>
        </div>
      </GalleryLayout>
    );
  }

  const displayedPhotos =
    activeTab === "favorites"
      ? photos.filter((p) => favoriteIds.includes(p.id))
      : photos;

  const currentViewerPhoto =
    selectedPhotoIndex !== null ? displayedPhotos[selectedPhotoIndex] : null;

  return (
    <GalleryLayout event={event} activeAction="gallery">
      {/* Hero Header Section */}
      <section className="relative overflow-hidden border-b border-[#E8E2D8] bg-ivory px-4 py-14 sm:px-8 sm:py-20 text-center">
        <div className="max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold/10 px-3.5 py-1 text-xs font-semibold text-gold-darker shadow-sm">
            <span>✨</span>
            <span>Private Event Collection</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-serif font-bold tracking-tight text-midnight leading-tight">
            {event.name}
          </h1>

          <p className="text-sm sm:text-base text-muted">
            {event.eventType} Photography •{" "}
            {new Date(event.date).toLocaleDateString("en-US", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
          <p className="text-xs text-muted/80">{event.location}</p>

          {/* Primary Find My Photos Hero CTA & Share */}
          <div className="pt-6 flex flex-wrap items-center justify-center gap-3">
            <Link to={`/event/${event.token}/search`}>
              <button className="group relative inline-flex items-center gap-2.5 rounded-full bg-gold hover:bg-gold-light px-7 py-3 text-sm sm:text-base font-semibold text-midnight shadow-gold/20 shadow-md transition-all hover:scale-105 active:scale-95 cursor-pointer">
                <svg className="h-5 w-5 text-midnight" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="8" r="4" />
                  <path d="M6 20v-2a6 6 0 0112 0v2" />
                </svg>
                <span>Find My Photos</span>
                <span className="text-midnight/70 group-hover:translate-x-0.5 transition-transform">→</span>
              </button>
            </Link>

            <button
              onClick={() => setShowShareModal(true)}
              className="inline-flex items-center gap-2 rounded-full border border-[#E8E2D8] bg-white hover:bg-ivory px-5 py-3 text-sm font-medium text-midnight transition-colors shadow-sm cursor-pointer"
            >
              <svg className="h-4 w-4 text-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
              <span>Share Gallery</span>
            </button>
          </div>
          <p className="text-[11px] text-muted mt-2">
            Upload a quick selfie to discover every photo you appear in
          </p>
        </div>
      </section>

      {/* Gallery Section */}
      <section className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-8 py-8 space-y-6">
        {toastNotice && (
          <Alert type="success" onClose={() => setToastNotice(null)}>
            {toastNotice}
          </Alert>
        )}

        {/* Toolbar & Filter Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E8E2D8]">
          {/* Tabs: Public Gallery vs Favorites */}
          <div className="flex items-center gap-2 bg-white p-1 rounded-xl border border-[#E8E2D8] shadow-sm">
            <button
              onClick={() => setActiveTab("all")}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === "all"
                  ? "bg-gold text-midnight shadow-sm font-bold"
                  : "text-muted hover:text-midnight"
              }`}
            >
              <span>Public Gallery</span>
              <span className="rounded-full bg-midnight/10 px-1.5 py-0.2 text-[10px]">
                {photos.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("favorites")}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === "favorites"
                  ? "bg-coral text-white shadow-sm font-bold"
                  : "text-muted hover:text-midnight"
              }`}
            >
              <svg className="h-3.5 w-3.5 fill-current text-white" viewBox="0 0 24 24">
                <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              <span>Favorites</span>
              <span className="rounded-full bg-midnight/10 px-1.5 py-0.2 text-[10px]">
                {favoriteIds.length}
              </span>
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5">
            {activeTab === "favorites" ? (
              <Button
                size="sm"
                variant="primary"
                disabled={favoriteIds.length === 0 || downloadingZip}
                onClick={handleDownloadFavoritesZip}
                className="gap-2 text-xs bg-coral hover:bg-coral-light border-none text-white font-semibold"
              >
                {downloadingZip ? (
                  <>
                    <svg className="animate-spin h-3.5 w-3.5 text-white" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    <span>Downloading ZIP...</span>
                  </>
                ) : (
                  <>
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    <span>Download Favorites ({favoriteIds.length})</span>
                  </>
                )}
              </Button>
            ) : (
              <Button
                size="sm"
                variant="secondary"
                disabled={photos.length === 0 || downloadingZip}
                onClick={handleDownloadAllZip}
                className="gap-2 text-xs border-[#E8E2D8] bg-white text-midnight hover:bg-ivory"
              >
                {downloadingZip ? (
                  <>
                    <svg className="animate-spin h-3.5 w-3.5 text-midnight" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    <span>Downloading ZIP...</span>
                  </>
                ) : (
                  <>
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    <span>Download All ({photos.length})</span>
                  </>
                )}
              </Button>
            )}

            <Link to={`/event/${event.token}/search`}>
              <Button size="sm" variant="outline" className="border-[#E8E2D8] text-midnight hover:bg-ivory text-xs">
                Selfie Search
              </Button>
            </Link>
          </div>
        </div>

        {/* Empty State for Public Gallery */}
        {activeTab === "all" && displayedPhotos.length === 0 && (
          <div className="py-16 text-center border border-[#E8E2D8] rounded-2xl bg-white p-8 max-w-lg mx-auto space-y-4 shadow-sm">
            <div className="h-14 w-14 mx-auto rounded-full bg-gold/10 border border-gold/30 flex items-center justify-center text-2xl text-gold">
              📸
            </div>
            <div>
              <h3 className="text-base font-serif font-semibold text-midnight">Private Guest Search Active</h3>
              <p className="mt-1.5 text-xs text-muted leading-relaxed">
                The photographer has configured this event for private selfie search.
                Upload your selfie to automatically search and find every photograph you appear in!
              </p>
            </div>
            <div className="pt-2">
              <Link to={`/event/${event.token}/search`}>
                <Button size="sm" variant="primary" className="gap-2">
                  <span>📸</span>
                  <span>Find My Photos With Selfie</span>
                </Button>
              </Link>
            </div>
          </div>
        )}

        {/* Empty State for Favorites */}
        {activeTab === "favorites" && displayedPhotos.length === 0 && (
          <div className="py-16 text-center border border-[#E8E2D8] rounded-2xl bg-white p-8 max-w-lg mx-auto space-y-4 shadow-sm">
            <div className="h-12 w-12 mx-auto rounded-full bg-coral/10 border border-coral/20 flex items-center justify-center text-coral mb-3">
              <svg className="h-6 w-6 fill-current" viewBox="0 0 24 24">
                <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <h3 className="text-base font-serif font-semibold text-midnight">No favorites saved yet</h3>
            <p className="mt-1 text-xs text-muted max-w-sm mx-auto">
              Click the heart icon on any photo to save your personal picks and download them as a ZIP!
            </p>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setActiveTab("all")}
              className="mt-4 text-xs border-[#E8E2D8] text-midnight hover:bg-ivory"
            >
              Browse Public Gallery
            </Button>
          </div>
        )}

        {/* Responsive Photo Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5 sm:gap-4">
          {displayedPhotos.map((photo, index) => {
            const isFav = favoriteIds.includes(photo.id);

            return (
              <div
                key={photo.id}
                onClick={() => setSelectedPhotoIndex(index)}
                className={`group relative aspect-[3/2] sm:aspect-[4/3] rounded-2xl overflow-hidden bg-ivory cursor-pointer border transition-all shadow-sm ${
                  isFav
                    ? "border-coral ring-2 ring-coral/30"
                    : "border-[#E8E2D8] hover:border-gold/50"
                }`}
              >
                <img
                  src={photo.thumbnailUrl || photo.url}
                  alt={photo.filename}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                  onError={(e) => {
                    if (photo.url && e.currentTarget.src !== photo.url) {
                      e.currentTarget.src = photo.url;
                    }
                  }}
                />

                {/* Top-Right Favorite Heart Trigger */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFavorite(photo.id);
                  }}
                  aria-label={isFav ? "Remove favorite" : "Add to favorites"}
                  className={`absolute top-2.5 right-2.5 h-8 w-8 rounded-full flex items-center justify-center backdrop-blur-md transition-all cursor-pointer ${
                    isFav
                      ? "bg-coral text-white shadow-sm scale-100"
                      : "bg-midnight/50 text-white/80 hover:text-white hover:bg-midnight/70 opacity-80 group-hover:opacity-100"
                  }`}
                >
                  <svg
                    className={`h-4 w-4 transition-transform ${isFav ? "fill-white scale-110" : "fill-none scale-100"}`}
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                    />
                  </svg>
                </button>

                {/* Bottom Overlay Label */}
                <div className="absolute inset-0 bg-gradient-to-t from-midnight/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-between p-3 pointer-events-none">
                  <span className="text-xs font-medium text-soft-white truncate max-w-[70%]">
                    {photo.filename}
                  </span>
                  <span className="text-gold font-medium text-[11px]">
                    View
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Share Gallery Modal */}
      {showShareModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-midnight/70 backdrop-blur-sm animate-fade-in"
          onClick={() => setShowShareModal(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white border border-[#E8E2D8] p-6 shadow-2xl space-y-5 text-midnight"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#E8E2D8]">
              <div className="flex items-center gap-2">
                <span className="text-lg">✨</span>
                <h3 className="text-base font-serif font-bold text-midnight">Share Gallery</h3>
              </div>
              <button
                onClick={() => setShowShareModal(false)}
                className="h-7 w-7 rounded-lg bg-ivory hover:bg-slate-100 text-muted hover:text-midnight flex items-center justify-center cursor-pointer border border-[#E8E2D8]"
              >
                ✕
              </button>
            </div>

            {/* QR Code Canvas */}
            <div className="flex flex-col items-center justify-center py-2 space-y-2">
              <div className="p-3 bg-white rounded-2xl shadow-md border border-[#E8E2D8]">
                <canvas ref={qrCanvasRef} className="block" />
              </div>
              <p className="text-[11px] text-muted text-center">
                Point a phone camera at this QR code to view the gallery instantly on mobile
              </p>
            </div>

            {/* Copy Link Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted">Direct Gallery Link</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={window.location.href}
                  className="flex-1 rounded-xl bg-ivory border border-[#E8E2D8] px-3 py-2 text-xs font-mono text-midnight select-all focus:outline-none focus:border-gold"
                />
                <button
                  onClick={handleCopyLink}
                  className="rounded-xl bg-gold hover:bg-gold-light px-3.5 py-2 text-xs font-semibold text-midnight transition-colors flex items-center gap-1.5 shrink-0 shadow-sm cursor-pointer"
                >
                  {copiedLink ? (
                    <>
                      <span>✓</span>
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Social Share Buttons */}
            <div className="pt-2 border-t border-[#E8E2D8] flex items-center justify-between gap-2">
              {/* WhatsApp */}
              <a
                href={`https://api.whatsapp.com/send?text=${encodeURIComponent(
                  `Check out our photos from ${event.name}! ${window.location.href}`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 py-2.5 text-xs font-semibold text-emerald-800 transition-colors"
              >
                <span>WhatsApp</span>
              </a>

              {/* Twitter / X */}
              <a
                href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(
                  `Check out the photo gallery from ${event.name}:`
                )}&url=${encodeURIComponent(window.location.href)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-ivory hover:bg-slate-100 border border-[#E8E2D8] py-2.5 text-xs font-semibold text-midnight transition-colors"
              >
                <span>Twitter / X</span>
              </a>

              {/* Email */}
              <a
                href={`mailto:?subject=${encodeURIComponent(
                  `Photos from ${event.name}`
                )}&body=${encodeURIComponent(
                  `Hi,\n\nHere are the photos from ${event.name}:\n${window.location.href}\n\nEnjoy!`
                )}`}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-ivory hover:bg-slate-100 border border-[#E8E2D8] py-2.5 text-xs font-semibold text-midnight transition-colors"
              >
                <span>Email</span>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Fullscreen Photo Lightbox */}
      {selectedPhotoIndex !== null && currentViewerPhoto && (
        <PhotoViewer
          photos={displayedPhotos}
          currentIndex={selectedPhotoIndex}
          isOpen={selectedPhotoIndex !== null}
          onClose={() => setSelectedPhotoIndex(null)}
          onNavigate={(newIdx) => setSelectedPhotoIndex(newIdx)}
          isFavorite={favoriteIds.includes(currentViewerPhoto.id)}
          onToggleFavorite={(photo) => toggleFavorite(photo.id)}
          onDownload={handleDownloadPhoto}
        />
      )}

      {/* Guest Paywall Checkout Modal (Phase 9) */}
      {showPaywallModal && event && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-midnight/70 backdrop-blur-md animate-fade-in"
          onClick={() => setShowPaywallModal(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white border border-[#E8E2D8] p-6 shadow-2xl space-y-5 text-midnight"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#E8E2D8]">
              <div className="flex items-center gap-2">
                <span className="text-xl">💳</span>
                <div>
                  <h3 className="text-base font-serif font-bold text-midnight">Unlock High-Resolution</h3>
                  <p className="text-[11px] text-muted">Unwatermarked Original Quality</p>
                </div>
              </div>
              <button
                onClick={() => setShowPaywallModal(false)}
                className="h-7 w-7 rounded-lg bg-ivory hover:bg-slate-100 text-muted hover:text-midnight flex items-center justify-center cursor-pointer border border-[#E8E2D8]"
              >
                ✕
              </button>
            </div>

            {/* Option selector: Single Photo vs Full Gallery */}
            <div className="grid grid-cols-2 gap-2 p-1 bg-ivory rounded-xl border border-[#E8E2D8] text-xs">
              <button
                type="button"
                onClick={() => setPaywallType("photo")}
                className={`py-2 px-3 rounded-lg font-bold transition-all text-center cursor-pointer ${
                  paywallType === "photo"
                    ? "bg-gold text-midnight shadow-sm font-semibold"
                    : "text-muted hover:text-midnight"
                }`}
              >
                Single Photo ({event.currency} {event.photoPrice?.toFixed(2) || "4.99"})
              </button>
              <button
                type="button"
                onClick={() => setPaywallType("gallery")}
                className={`py-2 px-3 rounded-lg font-bold transition-all text-center cursor-pointer ${
                  paywallType === "gallery"
                    ? "bg-gold text-midnight shadow-sm font-semibold"
                    : "text-muted hover:text-midnight"
                }`}
              >
                All Photos ({event.currency} {event.galleryUnlockPrice?.toFixed(2) || "29.99"})
              </button>
            </div>

            {paywallType === "photo" && paywallTargetPhoto && (
              <div className="flex items-center gap-3 p-3 rounded-xl bg-ivory border border-[#E8E2D8]">
                <img
                  src={paywallTargetPhoto.thumbnailUrl || paywallTargetPhoto.url}
                  alt={paywallTargetPhoto.filename}
                  className="h-12 w-12 rounded-lg object-cover border border-[#E8E2D8]"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-midnight truncate">
                    {paywallTargetPhoto.filename}
                  </p>
                  <p className="text-[11px] text-gold-darker font-mono font-bold">
                    Full Resolution Original • {event.currency} {event.photoPrice?.toFixed(2) || "4.99"}
                  </p>
                </div>
              </div>
            )}

            {paywallType === "gallery" && (
              <div className="p-3 rounded-xl bg-gold/10 border border-gold/30 text-xs space-y-1">
                <p className="font-serif font-bold text-gold-darker">⭐ Full Gallery VIP Pass</p>
                <p className="text-muted text-[11px]">
                  Unlock unlimited high-resolution downloads for every photo in this entire event.
                </p>
              </div>
            )}

            {/* Checkout Form */}
            <form onSubmit={handleCompleteGuestCheckout} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-midnight mb-1">
                  Email Address for Receipt & Downloads *
                </label>
                <input
                  type="email"
                  required
                  placeholder="your.email@example.com"
                  value={guestEmail}
                  onChange={(e) => setGuestEmail(e.target.value)}
                  className="w-full rounded-xl bg-ivory border border-[#E8E2D8] px-3.5 py-2.5 text-xs text-midnight placeholder-muted/60 focus:outline-none focus:border-gold"
                />
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  disabled={isProcessingCheckout || !guestEmail.trim()}
                  className="w-full font-bold shadow-sm"
                >
                  {isProcessingCheckout
                    ? "Processing Secure Unlock…"
                    : `Pay ${event.currency} ${
                        paywallType === "gallery"
                          ? event.galleryUnlockPrice?.toFixed(2) || "29.99"
                          : event.photoPrice?.toFixed(2) || "4.99"
                      } & Instant Download`}
                </Button>
              </div>

              <div className="flex items-center justify-center gap-2 text-[10px] text-muted">
                <svg className="w-3.5 h-3.5 text-gold" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                <span>Encrypted Direct Studio Checkout • Instant Delivery</span>
              </div>
            </form>
          </div>
        </div>
      )}
    </GalleryLayout>
  );
}
