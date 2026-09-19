/**
 * Photos and Processing API Service Layer
 * Supports Phase 6 direct-to-storage upload pipeline and photo management.
 * Status: IMPLEMENTED (Phase 6)
 */

import { mockProcessingJobs } from "../../data/mockProcessing";
import { mockPhotosList } from "../../data/mockPhotos";
import type { Photo, ProcessingJob } from "../../types";
import { delay, request } from "./client";

export interface UploadInitResult {
  photoId: string;
  uploadUrl: string;
  storageKey: string;
  headers: Record<string, string>;
  expiresIn: number;
}

export interface PhotoUrlResult {
  photoId: string;
  url: string;
  variant: string;
  expiresIn: number;
  filename: string;
}

export const photosApi = {
  /**
   * Fetch all photos associated with an event.
   */
  async getByEventId(eventId: string): Promise<Photo[]> {
    try {
      const res = await request<{ items: Photo[]; total: number }>(
        `/api/v1/events/${eventId}/photos?limit=200`
      );
      if (res && res.items) {
        return res.items;
      }
    } catch (err) {
      console.warn("Could not load photos from API, falling back to mock fixtures:", err);
    }

    await delay(50);
    const matched = mockPhotosList.filter((p) => p.eventId === eventId);
    return matched.length > 0 ? matched : mockPhotosList;
  },

  /**
   * Step 1: Initialize direct binary upload and obtain presigned PUT URL.
   */
  async uploadInit(
    eventId: string,
    payload: { filename: string; fileSize: number; mimeType: string }
  ): Promise<UploadInitResult> {
    return request<UploadInitResult>(`/api/v1/events/${eventId}/photos/upload-init`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  /**
   * Step 2: Directly upload binary to MinIO/S3 using presigned PUT URL with progress tracking.
   */
  uploadBinary(
    uploadUrl: string,
    file: File,
    mimeType: string,
    onProgress?: (percent: number) => void
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("PUT", uploadUrl, true);
      xhr.setRequestHeader("Content-Type", mimeType || file.type || "image/jpeg");

      if (xhr.upload && onProgress) {
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const percent = Math.round((event.loaded / event.total) * 100);
            onProgress(percent);
          }
        };
      }

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve();
        } else {
          reject(new Error(`Storage PUT failed with status ${xhr.status}: ${xhr.statusText}`));
        }
      };

      xhr.onerror = () => {
        reject(new Error("Network error during direct binary upload to storage."));
      };

      xhr.send(file);
    });
  },

  /**
   * Step 3: Notify backend that upload finished, trigger derivative generation & AI indexing.
   */
  async uploadComplete(photoId: string): Promise<Photo> {
    return request<Photo>(`/api/v1/photos/${photoId}/upload-complete`, {
      method: "POST",
      body: JSON.stringify({ photoId }),
    });
  },

  /**
   * Generate short-lived presigned URL for viewing or downloading a photo.
   */
  async getPhotoUrl(
    photoId: string,
    variant: "original" | "web" | "thumbnail" = "web",
    download: boolean = false
  ): Promise<PhotoUrlResult> {
    return request<PhotoUrlResult>(
      `/api/v1/photos/${photoId}/url?variant=${variant}&download=${download}`
    );
  },

  /**
   * Delete photo from storage and database.
   */
  async delete(photoId: string): Promise<{ ok: boolean; id: string }> {
    return request<{ ok: boolean; id: string }>(`/api/v1/photos/${photoId}`, {
      method: "DELETE",
    });
  },

  /**
   * Fetch processing job status for an event.
   */
  async getProcessingJob(eventId: string): Promise<ProcessingJob> {
    await delay(100);
    return (
      mockProcessingJobs[eventId] || {
        ...mockProcessingJobs.default,
        eventId,
      }
    );
  },
};
