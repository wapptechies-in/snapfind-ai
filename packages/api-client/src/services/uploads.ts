import { request } from "../client";

export interface BatchInitResponseItem {
  photoId: string;
  itemId: string;
  filename: string;
  uploadUrl: string;
  storageKey: string;
  headers: Record<string, string>;
  expiresIn: number;
}

export interface BatchInitResponse {
  uploadSessionId: string;
  items: BatchInitResponseItem[];
}

export const uploadsApi = {
  async createSession(
    eventId: string,
    name: string,
    totalFiles: number,
    totalBytes: number
  ): Promise<{ id: string; status: string }> {
    return request<{ id: string; status: string }>("/api/v1/upload-sessions", {
      method: "POST",
      body: JSON.stringify({
        eventId,
        name,
        totalFiles,
        totalBytes,
      }),
    });
  },

  async getSession(sessionId: string): Promise<Record<string, unknown>> {
    return request<Record<string, unknown>>(`/api/v1/upload-sessions/${sessionId}`);
  },

  async batchInit(
    sessionId: string,
    items: Array<{ filename: string; fileSize: number; mimeType: string; checksum?: string }>
  ): Promise<BatchInitResponse> {
    return request<BatchInitResponse>(`/api/v1/upload-sessions/${sessionId}/batch-init`, {
      method: "POST",
      body: JSON.stringify({ items }),
    });
  },

  async uploadComplete(photoId: string): Promise<{ id: string; uploadStatus: string; processingStatus: string }> {
    return request<{ id: string; uploadStatus: string; processingStatus: string }>(
      `/api/v1/photos/${photoId}/upload-complete`,
      {
        method: "POST",
        body: JSON.stringify({ photoId }),
      }
    );
  },

  async completeSession(sessionId: string): Promise<{ id: string; status: string }> {
    return request<{ id: string; status: string }>(`/api/v1/upload-sessions/${sessionId}/complete`, {
      method: "POST",
    });
  },

  async cancelSession(sessionId: string): Promise<{ id: string; status: string }> {
    return request<{ id: string; status: string }>(`/api/v1/upload-sessions/${sessionId}/cancel`, {
      method: "POST",
    });
  },
};

