import { useCallback, useEffect, useState } from 'react'
import { adminApi } from '../api/endpoints'
import type { ChatMessage, ChatRoomConsultation } from '../api/types'

const money = (v: unknown) => `₹${v ?? '0.00'}`
const dateTime = (v: unknown) => (v ? new Date(String(v)).toLocaleString() : '—')
function durationLabel(s: unknown){ const n=Number(s); if(!Number.isFinite(n)||n<=0) return '—'; const m=Math.floor(n/60); const sec=Math.round(n%60); return m>0?`${m}m ${sec}s`:`${sec}s` }

interface Props { consultationId: string|null|undefined; onClose:()=>void }

export function ChatTranscriptModal({ consultationId, onClose }: Props) {
  const [consultation, setConsultation] = useState<ChatRoomConsultation|null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string|null>(null)

  const load = useCallback(async ()=>{
    if(!consultationId) return
    setLoading(true); setError(null); setConsultation(null); setMessages([])
    try{ const d=await adminApi.chatTranscript(consultationId); setConsultation(d.consultation); setMessages(d.messages??[]) }
    catch(e){ setError((e as Error).message) } finally{ setLoading(false) }
  },[consultationId])

  useEffect(()=>{ void load() },[load])
  useEffect(()=>{ if(!consultationId) return; const fn=(e:KeyboardEvent)=>{ if(e.key==='Escape') onClose() }; window.addEventListener('keydown',fn); return()=>window.removeEventListener('keydown',fn) },[consultationId,onClose])
  if(!consultationId) return null

  return (
    <div className="fixed inset-0 z-[60] grid place-items-center bg-black/60 backdrop-blur-md p-4 animate-fade-in" onClick={onClose}>
      <div className="flex max-h-[85vh] w-full max-w-[720px] animate-pop-in flex-col overflow-hidden rounded-[20px] border border-border-mid bg-surface-raised shadow-[0_24px_70px_rgba(0,0,0,0.5)]" onClick={e=>e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-border-soft px-6 py-4">
          <div>
            <h3 className="text-[16px] font-semibold">Chat transcript</h3>
            <p className="mt-0.5 text-[12px] text-ivory-faint">Full conversation history</p>
          </div>
          <button onClick={onClose} className="grid h-8 w-8 place-items-center rounded-full border border-border-soft bg-surface-1 text-ivory-dim transition-colors hover:bg-surface-2 hover:text-ivory">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading && <div className="grid place-items-center p-12 text-[13px] text-ivory-faint">Loading transcript…</div>}
          {error && <div className="m-4 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-[13px] text-red-400">{error}</div>}
          {!loading && !error && consultation && (
            <>
              <div className="border-b border-border-soft bg-surface-1/50 p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="text-[15px] font-semibold">{consultation.astrologer_name ?? 'Astrologer'} <span className="text-ivory-faint font-normal">↔</span> {consultation.user_name ?? 'Seeker'}</div>
                    <div className="mt-1 flex flex-wrap gap-2 text-[12px] text-ivory-faint">
                      <span className="inline-flex items-center gap-1 rounded-full border border-border-soft bg-surface-raised px-2.5 py-1"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500"/> {consultation.message_count} messages</span>
                      <span className="inline-flex items-center gap-1 rounded-full border border-border-soft bg-surface-raised px-2.5 py-1">{money(consultation.amount_charged)}</span>
                      <span className="inline-flex items-center gap-1 rounded-full border border-border-soft bg-surface-raised px-2.5 py-1">{durationLabel(consultation.duration_seconds)}</span>
                      <span className="inline-flex items-center gap-1 rounded-full border border-border-soft bg-surface-raised px-2.5 py-1">{dateTime(consultation.created_at)}</span>
                    </div>
                  </div>
                  <span className="rounded-full border border-amber-500/20 bg-amber-500/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-amber-500">{consultation.status}</span>
                </div>
              </div>

              <div className="space-y-3 p-4">
                {messages.length===0 && <div className="grid place-items-center rounded-xl border border-dashed border-border-soft bg-surface-1/40 p-10 text-[13px] text-ivory-faint">No messages yet.</div>}
                {messages.map(m=>(
                  <div key={m.id} className={`flex ${m.sender_role==='astrologer' ? 'justify-start' : 'justify-end'}`}>
                    <div className={`max-w-[78%] rounded-[16px] border px-3.5 py-2.5 shadow-sm ${m.sender_role==='astrologer' ? 'rounded-bl-[4px] border-border-soft bg-surface-1' : 'rounded-br-[4px] border-saffron/20 bg-saffron-soft'}`}>
                      <div className="text-[11px] font-semibold text-ivory-faint">{m.sender_name ?? (m.sender_role==='astrologer' ? 'Astrologer' : 'Seeker')}</div>
                      <div className="mt-1 text-[13.5px] leading-[1.5] whitespace-pre-wrap break-words text-ivory">{m.body}</div>
                      <div className="mt-1.5 text-right text-[10.5px] text-ivory-faint">{dateTime(m.created_at)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
