/**
 * Centralized Mock Facial Search Results
 * Status: MOCK DATA (Phase 3)
 *
 * Simulates AI facial vector search results without real ML backend or server uploads.
 */

import { mockPhotosList } from "./mockPhotos";
import type { Photo, SearchResult } from "../types";

export function generateMockSearchResults(token: string, previewUrl?: string): SearchResult {
  const strongMatches: Photo[] = [
    {
      ...mockPhotosList[0],
      matchConfidence: 96,
    },
    {
      ...mockPhotosList[3],
      matchConfidence: 92,
    },
    {
      ...mockPhotosList[4],
      matchConfidence: 88,
    },
    {
      ...mockPhotosList[5],
      matchConfidence: 86,
    },
  ];

  const possibleMatches: Photo[] = [
    {
      ...mockPhotosList[1],
      matchConfidence: 78,
    },
    {
      ...mockPhotosList[2],
      matchConfidence: 73,
    },
    {
      ...mockPhotosList[6],
      matchConfidence: 68,
    },
  ];

  return {
    token,
    selfiePreviewUrl: previewUrl,
    totalMatches: strongMatches.length + possibleMatches.length,
    strongMatches,
    possibleMatches,
  };
}

