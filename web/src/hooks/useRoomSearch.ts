import { useEffect,useRef,useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { defaultStaySearch,searchStays,stayError,validStaySearch,type RoomPlan,type StayQuote,type StaySearch } from '../lib/stays'
import { useLanguage } from '../lib/i18n'

export type RoomCategory='all'|'classic'|'theme'
export function useRoomHeaderOffset(){
 const ref=useRef<HTMLDivElement>(null)
 useEffect(()=>{const header=document.querySelector('.site-header');if(!header)return
  const measure=()=>ref.current?.style.setProperty('--room-header-offset',`${Math.ceil(header.getBoundingClientRect().height)}px`)
  measure();const observer=typeof ResizeObserver==='undefined'?null:new ResizeObserver(measure);observer?.observe(header);window.addEventListener('resize',measure)
  return()=>{observer?.disconnect();window.removeEventListener('resize',measure)}
 },[])
 return ref
}
export function roomSearchParams(search:StaySearch,existing:URLSearchParams,opts:{plan?:string;room?:string;session?:string|null;sessionAt?:string|null}={}){
 const next=new URLSearchParams(existing)
 next.set('in',search.checkIn);next.set('out',search.checkOut);next.set('guests',String(search.guests))
 if(opts.plan)next.set('plan',opts.plan)
 if(opts.room)next.set('room',opts.room)
 if('session' in opts){
  if(opts.session){next.set('session',opts.session);if(opts.sessionAt)next.set('sessionAt',opts.sessionAt);else next.delete('sessionAt')}
  else{next.delete('session');next.delete('sessionAt')}
 }
 return next
}
export function useRoomSearch(){
 const {language}=useLanguage();const [params,setParams]=useSearchParams();const defaults=defaultStaySearch()
 const initial=useRef<StaySearch>({checkIn:params.has('in')?params.get('in')!:defaults.checkIn,checkOut:params.has('out')?params.get('out')!:defaults.checkOut,guests:params.has('guests')?Number(params.get('guests')):defaults.guests})
 const [search,setSearch]=useState(initial.current);const [quotes,setQuotes]=useState<StayQuote[]>([]);const [busy,setBusy]=useState(false);const [error,setError]=useState<unknown>(null);const [queried,setQueried]=useState(false);const [revision,setRevision]=useState(0);const serial=useRef(0)
 const category:RoomCategory=['classic','theme'].includes(params.get('category')||'')?params.get('category') as RoomCategory:'all'
 const plan:RoomPlan=params.get('plan')==='heritage'?'heritage':'room_only'
 const session=plan==='heritage'?params.get('session'):null
 const sessionAt=plan==='heritage'?params.get('sessionAt'):null
 async function run(value=search,save=true){
  const current=++serial.current;setQuotes([]);setError(null);setQueried(false);setSearch(value)
  if(save)setParams(roomSearchParams(value,params,{plan,session,sessionAt}),{replace:true})
  if(!validStaySearch(value)){setBusy(false);setError(new Error('STAY_DATES_INVALID'));return false}
  setBusy(true)
  try{const result=await searchStays(value);if(current===serial.current){setQuotes(result);setQueried(true);if(save)setRevision(r=>r+1)}return current===serial.current}catch(e){if(current===serial.current)setError(e);return false}finally{if(current===serial.current)setBusy(false)}
 }
 useEffect(()=>{void run(initial.current,false);return()=>{serial.current++}},[])
 function change(patch:Partial<StaySearch>){
  serial.current++;setSearch(s=>({...s,...patch}));setQuotes([]);setBusy(false);setQueried(false);setError(null)
  if(('checkIn' in patch||'checkOut' in patch||'guests' in patch)&&(params.has('session')||params.has('sessionAt'))){const next=new URLSearchParams(params);next.delete('session');next.delete('sessionAt');setParams(next,{replace:true})}
 }
 function setPlan(next:RoomPlan){setParams(roomSearchParams(search,params,{plan:next,session:next==='heritage'?session:null,sessionAt:next==='heritage'?sessionAt:null}),{replace:true})}
 function setSession(id:string|null,startsAt:string|null=null){setParams(roomSearchParams(search,params,{plan,session:id,sessionAt:id?startsAt:null}),{replace:true})}
 function selectCategory(value:RoomCategory){const next=roomSearchParams(search,params,{plan,session,sessionAt});next.set('category',value);setParams(next)}
 function link(room?:string){return roomSearchParams(search,params,{plan,room,session,sessionAt}).toString()}
 return {search,quotes,busy,error:error?stayError(error,language==='zh'):'',queried,revision,category,plan,session,sessionAt,run,change,setPlan,setSession,selectCategory,link}
}
