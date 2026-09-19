/**
 * Centralized Mock Processing Pipeline Data
 * Status: MOCK DATA (Phase 3)
 *
 * Implements the 5 core stages:
 * 1. Thumbnail Generation
 * 2. Web Optimization
 * 3. Face Detection
 * 4. Face Embeddings
 * 5. Cloud Upload
 *
 * Each stage supports mock states: "Waiting", "Processing", "Completed", "Failed"
 */

import type { ProcessingJob } from "../types";

export const mockProcessingJobs: Record<string, ProcessingJob> = {
  evt_1: {
    eventId: "evt_1",
    totalPhotos: 4284,
    processed: 3720,
    remaining: 564,
    progressPercent: 87,
    currentStage: "Face Detection",
    stages: [
      {
        name: "Thumbnail Generation",
        status: "Completed",
        detail: "4,284 / 4,284 files generated (250px grid thumbs)",
      },
      {
        name: "Web Optimization",
        status: "Completed",
        detail: "1600px progressive WebP images generated",
      },
      {
        name: "Face Detection",
        status: "Processing",
        detail: "Detecting facial landmarks in batch 78/90",
      },
      {
        name: "Face Embeddings",
        status: "Waiting",
        detail: "Queued behind Face Detection completion",
      },
      {
        name: "Cloud Upload",
        status: "Processing",
        detail: "Uploading optimized web derivatives to edge cache",
      },
    ],
  },
  evt_2: {
    eventId: "evt_2",
    totalPhotos: 2842,
    processed: 2842,
    remaining: 0,
    progressPercent: 100,
    currentStage: "Completed",
    stages: [
      { name: "Thumbnail Generation", status: "Completed", detail: "2,842 thumbnails generated" },
      { name: "Web Optimization", status: "Completed", detail: "Web derivatives ready" },
      { name: "Face Detection", status: "Completed", detail: "5,120 faces indexed" },
      { name: "Face Embeddings", status: "Completed", detail: "512-dim vectors stored" },
      { name: "Cloud Upload", status: "Completed", detail: "All photos synced" },
    ],
  },
  evt_6: {
    eventId: "evt_6",
    totalPhotos: 54,
    processed: 22,
    remaining: 32,
    progressPercent: 41,
    currentStage: "Web Optimization",
    stages: [
      { name: "Thumbnail Generation", status: "Completed", detail: "54 thumbnails generated" },
      { name: "Web Optimization", status: "Processing", detail: "Compressing high-res RAW frames (22/54)" },
      { name: "Face Detection", status: "Waiting", detail: "Awaiting optimization" },
      { name: "Face Embeddings", status: "Waiting", detail: "Awaiting detection" },
      { name: "Cloud Upload", status: "Waiting", detail: "Awaiting embeddings" },
    ],
  },
  default: {
    eventId: "default",
    totalPhotos: 1200,
    processed: 1200,
    remaining: 0,
    progressPercent: 100,
    currentStage: "Completed",
    stages: [
      { name: "Thumbnail Generation", status: "Completed", detail: "Completed" },
      { name: "Web Optimization", status: "Completed", detail: "Completed" },
      { name: "Face Detection", status: "Completed", detail: "Completed" },
      { name: "Face Embeddings", status: "Completed", detail: "Completed" },
      { name: "Cloud Upload", status: "Completed", detail: "Completed" },
    ],
  },
};

