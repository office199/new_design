import { useCallback, useEffect, useState } from 'react'
import { adminApi } from '../api/endpoints'
import type { ChatMessage, ChatRoomConsultation } from '../api/types'

const money = (v: unknown) => `₹${v ?? '0.00'}`
const dateTime = (v: unknown) => (v ? new Date(String(v)).toLocaleString() : '—')

function durationLabel(seconds: unknown): string {
  const n = Number(seconds)
  if (!Number.isFinite(n) || n <= 0) return '—'
  const m = Math.floor(n / 60)
  const s = Math.round(n % 60)
  return m > 0 ? `${m}m ${s}s` : `${s}s`
}

const STATUS_BADGE: Record<string, string> = {
  pending: 'badge-pending',
  active: 'badge-pending',
  ongoing: 'badge-pending',
  completed: 'badge-approved',
  paid: 'badge-approved',
  cancelled: 'badge-rejected',
  canceled: 'badge-rejected',
  refunded: 'badge-rejected',
  failed: 'badge-rejected',
}

interface ChatTranscriptModalProps {
  /** Chat consultation id to fetch the transcript for. Null/undefined keeps the modal closed. */
  consultationId: string | null | undefined
  onClose: () => void
}

/**
 * Full chat transcript viewer, opened from the Chat Message Rooms list.
 * Fetches `GET /admin/chat-rooms/{id}/messages` on open and renders the
 * consultation summary plus a scrollable message thread. Matches
 * DetailDrawer's modal chrome (backdrop, close button, Escape-to-close,
 * loading/error states) but uses a chat-bubble layout instead of stat tiles.
 */
export function ChatTranscriptModal({ consultationId, onClose }: ChatTranscriptModalProps) {
  const [consultation, setConsultation] = useState<ChatRoomConsultation | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!consultationId) return
    setLoading(true)
    setError(null)
    setConsultation(null)
    setMessages([])
    try {
      const data = await adminApi.chatTranscript(consultationId)
      setConsultation(data.consultation)
      setMessages(data.messages ?? [])
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }, [consultationId])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load()
  }, [load])

  useEffect(() => {
    if (!consultationId) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [consultationId, onClose])

  if (!consultationId) return null

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="card modal-detail" onClick={(e) => e.stopPropagation()}>
        <div className="row spread" style={{ alignItems: 'flex-start' }}>
          <h2 style={{ fontSize: 20 }}>Chat transcript</h2>
          <button className="btn-ghost" onClick={onClose}>Close</button>
        </div>

        {loading && <div className="empty">Loading…</div>}
        {error && <div className="error-banner" style={{ marginTop: 12 }}>{error}</div>}

        {!loading && !error && consultation && (
          <>
            <div className="row spread" style={{ marginTop: 4, flexWrap: 'wrap', gap: 12 }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 600 }}>
                  {consultation.astrologer_name ?? 'Astrologer'}
                  <span className="faint"> &harr; </span>
                  {consultation.user_name ?? 'Seeker'}
                </div>
                <div className="muted" style={{ fontSize: 13, marginTop: 2 }}>
                  {consultation.message_count} messages · {money(consultation.amount_charged)} charged ·{' '}
                  {durationLabel(consultation.duration_seconds)} · {dateTime(consultation.created_at)}
                </div>
              </div>
              <span className={`badge ${STATUS_BADGE[consultation.status] ?? 'badge-pending'}`}>
                {consultation.status}
              </span>
            </div>

            <div className="chat-thread">
              {messages.length === 0 && <div className="empty">No messages yet.</div>}
              {messages.map((m) => (
                <ChatBubble key={m.id} message={m} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function ChatBubble({ message }: { message: ChatMessage }) {
  const isAstrologer = message.sender_role === 'astrologer'
  const fallbackName = isAstrologer ? 'Astrologer' : 'Seeker'
  return (
    <div className={`chat-bubble-row ${isAstrologer ? 'astrologer' : 'user'}`}>
      <div className="chat-bubble">
        <div className="chat-bubble-sender">{message.sender_name ?? fallbackName}</div>
        <div className="chat-bubble-body">{message.body}</div>
        <div className="chat-bubble-time">{dateTime(message.created_at)}</div>
      </div>
    </div>
  )
}
