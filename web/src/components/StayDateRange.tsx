import { useEffect,useId,useMemo,useRef,useState } from 'react'
import { addDays,money,shanghaiDate,stayRateCalendar,staySessionPreview,type RoomPlan,type StaySearch,type StaySessionOption } from '../lib/stays'
import { useCopy } from './JourneyCommon'

interface NightRate{price:number;available:number}
const parse=(iso:string)=>new Date(`${iso}T00:00:00Z`)
const weekday=(iso:string)=>parse(iso).getUTCDay()
const diffDays=(a:string,b:string)=>Math.round((parse(b).getTime()-parse(a).getTime())/86400000)
const compactMoney=(cents:number)=>money(cents)
const monthOf=(iso:string)=>iso.slice(0,7)
function monthKeys(from:string,to:string){
 const out:string[]=[];let y=Number(from.slice(0,4)),m=Number(from.slice(5,7))
 const ly=Number(to.slice(0,4)),lm=Number(to.slice(5,7))
 while(y<ly||(y===ly&&m<=lm)){out.push(`${y}-${String(m).padStart(2,'0')}`);m++;if(m>12){m=1;y++}}
 return out
}
function shanghaiParts(iso:string){
 const date=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Shanghai',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(iso))
 const time=new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Shanghai',hour:'2-digit',minute:'2-digit',hour12:false}).format(new Date(iso))
 return {date,time}
}
export function StayDateRange({value,plan,session,room,compact,onChange,onPlan,onSession}:{
 value:StaySearch;plan:RoomPlan;session:string|null;room?:string;compact?:boolean
 onChange:(patch:Partial<StaySearch>)=>void;onPlan:(plan:RoomPlan)=>void;onSession:(id:string|null,startsAt?:string|null)=>void
}){
 const {language,t}=useCopy();const id=useId();const root=useRef<HTMLDivElement>(null);const trigger=useRef<HTMLButtonElement>(null)
 const today=shanghaiDate();const minDate=addDays(today,1);const maxDate=addDays(today,90)
 const months=useMemo(()=>monthKeys(minDate,maxDate),[minDate,maxDate])
 function panelTitle(){
  const first=months[cursor],second=months[cursor+1]
  if(!first)return ''
  if(language==='zh'){
   const head=`${Number(first.slice(0,4))} 年 ${Number(first.slice(5,7))} 月`
   if(!second)return head
   return `${head} — ${second.slice(0,4)===first.slice(0,4)?`${Number(second.slice(5,7))} 月`:`${Number(second.slice(0,4))} 年 ${Number(second.slice(5,7))} 月`}`
  }
  const format=(key:string)=>new Intl.DateTimeFormat('en-GB',{month:'long',year:'numeric',timeZone:'UTC'}).format(parse(`${key}-01`))
  return second?`${format(first)} – ${format(second)}`:format(first)
 }
 const isDate=(iso:string)=>/^\d{4}-\d{2}-\d{2}$/.test(iso)&&!Number.isNaN(parse(iso).getTime())
 const checkIn=isDate(value.checkIn)?value.checkIn:minDate
 const checkOut=isDate(value.checkOut)&&value.checkOut>checkIn?value.checkOut:addDays(checkIn,1)
 const showRates=!!room
 const [open,setOpen]=useState(false)
 const [cursor,setCursor]=useState(()=>Math.max(0,months.indexOf(monthOf(checkIn))))
 const [hover,setHover]=useState<string|null>(null)
 const [picking,setPicking]=useState(false)
 const [rates,setRates]=useState<Map<string,NightRate>|null>(null)
 const [sessions,setSessions]=useState<StaySessionOption[]>([])
 const [sessionState,setSessionState]=useState<'idle'|'loading'|'ready'|'error'>('idle')
 const nights=diffDays(checkIn,checkOut)

 useEffect(()=>{let active=true;setRates(null)
  void stayRateCalendar(room).then(rows=>{if(active)setRates(new Map(rows.map(row=>[row.night,{price:row.price,available:row.available}])))}).catch(()=>{if(active)setRates(new Map())})
  return()=>{active=false}
 },[room])

 useEffect(()=>{
  if(plan!=='heritage'){setSessions([]);setSessionState('idle');return}
  let active=true;setSessionState('loading')
  void staySessionPreview(plan,checkIn,checkOut)
   .then(rows=>{if(active){setSessions(rows);setSessionState('ready')}})
   .catch(()=>{if(active){setSessions([]);setSessionState('error')}})
  return()=>{active=false}
 },[plan,checkIn,checkOut])

 useEffect(()=>{
  if(!open)return
  const onKey=(event:KeyboardEvent)=>{if(event.key==='Escape'){setOpen(false);trigger.current?.focus()}}
  const onPointer=(event:MouseEvent)=>{if(root.current&&!root.current.contains(event.target as Node))setOpen(false)}
  document.addEventListener('keydown',onKey);document.addEventListener('mousedown',onPointer)
  return()=>{document.removeEventListener('keydown',onKey);document.removeEventListener('mousedown',onPointer)}
 },[open])

 const nightTotal=nights>0?sumNights(checkIn,nights,rates):0
 const surcharge=plan==='heritage'?18000:0
 const total=nightTotal===null?null:nightTotal+surcharge

 function sumNights(start:string,count:number,map:Map<string,NightRate>|null){
  if(!map||map.size===0)return null
  let sum=0,cur=start
  for(let i=0;i<count;i++){const rate=map.get(cur);if(!rate)return null;sum+=rate.price;cur=addDays(cur,1)}
  return sum
 }
 function labelOf(iso:string,rate?:NightRate){
  const marker=iso===checkIn?t('入住','Check-in'):iso===checkOut&&!picking?t('离店','Check-out'):''
  const price=rate?(language==='zh'?`单晚 ${compactMoney(rate.price)}`:`${compactMoney(rate.price)} per night`):(language==='zh'?'价格待核对':'rate to be confirmed')
  const full=rate&&rate.available<1?(language==='zh'?'已满房':'sold out'):''
  if(language==='zh')return `${Number(iso.slice(0,4))}年${Number(iso.slice(5,7))}月${Number(iso.slice(8,10))}日，周${'日一二三四五六'[weekday(iso)]}${marker?`，${marker}`:''}，${full||price}`
  return `${new Intl.DateTimeFormat('en-GB',{weekday:'short',day:'numeric',month:'short',year:'numeric',timeZone:'UTC'}).format(parse(iso))}${marker?` · ${marker}`:''} · ${full||price}`
 }
 function pick(iso:string){
  const rate=rates?.get(iso)
  if(rates&&(!rate||rate.available<1))return
  if(picking&&iso>checkIn){
   const capped=diffDays(checkIn,iso)>14?addDays(checkIn,14):iso
   setPicking(false);setHover(null);onChange({checkOut:capped});return
  }
  const keep=checkOut>iso&&diffDays(iso,checkOut)<=14?checkOut:addDays(iso,1)
  setPicking(true);setHover(null);onChange({checkIn:iso,checkOut:keep})
 }
 function clear(){setPicking(false);setHover(null);onChange({checkIn:addDays(today,1),checkOut:addDays(today,2)})}
 function dateText(iso:string){return language==='zh'?iso.replace(/-/g,'/'):new Intl.DateTimeFormat('en-GB',{day:'numeric',month:'short',year:'numeric',timeZone:'UTC'}).format(parse(iso))}

 const previewing=!!(picking&&hover&&hover>checkIn)
 const endPreview=previewing?diffDays(checkIn,hover!):0
 const shownNights=previewing?Math.min(endPreview,14):nights
 const shownTotal=previewing?(sumNights(checkIn,Math.min(endPreview,14),rates)??total):total

 const sessionGroups=useMemo(()=>{
  const groups:{date:string;items:StaySessionOption[]}[]=[]
  for(const item of sessions){
   const {date}=shanghaiParts(item.starts_at)
   const last=groups[groups.length-1]
   if(last&&last.date===date)last.items.push(item)
   else groups.push({date,items:[item]})
  }
  return groups.slice(0,3)
 },[sessions])

 const sessionItem=session?sessions.find(item=>item.id===session):undefined
 const sessionLine=sessionItem?(()=>{const {date,time}=shanghaiParts(sessionItem.starts_at);return `${Number(date.slice(5,7))}/${Number(date.slice(8,10))} ${time}`})():''

 return <div className={`date-range${compact?' is-compact':''}`} ref={root}>
  <span className="date-range-label" id={`${id}-label`}>{t('入住与离店日期','Check-in and check-out')}</span>
  <button type="button" ref={trigger} className="date-range-trigger" aria-labelledby={`${id}-label`} aria-expanded={open} aria-controls={`${id}-panel`} onClick={()=>setOpen(v=>!v)}>
   <span className="date-range-main">{dateText(checkIn)} — {dateText(checkOut)}</span>
   <span className="date-range-sub">{nights} {nights===1?t('晚','night'):t('晚','nights')}{showRates&&total!==null?` · ${compactMoney(total)}`:''}{plan==='heritage'?` · ${t('苏绣体验','Embroidery package')}${sessionLine?` ${sessionLine}`:''}`:''}</span>
   <svg className="date-range-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true"><rect x="3.5" y="5.5" width="17" height="15" rx="1"/><path d="M3.5 10h17M8 3.5v4M16 3.5v4"/></svg>
  </button>
  <div className="date-panel" id={`${id}-panel`} hidden={!open} role="group" aria-label={t('日期与住宿方案','Dates and stay option')}>
   <div className="date-panel-head">
    <span className="date-panel-title">{panelTitle()}</span>
    <div className="date-nav">
     <button type="button" aria-label={t('上一个月','Previous month')} disabled={cursor<=0} onClick={()=>setCursor(c=>Math.max(0,c-1))}>‹</button>
     <button type="button" aria-label={t('下一个月','Next month')} disabled={cursor>=months.length-2} onClick={()=>setCursor(c=>Math.min(months.length-2,c+1))}>›</button>
    </div>
   </div>
   <div className="date-months">
    {[0,1].map(offset=>{
     const key=months[cursor+offset];if(!key)return null
     const y=Number(key.slice(0,4)),m=Number(key.slice(5,7))
     const lead=(new Date(Date.UTC(y,m-1,1)).getUTCDay()+6)%7
     const last=new Date(Date.UTC(y,m,0)).getUTCDate()
     return <div className={`date-month date-month-${offset+1}`} key={key}>
      <p className="date-month-title">{language==='zh'?`${y} 年 ${m} 月`:new Intl.DateTimeFormat('en-GB',{month:'long',year:'numeric',timeZone:'UTC'}).format(new Date(Date.UTC(y,m-1,1)))}</p>
      <div className="date-weekdays" aria-hidden="true">{(language==='zh'?['一','二','三','四','五','六','日']:['Mon','Tue','Wed','Thu','Fri','Sat','Sun']).map((day,index)=><span key={index}>{day}</span>)}</div>
      <div className="date-grid">
       {Array.from({length:lead},(_,index)=><span key={`lead-${index}`}/>)}
       {Array.from({length:last},(_,index)=>{
        const day=index+1,iso=`${key}-${String(day).padStart(2,'0')}`,rate=rates?.get(iso)
        const outside=iso<minDate||iso>maxDate
        const sold=!!rate&&rate.available<1
        const disabled=outside||sold
        const rangeEnd=previewing?Math.min(14,diffDays(checkIn,hover!)):nights
        const previewStop=previewing?addDays(checkIn,rangeEnd):''
        const inRange=iso>checkIn&&iso<addDays(checkIn,rangeEnd)
        const classes=['date-day']
        if(iso===checkIn)classes.push('is-start')
        if(!picking&&iso===checkOut)classes.push('is-end')
        if(previewing&&iso===previewStop)classes.push('is-preview-end')
        if(inRange)classes.push('is-in')
        if(outside)classes.push('is-outside')
        return <button type="button" key={iso} className={classes.join(' ')} data-date={iso} disabled={disabled} aria-label={labelOf(iso,rate)}
          onMouseEnter={()=>{if(picking&&!disabled)setHover(iso)}}
          onFocus={()=>{if(picking&&!disabled)setHover(iso)}}
          onClick={()=>pick(iso)}>
         <span className="date-day-number">{day}</span>
         {iso===checkIn?<span className="date-day-tag">{t('入住','Arrive')}</span>
          :iso===checkOut&&!picking?<span className="date-day-tag">{t('离店','Depart')}</span>
          :previewing&&iso===previewStop?<span className="date-day-tag">{t('离店','Depart')}</span>
          :(sold||(showRates&&!outside))&&<span className="date-day-price">{sold?t('满','Full'):rate?compactMoney(rate.price):'·'}</span>}
        </button>
       })}
      </div>
     </div>
    })}
   </div>
   <div className="date-plans">
    <span className="date-label">{t('住宿方案','Stay option')}</span>
    <div className="date-seg" role="group" aria-label={t('住宿方案','Stay option')}>
     <button type="button" aria-pressed={plan==='room_only'} onClick={()=>onPlan('room_only')}>{t('纯住宿','Room only')}</button>
     <button type="button" aria-pressed={plan==='heritage'} onClick={()=>onPlan('heritage')}>{t('苏绣体验套餐','Embroidery package')} {plan==='heritage'?'':`+${compactMoney(18000)}`}</button>
    </div>
   </div>
   {plan==='heritage'&&<div className="date-sessions">
    <p className="date-sessions-head">{t('90 分钟入门工坊 · 每次入住 1 场','90-minute workshop · one session per stay')}<span>{t('入住确认时锁定场次，之后可改约','Held when the stay is confirmed; changes can be made later')}</span></p>
    {sessionState==='loading'&&<p className="date-sessions-note" role="status">{t('正在核对场次…','Checking sessions…')}</p>}
    {sessionState==='error'&&<p className="date-sessions-note">{t('场次暂时无法核对，可仍提交住宿申请。','Session times are unavailable right now. You can still submit a stay request.')}</p>}
    {sessionState==='ready'&&sessions.length===0&&<p className="date-sessions-note">{t('入住期间暂无可约场次，可选择纯住宿或调整日期。','No workshop session is available for these dates. Choose room only or adjust your dates.')}</p>}
    {sessionGroups.map(group=><div className="date-session-row" key={group.date}>
     <span className="date-session-date">{language==='zh'?`${Number(group.date.slice(5,7))}/${Number(group.date.slice(8,10))} 周${'日一二三四五六'[weekday(group.date)]}`:new Intl.DateTimeFormat('en-GB',{month:'short',day:'numeric',weekday:'short',timeZone:'UTC'}).format(parse(group.date))}</span>
     {group.items.map(item=>{const {time}=shanghaiParts(item.starts_at);const full=item.available<value.guests
      return <button type="button" key={item.id} className="date-session-time" aria-pressed={session===item.id} disabled={full} onClick={()=>onSession(session===item.id?null:item.id,item.starts_at)}>{time}{full?` · ${t('已满','Full')}`:item.available<2?` · ${t(`余${item.available}` ,`${item.available} left`)}`:''}</button>})}
    </div>)}
    {sessions.length>0&&daysInWindow(checkIn,checkOut)>3&&<p className="date-sessions-note">{t('仅展示前三天的场次，其余日期可在预订后于「我的行程」改约。','Only the first three days are shown; other dates can be changed later from My Journey.')}</p>}
   </div>}
   <div className="date-panel-foot">
    <div className="date-foot-left"><button type="button" className="room-text-link" onClick={clear}>{t('清除','Clear')}</button><span className="date-rule">{t('明日起 90 天内可订 · 最多连住 14 晚','Arrival within the next 90 days · up to 14 nights')}</span></div>
    <div className="date-foot-right">
     <span className="date-total" aria-live="polite">{shownNights} {shownNights===1?t('晚','night'):t('晚','nights')}{showRates&&shownTotal!==null?` · ${compactMoney(shownTotal)}`:''}{picking?` · ${t('选择离店日期','Choose a check-out date')}`:''}</span>
     <button type="button" className="btn-primary" disabled={picking} onClick={()=>{setOpen(false);trigger.current?.focus()}}>{t('完成','Done')}</button>
    </div>
   </div>
  </div>
 </div>
}
function daysInWindow(from:string,to:string){
 const out:string[]=[];let cur=from
 while(cur<to&&out.length<4){out.push(cur);cur=addDays(cur,1)}
 return out.length
}
