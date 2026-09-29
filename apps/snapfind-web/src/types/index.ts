/**
 * SnapFind Web Application — Core Domain Types
 * Unified with @snapfind/types
 */

import type { Photo, User } from "@snapfind/types";

export * from "@snapfind/types";

export interface ProcessingStage {
  name: string;
  status: "Completed" | "Processing" | "Waiting" | "Failed";
  detail?: string;
}

export interface SearchResult {
  token: string;
  selfiePreviewUrl?: string;
  totalMatches: number;
  strongMatches: Photo[];
  possibleMatches: Photo[];
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}
