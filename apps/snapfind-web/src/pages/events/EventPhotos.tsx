import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import DashboardLayout from "../../layouts/DashboardLayout";
import { EventHeader } from "../../components/events/EventHeader";
import { Alert, Button, Card, Input, LoadingSpinner } from "../../components/common";
import { PhotoGrid } from "../../components/events/PhotoGrid";
import { PhotoUploadModal } from "../../components/events/PhotoUploadModal";
import { PhotoViewer } from "../../components/viewer/PhotoViewer";
import { eventsApi, foldersApi, photosApi } from "../../services/api";
import type { EventFolder, Photo, SnapEvent } from "../../types";

export default function EventPhotos() {
  const { id } = useParams<{ id: string }>();
  const [event, setEvent] = useState<SnapEvent | null>(null);
  const [folders, setFolders] = useState<EventFolder[]>([]);
  const [activeFolderId, setActiveFolderId] = useState<string | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<"all" | "public">("all");
  const [updatingVisibility, setUpdatingVisibility] = useState(false);

  // New Folder Modal states
  const [isNewFolderModalOpen, setIsNewFolderModalOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [folderError, setFolderError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      const eventData = await eventsApi.getById(id);
      setEvent(eventData);

      if (eventData) {
        // Parallelize folder and photo metadata fetching for instant page load
        const [folderList, photosData] = await Promise.all([
          foldersApi.list(eventData.id).catch((fErr) => {
            console.warn("Could not load folders:", fErr);
            return [] as EventFolder[];
          }),
          photosApi.getByEventId(eventData.id).catch(async (photoErr) => {
            console.warn("Could not load photos via getByEventId, falling back to list:", photoErr);
            return photosApi.list(eventData.id).catch(() => [] as Photo[]);
          }),
        ]);
        setFolders(folderList);
        setPhotos(photosData);
      }
    } catch (err) {
      console.error("Failed to load event:", err);
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

  const filteredPhotos = displayedPhotos.filter((p) =>
    p.filename.toLowerCase().includes(search.toLowerCase())
  );

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
      setNotice(newVal ? `Publishing "${photo.filename}" to customer gallery...` : `Hiding "${photo.filename}" from customer gallery...`);
      await photosApi.setGalleryVisibility(photo.id, newVal);
      setNotice(newVal ? `"${photo.filename}" is now published to Public Gallery ✓` : `"${photo.filename}" hidden from Public Gallery.`);
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

  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = newFolderName.trim();
    if (!cleanName) return;

    try {
      setCreatingFolder(true);
      setFolderError(null);
      const created = await foldersApi.create(event.id, cleanName);
      setNewFolderName("");
      setIsNewFolderModalOpen(false);
      setActiveFolderId(created.id);
      setNotice(`Sub-folder "${created.name}" created.`);
      setTimeout(() => setNotice(null), 3000);
      await loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to create folder";
      setFolderError(msg);
    } finally {
      setCreatingFolder(false);
    }
  };

  const handleDeleteFolder = async (folder: EventFolder) => {
    if (!confirm(`Are you sure you want to delete folder "${folder.name}"? Photos will be preserved under All Photos.`)) {
      return;
    }
    try {
      await foldersApi.delete(event.id, folder.id);
      if (activeFolderId === folder.id) {
        setActiveFolderId(null);
      }
      setNotice(`Folder "${folder.name}" deleted.`);
      setTimeout(() => setNotice(null), 3000);
      await loadData();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setNotice(`Failed to delete folder: ${message}`);
      setTimeout(() => setNotice(null), 3000);
    }
  };

  const handleDeletePhoto = async (photo: Photo) => {
    try {
      await photosApi.delete(photo.id);
      setNotice(`Successfully deleted ${photo.filename}.`);
      setTimeout(() => setNotice(null), 3000);
      setSelectedPhotoIndex(null);
      await loadData();
    } catch {
      setNotice(`Failed to delete ${photo.filename}.`);
      setTimeout(() => setNotice(null), 3000);
    }
  };

  return (
    <DashboardLayout title={`${event.name} — Photos`}>
      <EventHeader event={event} />

      {/* Storage & Folder Relationship Info */}
      <div className="mb-6 flex items-center justify-between rounded-xl border border-gold/20 bg-slate/60 p-3.5 text-xs text-cool-gray">
        <div className="flex items-center gap-2.5">
          <span className="rounded-md bg-gold/15 border border-gold/30 px-2 py-0.5 text-[10px] font-semibold text-gold uppercase tracking-wider">
            1 EVENT : 1 QR : N FOLDERS
          </span>
          <span>
            Photos in sub-folders are organized for easy studio management, while the single event QR code aggregates all photos for guests.
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

      {/* Sub-Folders & Gallery Tabs Navigation Bar */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-hairline pb-4">
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

          {/* Public Customer Gallery Tab */}
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

          {/* Sub-folder Pills */}
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
                  className="ml-1 hidden rounded-lg p-1 text-cool-gray hover:bg-coral/20 hover:text-coral group-hover:inline-flex transition-colors cursor-pointer"
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

      {/* Photo Toolbar */}
      <Card className="p-4 mb-6 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate border-hairline shadow-xs">
        <div className="w-full sm:w-72">
          <Input
            placeholder={`Search ${activeTab === "public" ? "public gallery" : activeFolder ? activeFolder.name : "all"} photos...`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex items-center justify-between w-full sm:w-auto gap-4 text-xs text-cool-gray font-medium">
          <span>
            {activeTab === "public" ? (
              <>
                Showing <strong className="text-gold font-semibold">{filteredPhotos.length}</strong> of{" "}
                {publicPhotosCount} Public Gallery photos
              </>
            ) : activeFolder ? (
              <>
                Folder: <strong className="text-soft-white font-semibold">{activeFolder.name}</strong> •{" "}
                Showing <strong className="text-soft-white font-semibold">{filteredPhotos.length}</strong> of {displayedPhotos.length}
              </>
            ) : (
              <>
                Showing <strong className="text-soft-white font-semibold">{filteredPhotos.length}</strong> of{" "}
                {photos.length} photos across all folders
              </>
            )}
          </span>
          <Button
            size="sm"
            variant="primary"
            onClick={() => setIsUploadModalOpen(true)}
            className="font-semibold shadow-xs"
          >
            <span>+</span> Upload to {activeFolder ? activeFolder.name : "Event"}
          </Button>
        </div>
      </Card>

      {/* Modular Responsive Photo Grid */}
      <PhotoGrid
        photos={filteredPhotos}
        onPhotoClick={(index) => setSelectedPhotoIndex(index)}
        selectable={true}
        selectedIds={selectedIds}
        onToggleSelect={handleToggleSelect}
        onToggleGalleryVisibility={handleToggleGalleryVisibility}
        onDeletePhoto={handleDeletePhoto}
        coverImageUrl={event.coverImage}
        emptyTitle={activeFolder ? `No photos in folder "${activeFolder.name}"` : "No photos found"}
        emptyDescription={
          search
            ? "No photos match your current search query."
            : activeFolder
            ? `Upload photos into "${activeFolder.name}" to view them in this sub-folder.`
            : "Upload photos to start populating this event gallery."
        }
        emptyActionLabel={search ? "Clear Search" : `Upload to ${activeFolder ? activeFolder.name : "Event"}`}
        onEmptyAction={search ? () => setSearch("") : () => setIsUploadModalOpen(true)}
      />

      {/* Fullscreen Photo Lightbox */}
      {selectedPhotoIndex !== null && (
        <PhotoViewer
          photos={filteredPhotos}
          currentIndex={selectedPhotoIndex}
          isOpen={selectedPhotoIndex !== null}
          onClose={() => setSelectedPhotoIndex(null)}
          onNavigate={(newIdx) => setSelectedPhotoIndex(newIdx)}
          onDelete={handleDeletePhoto}
        />
      )}

      {/* Direct-to-Storage Uploader Modal */}
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
          <div className="w-full max-w-sm rounded-xl border border-hairline bg-panel p-6 shadow-2xl">
            <h3 className="text-base font-semibold text-cloud">Create Sub-Folder</h3>
            <p className="mt-1 text-xs text-dim">
              Organize event photos by segment (e.g. Ceremony, Reception, Portraits).
            </p>

            <form onSubmit={handleCreateFolder} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-medium text-dim mb-1">
                  Folder Name
                </label>
                <Input
                  autoFocus
                  placeholder="e.g. Ceremony, Reception, Portraits"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  className="bg-panel2"
                />
              </div>

              {folderError && (
                <p className="text-xs text-red-400">{folderError}</p>
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
    </DashboardLayout>
  );
}
