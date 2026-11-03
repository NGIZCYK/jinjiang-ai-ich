import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useCopy, Notice } from '../components/JourneyCommon'
import { StayDemoNotice, StayMessage, StayPrice, StayRules, useStayAction } from '../components/StayCommon'
import { clearStayDraft, formatStaySession, quoteStay, readStayDraft, saveStayDraft, stayError, type StayQuote } from '../lib/stays'
import { rpc } from '../lib/cloud'
import { useAppStore } from '../lib/store'
import { roomPresentation } from '../data/roomPresentation'
import { RoomPhoto } from '../components/RoomPhoto'

export function StayCheckoutPage(){
 const {language,t}=useCopy();const [params]=useSearchParams();const nav=useNavigate();const user=useAppStore(s=>s.user)
 const [quote,setQuote]=useState<StayQuote|null>(null);const [loading,setLoading]=useState(true);const [error,setError]=useState('');const [changed,setChanged]=useState(false);const [accepted,setAccepted]=useState(false)
 const action=useStayAction();const request=useRef(crypto.randomUUID());const signature=params.toString()
 const session=params.get('session')||null;const sessionAt=params.get('sessionAt')
 useEffect(()=>{let active=true;setLoading(true);setError('');setAccepted(false);setQuote(null);request.current=crypto.randomUUID()
  const wanted={room_id:params.get('room')||'',plan_id:params.get('plan')||'',check_in:params.get('in')||'',check_out:params.get('out')||'',guests:Number(params.get('guests'))}
  void quoteStay(wanted).then(q=>{if(!active)return;const draft=readStayDraft();setChanged(!!draft&&draft.room_id===q.room_id&&draft.plan_id===q.plan_id&&draft.check_in===q.check_in&&draft.check_out===q.check_out&&draft.guests===q.guests&&draft.token!==q.token);saveStayDraft(q);setQuote(q)}).catch(e=>{if(active)setError(stayError(e,language==='zh'))}).finally(()=>{if(active)setLoading(false)})
  return()=>{active=false}
 },[signature,user?.id])
 async function submit(){if(!quote)return;try{
  const id=await rpc<string>('submit_stay_request',{p_room:quote.room_id,p_plan:quote.plan_id,p_in:quote.check_in,p_out:quote.check_out,p_guests:quote.guests,p_token:quote.token,p_request:request.current,p_session:session})
  clearStayDraft();nav(`/my?tab=stays&stay=${encodeURIComponent(id)}`,{replace:true})
 }catch(e){if(e instanceof Error&&e.message.includes('STAY_PRICE_CHANGED')){const fresh=await quoteStay(quote);setQuote(fresh);saveStayDraft(fresh);setAccepted(false);setChanged(true);request.current=crypto.randomUUID()}throw e}}
 return <div className="stays-page"><header className="stay-intro"><p className="eyebrow">YOUR STAY, CONSIDERED</p><h1>{t('确认这段停留','Review your stay')}</h1><StayDemoNotice/></header>
 <Link className="journey-text-button" to={`/stays/${params.get('room')||''}?${params.toString()}`}>← {t('返回房型与方案','Back to room & options')}</Link>
 {loading&&<p role="status">{t('正在核对报价…','Checking your quote…')}</p>}{error&&<Notice error>{error}</Notice>}
 {quote&&!loading&&<div className="stay-checkout-grid"><div className="stay-checkout-copy">{roomPresentation(quote.room_id)&&<figure className="room-checkout-photo"><RoomPhoto image={roomPresentation(quote.room_id)!.images[0]} sizes="(min-width: 1024px) 45vw, 100vw"/><figcaption>{t('所选房型 · AI空间概念参考','Selected room · AI interior concept')}</figcaption></figure>}<h2>{t('提交后，由酒店运营确认','Reviewed by hotel operations')}</h2><p>{t('无需付款。提交申请后可在我的行程查看编号和进度；提交本身不保留房量。','No payment is required. Follow the reference and status in My Journey. Submission itself does not reserve a room.')}</p>
 {session&&sessionAt&&<p className="stay-caption">{t('工坊场次偏好','Workshop preference')}：{formatStaySession(sessionAt,language==='zh')}{t('。确认时锁定；若该场次已满，将改排入住期间的其他场次。','. Held at confirmation; if full, another session during your stay is arranged.')}</p>}
 {changed&&<Notice>{t('报价与上次查看时不同。下方是最新费用，请重新核对。','This quote differs from your previous view. Review the latest breakdown below.')}</Notice>}
 {quote.available<1&&<Notice error>{t('所选日期房量不足，请返回调整。','The selected dates are unavailable. Return to change your selection.')}</Notice>}
 <StayRules/><form onSubmit={e=>{e.preventDefault();void action.run(submit)}}><label className="stay-consent"><input type="checkbox" checked={accepted} onChange={e=>setAccepted(e.target.checked)} required disabled={action.busy}/><span>{t('我已核对费用、运营确认方式、套餐兑换时限及取消规则。','I have reviewed the price, approval process, benefit deadline and cancellation terms.')}</span></label>
 <button className="btn-primary" disabled={!accepted||action.busy||quote.available<1} aria-busy={action.busy}>{action.busy?t('正在提交…','Submitting…'):t('提交住宿申请','Submit stay request')} →</button></form><StayMessage message={action.message} error={action.failed}/></div><StayPrice quote={quote}/></div>}
 </div>
}
