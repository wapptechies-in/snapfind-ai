export interface ProcessingStage {
  name: string;
  status: "Completed" | "Processing" | "Waiting" | "Failed" | string;
  detail?: string;
}

export interface EventProcessingStatus {
  eventId: string;
  totalPhotos: number;
  processedPhotos: number;
  facesDetected: number;
  percent: number;
  stage: "idle" | "indexing" | "detecting_faces" | "generating_embeddings" | "completed" | "failed" | string;
  status: "idle" | "running" | "completed" | "failed" | "processing" | string;
  error?: string;
  updatedAt: string;
}

export interface ProcessingJob {
  id?: string;
  currentJobId?: string | null;
  eventId: string;
  status?: "queued" | "running" | "completed" | "failed" | "processing" | string;
  progress?: number;
  progressPercent: number;
  totalPhotos: number;
  processedPhotos?: number;
  processed: number;
  remaining: number;
  failed?: number;
  facesDetected?: number;
  currentStage: string;
  stages: ProcessingStage[];
  startedAt?: string;
  completedAt?: string;
  error?: string;
}

