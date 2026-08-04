import { useCallback, useEffect, useMemo, useState, type ChangeEvent, type FormEvent, type ReactNode } from 'react'
import { api, mediaUrl } from '../api/client'
import { adminApi } from '../api/endpoints'
import type { Row } from '../components/DataTable'
import { PageHeader, Card } from '../components/ui/PageShell'

export interface SelectOption { value:string; label:string }
export interface CrudField { key:string; label:string; placeholder?:string; required?:boolean; kind?:'text'|'image'|'video'|'select'; loadOptions?:()=>Promise<SelectOption[]> }

interface Props { title:string; subtitle?:string; endpoint:string; fields:CrudField[]; display:{key:string;label:string}[] }

function emptyForm(fields:CrudField[]){ const f:Record<string,string>={}; for(const fld of fields) f[fld.key]=''; return f }
function normalizeBody(fields:CrudField[], form:Record<string,string>){ const body:Record<string,unknown>={}; for(const fld of fields){ const v=(form[fld.key]??'').trim(); body[fld.key]= v==='' && fld.kind==='select' ? null : v } return body }

export default function SimpleCrudPage({ title, subtitle, endpoint, fields, display }: Props){
  const [rows,setRows]=useState<Row[]>([])
  const [form,setForm]=useState<Record<string,string>>(()=>emptyForm(fields))
  const [error,setError]=useState<string|null>(null)
  const [editing,setEditing]=useState<Row|null>(null)
  const [optionsMap,setOptionsMap]=useState<Record<string,SelectOption[]>>({})
  const selectFields=useMemo(()=>fields.filter(f=>f.kind==='select' && f.loadOptions),[fields])

  const load=useCallback(async()=>{ try{ setRows(await api<Row[]>(endpoint)); setError(null) } catch(e){ setError((e as Error).message) } },[endpoint])
  useEffect(()=>{ void load() },[load])
  useEffect(()=>{
    let cancelled=false
    for(const f of selectFields){ f.loadOptions!().then(opts=>{ if(!cancelled) setOptionsMap(prev=>({...prev,[f.key]:opts})) }).catch(()=>{}) }
    return()=>{ cancelled=true }
  },[selectFields])

  async function create(e:FormEvent){ e.preventDefault(); setError(null); try{ await api(endpoint,{method:'POST',body:normalizeBody(fields,form)}); setForm(emptyForm(fields)); await load() } catch(err){ setError((err as Error).message) } }
  async function remove(id:string){ await api(`${endpoint}/${id}`,{method:'DELETE'}); await load() }

  return (
    <div className="page-shell space-y-6">
      <PageHeader title={title} subtitle={subtitle ?? `Manage ${title.toLowerCase()} — add, edit, delete and upload media.`} icon={<span className="text-[18px]">🗂️</span>} actions={<span className="rounded-full bg-surface-1 border border-border-soft px-3 py-1 text-[11px] font-bold">{rows.length} total</span>} />
      {error && <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-[13px] text-red-300">{error}</div>}

      <Card className="p-5 sm:p-6">
        <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-ivory-faint"><span className="grid h-6 w-6 place-items-center rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">+</span> Add new {title.toLowerCase()}</div>
        <form onSubmit={create} className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {fields.map(f=>(
            <label key={f.key} className="text-[11px] font-semibold text-ivory-dim">{f.label}
              <div className="mt-1.5"><FieldControl field={f} value={form[f.key]??''} options={optionsMap[f.key]} onChange={v=>setForm(prev=>({...prev,[f.key]:v}))} /></div>
            </label>
          ))}
          <div className="sm:col-span-2 lg:col-span-3 xl:col-span-4 flex">
            <button type="submit" className="h-11 rounded-xl bg-ivory text-bg-0 px-6 text-[13px] font-bold hover:bg-white">Add {title.slice(0, -1) || 'item'}</button>
          </div>
        </form>
      </Card>

      <div className="overflow-hidden rounded-[20px] border border-border-soft bg-surface-raised shadow-sm">
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full border-collapse">
            <thead><tr className="border-b border-border-soft bg-surface-1/60 text-left text-[11px] font-bold uppercase tracking-wider text-ivory-faint">{display.map(d=><th key={d.key} className="px-5 py-3.5">{d.label}</th>)}<th className="px-5 py-3.5 text-right">Actions</th></tr></thead>
            <tbody className="divide-y divide-border-soft/60">
              {rows.map(r=>(
                <tr key={r.id as string} className="hover:bg-surface-1/50">
                  {display.map(d=>{
                    const field=fields.find(f=>f.key===d.key)
                    return <td key={d.key} className="px-5 py-4 text-[13px]">{renderDisplay(r[d.key], field, optionsMap)}</td>
                  })}
                  <td className="px-5 py-4 text-right">
                    <div className="inline-flex gap-1.5"><button onClick={()=>setEditing(r)} className="h-8 rounded-full border border-border-soft bg-surface-1 px-4 text-[12px] font-semibold hover:bg-surface-2">Edit</button><button onClick={()=>remove(r.id as string)} className="h-8 rounded-full bg-red-500/10 border border-red-500/20 px-4 text-[12px] font-bold text-red-400">Delete</button></div>
                  </td>
                </tr>
              ))}
              {rows.length===0 && <tr><td colSpan={display.length+1} className="py-16 text-center text-[13px] text-ivory-faint">Nothing here yet — add your first item above.</td></tr>}
            </tbody>
          </table>
        </div>

        <div className="grid gap-3 p-3 md:hidden">
          {rows.map(r=>(
            <div key={r.id as string} className="rounded-[16px] border border-border-soft bg-surface-1 p-4">
              <div className="grid gap-2">
                {display.slice(0,3).map(d=>{
                  const field=fields.find(f=>f.key===d.key)
                  return <div key={d.key} className="flex justify-between gap-3 text-[13px]"><span className="text-[11px] font-bold uppercase text-ivory-faint">{d.label}</span><span>{renderDisplay(r[d.key],field,optionsMap)}</span></div>
                })}
              </div>
              <div className="mt-3 flex gap-2"><button onClick={()=>setEditing(r)} className="flex-1 h-9 rounded-full border border-border-soft bg-surface-raised text-[12px] font-semibold">Edit</button><button onClick={()=>remove(r.id as string)} className="flex-1 h-9 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-[12px] font-bold">Delete</button></div>
            </div>
          ))}
        </div>
      </div>

      {editing && <EditModal endpoint={endpoint} fields={fields} row={editing} optionsMap={optionsMap} onClose={()=>setEditing(null)} onDone={()=>{setEditing(null); void load()}} />}
    </div>
  )
}

function renderDisplay(value:unknown, field:CrudField|undefined, optionsMap:Record<string,SelectOption[]>):ReactNode{
  if(value==null||value==='') return <span className="text-ivory-faint">—</span>
  if(field?.kind==='image'){ const url=mediaUrl(String(value)); return <a href={url} target="_blank" rel="noreferrer"><img src={url} alt="" className="h-10 w-14 rounded-lg object-cover border border-border-soft shadow-sm" /></a> }
  if(field?.kind==='video'){ const url=mediaUrl(String(value)); return <a href={url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded-full bg-violet-500/10 border border-violet-500/20 px-2.5 py-1 font-mono text-[11px] text-violet-400">🎬 {(String(value).split('/').pop())}</a> }
  if(field?.kind==='select'){ const opts=optionsMap[field.key]??[]; const m=opts.find(o=>o.value===String(value)); return m ? <span className="rounded-full bg-surface-1 border border-border-soft px-2.5 py-1 text-[12px]">{m.label}</span> : <span className="font-mono text-[11px]">{String(value).slice(0,8)}</span> }
  if(typeof value==='boolean') return <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold border ${value ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-surface-2 text-ivory-faint border-border-soft'}`}>{value?'Yes':'No'}</span>
  const s=String(value)
  return s.length>48 ? <span title={s} className="line-clamp-1 max-w-[200px]">{s.slice(0,48)}…</span> : s
}

function FieldControl({field,value,onChange,options}:{field:CrudField; value:string; onChange:(v:string)=>void; options?:SelectOption[]}){
  const [uploading,setUploading]=useState(false)
  const [uploadError,setUploadError]=useState<string|null>(null)

  if(field.kind==='select'){
    return <select value={value} required={field.required} onChange={e=>onChange(e.target.value)} className="h-11 w-full rounded-xl border border-border-soft bg-surface-1 px-3.5 text-[13px] outline-none focus:border-saffron"><option value="">{field.placeholder ?? '— none —'}</option>{(options??[]).map(o=><option key={o.value} value={o.value}>{o.label}</option>)}</select>
  }

  async function handleFile(e:ChangeEvent<HTMLInputElement>){
    const file=e.target.files?.[0]; if(!file) return
    setUploading(true); setUploadError(null)
    try{ const {url}= field.kind==='video' ? await adminApi.uploadVideo(file) : await adminApi.uploadImage(file); onChange(url) }
    catch(err){ setUploadError((err as Error).message) } finally{ setUploading(false); e.target.value='' }
  }

  return (
    <div>
      <input value={value} placeholder={field.placeholder} required={field.required} onChange={e=>onChange(e.target.value)} className="h-11 w-full rounded-xl border border-border-soft bg-surface-1 px-3.5 text-[13px] outline-none focus:border-saffron focus:bg-surface-2" />
      {(field.kind==='image'||field.kind==='video') && (
        <div className="mt-2 flex items-center gap-2">
          <label className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-full border border-border-soft bg-surface-1 px-3 text-[11px] font-bold hover:bg-surface-2"><input type="file" accept={field.kind==='image'?'image/*':'video/*'} onChange={handleFile} disabled={uploading} className="hidden" />📎 Upload {field.kind}</label>
          {uploading && <span className="text-[11px] text-ivory-faint">Uploading…</span>}
          {!uploading && value && field.kind==='image' && <img src={mediaUrl(value)} alt="" className="h-7 w-10 rounded border border-border-soft object-cover" />}
        </div>
      )}
      {uploadError && <div className="mt-1 text-[11px] text-red-400">{uploadError}</div>}
    </div>
  )
}

function EditModal({endpoint,fields,row,optionsMap,onClose,onDone}:{endpoint:string; fields:CrudField[]; row:Row; optionsMap:Record<string,SelectOption[]>; onClose:()=>void; onDone:()=>void}){
  const [form,setForm]=useState<Record<string,string>>(()=>{ const init:Record<string,string>={}; for(const f of fields){ const v=row[f.key]; init[f.key]= v==null?'':String(v) } return init })
  const [error,setError]=useState<string|null>(null)
  const [saving,setSaving]=useState(false)

  async function submit(){
    setSaving(true); setError(null)
    try{ await api(`${endpoint}/${row.id as string}`,{method:'PATCH',body:normalizeBody(fields,form)}); onDone() }
    catch(e){ setError((e as Error).message) } finally{ setSaving(false) }
  }

  return (
    <div className="fixed inset-0 z-[60] grid place-items-center bg-black/60 backdrop-blur-xl p-4" onClick={onClose}>
      <div className="w-full max-w-[520px] rounded-[22px] border border-border-mid bg-surface-raised p-6 shadow-2xl animate-pop-in" onClick={e=>e.stopPropagation()}>
        <div className="flex items-center justify-between"><h3 className="text-[16px] font-bold">Edit item</h3><button onClick={onClose} className="grid h-8 w-8 place-items-center rounded-full bg-surface-1 border border-border-soft">✕</button></div>
        {error && <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-[13px] text-red-400">{error}</div>}
        <div className="mt-5 grid gap-4">
          {fields.map(f=><label key={f.key} className="text-[11px] font-semibold text-ivory-dim">{f.label}<div className="mt-1.5"><FieldControl field={f} value={form[f.key]??''} options={optionsMap[f.key]} onChange={v=>setForm(prev=>({...prev,[f.key]:v}))} /></div></label>)}
        </div>
        <div className="mt-6 flex justify-end gap-2.5"><button onClick={onClose} className="h-10 rounded-full border border-border-soft bg-surface-1 px-5 text-[13px]">Cancel</button><button disabled={saving} onClick={submit} className="h-10 rounded-full bg-ivory text-bg-0 px-6 text-[13px] font-bold disabled:opacity-50">{saving?'Saving…':'Save changes'}</button></div>
      </div>
    </div>
  )
}
