import { request } from "../client";
import type {
  BillingSummary,
  GuestCheckoutPayload,
  GuestCheckoutResponse,
  PlanTier,
  SubscriptionStatus,
  SubscriptionTier,
} from "@snapfind/types";

export const billingApi = {
  async getTiers(): Promise<SubscriptionTier[]> {
    return request<SubscriptionTier[]>("/api/v1/billing/tiers");
  },

  async getPlans(): Promise<PlanTier[]> {
    return request<PlanTier[]>("/api/v1/billing/plans");
  },

  async getSubscription(): Promise<SubscriptionStatus> {
    return request<SubscriptionStatus>("/api/v1/billing/subscription");
  },

  async getSummary(): Promise<BillingSummary> {
    return request<BillingSummary>("/api/v1/billing/summary");
  },

  async upgrade(tier: "free" | "pro" | "studio" | string): Promise<SubscriptionStatus> {
    return request<SubscriptionStatus>("/api/v1/billing/upgrade", {
      method: "POST",
      body: JSON.stringify({ tier }),
    });
  },

  async createCheckoutSession(tierId: string, interval: "monthly" | "yearly"): Promise<{ checkoutUrl: string }> {
    return request<{ checkoutUrl: string }>("/api/v1/billing/checkout", {
      method: "POST",
      body: JSON.stringify({ tierId, interval }),
    });
  },

  async guestCheckout(payload: GuestCheckoutPayload): Promise<GuestCheckoutResponse> {
    return request<GuestCheckoutResponse>("/api/v1/billing/guest-checkout", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  async getPortalUrl(): Promise<{ portalUrl: string }> {
    return request<{ portalUrl: string }>("/api/v1/billing/portal", {
      method: "POST",
    });
  },
};

