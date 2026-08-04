import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import type { ReactNode } from 'react'
import { AuthProvider, useAuth } from './auth/AuthContext'
import Layout from './components/Layout'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import KYCQueuePage from './pages/KYCQueuePage'
import CouponsPage from './pages/CouponsPage'
import LiveGiftsPage from './pages/LiveGiftsPage'
import SimpleCrudPage from './pages/SimpleCrudPage'
import CosmicServicesPage from './pages/CosmicServicesPage'
import SettingsPage from './pages/SettingsPage'
import MaintenancePage from './pages/MaintenancePage'
import FirebaseConfigPage from './pages/FirebaseConfigPage'
import AgoraSettingsPage from './pages/AgoraSettingsPage'
import WalletManagementPage from './pages/WalletManagementPage'
import AstrologerChargesPage from './pages/AstrologerChargesPage'
import AstrologerDetailsPage from './pages/AstrologerDetailsPage'
import CommissionPage from './pages/CommissionPage'
import CustomersPage from './pages/CustomersPage'
import PayoutsPage from './pages/PayoutsPage'
import RazorpaySettingsPage from './pages/RazorpaySettingsPage'
import TopAstrologersPage from './pages/TopAstrologersPage'
import ApprovalStatusPage from './pages/ApprovalStatusPage'
import WalletTransactionsPage from './pages/WalletTransactionsPage'
import WalletLedgerPage from './pages/WalletLedgerPage'
import RefundsPage from './pages/RefundsPage'
import SessionsPage from './pages/SessionsPage'
import ChatRoomsPage from './pages/ChatRoomsPage'
import ReviewsPage from './pages/ReviewsPage'
import { adminApi } from './api/endpoints'

function RequireAuth({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth()
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            element={
              <RequireAuth>
                <Layout />
              </RequireAuth>
            }
          >
            <Route path="/" element={<DashboardPage />} />

            {/* Seekers & Users */}
            <Route path="/customers" element={<CustomersPage />} />

            {/* Astrologers Network */}
            <Route path="/astrologers" element={<AstrologerDetailsPage />} />
            <Route path="/charges" element={<AstrologerChargesPage />} />
            <Route path="/top" element={<TopAstrologersPage />} />
            <Route path="/approval" element={<KYCQueuePage />} />
            <Route path="/approval-status" element={<ApprovalStatusPage />} />

            {/* Financial Suite */}
            <Route path="/wallet" element={<WalletManagementPage />} />
            <Route path="/wallet-transactions" element={<WalletTransactionsPage />} />
            <Route path="/wallet-ledger" element={<WalletLedgerPage />} />
            <Route path="/payouts" element={<PayoutsPage />} />
            <Route path="/refunds" element={<RefundsPage />} />

            {/* Sessions & Communications */}
            <Route path="/sessions" element={<SessionsPage />} />
            <Route path="/chat-rooms" element={<ChatRoomsPage />} />
            <Route path="/reviews" element={<ReviewsPage />} />

            {/* Store & Media Content */}
            <Route path="/coupons" element={<CouponsPage />} />
            <Route
              path="/banners"
              element={
                <SimpleCrudPage
                  title="Promotional Banners"
                  subtitle="Home-screen promotional banners and hero slides."
                  endpoint="/admin/banners"
                  fields={[
                    { key: 'title', label: 'Title' },
                    { key: 'image_url', label: 'Image URL', required: true, placeholder: 'https://…', kind: 'image' },
                    { key: 'link_url', label: 'Link URL' },
                    { key: 'position', label: 'Display Order' },
                  ]}
                  display={[
                    { key: 'title', label: 'Banner Title' },
                    { key: 'image_url', label: 'Preview' },
                    { key: 'position', label: 'Position' },
                    { key: 'is_active', label: 'Active Status' },
                  ]}
                />
              }
            />
            <Route path="/cosmic-services" element={<CosmicServicesPage />} />
            <Route path="/live-gifts" element={<LiveGiftsPage />} />
            <Route
              path="/promo-videos"
              element={
                <SimpleCrudPage
                  title="Feature Promo Videos"
                  subtitle="Platform showcase and marketing videos."
                  endpoint="/admin/promo-videos"
                  fields={[
                    { key: 'title', label: 'Video Title' },
                    { key: 'video_url', label: 'Video File / URL', required: true, kind: 'video' },
                    { key: 'thumbnail_url', label: 'Thumbnail Image', kind: 'image' },
                  ]}
                  display={[
                    { key: 'title', label: 'Title' },
                    { key: 'video_url', label: 'Video Clip' },
                    { key: 'thumbnail_url', label: 'Thumbnail' },
                    { key: 'is_active', label: 'Status' },
                  ]}
                />
              }
            />
            <Route
              path="/astrologer-videos"
              element={
                <SimpleCrudPage
                  title="Astrologer Intro Videos"
                  subtitle="Astrologer introduction and consultation sample reels."
                  endpoint="/admin/astrologer-videos"
                  fields={[
                    {
                      key: 'astrologer_id',
                      label: 'Astrologer',
                      kind: 'select',
                      placeholder: '— Select Astrologer —',
                      loadOptions: () =>
                        adminApi
                          .astrologerOptions()
                          .then((list) => list.map((a) => ({ value: a.id, label: a.name || a.id }))),
                    },
                    { key: 'title', label: 'Video Title' },
                    { key: 'video_url', label: 'Video File', required: true, kind: 'video' },
                    { key: 'thumbnail_url', label: 'Thumbnail Image', kind: 'image' },
                  ]}
                  display={[
                    { key: 'title', label: 'Title' },
                    { key: 'astrologer_id', label: 'Astrologer' },
                    { key: 'video_url', label: 'Video Reel' },
                    { key: 'thumbnail_url', label: 'Thumbnail' },
                    { key: 'is_active', label: 'Status' },
                  ]}
                />
              }
            />

            {/* Integrations & System Settings */}
            <Route
              path="/social-links"
              element={
                <SettingsPage
                  title="Social Links"
                  subtitle="Platform social media handles and support contact links."
                  endpoint="/admin/settings/social-links"
                  fields={[
                    { key: 'facebook', label: 'Facebook Page URL' },
                    { key: 'instagram', label: 'Instagram Profile URL' },
                    { key: 'youtube', label: 'YouTube Channel URL' },
                    { key: 'whatsapp', label: 'WhatsApp Support Number' },
                  ]}
                />
              }
            />
            <Route path="/agora" element={<AgoraSettingsPage />} />
            <Route path="/razorpay" element={<RazorpaySettingsPage />} />
            <Route path="/commission" element={<CommissionPage />} />
            <Route path="/maintenance" element={<MaintenancePage />} />
            <Route path="/firebase-config" element={<FirebaseConfigPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
