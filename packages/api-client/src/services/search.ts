import { getApiBaseUrl, ApiError } from "../client";
import type { Photo, SearchResult } from "@snapfind/types";

interface ApiMatch {
  id: string;
  eventId?: string;
  filename: string;
  url?: string;
  thumbnailUrl?: string;
  width?: number;
  height?: number;
  uploadedAt?: string;
  matchConfidence?: number;
}

export function normalizePhotoUrl(url?: string): string | undefined {
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

export function normalizeSearchResult(
  token: string,
  previewUrl: string,
  data: {
    totalMatches?: number;
    strongMatches?: ApiMatch[];
    possibleMatches?: ApiMatch[];
  }
): SearchResult {
  const strongMatches: Photo[] = (data.strongMatches || []).map((m) => {
    const u = normalizePhotoUrl(m.url) || previewUrl;
    return {
      id: m.id,
      eventId: m.eventId,
      filename: m.filename,
      url: u,
      thumbnailUrl: normalizePhotoUrl(m.thumbnailUrl) || u,
      width: m.width || 1600,
      height: m.height || 1067,
      uploadedAt: m.uploadedAt || new Date().toISOString(),
      matchConfidence: m.matchConfidence,
    };
  });

  const possibleMatches: Photo[] = (data.possibleMatches || []).map((m) => {
    const u = normalizePhotoUrl(m.url) || previewUrl;
    return {
      id: m.id,
      eventId: m.eventId,
      filename: m.filename,
      url: u,
      thumbnailUrl: normalizePhotoUrl(m.thumbnailUrl) || u,
      width: m.width || 1600,
      height: m.height || 1067,
      uploadedAt: m.uploadedAt || new Date().toISOString(),
      matchConfidence: m.matchConfidence,
    };
  });

  return {
    token,
    selfiePreviewUrl: previewUrl,
    totalMatches: data.totalMatches ?? (strongMatches.length + possibleMatches.length),
    strongMatches,
    possibleMatches,
  };
}

export const searchApi = {
  async searchBySelfie(token: string, file: File): Promise<SearchResult> {
    const previewUrl = typeof URL !== "undefined" ? URL.createObjectURL(file) : "";
    const baseUrl = getApiBaseUrl();

    try {
      const formData = new FormData();
      formData.append("token", token);
      formData.append("selfie", file);

      const response = await fetch(`${baseUrl}/api/v1/ai/search`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        let detail = "Could not complete face search.";
        try {
          const errData = (await response.json()) as { detail?: string };
          detail = errData.detail || detail;
        } catch {
          // ignore
        }
        throw new ApiError(detail, response.status, detail);
      }

      const data = (await response.json()) as {
        totalMatches?: number;
        strongMatches?: ApiMatch[];
        possibleMatches?: ApiMatch[];
      };

      return normalizeSearchResult(token, previewUrl, data);
    } catch (err: unknown) {
      if (err instanceof ApiError) throw err;
      const detail = err instanceof Error ? err.message : "Network error";
      throw new ApiError(
        `Face search service is unavailable. Please try again shortly. (${detail})`,
        503,
        detail
      );
    }
  },

  async searchAsync(
    token: string,
    file: File
  ): Promise<{ jobId: string; job_id: string; status: string; eventId?: string; event_id?: string }> {
    const baseUrl = getApiBaseUrl();
    try {
      const formData = new FormData();
      formData.append("token", token);
      formData.append("selfie", file);

      const response = await fetch(`${baseUrl}/api/v1/ai/search-async`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        let detail = "Could not start async face search.";
        try {
          const errData = (await response.json()) as { detail?: string };
          detail = errData.detail || detail;
        } catch {
          // ignore
        }
        throw new ApiError(detail, response.status, detail);
      }

      const json = (await response.json()) as Record<string, any>;
      const id = json.jobId || json.job_id || "";
      return {
        jobId: id,
        job_id: id,
        status: json.status || "queued",
        eventId: json.eventId || json.event_id,
        event_id: json.eventId || json.event_id,
      };
    } catch (err: unknown) {
      if (err instanceof ApiError) throw err;
      const detail = err instanceof Error ? err.message : "Network error";
      throw new ApiError(`Face search queue failed: ${detail}`, 503, detail);
    }
  },

  async getJobStatus(jobId: string): Promise<any> {
    if (!jobId || jobId === "null" || jobId === "undefined") {
      throw new ApiError("Invalid face search job identifier.", 400);
    }
    const baseUrl = getApiBaseUrl();
    try {
      const response = await fetch(`${baseUrl}/api/v1/ai/jobs/${jobId}`);
      if (!response.ok) {
        let detail = "Could not fetch search job status.";
        try {
          const errData = (await response.json()) as { detail?: string };
          detail = errData.detail || detail;
        } catch {
          // ignore
        }
        throw new ApiError(detail, response.status, detail);
      }

      return await response.json();
    } catch (err: unknown) {
      if (err instanceof ApiError) throw err;
      const detail = err instanceof Error ? err.message : "Network error";
      throw new ApiError(`Failed to check search status: ${detail}`, 503, detail);
    }
  },
};



