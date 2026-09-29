/**
 * Billing and Monetization API Service Layer
 * Supports Phase 9 photographer subscriptions and guest paywalls.
 * Status: IMPLEMENTED (Phase 9)
 */

import { request } from "./client";

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
  used_storage_bytes?: number;
  max_storage_bytes?: number;
  is_trial_edition?: boolean;
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

export const billingApi = {
  async getPlans(): Promise<PlanTier[]> {
    return request<PlanTier[]>("/api/v1/billing/plans");
  },

  async getSubscription(): Promise<SubscriptionStatus> {
    return request<SubscriptionStatus>("/api/v1/billing/subscription");
  },

  async upgrade(tier: "free" | "pro" | "studio"): Promise<SubscriptionStatus> {
    return request<SubscriptionStatus>("/api/v1/billing/upgrade", {
      method: "POST",
      body: JSON.stringify({ tier }),
    });
  },

  async createCheckoutSession(
    planId: string,
    interval: "monthly" | "yearly" = "monthly"
  ): Promise<{ checkoutUrl: string; sessionId: string; amount: number; currency: string }> {
    return request("/api/v1/billing/create-checkout-session", {
      method: "POST",
      body: JSON.stringify({ planId, interval }),
    });
  },

  async guestCheckout(payload: GuestCheckoutPayload): Promise<GuestCheckoutResponse> {
    return request<GuestCheckoutResponse>("/api/v1/billing/guest-checkout", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  async verifyPurchase(token: string): Promise<{
    valid: boolean;
    purchaseId: string;
    eventId: string;
    photoId: string | null;
    purchaseType: string;
    customerEmail: string;
  }> {
    return request(`/api/v1/billing/verify-purchase/${token}`);
  },
};

