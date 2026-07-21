import { api, apiDownload, apiUpload } from './client'
import type {
  AdminStats,
  AgoraDiagnoseResult,
  Astrologer,
  AstrologerDetail,
  AstrologerEditInput,
  AstrologerOption,
  AuthResponse,
  ChatTranscript,
  CustomerDetail,
  CustomerEditInput,
  CustomerRow,
  FirebaseClientConfigResult,
  FirebaseServiceAccountStatus,
  KYCReviewItem,
  KYCStatus,
  MaintenanceApp,
  MaintenanceSetting,
  RazorpayDiagnoseResult,
  RazorpaySettings,
  RazorpaySettingsInput,
  UploadResponse,
} from './types'

/**
 * KYC action routes are centralised here so they can be adjusted in one place
 * if the backend contract differs. The primary contract is the dedicated
 * `/kyc/approve` + `/kyc/reject` routes landing in parallel; if those 404 the
 * legacy `/approve` + `/reject` routes on the astrologer are used as fallback.
 */
export const KYC_ROUTES = {
  approve: (id: string) => `/admin/astrologers/${id}/kyc/approve`,
  reject: (id: string) => `/admin/astrologers/${id}/kyc/reject`,
  approveFallback: (id: string) => `/admin/astrologers/${id}/approve`,
  rejectFallback: (id: string) => `/admin/astrologers/${id}/reject`,
}

async function kycAction(
  primary: string,
  fallback: string,
  body: Record<string, unknown>,
): Promise<Astrologer> {
  try {
    return await api<Astrologer>(primary, { method: 'POST', body })
  } catch (e) {
    // If the dedicated KYC route is not present (404/405), fall back to the
    // legacy astrologer approve/reject route with the same payload.
    const status = (e as { status?: number }).status
    if (status === 404 || status === 405) {
      return api<Astrologer>(fallback, { method: 'POST', body })
    }
    throw e
  }
}

export const adminApi = {
  login: (email: string, password: string) =>
    api<AuthResponse>('/admin/login', { method: 'POST', body: { email, password }, auth: false }),

  stats: () => api<AdminStats>('/admin/stats'),

  listAstrologers: (kycStatus?: KYCStatus) =>
    api<KYCReviewItem[]>(
      `/admin/astrologers${kycStatus ? `?kyc_status=${kycStatus}` : ''}`,
    ),

  approve: (id: string, notes?: string) =>
    kycAction(KYC_ROUTES.approve(id), KYC_ROUTES.approveFallback(id), { reason: notes, notes }),

  reject: (id: string, notes?: string) =>
    kycAction(KYC_ROUTES.reject(id), KYC_ROUTES.rejectFallback(id), { reason: notes, notes }),

  refund: (consultationId: string, amount: string | null, reason: string | null) =>
    api(`/admin/consultations/${consultationId}/refund`, {
      method: 'POST',
      body: { amount: amount || null, reason },
    }),

  creditWallet: (customerId: string, amount: number, note?: string) =>
    api(`/admin/customers/${customerId}/wallet`, {
      method: 'POST',
      body: { amount, note: note || null },
    }),

  // Customer edit / hard delete.
  editCustomer: (id: string, body: CustomerEditInput) =>
    api<CustomerRow>(`/admin/customers/${id}`, { method: 'PATCH', body }),
  deleteCustomer: (id: string) =>
    api<void>(`/admin/customers/${id}`, { method: 'DELETE' }),

  // Astrologer edit / hard delete.
  editAstrologer: (id: string, body: AstrologerEditInput) =>
    api<Astrologer>(`/admin/astrologers/${id}`, { method: 'PATCH', body }),
  deleteAstrologer: (id: string) =>
    api<void>(`/admin/astrologers/${id}`, { method: 'DELETE' }),

  // Full-details drill-downs (used by the DetailDrawer row-click experience).
  customerDetail: (id: string) => api<CustomerDetail>(`/admin/customers/${id}/detail`),
  astrologerDetail: (id: string) => api<AstrologerDetail>(`/admin/astrologers/${id}/detail`),

  // Full chat transcript (used by the Chat Message Rooms row-click experience).
  chatTranscript: (consultationId: string) =>
    api<ChatTranscript>(`/admin/chat-rooms/${consultationId}/messages`),

  // Razorpay payment gateway credentials (secrets masked on read).
  getRazorpay: () => api<RazorpaySettings>('/admin/razorpay-settings'),
  saveRazorpay: (body: RazorpaySettingsInput) =>
    api<RazorpaySettings>('/admin/razorpay-settings', { method: 'PUT', body }),

  // "Test connection" diagnostics — mint a real token / place a real (never
  // charged) test order to confirm the stored credentials actually work.
  diagnoseAgora: () => api<AgoraDiagnoseResult>('/admin/agora-settings/diagnose'),
  diagnoseRazorpay: () => api<RazorpayDiagnoseResult>('/admin/razorpay-settings/diagnose'),

  // Per-app maintenance mode.
  getMaintenance: (app: MaintenanceApp) => api<MaintenanceSetting>(`/admin/settings/maintenance/${app}`),
  setMaintenance: (app: MaintenanceApp, value: MaintenanceSetting) =>
    api<MaintenanceSetting>(`/admin/settings/maintenance/${app}`, { method: 'PUT', body: { value } }),

  // Firebase service-account (push notifications) — status only, never the key.
  firebaseServiceAccountStatus: () => api<FirebaseServiceAccountStatus>('/admin/firebase/service-account/status'),
  uploadFirebaseServiceAccount: (file: File) =>
    apiUpload<{ project_id: string | null; client_email: string | null }>('/admin/firebase/service-account', file),

  // Per-app Firebase client config (google-services.json).
  downloadFirebaseClientConfig: (app: MaintenanceApp) => apiDownload(`/admin/firebase/client-config/${app}`),
  uploadFirebaseClientConfig: (app: MaintenanceApp, file: File) =>
    apiUpload<FirebaseClientConfigResult>(`/admin/firebase/client-config/${app}`, file),

  // Payout (withdraw request) lifecycle actions.
  approvePayout: (id: string) => api(`/admin/payouts/${id}/approve`, { method: 'POST' }),
  markPayoutPaid: (id: string, reference?: string) =>
    api(`/admin/payouts/${id}/mark-paid`, { method: 'POST', body: { reference: reference || null } }),
  rejectPayout: (id: string, reason?: string) =>
    api(`/admin/payouts/${id}/reject`, { method: 'POST', body: { reason: reason || null } }),

  // Lightweight astrologer list for pickers (e.g. the Astrologer Videos form).
  astrologerOptions: () => api<AstrologerOption[]>('/admin/astrologers/list'),

  // Content media uploads — used by the Banners / Promo Videos / Astrologer
  // Videos forms to turn a file picked on disk into a hosted URL.
  uploadImage: (file: File) => apiUpload<UploadResponse>('/admin/uploads/image', file),
  uploadVideo: (file: File) => apiUpload<UploadResponse>('/admin/uploads/video', file),
}
