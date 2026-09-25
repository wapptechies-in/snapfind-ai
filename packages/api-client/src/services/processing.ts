import { request } from "../client";
import type { EventProcessingStatus, ProcessingJob } from "@snapfind/types";

export const processingApi = {
  async getEventStatus(eventId: string): Promise<EventProcessingStatus> {
    return request<EventProcessingStatus>(`/api/v1/processing/events/${eventId}/status`);
  },

  async triggerProcessing(eventId: string): Promise<ProcessingJob> {
    return request<ProcessingJob>(`/api/v1/processing/events/${eventId}/start`, {
      method: "POST",
    });
  },

  async getJob(jobId: string): Promise<ProcessingJob> {
    return request<ProcessingJob>(`/api/v1/processing/jobs/${jobId}`);
  },
};

