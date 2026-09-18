// Status: MOCK data shapes — will be replaced/extended by real API
// schemas once the backend exposes event/photo endpoints (Phase 2).

export type EventStatus = "active" | "processing" | "completed";

export type SnapEvent = {
  id: string;
  name: string;
  date: string;
  status: EventStatus;
  photos: number;
  searches: number;
};
