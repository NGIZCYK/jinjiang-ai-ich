import { useRef, useState } from 'react'
import type { StayQuote } from '../lib/stays'
import { money, stayError } from '../lib/stays'
import { useCopy, Notice } from './JourneyCommon'

export function useStayAction(){
 const {language}=useCopy();const lock=useRef(false);const [busy,setBusy]=useState(false);const [message,setMessage]=useState('');const [failed,setFailed]=useState(false)
 return {busy,message,failed,clear(){setMessage('');setFailed(false)},async run(fn:()=>Promise<void>,success=''){
  if(lock.current)return false;lock.current=true;setBusy(true);setMessage('');setFailed(false)
  try{await fn();setMessage(success);return true}catch(e){setMessage(stayError(e,language==='zh'));setFailed(true);return false}finally{lock.current=false;setBusy(false)}
 }}
}
export function StayDemoNotice(){const {t}=useCopy();return <p className="stay-demo-notice">{t('课程预订原型 · 房型、房价及房量为演示资料，无需实际付款。','Course booking prototype · Rooms, rates and inventory are demonstration data. No payment is taken.')}</p>}
export function StayRules(){const {t}=useCopy();return <details className="stay-rules"><summary>{t('入住、套餐与取消规则','Stay, package & cancellation terms')}</summary><ul>
 <li>{t('每单一间房，1—2人；入住14:00，离店12:00。','One room for 1–2 guests. Check-in 14:00; check-out 12:00, Shanghai time.')}</li>
 <li>{t('提交不占房，须由运营确认。套餐体验在住宿确认时保障一个具体场次的名额。','Requests do not hold rooms until operations confirms. A package includes held places in one specific experience session.')}</li>
 <li>{t('体验套餐每次入住加¥180，含入住人数的一次90分钟工坊，不按晚重复赠送。','The package adds ¥180 per stay and includes one 90-minute workshop for the booked guests, once per stay.')}</li>
 <li>{t('确认后须在保留场次开始前兑换；可改选入住期间有余位的场次。逾期权益失效，不自动顺延。','Redeem before the held session starts. You may choose another available session during your stay. Unredeemed benefits expire at the held start time.')}</li>
 <li>{t('待确认订单可取消；已确认订单须在入住时间前取消，并同步取消套餐体验。改日期或房型请取消后重新申请。','Pending orders may be cancelled. Confirmed orders may be cancelled before check-in, together with their package experience. Cancel and reapply to change dates or room.')}</li>
 </ul></details>}
export function StayPrice({quote:q}:{quote:StayQuote}){const {language,t}=useCopy();return <section className="stay-price" aria-label={t('费用明细','Price breakdown')}>
 <h2>{t('你的住宿安排','Your stay')}</h2><h3>{language==='zh'?q.room_title_zh:q.room_title_en}</h3><p>{q.check_in} → {q.check_out} · {q.guests} {t('人','guests')}</p>
 <p>{language==='zh'?q.plan_title_zh:q.plan_title_en}</p>
 <dl>{q.nights.map(n=><div key={n.night}><dt>{n.night}</dt><dd>{money(n.price)}</dd></div>)}<div><dt>{t('套餐加价（每次入住）','Package · per stay')}</dt><dd>{money(q.surcharge)}</dd></div><div className="stay-price-total"><dt>{t('演示费用合计','Demo total')}</dt><dd>{money(q.total)}</dd></div></dl>
 <p className="stay-caption">{t('按提交时费用快照记录，无实际付款。','Saved at the submitted rate. No actual payment.')}</p>
 </section>}
export function StayMessage({message,error=false}:{message:string;error?:boolean}){return message?<Notice error={error}>{message}</Notice>:null}
