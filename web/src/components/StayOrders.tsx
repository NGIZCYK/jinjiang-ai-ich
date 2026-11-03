import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { requireCloud, rpc } from '../lib/cloud'
import { useAppStore } from '../lib/store'
import { money, stayError, staySlots, stayStatus, transitionStay, useStayStore, type StayBooking, type StaySlot } from '../lib/stays'
import { slotTime } from '../lib/journey'
import { useCopy, Notice } from './JourneyCommon'
import { StayDemoNotice, StayMessage, useStayAction } from './StayCommon'

function StayHistory({id}:{id:string}){
 const {language,t}=useCopy();const [rows,setRows]=useState<{id:number;status:keyof typeof stayStatus;reason:string;created_at:string}[]>([]);const action=useStayAction()
 return <details className="stay-history" onToggle={e=>{if(e.currentTarget.open)void action.run(async()=>{const {data,error}=await requireCloud().from('stay_history').select('*').eq('booking_id',id).order('created_at');if(error)throw new Error(error.message);setRows(data??[])})}}><summary>{t('订单处理记录','Order history')}</summary>{rows.map(row=><p key={row.id}>{slotTime(row.created_at,language)} · {stayStatus[row.status]?.[language==='zh'?0:1]} {row.reason}</p>)}<StayMessage message={action.message} error={action.failed}/></details>
}
export function StayOrderCard({booking:b,operations=false}:{booking:StayBooking;operations?:boolean}){
 const {language,t}=useCopy();const zh=language==='zh';const refresh=useStayStore(s=>s.refresh);const action=useStayAction()
 const [slots,setSlots]=useState<StaySlot[]>([]);const [loaded,setLoaded]=useState(false);const [selected,setSelected]=useState('');const [reason,setReason]=useState('');const [cancelOpen,setCancelOpen]=useState(false)
 const e=b.stay_entitlements;const held=slots.find(s=>s.is_held);const [heldStart,setHeldStart]=useState('')
 useEffect(()=>{let active=true;setSlots([]);setLoaded(false);setSelected('');setHeldStart('')
  if(e)void requireCloud().from('sessions').select('starts_at').eq('id',e.session_id).single().then(({data})=>{if(active&&data)setHeldStart(data.starts_at)})
  return()=>{active=false}
 },[b.id,e?.session_id,e?.status])
 async function loadSlots(){const rows=await staySlots(b.id);setSlots(rows);setSelected(rows.find(s=>s.is_held)?.id||rows.find(s=>s.available>=b.guests)?.id||'');setLoaded(true)}
 async function change(status:keyof typeof stayStatus){await transitionStay(b.id,status,reason,selected||null);setCancelOpen(false);setLoaded(false);await refresh()}
 const beforeArrival=Date.now()<Date.parse(`${b.check_in}T14:00:00+08:00`)
 const canCancel=b.status==='pending'||b.status==='confirmed'&&beforeArrival
 const eligible=(b.status==='confirmed'||b.status==='checked_in')&&e&&e.status!=='cancelled'
 const expired=!!heldStart&&Date.parse(heldStart)<=Date.now()
 return <article className="stay-order" id={`stay-${b.id}`}>
  <div className="stay-order-head"><div><p className="eyebrow">{t('住宿订单','STAY ORDER')} · {b.id.slice(0,8)}</p><h2>{zh?b.quote.room_title_zh:b.quote.room_title_en}</h2></div><span className={`status-pill status-${b.status}`}>{stayStatus[b.status][zh?0:1]}</span></div>
  <p>{b.check_in} 14:00 → {b.check_out} 12:00 · {b.guests} {t('人','guests')}</p><p>{zh?b.quote.plan_title_zh:b.quote.plan_title_en} · {t('演示订单金额','Demo order amount')} <strong>{money(b.quote.total)}</strong></p>
  {operations&&<p className="stay-caption">{t('住客编号','Guest ID')}: {b.user_id.slice(0,8)} · {b.batch_id}</p>}
  {b.status==='pending'&&<p className="stay-caption">{t('已收到申请，尚未保留房量。运营确认后才获得住宿名额。','Request received. Rooms are reserved only after operations confirms.')}</p>}
  {b.reason&&<Notice>{b.reason}</Notice>}
  <details><summary>{t('查看提交时费用','Submitted price breakdown')}</summary><dl className="stay-order-prices">{b.quote.nights.map(n=><div key={n.night}><dt>{n.night}</dt><dd>{money(n.price)}</dd></div>)}<div><dt>{t('套餐费用','Package')}</dt><dd>{money(b.quote.surcharge)}</dd></div></dl></details>
  {e&&<div className="stay-benefit"><h3>{t('套餐文化权益','Included cultural experience')}</h3><p>{e.seats} {t('人的一次90分钟工坊，套餐已包含。','guests · one 90-minute workshop, included in the package.')}</p>
   {heldStart&&<p>{t(e.status==='cancelled'?'原关联场次：':e.status==='redeemed'?'已预约场次：':'已保留名额：',e.status==='cancelled'?'Previously linked session: ':e.status==='redeemed'?'Booked session: ':'Held places: ')}{slotTime(heldStart,language)}</p>}
   {e.status==='held'&&<p className="stay-caption">{expired?t('保留场次已开始，未兑换权益已过期。','The held session has started. The unredeemed benefit has expired.'):t('请在保留场次开始前兑换，逾期失效。','Redeem before the held session begins; the benefit then expires.')}</p>}
   {e.status==='cancelled'&&<p>{t('住宿已取消，关联权益已释放。','Accommodation cancelled; the associated benefit has been released.')}</p>}
  </div>}
  {!operations&&eligible&&!expired&&<div className="stay-benefit-actions"><button className="btn-ghost" disabled={action.busy} onClick={()=>void action.run(loadSlots)}>{t(e.status==='redeemed'?'查看可改约场次':'预约套餐体验',e.status==='redeemed'?'Change experience session':'Book included experience')}</button>
   {loaded&&<><label>{t('入住期间可选场次','Sessions during your stay')}<select className="input" value={selected} disabled={action.busy} onChange={event=>setSelected(event.target.value)}><option value="">{t('请选择场次','Choose a session')}</option>{slots.filter(s=>s.available>=b.guests).map(s=><option key={s.id} value={s.id}>{slotTime(s.starts_at,language)}{s.is_held?t(' · 已保障',' · Held'):''}</option>)}</select></label><button className="btn-primary" disabled={action.busy||!selected} aria-busy={action.busy} onClick={()=>void action.run(async()=>{await rpc(e.status==='redeemed'?'reschedule_stay_experience':'redeem_stay_entitlement',{p_booking:b.id,p_session:selected});await refresh();setLoaded(false)},t('体验场次已确认，可在文化体验中查看。','Experience confirmed. View it under Cultural experiences.'))}>{t('确认场次','Confirm session')}</button>{!slots.some(s=>s.available>=b.guests)&&<Notice>{t('暂无可选场次，请更新订单或联系运营。','No sessions are available. Refresh or contact operations.')}</Notice>}</>}
  </div>}
  {operations&&b.status==='pending'&&<div className="stay-ops-actions">{b.quote.experience_id&&<><button className="ops-btn ops-btn-secondary" disabled={action.busy} onClick={()=>void action.run(loadSlots)}>{t('核对可保障场次','Check held-session options')}</button>{loaded&&<label>{t('保障体验场次','Guaranteed experience session')}<select className="input" value={selected} onChange={ev=>setSelected(ev.target.value)}><option value="">{t('自动选择最早可用场次','Earliest available session')}</option>{slots.filter(s=>s.available>=b.guests).map(s=><option key={s.id} value={s.id}>{slotTime(s.starts_at,language)} · {s.available}</option>)}</select></label>}</>}
   <button className="ops-btn ops-btn-primary" disabled={action.busy} aria-busy={action.busy} onClick={()=>void action.run(()=>change('confirmed'),t('住宿已确认，含套餐时已同时保障体验名额。','Accommodation confirmed; package places are held when included.'))}>{t('确认住宿','Confirm stay')}</button>
   <label>{t('拒绝原因','Reason for declining')}<input className="input" maxLength={1000} value={reason} onChange={ev=>setReason(ev.target.value)}/></label><button className="ops-btn ops-btn-secondary" disabled={action.busy||!reason.trim()} onClick={()=>void action.run(()=>change('declined'),t('已拒绝并记录原因。','Declined with the reason recorded.'))}>{t('拒绝申请','Decline')}</button>
  </div>}
  {operations&&b.status==='confirmed'&&<button className="ops-btn ops-btn-secondary" disabled={action.busy||beforeArrival||Date.now()>=Date.parse(`${b.check_out}T12:00:00+08:00`)} onClick={()=>void action.run(()=>change('checked_in'),t('演示入住状态已更新。','Demo check-in recorded.'))}>{t('办理演示入住','Record demo check-in')}</button>}
  {operations&&b.status==='checked_in'&&<button className="ops-btn ops-btn-secondary" disabled={action.busy||Date.now()<Date.parse(`${b.check_out}T12:00:00+08:00`)} onClick={()=>void action.run(()=>change('checked_out'),t('演示离店状态已更新。','Demo check-out recorded.'))}>{t('办理演示离店','Record demo check-out')}</button>}
  {canCancel&&<div className="stay-cancel">{cancelOpen?<><Notice>{t('取消将释放房量，并取消未开始的套餐体验。确定取消这笔住宿？','Cancellation releases the room and cancels unstarted package experiences. Cancel this stay?')}</Notice><button className="btn-ghost" disabled={action.busy} onClick={()=>void action.run(()=>change('cancelled'),t('住宿及关联权益已取消。','Accommodation and associated benefits cancelled.'))}>{t('确认取消住宿','Confirm cancellation')}</button><button className="journey-text-button" onClick={()=>setCancelOpen(false)}>{t('保留订单','Keep order')}</button></>:<button className="journey-text-button" disabled={action.busy} onClick={()=>setCancelOpen(true)}>{t('取消住宿申请','Cancel stay request')}</button>}</div>}
  {held&&<span className="sr-only">{held.starts_at}</span>}<StayMessage message={action.message} error={action.failed}/><StayHistory id={b.id}/>
 </article>
}
export function StayOrders(){
 const {language,t}=useCopy();const user=useAppStore(s=>s.user);const {bookings,error,loading,refresh}=useStayStore()
 useEffect(()=>{void refresh()},[user?.id])
 return <div className="journey-page"><header className="journey-heading"><div><p className="eyebrow">YOUR STAY</p><h1>{t('我的住宿订单','My accommodation')}</h1></div><button className="btn-ghost" disabled={loading} onClick={()=>void refresh()}>{loading?t('正在更新…','Refreshing…'):t('更新住宿订单','Refresh stays')}</button></header><StayDemoNotice/>
 {error&&<Notice error>{stayError(error,language==='zh')}</Notice>}{!loading&&!error&&!bookings.length&&<div className="journey-card"><p>{t('还没有住宿申请。选一间客房，开始安排停留。','No accommodation requests yet. Choose a room to begin.')}</p><Link className="btn-primary" to="/stays">{t('查看客房与套餐','Rooms & packages')} →</Link></div>}
 {bookings.filter(b=>b.user_id===user?.id).map(b=><StayOrderCard key={b.id} booking={b}/>)}
 </div>
}
