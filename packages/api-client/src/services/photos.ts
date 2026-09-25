import { downloadFile, getApiBaseUrl, request } from "../client";
import type { Photo, PhotoFilter, ProcessingJob } from "@snapfind/types";

export interface BatchPresignedRequest {
  eventId: string;
  files: { filename: string; contentType: string; size: number }[];
}

export interface BatchPresignedResponse {
  uploads: {
    filename: string;
    uploadUrl: string;
    s3Key: string;
    photoId: string;
  }[];
}

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

function normalizePhotoUrl(url?: string): string | undefined {
  if (!url) return url;
  const baseUrl = getApiBaseUrl();

  try {
    const parsed = new URL(url);
    if (parsed.hostname === "127.0.0.1" || parsed.hostname === "localhost") {
      return `${baseUrl}${parsed.pathname}${parsed.search}${parsed.hash}`;
    }
  } catch {
    if (url.startsWith("/")) return `${baseUrl}${url}`;
  }

  return url;
}

function normalizePhotoUrls(photo: Photo): Photo {
  return {
    ...photo,
    url: normalizePhotoUrl(photo.url) || "",
    thumbnailUrl: normalizePhotoUrl(photo.thumbnailUrl) || "",
  };
}

export const photosApi = {
  async list(eventId: string, filter?: PhotoFilter): Promise<Photo[]> {
    const params = new URLSearchParams();
    if (filter?.folderId) params.set("folderId", filter.folderId);
    if (filter?.tag) params.set("tag", filter.tag);
    if (filter?.search) params.set("search", filter.search);
    if (filter?.hasFaces !== undefined) params.set("hasFaces", String(filter.hasFaces));
    if (filter?.sortBy) params.set("sortBy", filter.sortBy);
    if (filter?.limit) params.set("limit", String(filter.limit));
    if (filter?.offset) params.set("offset", String(filter.offset));

    const qs = params.toString();
    const endpoint = `/api/v1/events/${eventId}/photos${qs ? `?${qs}` : ""}`;
    const res = await request<any>(endpoint);
    const items = Array.isArray(res) ? res : (res?.items || []);
    return items.map(normalizePhotoUrls);
  },

  async getByEventId(eventId: string, folderId?: string): Promise<Photo[]> {
    return this.list(eventId, { limit: 500, folderId });
  },

  async getBatchPresignedUrls(payload: BatchPresignedRequest): Promise<BatchPresignedResponse> {
    return request<BatchPresignedResponse>("/api/v1/uploads/batch-presigned-urls", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  async uploadInit(
    eventId: string,
    payload: { filename: string; fileSize: number; mimeType: string; folderId?: string | null }
  ): Promise<UploadInitResult> {
    return request<UploadInitResult>(`/api/v1/events/${eventId}/photos/upload-init`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

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

  async uploadComplete(photoId: string): Promise<Photo> {
    return request<Photo>(`/api/v1/photos/${photoId}/upload-complete`, {
      method: "POST",
      body: JSON.stringify({ photoId }),
    });
  },

  async confirmUpload(photoId: string): Promise<Photo> {
    return this.uploadComplete(photoId);
  },

  async getPhotoUrl(
    photoId: string,
    variant: "original" | "web" | "thumbnail" = "web",
    download: boolean = false,
    downloadToken?: string
  ): Promise<PhotoUrlResult> {
    const params = new URLSearchParams({
      variant,
      download: String(download),
    });
    if (downloadToken) {
      params.set("downloadToken", downloadToken);
    }
    return request<PhotoUrlResult>(
      `/api/v1/photos/${photoId}/url?${params.toString()}`
    );
  },

  async delete(photoId: string): Promise<{ ok: boolean; id?: string }> {
    return request<{ ok: boolean; id?: string }>(`/api/v1/photos/${photoId}`, {
      method: "DELETE",
    });
  },

  async bulkDelete(photoIds: string[]): Promise<{ ok: boolean; deleted_count: number; deleted_ids: string[] }> {
    return request<{ ok: boolean; deleted_count: number; deleted_ids: string[] }>(
      "/api/v1/photos/bulk-delete",
      {
        method: "POST",
        body: JSON.stringify({ photo_ids: photoIds }),
      }
    );
  },

  async downloadZip(photoIds: string[], variant: "web" | "original" = "web"): Promise<void> {
    await downloadFile("/api/v1/photos/download-zip", "snapfind-photos.zip", {
      method: "POST",
      body: JSON.stringify({ photo_ids: photoIds, variant }),
    });
  },

  async getProcessingJob(eventId: string): Promise<ProcessingJob> {
    try {
      const res = await request<ProcessingJob>(`/api/v1/events/${eventId}/processing`);
      if (res && (typeof res.progressPercent === "number" || typeof res.progress === "number")) {
        return res;
      }
    } catch {
      // fallback
    }

    return {
      eventId,
      status: "completed",
      progressPercent: 100,
      totalPhotos: 0,
      processed: 0,
      remaining: 0,
      currentStage: "Completed",
      stages: [],
    };
  },

  async startProcessing(eventId: string): Promise<{ success: boolean; message: string; jobId?: string }> {
    return request<{ success: boolean; message: string; jobId?: string }>(
      `/api/v1/events/${eventId}/processing/start`,
      { method: "POST" }
    );
  },

  async reprocessEvent(eventId: string): Promise<{ success: boolean; message: string; jobId?: string }> {
    return request<{ success: boolean; message: string; jobId?: string }>(
      `/api/v1/events/${eventId}/processing/reprocess`,
      { method: "POST" }
    );
  },

  async retryFailedPhotos(eventId: string): Promise<{ success: boolean; message: string; jobId?: string }> {
    return request<{ success: boolean; message: string; jobId?: string }>(
      `/api/v1/events/${eventId}/processing/retry-failed`,
      { method: "POST" }
    );
  },

  async cancelProcessing(eventId: string): Promise<{ success: boolean; message: string }> {
    return request<{ success: boolean; message: string }>(
      `/api/v1/events/${eventId}/processing/cancel`,
      { method: "POST" }
    );
  },

  async setGalleryVisibility(photoId: string, isPublicGallery: boolean): Promise<{ success: boolean; is_public_gallery: boolean }> {
    return request<{ success: boolean; is_public_gallery: boolean }>(
      `/api/v1/photos/${photoId}/gallery-visibility`,
      {
        method: "PATCH",
        body: JSON.stringify({ is_public_gallery: isPublicGallery }),
      }
    );
  },

  async setBulkGalleryVisibility(
    eventId: string,
    photoIds: string[],
    isPublicGallery: boolean
  ): Promise<{ success: boolean; count: number; is_public_gallery: boolean }> {
    return request<{ success: boolean; count: number; is_public_gallery: boolean }>(
      `/api/v1/events/${eventId}/photos/gallery-visibility`,
      {
        method: "POST",
        body: JSON.stringify({ photo_ids: photoIds, is_public_gallery: isPublicGallery }),
      }
    );
  },
};

