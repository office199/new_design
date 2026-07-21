import type { Column } from '../components/DataTable'
import { StatusBadge } from '../components/Badge'
import type { KYCStatus } from '../api/types'

const money = (v: unknown) => `₹${v ?? '0.00'}`
const shortId = (v: unknown) => String(v ?? '').slice(0, 8)
const dateOnly = (v: unknown) => (v ? new Date(String(v)).toLocaleDateString() : '—')

export interface ResourceConfig {
  title: string
  subtitle?: string
  endpoint: string
  columns: Column[]
  /**
   * Opt-in: when set, ListPage makes rows clickable. `customer`/`astrologer`
   * open the shared DetailDrawer, fetching its `/{id}/detail` route.
   * `chatTranscript` opens the chat transcript viewer instead, fetching
   * `/admin/chat-rooms/{id}/messages`.
   */
  rowDetail?: 'customer' | 'astrologer' | 'chatTranscript'
}

export const RESOURCES: Record<string, ResourceConfig> = {
  customers: {
    title: 'Customer Details',
    subtitle: 'All registered seekers.',
    endpoint: '/admin/customers',
    columns: [
      { key: 'name', label: 'Name' },
      { key: 'mobile', label: 'Mobile', mono: true },
      { key: 'email', label: 'Email' },
      { key: 'language', label: 'Lang' },
      { key: 'wallet_balance', label: 'Wallet', render: money },
      { key: 'is_active', label: 'Active' },
      { key: 'created_at', label: 'Joined', render: dateOnly },
    ],
  },
  astrologers: {
    title: 'Astrologer Details',
    endpoint: '/admin/astrologers/list',
    columns: [
      { key: 'name', label: 'Name' },
      { key: 'mobile', label: 'Mobile', mono: true },
      { key: 'skills', label: 'Skills' },
      { key: 'experience', label: 'Exp (yrs)' },
      { key: 'kyc_status', label: 'KYC', render: (v) => <StatusBadge status={v as KYCStatus} /> },
      { key: 'is_online', label: 'Online' },
      { key: 'avg_rating', label: 'Rating' },
      { key: 'available_balance', label: 'Balance', render: money },
    ],
  },
  charges: {
    title: 'Astrologer Charges',
    subtitle: 'Per-astrologer consultation rates.',
    endpoint: '/admin/astrologers/charges',
    columns: [
      { key: 'name', label: 'Astrologer' },
      { key: 'chat_per_msg', label: 'Chat / msg', render: money },
      { key: 'call_per_min', label: 'Call / min', render: money },
      { key: 'video_per_min', label: 'Video / min', render: money },
    ],
  },
  top: {
    title: 'Top Astrologers',
    subtitle: 'Ranked by rating & reviews.',
    endpoint: '/admin/astrologers/top',
    columns: [
      { key: 'name', label: 'Name' },
      { key: 'avg_rating', label: 'Rating' },
      { key: 'review_count', label: 'Reviews' },
      { key: 'followers', label: 'Followers' },
      { key: 'available_balance', label: 'Earnings', render: money },
    ],
  },
  approvals: {
    title: 'Approval Status',
    subtitle: 'KYC status for every astrologer.',
    endpoint: '/admin/approvals',
    columns: [
      { key: 'name', label: 'Name' },
      { key: 'mobile', label: 'Mobile', mono: true },
      { key: 'kyc_status', label: 'Status', render: (v) => <StatusBadge status={v as KYCStatus} /> },
      { key: 'submitted_at', label: 'Submitted', render: dateOnly },
      { key: 'reviewed_at', label: 'Reviewed', render: dateOnly },
    ],
  },
  walletTransactions: {
    title: 'Wallet Transactions',
    endpoint: '/admin/wallet/transactions',
    columns: [
      { key: 'user_id', label: 'User', mono: true, render: shortId },
      { key: 'type', label: 'Type' },
      { key: 'amount', label: 'Amount', render: money },
      { key: 'balance_after', label: 'Balance', render: money },
      { key: 'status', label: 'Status' },
      { key: 'created_at', label: 'When', render: dateOnly },
    ],
  },
  walletLedger: {
    title: 'Wallet Ledger',
    subtitle: 'Per-user credit / debit totals. Click a row for the full customer detail.',
    endpoint: '/admin/wallet/ledger',
    rowDetail: 'customer',
    columns: [
      { key: 'name', label: 'User' },
      { key: 'mobile', label: 'Mobile', mono: true },
      { key: 'total_credit', label: 'Credited', render: money },
      { key: 'total_debit', label: 'Debited', render: money },
      { key: 'balance', label: 'Balance', render: money },
    ],
  },
  payouts: {
    title: 'Withdraw Requests',
    endpoint: '/admin/payouts',
    columns: [
      { key: 'astrologer_id', label: 'Astrologer', mono: true, render: shortId },
      { key: 'amount', label: 'Amount', render: money },
      { key: 'status', label: 'Status' },
      { key: 'bank_account_last4', label: 'A/C', render: (v) => (v ? `•••• ${v}` : '—') },
      { key: 'ifsc', label: 'IFSC', mono: true },
      { key: 'created_at', label: 'Requested', render: dateOnly },
    ],
  },
  refunds: {
    title: 'Refund History',
    endpoint: '/admin/refunds',
    columns: [
      { key: 'user_id', label: 'User', mono: true, render: shortId },
      { key: 'amount', label: 'Amount', render: money },
      { key: 'reference_id', label: 'Consultation', mono: true, render: shortId },
      { key: 'created_at', label: 'When', render: dateOnly },
    ],
  },
  consultations: {
    title: 'Session Requests',
    subtitle: 'Every chat / call / video session.',
    endpoint: '/admin/consultations',
    columns: [
      { key: 'id', label: 'ID', mono: true, render: shortId },
      { key: 'type', label: 'Type' },
      { key: 'status', label: 'Status' },
      { key: 'rate', label: 'Rate', render: money },
      { key: 'duration_seconds', label: 'Dur (s)' },
      { key: 'amount_charged', label: 'Charged', render: money },
      { key: 'created_at', label: 'When', render: dateOnly },
    ],
  },
  chatRooms: {
    title: 'Chat Message Rooms',
    subtitle: 'Chat consultations and their message counts. Click a row to read the full transcript.',
    endpoint: '/admin/chat-rooms',
    rowDetail: 'chatTranscript',
    columns: [
      { key: 'id', label: 'Room', mono: true, render: shortId },
      { key: 'user_name', label: 'User', render: (v, row) => (v as string) ?? shortId(row.user_id) },
      { key: 'astrologer_name', label: 'Astrologer', render: (v, row) => (v as string) ?? shortId(row.astrologer_id) },
      { key: 'status', label: 'Status' },
      { key: 'message_count', label: 'Messages' },
      { key: 'amount_charged', label: 'Charged', render: money },
    ],
  },
  reviews: {
    title: 'Reviews',
    endpoint: '/admin/reviews',
    columns: [
      { key: 'astrologer_id', label: 'Astrologer', mono: true, render: shortId },
      { key: 'rating', label: 'Rating', render: (v) => `⭐ ${v}` },
      { key: 'review', label: 'Review' },
      { key: 'created_at', label: 'When', render: dateOnly },
    ],
  },
}
