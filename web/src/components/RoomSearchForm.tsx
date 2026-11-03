import { useEffect,useId,useState } from 'react'
import type { RoomPlan,StaySearch } from '../lib/stays'
import { useCopy } from './JourneyCommon'
import { StayDateRange } from './StayDateRange'

export function RoomSearchForm({value,busy,plan,session,room,compact,summary,revision,onChange,onPlan,onSession,onSubmit}:{
 value:StaySearch;busy:boolean;plan:RoomPlan;session:string|null;room?:string;compact?:boolean;summary?:string;revision:number
 onChange:(patch:Partial<StaySearch>)=>void;onPlan:(plan:RoomPlan)=>void;onSession:(id:string|null,startsAt?:string|null)=>void;onSubmit:()=>void
}){
 const {t}=useCopy();const id=useId();const [flash,setFlash]=useState(false)
 useEffect(()=>{if(!revision)return;setFlash(true);const timer=setTimeout(()=>setFlash(false),2400);return()=>clearTimeout(timer)},[revision])
 return <form className={`room-search-form${compact?' is-compact':''}`} onSubmit={e=>{e.preventDefault();onSubmit()}} aria-label={t('查询客房','Search rooms')}>
  <StayDateRange value={value} plan={plan} session={session} room={room} compact={compact} onChange={onChange} onPlan={onPlan} onSession={onSession}/>
  <label className="room-search-guests" htmlFor={`${id}-guests`}>{t('入住人数','Guests')}<select id={`${id}-guests`} className="input" value={[1,2].includes(value.guests)?value.guests:''} onChange={e=>onChange({guests:Number(e.target.value)})}><option value="" disabled>{t('选择人数','Select guests')}</option><option value={1}>1</option><option value={2}>2</option></select></label>
  <button className="btn-primary" disabled={busy} aria-busy={busy}>{busy?t('正在查询…','Searching…'):t('查询房型与价格','Find rooms & rates')}</button>
  {summary&&<p className="room-search-status" aria-live="polite">{flash?`${t('已更新','Updated')} · `:''}{summary}</p>}
 </form>
}
