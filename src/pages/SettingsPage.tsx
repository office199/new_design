import { useCallback, useEffect, useState } from 'react'
import { api } from '../api/client'
import { PageHeader, Card } from '../components/ui/PageShell'

export interface SettingField { key:string; label:string; type?:'text'|'number'|'bool'; placeholder?:string }
interface Props { title:string; subtitle?:string; endpoint:string; fields:SettingField[] }
type Value = Record<string,string|number|boolean>

export default function SettingsPage({ title, subtitle, endpoint, fields }: Props){
  const [value,setValue]=useState<Value>({})
  const [error,setError]=useState<string|null>(null)
  const [saved,setSaved]=useState(false)
  const [loading,setLoading]=useState(true)

  const load=useCallback(async()=>{
    try{ setLoading(true); setValue(await api<Value>(endpoint)) }
    catch(e){ setError((e as Error).message) } finally{ setLoading(false) }
  },[endpoint])
  useEffect(()=>{ void load() },[load])

  async function save(){
    setError(null); setSaved(false)
    try{ await api(endpoint,{method:'PUT',body:{value}}); setSaved(true); setTimeout(()=>setSaved(false),3000) }
    catch(e){ setError((e as Error).message) }
  }

  return (
    <div className="page-shell max-w-[680px] space-y-6">
      <PageHeader title={title} subtitle={subtitle ?? `Configure ${title.toLowerCase()} for your platform.`} icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-violet-400"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>} />

      {error && <div className="rounded-2xl border border-red-500/20 bg-red-500/10 backdrop-blur-xl px-5 py-4 text-[14px] text-red-300">{error}</div>}
      {saved && <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 backdrop-blur-xl px-5 py-4 text-[14px] text-emerald-400 flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"/>Saved successfully!</div>}

      <Card className="p-7 sm:p-8">
        {loading ? <div className="py-12 text-center text-[14px] text-ivory-faint">Loading…</div> : (
          <>
            <div className="grid gap-6">
              {fields.map(f=>(
                <div key={f.key}>
                  <label className="block text-[11px] font-bold uppercase tracking-[0.08em] text-ivory-faint">{f.label}</label>
                  {f.type==='bool' ? (
                    <label className="mt-3 flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-5 cursor-pointer hover:bg-white/8 transition-colors">
                      <span className="text-[14px] font-medium">Enable — {value[f.key] ? 'Active' : 'Disabled'}</span>
                      <input type="checkbox" checked={Boolean(value[f.key])} onChange={e=>setValue({...value,[f.key]:e.target.checked})} className="h-5 w-5 rounded" />
                    </label>
                  ) : (
                    <input type={f.type==='number'?'number':'text'} placeholder={f.placeholder} value={String(value[f.key]??'')} onChange={e=>setValue({...value,[f.key]: f.type==='number' ? Number(e.target.value) : e.target.value})} className="mt-3 h-12 w-full rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl px-5 text-[14px] outline-none focus:border-violet-400/50 focus:bg-white/8 focus:shadow-[0_0_0_4px_rgba(139,92,246,0.15)]" />
                  )}
                </div>
              ))}
            </div>
            <button onClick={save} className="mt-8 h-12 rounded-2xl bg-gradient-to-r from-violet-500 to-pink-500 text-white px-7 text-[14px] font-bold hover:brightness-110 shadow-[0_4px_20px_rgba(139,92,246,0.25),inset_0_1px_0_rgba(255,255,255,0.15)]">Save changes</button>
          </>
        )}
      </Card>
    </div>
  )
}
