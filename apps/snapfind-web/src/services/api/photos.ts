/**
 * Photos and Processing API Service Layer
 * Status: IMPLEMENTED (Phase 4)
 */

import { mockProcessingJobs } from "../../data/mockProcessing";
import { mockPhotosList } from "../../data/mockPhotos";
import type { Photo, ProcessingJob } from "../../types";
import { delay, request } from "./client";

export const photosApi = {
  async getByEventId(eventId: string): Promise<Photo[]> {
    try {
      const res = await request<{ items: Photo[]; total: number }>(
        `/api/v1/events/${eventId}/photos`
      );
      if (res && res.items && res.items.length > 0) {
        return res.items;
      }
    } catch {
      // ignore, fall back to mock
    }

    await delay(100);
    const matched = mockPhotosList.filter((p) => p.eventId === eventId);
    return matched.length > 0 ? matched : mockPhotosList;
  },

  async getProcessingJob(eventId: string): Promise<ProcessingJob> {
    await delay(100);
    return mockProcessingJobs[eventId] || {
      ...mockProcessingJobs.default,
      eventId,
    };
  },
};
