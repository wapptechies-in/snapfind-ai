export interface SubscriptionTier {
  id: string;
  name: string;
  priceMonthly: number;
  priceYearly: number;
  currency: string;
  maxActiveEvents: number;
  maxPhotosPerEvent: number;
  features: string[];
  isPopular?: boolean;
}

export interface BillingSummary {
  currentTier: string;
  status: "active" | "trialing" | "past_due" | "canceled" | "free";
  currentPeriodEnd?: string;
  activeEventsCount: number;
  maxActiveEvents: number;
  totalPhotosCount: number;
  maxPhotosPerEvent: number;
  used_storage_bytes?: number;
  max_storage_bytes?: number;
  is_trial_edition?: boolean;
}


