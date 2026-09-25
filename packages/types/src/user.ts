export interface User {
  id: string;
  email: string;
  studio_name: string;
  studioName?: string;
  name?: string;
  display_name?: string;
  phone?: string;
  bio?: string;
  website?: string;
  location?: string;
  avatar_url?: string;
  avatarUrl?: string;
  created_at: string;
  createdAt?: string;
  subscription_tier?: string;
  subscriptionTier?: string;
  subscription_status?: string;
  subscriptionStatus?: string;
  max_active_events?: number;
  maxActiveEvents?: number;
  max_photos_per_event?: number;
  maxPhotosPerEvent?: number;
  // Role & Access Control
  role?: "photographer" | "admin" | "super_admin" | string;
  approval_status?: "pending" | "approved" | "rejected" | "suspended" | string;
  approvalStatus?: "pending" | "approved" | "rejected" | "suspended" | string;
  auth_provider?: "email" | "google" | string;
  authProvider?: "email" | "google" | string;
  rejection_reason?: string | null;
  rejectionReason?: string | null;
  // Onboarding & preferences
  onboarding_completed?: boolean;
  email_notifications?: boolean;
  guest_download_alerts?: boolean;
  auto_watermark?: boolean;
}

export interface AdminSummary {
  total_users: number;
  pending_approvals: number;
  approved_users: number;
  rejected_users: number;
  suspended_users: number;
}

export interface AdminUserListResponse {
  total: number;
  items: User[];
  summary: AdminSummary;
}

export interface ApprovalStatusCheck {
  status: "pending" | "approved" | "rejected" | "suspended" | string;
  email: string;
  message: string;
  rejection_reason?: string | null;
}

export interface Photographer {
  id: string;
  name: string;
  email: string;
  slug: string;
  bio?: string;
  avatarUrl?: string;
  coverUrl?: string;
}

export interface AppSettings {
  apiBaseUrl: string;
  concurrency: number;
  autoStartProcessing: boolean;
}
