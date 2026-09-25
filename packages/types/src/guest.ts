export interface Guest {
  id: string;
  event_id: string;
  full_name: string;
  whatsapp_number: string;
  email?: string | null;
  consent_selfie_processing: boolean;
  consent_whatsapp_transactional: boolean;
  consent_marketing: boolean;
  consent_selfie_at?: string | null;
  consent_whatsapp_at?: string | null;
  consent_marketing_at?: string | null;
  selfie_searches_count: number;
  matches_found_count: number;
  last_active_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface GuestRegisterPayload {
  event_id?: string;
  event_token?: string;
  full_name: string;
  whatsapp_number: string;
  email?: string;
  consent_selfie_processing: boolean;
  consent_whatsapp_transactional: boolean;
  consent_marketing: boolean;
  source?: string;
}

export interface MarketingLead {
  id: string;
  event_id: string;
  guest_id: string;
  full_name: string;
  whatsapp_number: string;
  email?: string | null;
  opted_in_at: string;
  source: string;
  notes?: string | null;
  created_at: string;
}

export interface WhatsAppMessageLog {
  id: string;
  event_id: string;
  guest_id: string;
  recipient_phone: string;
  message_type: "transactional" | "marketing";
  provider: string;
  status: "sent" | "delivered" | "failed" | "skipped";
  provider_message_id?: string | null;
  error_message?: string | null;
  sent_at: string;
}

export interface WhatsAppSendRequest {
  message_type: "transactional" | "marketing";
  template_name?: string;
  custom_message?: string;
  results_url?: string;
}

export interface WhatsAppDeliveryResult {
  success: boolean;
  message_id?: string | null;
  provider: string;
  status: string;
  error?: string | null;
}

export interface SearchJobStatus {
  job_id: string;
  status: "queued" | "processing" | "completed" | "failed";
  event_id: string;
  total_matches?: number;
  strong_matches?: any[];
  possible_matches?: any[];
  error_message?: string | null;
  created_at?: string;
  completed_at?: string | null;
}

