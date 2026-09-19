/**
 * Selfie Search API Service Layer
 * Connects guest selfie upload to FastAPI AI vector search (/api/v1/ai/search).
 * Status: IMPLEMENTED (Phase 5)
 */

import { generateMockSearchResults } from "../../data/mockSearchResults";
import type { Photo, SearchResult } from "../../types";
import { API_BASE_URL, ApiError } from "./client";

interface ApiMatch {
  id: string;
  eventId: string;
  filename: string;
  url?: string;
  thumbnailUrl?: string;
  width?: number;
  height?: number;
  uploadedAt?: string;
  matchConfidence?: number;
}

export const searchApi = {
  async searchBySelfie(token: string, file: File): Promise<SearchResult> {
    const previewUrl = URL.createObjectURL(file);

    try {
      const formData = new FormData();
      formData.append("token", token);
      formData.append("selfie", file);

      const response = await fetch(`${API_BASE_URL}/api/v1/ai/search`, {
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

      const strongMatches: Photo[] = (data.strongMatches || []).map((m) => ({
        id: m.id,
        eventId: m.eventId,
        filename: m.filename,
        url: m.url || previewUrl,
        thumbnailUrl: m.thumbnailUrl || m.url || previewUrl,
        width: m.width || 1600,
        height: m.height || 1067,
        uploadedAt: m.uploadedAt || new Date().toISOString(),
        matchConfidence: m.matchConfidence,
      }));

      const possibleMatches: Photo[] = (data.possibleMatches || []).map((m) => ({
        id: m.id,
        eventId: m.eventId,
        filename: m.filename,
        url: m.url || previewUrl,
        thumbnailUrl: m.thumbnailUrl || m.url || previewUrl,
        width: m.width || 1600,
        height: m.height || 1067,
        uploadedAt: m.uploadedAt || new Date().toISOString(),
        matchConfidence: m.matchConfidence,
      }));

      return {
        token,
        selfiePreviewUrl: previewUrl,
        totalMatches: data.totalMatches || (strongMatches.length + possibleMatches.length),
        strongMatches,
        possibleMatches,
      };
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        throw err;
      }
      console.warn("FastAPI AI search unreachable, falling back to mock search:", err);
      return generateMockSearchResults(token, previewUrl);
    }
  },
};
