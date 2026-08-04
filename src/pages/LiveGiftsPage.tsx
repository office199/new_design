import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { api } from '../api/client'
import { PageHeader, Card } from '../components/ui/PageShell'

interface LiveGift { id:string; key:string; name:string; price:string; emoji:string|null; position:number; is_active:boolean }

export default function LiveGiftsPage(){
  const [rows,setRows]=useState<LiveGift[]>([])
  const [error,setError]=useState<string|null>(null)
  const [key,setKey]=useState('')
  const [name,setName]=useState('')
  const [price,setPrice]=useState('')
  const [emoji,setEmoji]=useState('')
  const [position,setPosition]=useState('')
  const [edit,setEdit]=useState<LiveGift|null>(null)

  const load=useCallback(async()=>{ try{ setRows(await api<LiveGift[]>('/admin/live-gifts')); setError(null) } catch(e){ setError((e as Error).message) } },[])
  useEffect(()=>{ void load() },[load])

  async function create(e:FormEvent){
    e.preventDefault(); setError(null)
    try{
      const body:Record<string,unknown>={ key:key.trim(), name:name.trim(), price:price.trim() }
      if(emoji.trim()) body.emoji=emoji.trim()
      if(position.trim()) body.position=Number(position.trim())
      await api('/admin/live-gifts',{method:'POST',body})
      setKey(''); setName(''); setPrice(''); setEmoji(''); setPosition(''); await load()
    }catch(err){ setError((err as Error).message) }
  }
  async function toggle(g:LiveGift){ await api(`/admin/live-gifts/${g.id}`,{method:'PATCH',body:{is_active:!g.is_active}}); await load() }
  async function remove(g:LiveGift){ await api(`/admin/live-gifts/${g.id}`,{method:'DELETE'}); await load() }

  return (
    <div className="page-shell space-y-6">
      <PageHeader title="Live Gifts" subtitle="Gift catalog for live streams — emojis, prices and ordering. Viewers send these during live sessions." icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-pink-400"><polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><line x1="12" y1="22" x2="12" y2="7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/></svg>} />

      {error && <div className="rounded-2xl border border-red-500/20 bg-red-500/10 backdrop-blur-xl px-4 py-3 text-[13px] text-red-300">{error}</div>}

      <Card className="p-5 sm:p-6">
        <div className="text-[11px] font-bold uppercase tracking-widest text-ivory-faint flex items-center gap-2"><span className="grid h-6 w-6 place-items-center rounded-full bg-amber-500/10 border border-amber-500/15">+</span> Add gift</div>
        <form onSubmit={create} className="mt-4 grid gap-3 sm:grid-cols-5">
          <label className="text-[11px] font-semibold text-ivory-dim">Key<input value={key} onChange={e=>setKey(e.target.value)} placeholder="rose" required className="mt-1.5 h-11 w-full rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl px-3.5 text-[13px] outline-none focus:border-saffron" /></label>
          <label className="text-[11px] font-semibold text-ivory-dim">Name<input value={name} onChange={e=>setName(e.target.value)} placeholder="Rose Bouquet" required className="mt-1.5 h-11 w-full rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl px-3.5 text-[13px] outline-none focus:border-saffron" /></label>
          <label className="text-[11px] font-semibold text-ivory-dim">Price<input value={price} onChange={e=>setPrice(e.target.value)} placeholder="10" required className="mt-1.5 h-11 w-full rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl px-3.5 text-[13px] outline-none focus:border-saffron" /></label>
          <label className="text-[11px] font-semibold text-ivory-dim">Emoji<input value={emoji} onChange={e=>setEmoji(e.target.value)} placeholder="🌹" className="mt-1.5 h-11 w-full rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl px-3.5 text-[13px] outline-none focus:border-saffron" /></label>
          <label className="text-[11px] font-semibold text-ivory-dim">Position<input value={position} onChange={e=>setPosition(e.target.value)} placeholder="1" className="mt-1.5 h-11 w-full rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl px-3.5 text-[13px] outline-none focus:border-saffron" /></label>
          <div className="sm:col-span-5"><button type="submit" className="h-11 rounded-xl bg-gradient-to-r from-violet-500 to-pink-500 text-white px-6 text-[13px] font-bold hover:bg-white">Add gift</button></div>
        </form>
      </Card>

      <div className="overflow-hidden rounded-[24px] border border-white/10 bg-white/4 backdrop-blur-2xl shadow-sm">
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full border-collapse">
            <thead><tr className="border-b border-border-soft bg-surface-1/60 text-left text-[11px] font-bold uppercase tracking-wider text-ivory-faint"><th className="px-5 py-3.5">Gift</th><th className="px-5 py-3.5">Key</th><th className="px-5 py-3.5">Price</th><th className="px-5 py-3.5">Pos</th><th className="px-5 py-3.5">Status</th><th className="px-5 py-3.5 text-right">Actions</th></tr></thead>
            <tbody className="divide-y divide-border-soft/60">
              {rows.map(g=>(
                <tr key={g.id} className="hover:bg-surface-1/50">
                  <td className="px-5 py-4"><div className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-xl bg-surface-1 border border-border-soft text-[18px]">{g.emoji ?? '🎁'}</span><span className="font-semibold text-[13.5px]">{g.name}</span></div></td>
                  <td className="px-5 py-4 font-mono text-[12px] text-ivory-dim">{g.key}</td>
                  <td className="px-5 py-4"><span className="rounded-full bg-amber-500/10 border border-amber-500/20 px-3 py-1 font-mono text-[12px] font-bold text-amber-400">₹{g.price}</span></td>
                  <td className="px-5 py-4 text-[12px]">{g.position}</td>
                  <td className="px-5 py-4"><span className={`rounded-full border px-3 py-1 text-[11px] font-bold uppercase ${g.is_active?'border-emerald-500/20 bg-emerald-500/10 text-emerald-400':'border-border-soft bg-surface-2 text-ivory-faint'}`}>{g.is_active?'active':'off'}</span></td>
                  <td className="px-5 py-4 text-right"><div className="inline-flex gap-1.5"><button onClick={()=>setEdit(g)} className="h-8 rounded-full border border-border-soft bg-surface-1 px-4 text-[12px] font-semibold">Edit</button><button onClick={()=>toggle(g)} className={`h-8 rounded-full border px-4 text-[12px] font-bold ${g.is_active?'border-amber-500/20 bg-amber-500/10 text-amber-400':'border-emerald-500/20 bg-emerald-500/10 text-emerald-400'}`}>{g.is_active?'Disable':'Enable'}</button><button onClick={()=>remove(g)} className="h-8 rounded-full bg-red-500/10 border border-red-500/20 px-4 text-[12px] font-bold text-red-400">Delete</button></div></td>
                </tr>
              ))}
              {rows.length===0 && <tr><td colSpan={6} className="py-16 text-center text-[13px] text-ivory-faint">No gifts yet — add your first live gift above.</td></tr>}
            </tbody>
          </table>
        </div>

        <div className="grid gap-3 p-3 md:hidden">
          {rows.map(g=>(
            <div key={g.id} className="rounded-[20px] border border-white/10 bg-white/5 backdrop-blur-xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3"><span className="text-[22px]">{g.emoji ?? '🎁'}</span><div><div className="font-semibold text-[13px]">{g.name}</div><div className="font-mono text-[11px] text-ivory-faint">{g.key} · ₹{g.price}</div></div></div>
              <button onClick={()=>setEdit(g)} className="h-8 rounded-full border border-border-soft bg-surface-raised px-3 text-[11px] font-bold">Edit</button>
            </div>
          ))}
        </div>
      </div>

      {edit && <EditModal gift={edit} onClose={()=>setEdit(null)} onDone={()=>{setEdit(null); void load()}} />}
    </div>
  )
}

function EditModal({gift,onClose,onDone}:{gift:LiveGift; onClose:()=>void; onDone:()=>void}){
  const [name,setName]=useState(gift.name)
  const [price,setPrice]=useState(gift.price)
  const [emoji,setEmoji]=useState(gift.emoji??'')
  const [position,setPosition]=useState(String(gift.position))
  const [error,setError]=useState<string|null>(null)
  const [saving,setSaving]=useState(false)
  async function submit(){
    setSaving(true); setError(null)
    try{ await api(`/admin/live-gifts/${gift.id}`,{method:'PATCH',body:{name:name.trim(),price:price.trim(),emoji:emoji.trim()||null,position:Number(position)||0}}); onDone() }
    catch(e){ setError((e as Error).message) } finally{ setSaving(false) }
  }
  return (
    <div className="fixed inset-0 z-[60] grid place-items-center bg-black/60 backdrop-blur-xl p-4" onClick={onClose}>
      <div className="w-full max-w-[440px] animate-pop-in rounded-[26px] border border-white/12 bg-white/6 backdrop-blur-2xl p-6 shadow-2xl" onClick={e=>e.stopPropagation()}>
        <div className="flex items-center justify-between"><h3 className="text-[15px] font-bold">Edit gift · {gift.key}</h3><button onClick={onClose} className="grid h-8 w-8 place-items-center rounded-full bg-surface-1 border border-border-soft">✕</button></div>
        {error && <div className="mt-4 rounded-2xl border border-red-500/20 bg-red-500/10 backdrop-blur-xl px-3 py-2 text-[13px] text-red-400">{error}</div>}
        <div className="mt-5 grid gap-4">
          <label className="text-[12px] font-semibold">Name<input value={name} onChange={e=>setName(e.target.value)} className="mt-1.5 h-11 w-full rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl px-3.5 text-[13px]" /></label>
          <div className="grid grid-cols-2 gap-3"><label className="text-[12px]">Price<input value={price} onChange={e=>setPrice(e.target.value)} className="mt-1.5 h-11 w-full rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl px-3.5 text-[13px]" /></label><label className="text-[12px]">Emoji<input value={emoji} onChange={e=>setEmoji(e.target.value)} className="mt-1.5 h-11 w-full rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl px-3.5 text-[13px]" /></label></div>
          <label className="text-[12px]">Position<input value={position} onChange={e=>setPosition(e.target.value)} className="mt-1.5 h-11 w-full rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl px-3.5 text-[13px]" /></label>
        </div>
        <div className="mt-6 flex justify-end gap-2.5"><button onClick={onClose} className="h-10 rounded-full border border-border-soft bg-surface-1 px-5 text-[13px]">Cancel</button><button disabled={saving} onClick={submit} className="h-10 rounded-full bg-gradient-to-r from-violet-500 to-pink-500 text-white px-6 text-[13px] font-bold disabled:opacity-50">{saving?'Saving…':'Save'}</button></div>
      </div>
    </div>
  )
}
