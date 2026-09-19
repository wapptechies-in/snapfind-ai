/**
 * PhotoUploadModal: Multi-file drag-and-drop direct-to-storage photo uploader.
 * Features:
 * - Direct client-to-storage binary streaming via presigned URLs
 * - Concurrency throttling (max 3 concurrent uploads)
 * - Real-time individual and batch progress indicators
 * - Retry capability for failed items
 * - Automatic image derivative creation & face recognition trigger on completion
 * Status: IMPLEMENTED (Phase 6)
 */

import React, { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "../common";
import { photosApi } from "../../services/api";

interface UploadFileItem {
  id: string;
  file: File;
  name: string;
  size: number;
  previewUrl: string;
  status: "queued" | "initializing" | "uploading" | "processing" | "completed" | "failed";
  progress: number;
  error?: string;
  photoId?: string;
}

interface PhotoUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventId: string;
  eventName: string;
  onUploadSuccess: () => void;
}

const MAX_CONCURRENT_UPLOADS = 3;

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export function PhotoUploadModal({
  isOpen,
  onClose,
  eventId,
  eventName,
  onUploadSuccess,
}: PhotoUploadModalProps) {
  const [items, setItems] = useState<UploadFileItem[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const activeCountRef = useRef(0);
  const hasFinishedAnyRef = useRef(false);

  // Clean up object URLs on unmount
  useEffect(() => {
    return () => {
      items.forEach((item) => {
        if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
      });
    };
  }, [items]);

  const addFiles = useCallback((files: FileList | File[]) => {
    const validFiles: UploadFileItem[] = [];
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

    Array.from(files).forEach((file) => {
      if (!allowedTypes.includes(file.type)) {
        alert(`File "${file.name}" is not a supported image (JPEG, PNG, or WebP).`);
        return;
      }
      if (file.size > 50 * 1024 * 1024) {
        alert(`File "${file.name}" exceeds the 50MB limit.`);
        return;
      }

      validFiles.push({
        id: `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        file,
        name: file.name,
        size: file.size,
        previewUrl: URL.createObjectURL(file),
        status: "queued",
        progress: 0,
      });
    });

    if (validFiles.length > 0) {
      setItems((prev) => [...prev, ...validFiles]);
    }
  }, []);

  const uploadSingleItem = useCallback(
    async (item: UploadFileItem) => {
      try {
        // Step 1: Upload Init
        setItems((prev) =>
          prev.map((i) =>
            i.id === item.id ? { ...i, status: "initializing", progress: 5 } : i
          )
        );

        const initResult = await photosApi.uploadInit(eventId, {
          filename: item.name,
          fileSize: item.size,
          mimeType: item.file.type || "image/jpeg",
        });

        const photoId = initResult.photoId;

        // Step 2: Upload Binary directly to storage
        setItems((prev) =>
          prev.map((i) =>
            i.id === item.id
              ? { ...i, status: "uploading", photoId, progress: 10 }
              : i
          )
        );

        await photosApi.uploadBinary(
          initResult.uploadUrl,
          item.file,
          item.file.type || "image/jpeg",
          (percent) => {
            // Scale progress from 10% to 90% during raw upload
            const mappedProgress = 10 + Math.round((percent * 80) / 100);
            setItems((prev) =>
              prev.map((i) =>
                i.id === item.id ? { ...i, progress: mappedProgress } : i
              )
            );
          }
        );

        // Step 3: Upload Complete (generates derivatives & triggers face recognition)
        setItems((prev) =>
          prev.map((i) =>
            i.id === item.id ? { ...i, status: "processing", progress: 95 } : i
          )
        );

        await photosApi.uploadComplete(photoId);

        setItems((prev) =>
          prev.map((i) =>
            i.id === item.id ? { ...i, status: "completed", progress: 100 } : i
          )
        );

        hasFinishedAnyRef.current = true;
      } catch (err: unknown) {
        console.error(`Error uploading ${item.name}:`, err);
        const errMsg =
          err instanceof Error
            ? err.message
            : typeof err === "object" && err !== null && "detail" in err
            ? String((err as { detail: unknown }).detail)
            : "Upload failed";

        setItems((prev) =>
          prev.map((i) =>
            i.id === item.id
              ? {
                  ...i,
                  status: "failed",
                  error: errMsg,
                }
              : i
          )
        );
      } finally {
        activeCountRef.current = Math.max(0, activeCountRef.current - 1);
      }
    },
    [eventId]
  );

  // Queue orchestrator with concurrency limit
  useEffect(() => {
    const queuedItems = items.filter((i) => i.status === "queued");
    if (queuedItems.length === 0) return;

    while (
      activeCountRef.current < MAX_CONCURRENT_UPLOADS &&
      queuedItems.length > 0
    ) {
      const nextItem = queuedItems.shift();
      if (!nextItem) break;

      activeCountRef.current += 1;
      uploadSingleItem(nextItem);
    }
  }, [items, uploadSingleItem]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      addFiles(e.dataTransfer.files);
    }
  };

  const retryItem = (itemId: string) => {
    setItems((prev) =>
      prev.map((i) =>
        i.id === itemId
          ? { ...i, status: "queued", progress: 0, error: undefined }
          : i
      )
    );
  };

  const clearCompleted = () => {
    setItems((prev) => prev.filter((i) => i.status !== "completed"));
  };

  const handleClose = () => {
    if (hasFinishedAnyRef.current) {
      onUploadSuccess();
    }
    onClose();
  };

  if (!isOpen) return null;

  const totalCount = items.length;
  const completedCount = items.filter((i) => i.status === "completed").length;
  const failedCount = items.filter((i) => i.status === "failed").length;
  const isUploadingAny = items.some(
    (i) =>
      i.status === "queued" ||
      i.status === "initializing" ||
      i.status === "uploading" ||
      i.status === "processing"
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-panel border border-hairline rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-hairline bg-panel2/40">
          <div>
            <h2 className="text-base font-semibold text-cloud">Upload Event Photos</h2>
            <p className="text-xs text-dim">
              Target Event: <span className="text-cloud font-medium">{eventName}</span>
            </p>
          </div>
          <button
            onClick={handleClose}
            className="text-dim hover:text-cloud transition-colors p-1 text-lg rounded-md"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          {/* Dropzone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
              isDragging
                ? "border-violet bg-violet/10 scale-[0.99]"
                : "border-hairline hover:border-violet/50 hover:bg-panel2/30"
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  addFiles(e.target.files);
                  e.target.value = "";
                }
              }}
              multiple
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
            />
            <div className="text-3xl mb-2 text-violet-light">📁</div>
            <p className="text-sm font-medium text-cloud">
              Drag &amp; drop photos here, or <span className="text-violet-light underline">browse files</span>
            </p>
            <p className="text-xs text-dim mt-1">
              Supports JPEG, PNG, and WebP (up to 50MB each). Direct S3/MinIO upload.
            </p>
          </div>

          {/* Queue Items */}
          {items.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-dim px-1">
                <span>
                  Queue: <strong className="text-cloud">{completedCount}</strong> of{" "}
                  <strong>{totalCount}</strong> uploaded
                  {failedCount > 0 && (
                    <span className="text-red-400 ml-2">({failedCount} failed)</span>
                  )}
                </span>
                {completedCount > 0 && !isUploadingAny && (
                  <button
                    onClick={clearCompleted}
                    className="text-violet-light hover:underline text-xs"
                  >
                    Clear Completed
                  </button>
                )}
              </div>

              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 p-2.5 rounded-lg border border-hairline bg-panel2/40 text-xs"
                  >
                    {/* Thumbnail */}
                    <img
                      src={item.previewUrl}
                      alt={item.name}
                      className="w-10 h-10 object-cover rounded bg-black/40 border border-hairline shrink-0"
                    />

                    {/* File info and progress bar */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="truncate font-medium text-cloud" title={item.name}>
                          {item.name}
                        </span>
                        <span className="text-dim shrink-0 ml-2">{formatBytes(item.size)}</span>
                      </div>

                      {/* Progress bar */}
                      <div className="w-full bg-panel rounded-full h-1.5 overflow-hidden border border-hairline/50">
                        <div
                          className={`h-full transition-all duration-200 ${
                            item.status === "completed"
                              ? "bg-emerald-500"
                              : item.status === "failed"
                              ? "bg-red-500"
                              : "bg-violet"
                          }`}
                          style={{ width: `${item.progress}%` }}
                        />
                      </div>

                      {/* Status indicator */}
                      <div className="flex items-center justify-between mt-1 text-[11px]">
                        <span
                          className={
                            item.status === "completed"
                              ? "text-emerald-400"
                              : item.status === "failed"
                              ? "text-red-400"
                              : item.status === "processing"
                              ? "text-amber-400 animate-pulse"
                              : "text-dim"
                          }
                        >
                          {item.status === "queued" && "Queued"}
                          {item.status === "initializing" && "Preparing..."}
                          {item.status === "uploading" && `Uploading direct ${item.progress}%`}
                          {item.status === "processing" && "Indexing faces & derivatives..."}
                          {item.status === "completed" && "Ready in gallery ✓"}
                          {item.status === "failed" && (item.error || "Failed")}
                        </span>

                        {item.status === "failed" && (
                          <button
                            onClick={() => retryItem(item.id)}
                            className="text-violet-light underline font-medium"
                          >
                            Retry
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-hairline bg-panel2/40">
          <div className="text-xs text-dim">
            {isUploadingAny ? (
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-violet animate-ping" />
                Uploading binaries to object storage...
              </span>
            ) : completedCount > 0 ? (
              <span className="text-emerald-400 font-medium">
                {completedCount} {completedCount === 1 ? "photo" : "photos"} ready
              </span>
            ) : (
              <span>Select files to begin upload</span>
            )}
          </div>

          <Button
            size="sm"
            variant={isUploadingAny ? "secondary" : "primary"}
            onClick={handleClose}
          >
            {isUploadingAny ? "Hide / Background" : "Done"}
          </Button>
        </div>
      </div>
    </div>
  );
}
