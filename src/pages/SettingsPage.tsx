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
    <div className="max-w-[640px] space-y-6">
      <PageHeader title={title} subtitle={subtitle ?? `Configure ${title.toLowerCase()} for your platform.`} icon={<span className="text-[18px]">⚙️</span>} />

      {error && <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-[13px] text-red-300">{error}</div>}
      {saved && <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-[13px] text-emerald-400 flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"/>Saved successfully!</div>}

      <Card className="p-6 sm:p-7">
        {loading ? <div className="py-10 text-center text-[13px] text-ivory-faint">Loading…</div> : (
          <>
            <div className="grid gap-5">
              {fields.map(f=>(
                <div key={f.key}>
                  <label className="block text-[11px] font-bold uppercase tracking-[0.08em] text-ivory-faint">{f.label}</label>
                  {f.type==='bool' ? (
                    <label className="mt-2.5 flex items-center justify-between gap-3 rounded-xl border border-border-soft bg-surface-1 p-4 cursor-pointer hover:bg-surface-2 transition-colors">
                      <span className="text-[13px] font-medium">Enable — {value[f.key] ? 'Active' : 'Disabled'}</span>
                      <input type="checkbox" checked={Boolean(value[f.key])} onChange={e=>setValue({...value,[f.key]:e.target.checked})} className="h-5 w-5 rounded border-border-soft" />
                    </label>
                  ) : (
                    <input type={f.type==='number'?'number':'text'} placeholder={f.placeholder} value={String(value[f.key]??'')} onChange={e=>setValue({...value,[f.key]: f.type==='number' ? Number(e.target.value) : e.target.value})} className="mt-2.5 h-11 w-full rounded-xl border border-border-soft bg-surface-1 px-4 text-[13px] outline-none focus:border-saffron focus:bg-surface-2 shadow-sm" />
                  )}
                </div>
              ))}
            </div>
            <button onClick={save} className="mt-8 h-11 rounded-xl bg-ivory text-bg-0 px-6 text-[13px] font-bold hover:bg-white shadow-sm">Save changes</button>
          </>
        )}
      </Card>
    </div>
  )
}
