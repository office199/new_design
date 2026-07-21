// Shapes mirrored from the FastAPI backend (app/schemas).

export type KYCStatus = 'pending' | 'approved' | 'rejected'

export interface Admin {
  id: string
  email: string
  name: string | null
}

export interface AuthResponse {
  access_token: string
  refresh_token: string
  admin: Admin
}

export interface KYCReviewItem {
  astrologer_id: string
  display_name: string | null
  mobile: string | null
  email: string | null
  kyc_status: KYCStatus
  full_name: string | null
  pan_number: string | null
  aadhaar_last4: string | null
  bank_account_last4: string | null
  bank_ifsc: string | null
  professional: Record<string, unknown>
  submitted_at: string | null
}

export interface Astrologer {
  id: string
  display_name: string | null
  kyc_status: KYCStatus
  is_online: boolean
  is_live: boolean
  avg_rating: string
  review_count: number
  follower_count: number
}

export interface CustomerRow {
  id: string
  name: string | null
  mobile: string | null
  email: string | null
  language: string | null
  wallet_balance: string
  is_active: boolean
  created_at: string | null
}

export interface CustomerEditInput {
  name?: string
  email?: string
  mobile?: string
  language?: string
  is_active?: boolean
}

export interface AstrologerEditInput {
  display_name?: string
  bio?: string
  mobile?: string
  email?: string
  skills?: string[]
  languages?: string[]
  years_experience?: number
  rate_chat_per_msg?: number
  rate_call_per_min?: number
  rate_video_per_min?: number
  super_chat_min_price?: number
  kyc_status?: KYCStatus
  is_online?: boolean
}

export interface AdminStats {
  total_users: number
  total_astrologers: number
  pending_kyc: number
  approved_astrologers: number
  online_astrologers: number
  total_consultations: number
  completed_consultations: number
  gross_consultation_revenue: string
  platform_commission_earned: string
}

export interface RazorpaySettings {
  key_id: string | null
  key_secret_masked: string | null
  webhook_secret_masked: string | null
  is_active: boolean
  configured: boolean
}

export interface RazorpaySettingsInput {
  key_id: string
  key_secret: string
  webhook_secret: string
  is_active: boolean
}

export interface NotificationSummary {
  pendingKyc: number
  pendingPayouts: number
}

// ---- Agora / Razorpay "diagnose" (GET …/diagnose) ----

export interface AgoraDiagnoseResult {
  active_creds_app_id_set: boolean
  active_creds_app_certificate_set: boolean
  token_expire_seconds: number
  agora_token_builder_installed: boolean
  test_token_prefix: string
  test_token_is_placeholder: boolean
  diagnosis: string
}

export interface RazorpayDiagnoseResult {
  credentials_configured: boolean
  source: string | null
  dev_mode: boolean
  key_id_prefix?: string
  test_order_ok?: boolean
  failure_reason?: string | null
  detail?: string
  diagnosis: string
  note?: string
}

// ---- Per-app maintenance mode (GET/PUT /admin/settings/maintenance/{app}) ----

export type MaintenanceApp = 'user' | 'astro'

export interface MaintenanceSetting {
  enabled: boolean
  message: string
}

// ---- Firebase config (service account + per-app client config) ----

export interface FirebaseServiceAccountStatus {
  exists: boolean
  project_id: string | null
  client_email: string | null
  push_enabled: boolean
}

export interface FirebaseClientConfigResult {
  app: string
  project_id: string | null
  updated_at: string | null
}

// ---- Content: media uploads (banners / promo videos / astrologer videos) ----

export interface UploadResponse {
  url: string
}

// ---- Astrologer picker (used by the Astrologer Videos "Astrologer" select) ----

export interface AstrologerOption {
  id: string
  name: string | null
}

// ---- Customer "full details" drill-down (GET /admin/customers/{id}/detail) ----

export interface CustomerDetailProfile {
  id: string
  name: string | null
  mobile: string | null
  email: string | null
  avatar_url: string | null
  dob: string | null
  gender: string | null
  birth_place: string | null
  language: string | null
  is_active: boolean
  created_at: string | null
}

export interface CustomerDetailWallet {
  balance: string
  total_credit: string
  total_debit: string
}

export interface CustomerDetailTransaction {
  id: string
  type: string
  amount: string
  balance_after: string
  reference_id: string | null
  status: string
  created_at: string
}

export interface CustomerDetailConsultation {
  id: string
  astrologer_id: string
  astrologer_name: string | null
  type: string
  status: string
  amount_charged: string
  duration_seconds: number | null
  created_at: string
}

export interface CustomerDetail {
  profile: CustomerDetailProfile
  wallet: CustomerDetailWallet
  transactions: CustomerDetailTransaction[]
  consultations: {
    total: number
    completed: number
    total_spent: string
    recent: CustomerDetailConsultation[]
  }
}

// ---- Astrologer "full details" drill-down (GET /admin/astrologers/{id}/detail) ----

export interface AstrologerDetailProfile {
  id: string
  display_name: string | null
  mobile: string | null
  email: string | null
  photo_url: string | null
  bio: string | null
  skills: string[]
  languages: string[]
  years_experience: number | null
  rate_chat_per_msg: string
  rate_call_per_min: string
  rate_video_per_min: string
  super_chat_min_price: string
  kyc_status: KYCStatus
  is_online: boolean
  is_live: boolean
  avg_rating: string
  review_count: number
  followers: number
  created_at: string | null
}

export interface AstrologerDetailKyc {
  full_name: string | null
  dob: string | null
  address: string | null
  id_type: string | null
  pan_number: string | null
  aadhaar_last4: string | null
  bank_account_holder: string | null
  bank_account_last4: string | null
  bank_ifsc: string | null
  submitted_at: string | null
  reviewed_at: string | null
  reviewer_notes: string | null
}

export interface AstrologerDetailEarnings {
  available_balance: string
  earned_consultations: string
  live_super_chat_gross: string
  live_gift_gross: string
  total_paid_out: string
  pending_payout_requests: number
}

export interface AstrologerDetailConsultation {
  id: string
  user_id: string
  user_name: string | null
  type: string
  status: string
  amount_charged: string
  astrologer_payout: string
  duration_seconds: number | null
  created_at: string
}

export interface AstrologerDetailPayout {
  id: string
  astrologer_id: string
  amount: string
  status: string
  bank_account_last4: string | null
  ifsc: string | null
  razorpay_payout_id: string | null
  paid_at: string | null
  created_at: string
}

export interface AstrologerDetail {
  profile: AstrologerDetailProfile
  kyc: AstrologerDetailKyc | null
  earnings: AstrologerDetailEarnings
  consultations: {
    total: number
    completed: number
    recent: AstrologerDetailConsultation[]
  }
  payouts: {
    recent: AstrologerDetailPayout[]
  }
}

// ---- Chat transcript drill-down (GET /admin/chat-rooms/{id}/messages) ----

export type ChatSenderRole = 'user' | 'astrologer'

export interface ChatRoomConsultation {
  id: string
  user_id: string
  astrologer_id: string
  user_name: string | null
  astrologer_name: string | null
  type: string
  status: string
  rate: string
  duration_seconds: number | null
  message_count: number
  amount_charged: string
  created_at: string
}

export interface ChatMessage {
  id: string
  sender_role: ChatSenderRole
  sender_id: string
  sender_name: string | null
  body: string
  created_at: string
}

export interface ChatTranscript {
  consultation: ChatRoomConsultation
  messages: ChatMessage[]
}
