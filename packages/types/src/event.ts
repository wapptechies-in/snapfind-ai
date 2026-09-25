export type EventType =
  | "Wedding"
  | "Marriage"
  | "Birthday"
  | "Sports"
  | "Family"
  | "Corporate"
  | "College/School"
  | "Candid"
  | "Nature"
  | "Other"
  | string;

export type EventStatus =
  | "Active"
  | "Processing"
  | "Draft"
  | "Expired"
  | "Archived"
  | "active"
  | "processing"
  | "completed"
  | "failed"
  | string;

export interface EventSettings {
  galleryVisibility?: boolean;
  faceSearch?: boolean;
  downloads?: boolean;
  originalDownloads?: boolean;
  watermark?: boolean;
  eventExpiry?: boolean;
  expiryDate?: string;
  paywallEnabled?: boolean;
  photoPrice?: number;
  galleryUnlockPrice?: number;
  currency?: string;
  [key: string]: unknown;
}

export interface SnapEvent {
  id: string;
  name: string;
  slug?: string;
  eventType: EventType;
  date: string;
  location?: string;
  description?: string;
  coverImage: string;
  cover_image_url?: string;
  cover_photo_url?: string;
  status: EventStatus;
  isActive?: boolean;
  is_active?: boolean;
  photoCount: number;
  photo_count?: number;
  photos?: number; // legacy alias
  faceCount?: number;
  face_count?: number;
  token: string;
  public_token?: string;
  settings?: EventSettings;
  createdAt?: string;
  updatedAt?: string;
  created_at?: string;
  updated_at?: string;
  paywall_enabled?: boolean;
  paywallEnabled?: boolean;
  photo_price?: number;
  photoPrice?: number;
  gallery_unlock_price?: number;
  galleryUnlockPrice?: number;
  currency?: string;
  galleryViews: number;
  searches: number;
  downloads: number;
  welcome_message?: string | null;
  custom_logo_url?: string | null;
  show_snapfind_branding?: boolean;
  show_company_cta?: boolean;
  show_contact_button?: boolean;
  total_registrations?: number;
  total_matches_found?: number;
  total_whatsapp_sent?: number;
  total_marketing_consents?: number;
}

export interface CreateEventPayload {
  name: string;
  eventType?: EventType;
  date: string;
  location?: string;
  description?: string;
  coverImage?: string;
  cover_image?: string;
  cover_image_url?: string;
  status?: EventStatus;
  isActive?: boolean;
  is_active?: boolean;
  token?: string;
  settings?: Partial<EventSettings>;
  welcome_message?: string;
  custom_logo_url?: string;
  show_snapfind_branding?: boolean;
  show_company_cta?: boolean;
  show_contact_button?: boolean;
}

export interface EventFilterOptions {
  search?: string;
  eventType?: EventType | "all";
  status?: EventStatus | "all";
  sortBy?: "date-desc" | "date-asc" | "photos-desc" | "name-asc";
}

/**
 * Normalizes event object so consumers can access either camelCase or snake_case
 * fields without undefined checks.
 */
export function normalizeSnapEvent(raw: Partial<SnapEvent> & Record<string, any>): SnapEvent {
  const token = raw.token || raw.public_token || "";
  const photoCount = raw.photoCount ?? raw.photo_count ?? raw.photos ?? 0;
  const cover = raw.coverImage || raw.cover_image || raw.cover_image_url || raw.cover_photo_url || "";
  const status = raw.status || "Draft";
  const isActive = raw.isActive ?? raw.is_active ?? (status.toLowerCase() === "active");
  const paywallEnabled = raw.paywall_enabled ?? raw.paywallEnabled ?? false;
  const photoPrice = raw.photo_price ?? raw.photoPrice ?? 0;
  const galleryUnlockPrice = raw.gallery_unlock_price ?? raw.galleryUnlockPrice ?? 0;

  return {
    ...raw,
    id: raw.id || "",
    name: raw.name || "Untitled Event",
    date: raw.date || new Date().toISOString().split("T")[0],
    eventType: raw.eventType || raw.event_type || "Wedding",
    location: raw.location || "",
    description: raw.description || "",
    coverImage: cover,
    cover_image_url: cover,
    cover_photo_url: cover,
    status: status,
    isActive: isActive,
    is_active: isActive,
    token: token,
    public_token: token,
    photoCount: photoCount,
    photo_count: photoCount,
    photos: photoCount,
    paywall_enabled: paywallEnabled,
    paywallEnabled: paywallEnabled,
    photo_price: photoPrice,
    photoPrice: photoPrice,
    gallery_unlock_price: galleryUnlockPrice,
    galleryUnlockPrice: galleryUnlockPrice,
    galleryViews: raw.galleryViews ?? raw.gallery_views ?? 0,
    searches: raw.searches ?? 0,
    downloads: raw.downloads ?? 0,
    welcome_message: raw.welcome_message ?? null,
    custom_logo_url: raw.custom_logo_url ?? null,
    show_snapfind_branding: raw.show_snapfind_branding ?? true,
    show_company_cta: raw.show_company_cta ?? false,
    show_contact_button: raw.show_contact_button ?? true,
    total_registrations: raw.total_registrations ?? 0,
    total_matches_found: raw.total_matches_found ?? 0,
    total_whatsapp_sent: raw.total_whatsapp_sent ?? 0,
    total_marketing_consents: raw.total_marketing_consents ?? 0,
    settings: raw.settings || {},
  };
}

