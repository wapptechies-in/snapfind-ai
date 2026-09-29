import React, { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Button, Card, LoadingSpinner, QRCodeModal } from "../../components/common";
import { EventHeader } from "../../components/events/EventHeader";
import { PhotoViewer } from "../../components/PhotoViewer";
import { PhotoUploadModal } from "../../components/PhotoUploadModal";
import { eventsApi, foldersApi, photosApi } from "../../api";
import { useApp } from "../../state/store";
import type { EventFolder, Photo, SnapEvent } from "../../types";

export const EventPhotos: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { setSelectedEvent } = useApp();

  const [event, setEvent] = useState<SnapEvent | null>(null);
  const [folders, setFolders] = useState<EventFolder[]>([]);
  const [activeFolderId, setActiveFolderId] = useState<string | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null);
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const [downloadingZip, setDownloadingZip] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<"all" | "public">("all");
  const [updatingVisibility, setUpdatingVisibility] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  // New folder modal state
  const [isNewFolderModalOpen, setIsNewFolderModalOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [folderError, setFolderError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      const evData = await eventsApi.getById(id);
      setEvent(evData);
      if (evData) {
        setSelectedEvent(evData);

        // Load folders
        try {
          const folderList = await foldersApi.list(evData.id);
          setFolders(folderList);
        } catch (fErr) {
          console.warn("Could not load folders:", fErr);
          setFolders([]);
        }

        // Load all photos
        try {
          const photoList = await photosApi.getByEventId(evData.id);
          setPhotos(photoList);
        } catch (photoErr) {
          console.warn("Could not load photos via getByEventId, falling back to list:", photoErr);
          try {
            const fallbackList = await photosApi.list(evData.id);
            setPhotos(fallbackList);
          } catch {
            setPhotos([]);
          }
        }
      }
    } catch (err) {
      console.error("Failed to load event photos:", err);
    } finally {
      setLoading(false);
    }
  }, [id, setSelectedEvent]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleScanFolder = () => {
    if (event) {
      setSelectedEvent(event);
      navigate("/scan");
    }
  };

  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!event) return;
    const cleanName = newFolderName.trim();
    if (!cleanName) return;

    try {
      setCreatingFolder(true);
      setFolderError(null);
      const created = await foldersApi.create(event.id, cleanName);
      setNewFolderName("");
      setIsNewFolderModalOpen(false);
      setActiveFolderId(created.id);
      await loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setFolderError(msg || "Failed to create folder");
    } finally {
      setCreatingFolder(false);
    }
  };

  const handleDeleteFolder = async (folder: EventFolder) => {
    if (!event) return;
    if (!confirm(`Delete folder "${folder.name}"? Photos will remain preserved under All Photos.`)) {
      return;
    }
    try {
      await foldersApi.delete(event.id, folder.id);
      if (activeFolderId === folder.id) {
        setActiveFolderId(null);
      }
      await loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      alert(`Failed to delete folder: ${msg}`);
    }
  };

  const handleDownloadZip = async () => {
    if (!event || !photos.length) return;
    try {
      setDownloadingZip(true);
      const ids = displayedPhotos.map((p) => p.id);
      await photosApi.downloadZip(ids, "web");
    } catch (err) {
      alert(`Download failed: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setDownloadingZip(false);
    }
  };

  const handleDeletePhoto = async (photo: Photo) => {
    try {
      await photosApi.delete(photo.id);
      setPhotos((prev) => prev.filter((p) => p.id !== photo.id));
      setSelectedPhotoIndex(null);
      await loadData();
    } catch (err) {
      alert(`Failed to delete: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  // Count photos published to customer public gallery
  const publicPhotosCount = photos.filter(
    (p) => Boolean(p.isPublicGallery || p.is_public_gallery)
  ).length;

  // Filter photos by active folder or public gallery tab, then by filename search
  const displayedPhotos = photos.filter((p) => {
    if (activeFolderId && (p.folderId || p.folder_id) !== activeFolderId) {
      return false;
    }
    if (activeTab === "public" && !(p.isPublicGallery || p.is_public_gallery)) {
      return false;
    }
    return true;
  });

  const filteredPhotos = displayedPhotos.filter((p) => {
    if (!search) return true;
    return p.filename.toLowerCase().includes(search.toLowerCase());
  });

  const activeFolder = folders.find((f) => f.id === activeFolderId);

  const handleToggleSelect = (photoId: string) => {
    setSelectedIds((prev) =>
      prev.includes(photoId) ? prev.filter((id) => id !== photoId) : [...prev, photoId]
    );
  };

  const handleSelectAll = () => {
    if (selectedIds.length === filteredPhotos.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredPhotos.map((p) => p.id));
    }
  };

  const handleToggleGalleryVisibility = async (photo: Photo) => {
    const isCurrentlyPublic = Boolean(photo.isPublicGallery || photo.is_public_gallery);
    const newVal = !isCurrentlyPublic;
    try {
      setNotice(newVal ? `Adding "${photo.filename}" to customer public gallery...` : `Hiding "${photo.filename}" from customer gallery...`);
      await photosApi.setGalleryVisibility(photo.id, newVal);
      setNotice(newVal ? `"${photo.filename}" published to Customer Gallery ✓` : `"${photo.filename}" hidden from Customer Gallery.`);
      setTimeout(() => setNotice(null), 3000);
      await loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setNotice(`Failed to update visibility: ${msg}`);
      setTimeout(() => setNotice(null), 4000);
    }
  };

  const handleBulkGalleryVisibility = async (isPublic: boolean) => {
    if (selectedIds.length === 0 || updatingVisibility || !event) return;
    try {
      setUpdatingVisibility(true);
      setNotice(isPublic ? `Publishing ${selectedIds.length} photos to Customer Gallery...` : `Hiding ${selectedIds.length} photos from Customer Gallery...`);
      await photosApi.setBulkGalleryVisibility(event.id, selectedIds, isPublic);
      setNotice(isPublic ? `Published ${selectedIds.length} photos to Public Gallery ✓` : `Hidden ${selectedIds.length} photos from Public Gallery.`);
      setSelectedIds([]);
      setTimeout(() => setNotice(null), 3500);
      await loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setNotice(`Bulk update failed: ${msg}`);
      setTimeout(() => setNotice(null), 4000);
    } finally {
      setUpdatingVisibility(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <LoadingSpinner message="Loading event photo gallery..." />
      </div>
    );
  }

  if (!event) {
    return (
      <Card className="p-12 text-center max-w-lg mx-auto mt-12">
        <p className="text-sm text-dim">Event could not be found.</p>
        <Link to="/events" className="mt-4 inline-block">
          <Button size="sm">Back to Events</Button>
        </Link>
      </Card>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {notice && (
        <div className="p-3.5 rounded-xl bg-slate border border-gold/30 text-xs text-gold flex items-center justify-between animate-fade-in font-medium">
          <span>{notice}</span>
          <button onClick={() => setNotice(null)} className="text-cool-gray hover:text-soft-white px-1 cursor-pointer">✕</button>
        </div>
      )}

      {/* Event Header with Unified Tabs */}
      <EventHeader event={event} />

      {/* Storage & Quick Actions Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-panel p-3.5 text-xs text-muted shadow-sm">
        <div className="flex items-center gap-2.5">
          <span className="rounded-md bg-gold/15 border border-gold/30 px-2 py-0.5 text-[10px] font-semibold text-gold uppercase tracking-wider">
            1 EVENT : 1 QR : N FOLDERS
          </span>
          <span>
            Photos in sub-folders are organized for easy studio management, while the single event QR code aggregates all photos for guests.
          </span>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
          <Button
            size="sm"
            variant="secondary"
            disabled={downloadingZip || !displayedPhotos.length}
            onClick={handleDownloadZip}
          >
            <svg className="w-3.5 h-3.5 mr-1 text-gold" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            {downloadingZip ? "Zipping…" : "Download ZIP"}
          </Button>

          <Button size="sm" variant="secondary" onClick={handleScanFolder}>
            <svg className="w-3.5 h-3.5 mr-1 text-gold" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
              <circle cx="12" cy="13" r="4" />
            </svg>
            Scan Folder
          </Button>

          <Button size="sm" variant="primary" onClick={() => setIsUploadModalOpen(true)} className="font-semibold shadow-xs">
            <svg className="w-3.5 h-3.5 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Upload Photos
          </Button>
        </div>
      </div>

      {/* Sub-Folders & Gallery Tabs Navigation Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-hairline pb-4">
        <div className="flex flex-wrap items-center gap-2">
          {/* All Photos Tab */}
          <button
            type="button"
            onClick={() => {
              setActiveFolderId(null);
              setActiveTab("all");
            }}
            className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold transition-all cursor-pointer ${
              activeFolderId === null && activeTab === "all"
                ? "bg-gold text-midnight font-bold shadow-md shadow-gold/10"
                : "bg-slate border border-hairline text-cool-gray hover:text-soft-white hover:border-gold/30"
            }`}
          >
            <span>🖼️ All Photos</span>
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                activeFolderId === null && activeTab === "all" ? "bg-midnight/20 text-midnight" : "bg-panel2 text-cool-gray"
              }`}
            >
              {photos.length}
            </span>
          </button>

          {/* Public Gallery Tab */}
          <button
            type="button"
            onClick={() => {
              setActiveFolderId(null);
              setActiveTab("public");
            }}
            className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold transition-all cursor-pointer ${
              activeFolderId === null && activeTab === "public"
                ? "bg-gold text-midnight font-bold shadow-md shadow-gold/10"
                : "bg-slate border border-hairline text-cool-gray hover:text-soft-white hover:border-gold/30"
            }`}
          >
            <span>🌐 Public Gallery</span>
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                activeFolderId === null && activeTab === "public" ? "bg-midnight/20 text-midnight" : "bg-panel2 text-cool-gray"
              }`}
            >
              {publicPhotosCount}
            </span>
          </button>

          {/* Folder Pills */}
          {folders.map((folder) => {
            const isActive = activeFolderId === folder.id;
            return (
              <div key={folder.id} className="group relative flex items-center">
                <button
                  type="button"
                  onClick={() => {
                    setActiveFolderId(folder.id);
                    setActiveTab("all");
                  }}
                  className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold transition-all cursor-pointer ${
                    isActive
                      ? "bg-gold text-midnight font-bold shadow-md shadow-gold/10"
                      : "bg-slate border border-hairline text-cool-gray hover:text-soft-white hover:border-gold/30"
                  }`}
                >
                  <span>📁 {folder.name}</span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      isActive ? "bg-midnight/20 text-midnight" : "bg-panel2 text-cool-gray"
                    }`}
                  >
                    {folder.photoCount}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteFolder(folder);
                  }}
                  title={`Delete folder "${folder.name}"`}
                  className="ml-1 hidden rounded p-1 text-cool-gray hover:bg-coral/20 hover:text-coral group-hover:inline-flex transition-colors"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            );
          })}
        </div>

        {/* Add Folder Action */}
        <Button
          size="sm"
          variant="secondary"
          onClick={() => {
            setFolderError(null);
            setNewFolderName("");
            setIsNewFolderModalOpen(true);
          }}
          className="flex items-center gap-1.5"
        >
          <span>+</span>
          <span>New Folder</span>
        </Button>
      </div>

      {/* Batch Selection Action Bar */}
      {selectedIds.length > 0 && (
        <Card className="p-3 mb-6 bg-slate border-gold/40 flex flex-wrap items-center justify-between gap-3 animate-fade-in shadow-lg">
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-soft-white">
              <strong className="text-gold font-bold">{selectedIds.length}</strong> of {filteredPhotos.length} selected
            </span>
            <button
              onClick={handleSelectAll}
              className="text-xs text-gold hover:underline font-semibold cursor-pointer"
            >
              {selectedIds.length === filteredPhotos.length ? "Deselect All" : "Select All"}
            </button>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="primary"
              disabled={updatingVisibility}
              onClick={() => handleBulkGalleryVisibility(true)}
              className="text-xs font-semibold shadow-xs"
            >
              🌐 Show in Client Gallery ({selectedIds.length})
            </Button>
            <Button
              size="sm"
              variant="secondary"
              disabled={updatingVisibility}
              onClick={() => handleBulkGalleryVisibility(false)}
              className="text-xs font-medium"
            >
              🔒 Hide from Client Gallery ({selectedIds.length})
            </Button>
          </div>
        </Card>
      )}

      {/* Filter and Stats Bar */}
      <div className="flex items-center justify-between gap-4 p-4 rounded-xl border border-hairline bg-slate shadow-xs">
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-soft-white">
            {activeTab === "public" ? (
              <>
                Showing <strong className="text-gold font-semibold">{filteredPhotos.length}</strong> of{" "}
                {publicPhotosCount} Public Gallery photos
              </>
            ) : activeFolder ? (
              <>
                Folder: <strong className="text-gold font-semibold">{activeFolder.name}</strong> •{" "}
                {displayedPhotos.length} {displayedPhotos.length === 1 ? "Photo" : "Photos"}
              </>
            ) : (
              <>
                {photos.length} {photos.length === 1 ? "Photo" : "Photos"} (All Folders)
              </>
            )}
          </span>
          <span className="text-xs text-cool-gray">•</span>
          <span className="text-xs text-cool-gray font-mono">
            {(displayedPhotos.reduce((sum, p) => sum + (p.fileSize || 0), 0) / (1024 * 1024)).toFixed(1)} MB total
          </span>
        </div>

        <div className="w-64">
          <input
            type="text"
            placeholder={activeTab === "public" ? "Filter public photos..." : activeFolder ? `Search in ${activeFolder.name}...` : "Filter by filename..."}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-3 py-1.5 rounded-lg border border-hairline bg-midnight text-xs text-soft-white placeholder:text-cool-gray/60 focus:border-gold focus:outline-none"
          />
        </div>
      </div>

      {/* Photo Grid */}
      {filteredPhotos.length === 0 ? (
        <Card className="p-12 text-center bg-slate border-hairline">
          <div className="mx-auto w-12 h-12 rounded-full bg-gold/10 text-gold flex items-center justify-center mb-3">
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
          </div>
          <h3 className="text-sm font-semibold text-soft-white">
            {activeTab === "public"
              ? "No photos in public gallery yet"
              : activeFolder
              ? `No photos in folder "${activeFolder.name}"`
              : "No photos in this album yet"}
          </h3>
          <p className="text-xs text-cool-gray mt-1 max-w-sm mx-auto">
            {activeTab === "public"
              ? "Select photos and click 'Show in Public Gallery' to curate what visitors see on the public customer page."
              : activeFolder
              ? `Upload photos into "${activeFolder.name}" to view them in this folder.`
              : "Upload individual photos or an entire folder to start populating this cloud gallery."}
          </p>
          <div className="mt-4 flex items-center justify-center gap-2">
            <Button size="sm" variant="primary" onClick={() => setIsUploadModalOpen(true)}>
              Upload Photos / Folder
            </Button>
            <Button size="sm" variant="secondary" onClick={handleScanFolder}>
              Scan Local Folder
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {filteredPhotos.map((photo, idx) => {
            const isSelected = selectedIds.includes(photo.id);
            const isPublic = Boolean(photo.isPublicGallery || photo.is_public_gallery);

            return (
              <div
                key={photo.id}
                onClick={() => setSelectedPhotoIndex(idx)}
                className={`group relative rounded-xl overflow-hidden border bg-slate aspect-square cursor-pointer transition-all duration-200 ${
                  isSelected
                    ? "border-gold ring-2 ring-gold/60 shadow-lg scale-102"
                    : "border-hairline hover:border-gold/50 hover:shadow-lg hover:scale-102"
                }`}
              >
                <img
                  src={photo.thumbnailUrl || photo.url}
                  alt={photo.filename}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />

                {/* Selection Checkbox */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToggleSelect(photo.id);
                  }}
                  className={`absolute top-2 right-2 h-6 w-6 rounded-md border flex items-center justify-center transition-all z-10 ${
                    isSelected
                      ? "bg-gold border-gold text-midnight shadow-md"
                      : "opacity-0 group-hover:opacity-100 bg-midnight/80 border-hairline text-transparent hover:border-gold"
                  }`}
                >
                  <svg className={`h-3.5 w-3.5 ${isSelected ? "text-midnight" : "text-transparent"}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <path d="M5 13l4 4L19 7" />
                  </svg>
                </button>

                {/* Top-left Badges */}
                <div className="absolute top-2 left-2 z-10 flex flex-col gap-1 items-start">
                  {isPublic && (
                    <span className="rounded-md px-1.5 py-0.5 text-[9px] font-bold backdrop-blur-md bg-sage/90 border border-sage text-midnight flex items-center gap-1 shadow-sm">
                      <span>🌐</span> Public
                    </span>
                  )}
                </div>

                {/* Bottom Overlay Actions */}
                <div className="absolute inset-0 bg-gradient-to-t from-midnight/90 via-midnight/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-2.5">
                  <p className="text-[11px] font-semibold text-soft-white truncate">{photo.filename}</p>
                  <div className="flex items-center justify-between text-[9px] text-cool-gray font-mono mt-1">
                    <span>{((photo.fileSize || 0) / (1024 * 1024)).toFixed(1)} MB</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleGalleryVisibility(photo);
                      }}
                      className={`px-1.5 py-0.5 rounded font-sans text-[10px] font-semibold border transition-all ${
                        isPublic
                          ? "bg-sage hover:bg-coral text-midnight hover:text-white border-sage hover:border-coral"
                          : "bg-midnight/70 hover:bg-gold hover:text-midnight text-cool-gray border-hairline"
                      }`}
                    >
                      {isPublic ? "🌐 Public" : "+ Public"}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Fullscreen Photo Viewer */}
      {selectedPhotoIndex !== null && (
        <PhotoViewer
          photos={filteredPhotos}
          currentIndex={selectedPhotoIndex}
          isOpen={true}
          onClose={() => setSelectedPhotoIndex(null)}
          onNavigate={(newIdx) => setSelectedPhotoIndex(newIdx)}
          onDelete={handleDeletePhoto}
        />
      )}

      {/* QR Code Modal */}
      {isQRModalOpen && (
        <QRCodeModal
          isOpen={isQRModalOpen}
          onClose={() => setIsQRModalOpen(false)}
          event={event}
        />
      )}

      {/* Photo Upload Modal (Supports Individual Files and Entire Folder) */}
      <PhotoUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        eventId={event.id}
        eventName={event.name}
        activeFolderId={activeFolderId}
        folders={folders}
        onUploadSuccess={loadData}
      />

      {/* New Folder Modal */}
      {isNewFolderModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-xl border border-hairline bg-slate p-6 shadow-2xl">
            <h3 className="text-base font-semibold text-soft-white">Create Sub-Folder</h3>
            <p className="mt-1 text-xs text-cool-gray">
              Organize event photos by segment (e.g. Ceremony, Reception, Portraits).
            </p>

            <form onSubmit={handleCreateFolder} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-medium text-cool-gray mb-1">
                  Folder Name
                </label>
                <input
                  autoFocus
                  placeholder="e.g. Ceremony, Reception, Portraits"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-hairline bg-midnight text-xs text-soft-white placeholder:text-cool-gray/60 focus:border-gold focus:outline-none"
                />
              </div>

              {folderError && (
                <p className="text-xs text-coral">{folderError}</p>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={() => setIsNewFolderModalOpen(false)}
                  disabled={creatingFolder}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  variant="primary"
                  disabled={creatingFolder || !newFolderName.trim()}
                >
                  {creatingFolder ? "Creating..." : "Create Folder"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventPhotos;

