import type { SnapEvent } from "../types";

// MOCK DATA — not read from the database. This exists purely so the
// dashboard layout can be built and reviewed in Phase 1. It will be
// replaced by real API calls once event/photo endpoints exist (Phase 2).

export const mockSummary = {
  totalEvents: 18,
  totalPhotos: 24680,
  activeEvents: 3,
  photoSearches: 1542,
  downloads: 8931,
};

export const mockEvents: SnapEvent[] = [
  { id: "evt_1", name: "Hartwell Autumn Wedding", date: "2026-09-12", status: "active", photos: 842, searches: 210 },
  { id: "evt_2", name: "Northline Product Launch", date: "2026-09-05", status: "processing", photos: 1290, searches: 64 },
  { id: "evt_3", name: "Coastal Family Session", date: "2026-08-28", status: "completed", photos: 96, searches: 41 },
  { id: "evt_4", name: "Annual Gala 2026", date: "2026-08-14", status: "completed", photos: 2210, searches: 588 },
  { id: "evt_5", name: "Riverside Vineyard Wedding", date: "2026-08-02", status: "completed", photos: 1655, searches: 402 },
  { id: "evt_6", name: "Founder Headshots — Q3 batch", date: "2026-07-22", status: "active", photos: 54, searches: 12 },
];
