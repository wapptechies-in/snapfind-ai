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
import type { EventFolder } from "../../types";

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
  activeFolderId?: string | null;
  folders?: EventFolder[];
  onUploadSuccess: () => void;
}

const MAX_CONCURRENT_UPLOADS = 2;

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
  activeFolderId,
  folders = [],
  onUploadSuccess,
}: PhotoUploadModalProps) {
  const [items, setItems] = useState<UploadFileItem[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(activeFolderId || null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const activeCountRef = useRef(0);
  const hasFinishedAnyRef = useRef(false);

  useEffect(() => {
    setSelectedFolderId(activeFolderId || null);
  }, [activeFolderId, isOpen]);

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
          folderId: selectedFolderId || undefined,
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
    [eventId, selectedFolderId]
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
      <div className="relative w-full max-w-2xl bg-slate-panel border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-midnight/50">
          <div>
            <h2 className="text-base font-bold text-soft-white font-serif">Upload Event Photos</h2>
            <p className="text-xs text-muted">
              Target Event: <span className="text-soft-white font-medium">{eventName}</span>
            </p>
          </div>
          <button
            onClick={handleClose}
            className="text-muted hover:text-soft-white transition-colors p-1.5 text-base rounded-lg hover:bg-midnight cursor-pointer"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          {/* Destination Folder Selector */}
          {folders && folders.length > 0 && (
            <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-midnight/70 px-3.5 py-2 text-xs">
              <span className="text-muted font-medium">Destination Folder:</span>
              <select
                value={selectedFolderId || ""}
                onChange={(e) => setSelectedFolderId(e.target.value || null)}
                className="rounded-lg border border-slate-700 bg-midnight px-2.5 py-1 text-xs font-semibold text-soft-white focus:border-gold focus:outline-none"
              >
                <option value="">📁 Root / All Photos</option>
                {folders.map((f) => (
                  <option key={f.id} value={f.id}>
                    📁 {f.name} ({f.photoCount} photos)
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Dropzone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-7 text-center cursor-pointer transition-all ${
              isDragging
                ? "border-gold bg-gold/10 scale-[0.99]"
                : "border-slate-700 hover:border-gold/60 bg-midnight/40 hover:bg-midnight/70"
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
            <input
              type="file"
              ref={folderInputRef}
              {...({ webkitdirectory: "", directory: "" } as React.InputHTMLAttributes<HTMLInputElement> & Record<string, string>)}
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  addFiles(e.target.files);
                  e.target.value = "";
                }
              }}
              multiple
              className="hidden"
            />
            <div className="w-12 h-12 rounded-2xl bg-gold/10 border border-gold/20 text-gold flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <p className="text-sm font-semibold text-soft-white">
              Drag &amp; drop photos here, or browse files and folders
            </p>
            <p className="text-xs text-muted mt-1">
              Supports JPEG, PNG, and WebP (up to 50MB each). Direct high-speed object upload.
            </p>

            <div className="flex items-center justify-center gap-3 mt-4">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-soft-white transition-all border border-slate-700 cursor-pointer"
              >
                <svg className="w-3.5 h-3.5 text-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span>Select Photos</span>
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  folderInputRef.current?.click();
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gold/15 hover:bg-gold/25 border border-gold/30 text-xs font-semibold text-gold transition-all cursor-pointer"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                </svg>
                <span>Select Entire Folder</span>
              </button>
            </div>
          </div>

          {/* Queue Items */}
          {items.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-muted px-1">
                <span>
                  Queue: <strong className="text-soft-white">{completedCount}</strong> of{" "}
                  <strong className="text-soft-white">{totalCount}</strong> uploaded
                  {failedCount > 0 && (
                    <span className="text-coral ml-2">({failedCount} failed)</span>
                  )}
                </span>
                {completedCount > 0 && !isUploadingAny && (
                  <button
                    onClick={clearCompleted}
                    className="text-gold hover:underline text-xs cursor-pointer font-medium"
                  >
                    Clear Completed
                  </button>
                )}
              </div>

              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 p-3 rounded-xl border border-slate-800 bg-midnight/60 text-xs"
                  >
                    {/* Thumbnail */}
                    <img
                      src={item.previewUrl}
                      alt={item.name}
                      className="w-10 h-10 object-cover rounded-lg bg-black/40 border border-slate-800 shrink-0"
                    />

                    {/* File info and progress bar */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="truncate font-medium text-soft-white" title={item.name}>
                          {item.name}
                        </span>
                        <span className="text-muted shrink-0 ml-2 font-mono text-[11px]">{formatBytes(item.size)}</span>
                      </div>

                      {/* Progress bar */}
                      <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                        <div
                          className={`h-full transition-all duration-200 ${
                            item.status === "completed"
                              ? "bg-sage"
                              : item.status === "failed"
                              ? "bg-coral"
                              : "bg-gold"
                          }`}
                          style={{ width: `${item.progress}%` }}
                        />
                      </div>

                      {/* Status indicator */}
                      <div className="flex items-center justify-between mt-1.5 text-[11px]">
                        <span
                          className={
                            item.status === "completed"
                              ? "text-sage font-medium"
                              : item.status === "failed"
                              ? "text-coral font-medium"
                              : item.status === "processing"
                              ? "text-gold animate-pulse font-medium"
                              : "text-muted"
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
                            className="text-gold underline font-medium cursor-pointer"
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
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-midnight/50">
          <div className="text-xs text-muted">
            {isUploadingAny ? (
              <span className="flex items-center gap-2 text-gold">
                <span className="w-2 h-2 rounded-full bg-gold animate-ping" />
                Uploading binaries to object storage...
              </span>
            ) : completedCount > 0 ? (
              <span className="text-sage font-medium">
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
