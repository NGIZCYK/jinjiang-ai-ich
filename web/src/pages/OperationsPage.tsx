import { useEffect, useState } from 'react'
import { rpc } from '../lib/cloud'
import { useJourneyStore } from '../lib/journeyStore'
import { STATUS, slotTime, statusLabel, titleFor, type BookingStatus } from '../lib/journey'
import { Notice, useAction, useCopy } from '../components/JourneyCommon'
import { BookingHistory } from './MyPage'

interface Participant { id:string; name:string; batch_id:'demo'|'pilot-01'; created_at:string; has_activity:boolean }

export function OperationsPage(){
 const {language,t}=useCopy()
 const {bookings,catalog,refresh,loading,error}=useJourneyStore()
 const [status,setStatus]=useState('all'),[date,setDate]=useState(''),[batch,setBatch]=useState('demo'),[experience,setExperience]=useState('all')
 const [reasons,setReasons]=useState<Record<string,string>>({})
 const [participants,setParticipants]=useState<Participant[]>([])
 const [participantBatch,setParticipantBatch]=useState<Record<string,'demo'|'pilot-01'>>({})
 const [participantLoading,setParticipantLoading]=useState(false),[participantError,setParticipantError]=useState('')
 const action=useAction()
 const rows=bookings.filter(b=>b.batch_id===batch&&(status==='all'||b.status===status)&&(experience==='all'||b.sessions.experience_id===experience)&&(!date||new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Shanghai',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(b.sessions.starts_at))===date))

 async function loadParticipants(){
  setParticipantLoading(true);setParticipantError('')
  try{const roster=await rpc<Participant[]>('participant_roster');setParticipants(roster);setParticipantBatch(Object.fromEntries(roster.map(item=>[item.id,item.batch_id])))}
  catch(loadError){setParticipantError(loadError instanceof Error?loadError.message:String(loadError))}
  finally{setParticipantLoading(false)}
 }
 useEffect(()=>{void loadParticipants()},[])
 async function transition(id:string,next:BookingStatus){await action.run(async()=>{await rpc('transition_booking',{p_id:id,p_status:next,p_reason:reasons[id]||''});await refresh()},t('处理结果已保存，住客可刷新查看。','Saved. The guest can refresh to view this result.'))}
 async function assignBatch(participant:Participant){const next=participantBatch[participant.id]??participant.batch_id;await action.run(async()=>{await rpc('assign_guest_batch',{p_user:participant.id,p_batch:next});await loadParticipants()},t('测试批次已更新。','The participant cohort was updated.'))}

 return <div className="journey-page">
  <header className="journey-heading"><div><p className="eyebrow">EXPERIENCE OPERATIONS</p><h1>{t('体验管理','Experience management')}</h1><p>{t('仅处理演示场次；完成标记代表模拟流程完成。','Demonstration sessions only; completion means a simulated journey.')}</p></div><button className="btn-ghost" disabled={loading} onClick={()=>void refresh()}>{t('刷新','Refresh')}</button></header>

  <section className="journey-card">
   <div className="journey-heading"><div><p className="eyebrow">STUDY COHORT CONTROL</p><h2>{t('测试参与者分配','Participant cohort assignment')}</h2><p>{t('新账号默认进入 Demo。必须在参与者开始任何任务前分配到 Study 01；产生记录后批次会锁定。','New accounts start in Demo. Assign Study 01 before any task begins; the cohort locks after activity is recorded.')}</p></div><button className="btn-ghost" disabled={participantLoading} onClick={()=>void loadParticipants()}>{t('刷新参与者','Refresh participants')}</button></div>
   {participantError&&<Notice error>{participantError}</Notice>}{participantLoading&&<Notice>{t('正在读取参与者…','Loading participants…')}</Notice>}{!participantLoading&&!participants.length&&<Notice>{t('还没有住客账号。','No guest accounts yet.')}</Notice>}
   <div className="journey-grid">{participants.map(participant=>{const next=participantBatch[participant.id]??participant.batch_id;return <article className="experience-result" key={participant.id}><h3>{participant.name}</h3><p>{t('参与者编号','Participant reference')}: {participant.id.slice(0,8)}</p><label>{t('统计批次','Cohort')}<select className="input" disabled={participant.has_activity||action.busy} value={next} onChange={event=>setParticipantBatch(current=>({...current,[participant.id]:event.target.value as 'demo'|'pilot-01'}))}><option value="demo">Demo</option><option value="pilot-01">Study 01</option></select></label><button className="btn-ghost" disabled={participant.has_activity||action.busy||next===participant.batch_id} onClick={()=>void assignBatch(participant)}>{participant.has_activity?t('已有记录，批次已锁定','Locked after activity'):t('保存批次','Save cohort')}</button></article>})}</div>
  </section>

  <section className="journey-card"><div className="journey-grid needs-grid"><label>{t('批次','Cohort')}<select className="input" value={batch} onChange={e=>setBatch(e.target.value)}><option value="demo">Demo</option><option value="pilot-01">Study 01</option></select></label><label>{t('状态','Status')}<select className="input" value={status} onChange={e=>setStatus(e.target.value)}><option value="all">{t('全部','All')}</option>{Object.keys(STATUS).map(s=><option key={s} value={s}>{statusLabel(s as BookingStatus,language)}</option>)}</select></label><label>{t('体验','Experience')}<select className="input" value={experience} onChange={e=>setExperience(e.target.value)}><option value="all">{t('全部','All')}</option>{catalog.map(e=><option key={e.id} value={e.id}>{titleFor(e.id,language,catalog)}</option>)}</select></label><label>{t('北京时间日期','Shanghai date')}<input className="input" type="date" value={date} onChange={e=>setDate(e.target.value)}/></label></div></section>
  {(error||action.message)&&<Notice error={!!error||action.failed}>{error||action.message}</Notice>}{!rows.length&&<Notice>{t('没有符合筛选的申请。','No matching requests.')}</Notice>}
  {rows.map(b=><article className="journey-card" key={b.id}><div className="journey-heading"><h2>{titleFor(b.sessions.experience_id,language,catalog)}</h2><span className={`status-pill status-${b.status}`}>{statusLabel(b.status,language)}</span></div><p>{slotTime(b.sessions.starts_at,language)} · {b.party_size} {t('人','people')} · {t('申请编号','Request')}: {b.id.slice(0,8)}</p><p>{t('住客编号','Guest reference')}: {b.user_id.slice(0,8)}</p>{b.status==='pending'&&<><label>{t('处理说明（未通过时必填）','Reason (required for decline)')}<textarea className="input" maxLength={1000} value={reasons[b.id]||''} onChange={e=>setReasons(r=>({...r,[b.id]:e.target.value}))}/></label><div className="journey-actions"><button className="btn-primary" disabled={action.busy} onClick={()=>void transition(b.id,'confirmed')}>{t('确认名额','Confirm places')}</button><button className="btn-ghost" disabled={action.busy||!reasons[b.id]?.trim()} onClick={()=>void transition(b.id,'declined')}>{t('未通过并说明原因','Decline with reason')}</button></div></>}{b.status==='confirmed'&&<button className="btn-primary" disabled={action.busy} onClick={()=>void transition(b.id,'completed')}>{t('标记模拟流程完成','Mark simulation complete')}</button>}{b.reason&&<p>{b.reason}</p>}<BookingHistory id={b.id}/>{b.feedback?.map((f,i)=><Notice key={i}>{t('数字流程反馈','Digital journey feedback')}: {f.rating}/5 · {f.comment}</Notice>)}</article>)}
 </div>
}
