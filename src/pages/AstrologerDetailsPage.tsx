import { useCallback, useEffect, useState } from 'react'
import { api } from '../api/client'
import { adminApi } from '../api/endpoints'
import { StatusBadge } from '../components/Badge'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { DetailDrawer } from '../components/DetailDrawer'
import { PageHeader, Card } from '../components/ui/PageShell'
import { SearchBox } from '../components/ListControls'
import type { AstrologerEditInput, KYCStatus } from '../api/types'

interface AstrologerRow { id:string; name:string|null; mobile:string|null; skills:string[]|null; experience:number|null; kyc_status:KYCStatus; is_online:boolean; avg_rating:string; available_balance:string }

export default function AstrologerDetailsPage(){
  const [rows,setRows]=useState<AstrologerRow[]>([])
  const [error,setError]=useState<string|null>(null)
  const [busyId,setBusyId]=useState<string|null>(null)
  const [loading,setLoading]=useState(true)
  const [query,setQuery]=useState('')
  const [edit,setEdit]=useState<AstrologerRow|null>(null)
  const [remove,setRemove]=useState<AstrologerRow|null>(null)
  const [removing,setRemoving]=useState(false)
  const [removeError,setRemoveError]=useState<string|null>(null)
  const [detailId,setDetailId]=useState<string|null>(null)

  const load=useCallback(async()=>{ setLoading(true); try{ setRows(await api<AstrologerRow[]>('/admin/astrologers/list')); setError(null) } catch(e){ setError((e as Error).message) } finally{ setLoading(false) } },[])
  useEffect(()=>{ void load() },[load])

  const filtered = rows.filter(r=>{
    const q=query.toLowerCase()
    if(!q) return true
    return [r.name,r.mobile,r.skills?.join(' '),r.kyc_status].some(v=>v&&String(v).toLowerCase().includes(q))
  })

  async function act(id:string, action:'block'|'unblock'){ setBusyId(id); setError(null); try{ await api(`/admin/astrologers/${id}/${action}`,{method:'POST'}); await load() } catch(e){ setError((e as Error).message) } finally{ setBusyId(null) } }
  async function confirmDelete(){ if(!remove) return; setRemoving(true); setRemoveError(null); try{ await adminApi.deleteAstrologer(remove.id); setRemove(null); await load() } catch(e){ setRemoveError((e as Error).message) } finally{ setRemoving(false) } }

  return (
    <div className="page-shell space-y-5">
      <PageHeader
        title="Astrologers"
        subtitle="All astrologers — view detailed profiles, edit, block, or verify KYC status in one place."
        icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-pink-400"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>}
        actions={<><SearchBox value={query} onChange={setQuery} placeholder="Name, mobile, skills…" /><button onClick={load} className="h-[42px] rounded-full border border-border-soft bg-surface-raised px-5 text-[13px] font-semibold shadow-sm">↻ Refresh</button></>}
      />

      {error && <div className="rounded-2xl border border-red-500/20 bg-red-500/10 backdrop-blur-xl px-4 py-3 text-[13px] text-red-300">{error}</div>}

      {loading && rows.length===0 ? <Card><div className="p-10 text-center text-ivory-faint">Loading astrologers…</div></Card> : rows.length===0 ? <Card><div className="p-16 text-center"><div className="text-[14px] font-semibold">No astrologers</div><div className="text-[12px] text-ivory-faint">No astrologers found in system.</div></div></Card> : (
        <>
          {/* Desktop */}
          <div className="hidden lg:block overflow-hidden rounded-[24px] border border-white/10 bg-white/4 backdrop-blur-2xl shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead><tr className="border-b border-border-soft bg-surface-1/60 text-left text-[11px] font-bold uppercase tracking-wider text-ivory-faint"><th className="px-5 py-3.5">Astrologer</th><th className="px-5 py-3.5">Skills</th><th className="px-5 py-3.5">KYC</th><th className="px-5 py-3.5">Status</th><th className="px-5 py-3.5">Rating</th><th className="px-5 py-3.5">Balance</th><th className="px-5 py-3.5 text-right">Actions</th></tr></thead>
                <tbody className="divide-y divide-border-soft/60">
                  {filtered.map(a=>{
                    const blocked=a.kyc_status==='rejected'
                    return (
                      <tr key={a.id} className="hover:bg-surface-1/50 transition-colors">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="grid h-10 w-10 place-items-center rounded-xl bg-saffron-soft border border-saffron/15 text-[12px] font-bold text-saffron">{(a.name||'A')[0].toUpperCase()}</div>
                            <div><div className="text-[13.5px] font-semibold">{a.name ?? <span className="text-ivory-faint">—</span>}</div><div className="font-mono text-[11px] text-ivory-faint">{a.mobile ?? '—'} {a.experience!=null ? `· ${a.experience}y` : ''}</div></div>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-[12px] text-ivory-dim max-w-[180px] truncate">{a.skills?.length ? a.skills.join(', ') : <span className="text-ivory-faint">—</span>}</td>
                        <td className="px-5 py-4"><StatusBadge status={a.kyc_status} /></td>
                        <td className="px-5 py-4"><span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-bold ${a.is_online ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400' : 'border-border-soft bg-surface-2 text-ivory-faint'}`}><span className={`h-1.5 w-1.5 rounded-full ${a.is_online?'bg-emerald-500 animate-pulse':'bg-ivory-faint'}`}/>{a.is_online?'online':'offline'}</span></td>
                        <td className="px-5 py-4 text-[12px] font-medium">⭐ {a.avg_rating}</td>
                        <td className="px-5 py-4"><span className="rounded-full bg-amber-500/10 border border-amber-500/20 px-3 py-1 font-mono text-[11px] font-bold text-amber-400">₹{a.available_balance}</span></td>
                        <td className="px-5 py-4 text-right">
                          <div className="inline-flex items-center gap-1 rounded-full border border-border-soft bg-surface-1 p-1 shadow-sm">
                            <button onClick={()=>setDetailId(a.id)} className="grid h-8 w-8 place-items-center rounded-full bg-surface-raised border border-border-soft text-ivory-dim hover:text-ivory">👁</button>
                            <button onClick={()=>setEdit(a)} className="grid h-8 w-8 place-items-center rounded-full bg-surface-raised border border-border-soft text-ivory-dim hover:text-ivory"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>
                            <button disabled={busyId===a.id} onClick={()=>act(a.id, blocked?'unblock':'block')} className={`grid h-8 w-8 place-items-center rounded-full border text-[11px] font-bold ${blocked ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-amber-500/10 border-amber-500/20 text-amber-400'}`}>{busyId===a.id?'…':blocked?'↺':'⊘'}</button>
                            <button onClick={()=>setRemove(a)} className="grid h-8 w-8 place-items-center rounded-full bg-red-500/10 border border-red-500/20 text-red-400">✕</button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile cards */}
          <div className="grid gap-3 lg:hidden">
            {filtered.map(a=>(
              <div key={a.id} className="rounded-[22px] border border-white/10 bg-white/5 backdrop-blur-xl p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex gap-3"><div className="grid h-11 w-11 place-items-center rounded-xl bg-saffron-soft border border-saffron/15 text-saffron font-bold">{(a.name||'A')[0].toUpperCase()}</div><div><div className="font-semibold text-[14px]">{a.name ?? '—'}</div><div className="text-[11px] text-ivory-faint">{a.mobile ?? ''} · {a.experience ?? 0}y · ⭐{a.avg_rating}</div></div></div>
                  <StatusBadge status={a.kyc_status} />
                </div>
                <div className="mt-3 flex items-center justify-between"><span className="text-[12px] text-ivory-dim truncate max-w-[160px]">{a.skills?.join(', ') ?? '—'}</span><span className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-full border ${a.is_online ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-surface-2 text-ivory-faint border-border-soft'}`}>{a.is_online?'online':'offline'}</span></div>
                <div className="mt-3 flex gap-2">
                  <button onClick={()=>setDetailId(a.id)} className="flex-1 h-9 rounded-full bg-gradient-to-r from-violet-500 to-pink-500 text-white text-[12px] font-bold">View</button>
                  <button onClick={()=>setEdit(a)} className="h-9 w-9 grid place-items-center rounded-full border border-border-soft bg-surface-1">✎</button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {edit && <EditModal astrologer={edit} onClose={()=>setEdit(null)} onDone={()=>{setEdit(null); void load()}} />}
      {remove && <ConfirmDialog title="Delete astrologer" message="This permanently deletes the astrologer and all their data. Continue?" confirmLabel="Delete astrologer" busy={removing} error={removeError} onConfirm={confirmDelete} onClose={()=>{setRemove(null); setRemoveError(null)}} />}
      <DetailDrawer kind="astrologer" id={detailId} onClose={()=>setDetailId(null)} />
    </div>
  )
}

const KYC_OPTIONS: KYCStatus[]=['pending','approved','rejected']

function EditModal({astrologer,onClose,onDone}:{astrologer:AstrologerRow; onClose:()=>void; onDone:()=>void}){
  const [displayName,setDisplayName]=useState(astrologer.name??'')
  const [bio,setBio]=useState('')
  const [mobile,setMobile]=useState(astrologer.mobile??'')
  const [email,setEmail]=useState('')
  const [skills,setSkills]=useState((astrologer.skills??[]).join(', '))
  const [languages,setLanguages]=useState('')
  const [years,setYears]=useState(astrologer.experience!=null?String(astrologer.experience):'')
  const [rateChat,setRateChat]=useState('')
  const [rateCall,setRateCall]=useState('')
  const [rateVideo,setRateVideo]=useState('')
  const [superChatMin,setSuperChatMin]=useState('')
  const [kyc,setKyc]=useState<KYCStatus>(astrologer.kyc_status)
  const [isOnline,setIsOnline]=useState(astrologer.is_online)
  const [error,setError]=useState<string|null>(null)
  const [saving,setSaving]=useState(false)

  async function submit(){
    const body: AstrologerEditInput={ kyc_status:kyc, is_online:isOnline }
    const dn=displayName.trim(); if(dn) body.display_name=dn
    const b=bio.trim(); if(b) body.bio=b
    const m=mobile.trim(); if(m) body.mobile=m
    const em=email.trim(); if(em) body.email=em
    const sk=skills.split(',').map(s=>s.trim()).filter(Boolean); if(sk.length) body.skills=sk
    const lg=languages.split(',').map(s=>s.trim()).filter(Boolean); if(lg.length) body.languages=lg
    const numField=(raw:string)=>{ const t=raw.trim(); if(!t) return null; const n=Number(t); return Number.isFinite(n)?n:NaN }
    const nums: [string,keyof AstrologerEditInput,string][]=[[years,'years_experience','Years'],[rateChat,'rate_chat_per_msg','Chat rate'],[rateCall,'rate_call_per_min','Call rate'],[rateVideo,'rate_video_per_min','Video rate'],[superChatMin,'super_chat_min_price','Super-chat']]
    for(const [raw,key,label] of nums){ const n=numField(raw); if(n===null) continue; if(Number.isNaN(n)){ setError(`${label} must be a number.`); return } ;(body as Record<string,unknown>)[key]=n }
    setSaving(true); setError(null)
    try{ await adminApi.editAstrologer(astrologer.id,body); onDone() } catch(e){ setError((e as Error).message) } finally{ setSaving(false) }
  }

  return (
    <div className="fixed inset-0 z-[60] grid place-items-center bg-black/60 backdrop-blur-xl p-4" onClick={onClose}>
      <div className="max-h-[92vh] w-full max-w-[560px] overflow-y-auto rounded-[26px] border border-white/12 bg-white/6 backdrop-blur-2xl p-6 shadow-2xl animate-pop-in" onClick={e=>e.stopPropagation()}>
        <div className="flex items-center justify-between"><h3 className="text-[16px] font-bold">Edit astrologer</h3><button onClick={onClose} className="grid h-8 w-8 place-items-center rounded-full bg-surface-1 border border-border-soft">✕</button></div>
        <p className="mt-1 text-[11px] text-ivory-faint">Leave blank fields unchanged.</p>
        {error && <div className="mt-3 rounded-2xl border border-red-500/20 bg-red-500/10 backdrop-blur-xl px-3 py-2 text-[13px] text-red-400">{error}</div>}
        <div className="mt-4 grid gap-3">
          <label className="text-[12px] font-medium text-ivory-dim">Display name<input value={displayName} onChange={e=>setDisplayName(e.target.value)} className="mt-1.5 h-11 w-full rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl px-3.5 text-[13px] outline-none focus:border-saffron" /></label>
          <label className="text-[12px] font-medium text-ivory-dim">Bio<input value={bio} onChange={e=>setBio(e.target.value)} className="mt-1.5 h-11 w-full rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl px-3.5 text-[13px]" /></label>
          <div className="grid grid-cols-2 gap-3"><label className="text-[12px]">Mobile<input value={mobile} onChange={e=>setMobile(e.target.value)} className="mt-1.5 h-11 w-full rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl px-3.5 text-[13px]" /></label><label className="text-[12px]">Email<input value={email} onChange={e=>setEmail(e.target.value)} className="mt-1.5 h-11 w-full rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl px-3.5 text-[13px]" /></label></div>
          <label className="text-[12px] font-medium text-ivory-dim">Skills (comma)<input value={skills} onChange={e=>setSkills(e.target.value)} className="mt-1.5 h-11 w-full rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl px-3.5 text-[13px]" /></label>
          <label className="text-[12px] font-medium text-ivory-dim">Languages (comma)<input value={languages} onChange={e=>setLanguages(e.target.value)} className="mt-1.5 h-11 w-full rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl px-3.5 text-[13px]" /></label>
          <div className="grid grid-cols-2 gap-3"><label className="text-[12px]">Years exp<input value={years} onChange={e=>setYears(e.target.value)} className="mt-1.5 h-11 w-full rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl px-3.5 text-[13px]" /></label><label className="text-[12px]">KYC<select value={kyc} onChange={e=>setKyc(e.target.value as KYCStatus)} className="mt-1.5 h-11 w-full rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl px-3.5 text-[13px]">{KYC_OPTIONS.map(o=><option key={o} value={o}>{o}</option>)}</select></label></div>
          <div className="grid grid-cols-3 gap-3"><label className="text-[12px]">Chat ₹<input value={rateChat} onChange={e=>setRateChat(e.target.value)} className="mt-1.5 h-11 w-full rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl px-3.5 text-[13px]" /></label><label className="text-[12px]">Call ₹<input value={rateCall} onChange={e=>setRateCall(e.target.value)} className="mt-1.5 h-11 w-full rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl px-3.5 text-[13px]" /></label><label className="text-[12px]">Video ₹<input value={rateVideo} onChange={e=>setRateVideo(e.target.value)} className="mt-1.5 h-11 w-full rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl px-3.5 text-[13px]" /></label></div>
          <label className="text-[12px]">Super-chat min ₹<input value={superChatMin} onChange={e=>setSuperChatMin(e.target.value)} className="mt-1.5 h-11 w-full rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl px-3.5 text-[13px]" /></label>
          <label className="flex items-center gap-2 text-[13px] rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-3"><input type="checkbox" checked={isOnline} onChange={e=>setIsOnline(e.target.checked)} className="h-4 w-4 rounded border-border-soft" /> Online</label>
        </div>
        <div className="mt-6 flex justify-end gap-2"><button onClick={onClose} className="h-10 rounded-full border border-border-soft bg-surface-1 px-5 text-[13px]">Cancel</button><button disabled={saving} onClick={submit} className="h-10 rounded-full bg-gradient-to-r from-violet-500 to-pink-500 text-white px-6 text-[13px] font-bold disabled:opacity-50">{saving?'Saving…':'Save changes'}</button></div>
      </div>
    </div>
  )
}
