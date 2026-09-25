export * from "./event";
export * from "./user";
export * from "./photo";
export * from "./upload";
export * from "./processing";
export * from "./billing";
export * from "./booking";
export * from "./guest";

export interface DashboardSummary {
  totalEvents: number;
  totalPhotos: number;
  activeEvents: number;
  photoSearches: number;
  downloads: number;
  processingJobs?: number;
  galleryViews?: number;
}

export type DashboardStats = DashboardSummary;

export interface SearchResult {
  token: string;
  selfiePreviewUrl?: string;
  totalMatches: number;
  strongMatches: any[];
  possibleMatches: any[];
}

export interface PlanTier {
  id: string;
  name: string;
  tagline: string;
  price_usd_monthly: number;
  price_inr_monthly: number;
  max_active_events: number;
  max_photos_per_event: number;
  features: string[];
  popular?: boolean;
}

export interface SubscriptionStatus {
  tier: "free" | "pro" | "studio" | string;
  status: "active" | "canceled" | "past_due" | string;
  active_events_count: number;
  max_active_events: number;
  total_photos_count: number;
  max_photos_per_event: number;
  custom_branding: boolean;
  guest_paywall_enabled: boolean;
}

export interface GuestCheckoutPayload {
  eventId: string;
  photoId?: string | null;
  customerEmail: string;
  purchaseType?: "photo" | "gallery";
  paymentMethod?: string;
}

export interface GuestCheckoutResponse {
  purchase_id: string;
  download_token: string;
  status: string;
  amount: number;
  currency: string;
  message: string;
}

