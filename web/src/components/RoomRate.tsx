import { Link } from 'react-router-dom'
import { money,saveStayDraft,type StayQuote } from '../lib/stays'
import { useCopy } from './JourneyCommon'
export function RoomRate({quote,busy,queried,context=''}:{quote:StayQuote|undefined;busy:boolean;queried:boolean;context?:string}){
 const {t}=useCopy()
 if(!quote)return <div className="room-rate-empty"><p>{busy?t('正在核对所选日期…','Checking your dates…'):queried?t('暂无此房型的报价，请重试查询。','No quote for this room. Try searching again.'):t('选择日期，查看这段停留的费用。','Choose dates to see the price of your stay.')}</p></div>
 const params=new URLSearchParams(context);params.set('room',quote.room_id);params.set('plan',quote.plan_id);params.set('in',quote.check_in);params.set('out',quote.check_out);params.set('guests',String(quote.guests))
 return <div className="room-rate" aria-live="polite"><span>{quote.check_in} → {quote.check_out}</span><div><span>{quote.nights.length} {quote.nights.length===1?t('晚费用合计','night · total'):t('晚费用合计','nights · total')}</span><strong>{money(quote.total)}</strong></div><small>{quote.available>0?t(`当前最多可确认${quote.available}间，须运营审核`,`Up to ${quote.available} rooms, subject to review`):t('所选日期暂不可订，请调整日期或房型。','Unavailable for these dates. Change the dates or room.')}</small>
 {quote.available>0&&quote.total!==null?<Link className="btn-primary" to={`/stays/book?${params.toString()}`} onClick={()=>saveStayDraft(quote)}>{t('查看明细并预订','Review & request')} <span aria-hidden="true">→</span></Link>:<button className="btn-primary" disabled>{t('暂无房量','Unavailable')}</button>}</div>
}
