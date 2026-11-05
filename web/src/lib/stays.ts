import { create } from 'zustand'
import { requireCloud, rpc } from './cloud'
import { useAppStore } from './store'

export { STAYS_ENABLED, STAY_VERSION } from './stayConfig'
export type StayStatus = 'pending' | 'confirmed' | 'checked_in' | 'checked_out' | 'cancelled' | 'declined' | 'no_show'
export interface StaySearch { checkIn: string; checkOut: string; guests: number }
export type RoomPlan = 'room_only' | 'heritage'
export interface StayQuote {
 room_id: string; plan_id: string; check_in: string; check_out: string; guests: number;
 room_title_zh: string; room_title_en: string; plan_title_zh: string; plan_title_en: string;
 nights: { night: string; price: number }[]; room_total: number | null; surcharge: number;
 total: number | null; available: number; experience_id: string | null; token: string;
}
export interface StayEntitlement { id: string; session_id: string; seats: number; status: 'held'|'redeemed'|'cancelled'; activity_booking_id: string|null }
export interface StayBooking {
 id: string; user_id: string; batch_id: string; room_id: string; plan_id: string; check_in: string; check_out: string;
 guests: number; status: StayStatus; quote: StayQuote; reason: string; created_at: string;
 stay_entitlements: StayEntitlement | null;
}
export interface StaySlot { id: string; starts_at: string; available: number; is_held: boolean }
export interface StayNightRate { night: string; price: number; available: number }
export interface StaySessionOption { id: string; starts_at: string; available: number }
export interface StayInventory { room_id: string; night: string; price: number; capacity: number }
export interface StayRoom { id: string; title_zh: string; title_en: string; theme: boolean; max_guests: number }
export const stayStatus: Record<StayStatus,[string,string]> = {
 pending:['待确认','Awaiting review'],confirmed:['已确认','Confirmed'],checked_in:['已入住','Checked in'],checked_out:['已离店','Checked out'],cancelled:['已取消','Cancelled'],declined:['未通过','Declined'],no_show:['未入住','No-show'],
}
export function money(cents: number | null) { return cents === null ? '—' : new Intl.NumberFormat('zh-CN',{style:'currency',currency:'CNY',maximumFractionDigits:cents%100 ? 2 : 0}).format(cents/100) }
export function shanghaiDate(now = new Date()) { return new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Shanghai',year:'numeric',month:'2-digit',day:'2-digit'}).format(now) }
export function addDays(date: string, days: number) { const d = new Date(`${date}T00:00:00Z`);d.setUTCDate(d.getUTCDate()+days);return d.toISOString().slice(0,10) }
export function defaultStaySearch(): StaySearch { const today=shanghaiDate();return {checkIn:addDays(today,1),checkOut:addDays(today,2),guests:2} }
export function validStaySearch(s: StaySearch) {
 const today=shanghaiDate();const valid=(d:string)=>/^\d{4}-\d{2}-\d{2}$/.test(d)&&!Number.isNaN(Date.parse(d))&&new Date(`${d}T00:00:00Z`).toISOString().slice(0,10)===d;
 return valid(s.checkIn)&&valid(s.checkOut)&&s.checkIn>today&&s.checkIn<=addDays(today,90)&&s.checkOut>s.checkIn&&s.checkOut<=addDays(s.checkIn,14)&&[1,2].includes(s.guests)
}
const DRAFT='jj_stay_draft_v1'
export function saveStayDraft(q: StayQuote) { try{sessionStorage.setItem(DRAFT,JSON.stringify(q))}catch{/* optional */} }
export function readStayDraft(): StayQuote | null { try{const q=JSON.parse(sessionStorage.getItem(DRAFT)||'null');return q&&typeof q.room_id==='string'&&typeof q.plan_id==='string'&&typeof q.token==='string'&&validStaySearch({checkIn:q.check_in,checkOut:q.check_out,guests:q.guests})?q:null}catch{return null} }
export function clearStayDraft(){try{sessionStorage.removeItem(DRAFT)}catch{/* optional */}}
const ERRORS:Record<string,[string,string]>={
 STAY_DATES_INVALID:['请选择明日起90天内入住、最多14晚的有效日期。','Choose arrival within the next 90 days, for 1–14 nights.'],
 STAY_GUESTS_INVALID:['每间房可入住1—2人。','Each room accommodates 1–2 guests.'],
 STAY_PRICE_CHANGED:['报价已变化，请核对更新后的费用后重新提交。','Prices changed. Review the updated quote before submitting again.'],
 STAY_SOLD_OUT:['所选日期至少一晚房量不足，请更换房型或日期。','At least one night is unavailable. Change the room or dates.'],
 STAY_DUPLICATE:['已有相同房型和日期的有效申请，请查看住宿订单。','An active request already exists for this room and these dates.'],
 STAY_BENEFIT_UNAVAILABLE:['入住期间暂无足够的体验名额，原有订单或保留名额未改变。','There are not enough experience places. Your existing order or held places are unchanged.'],
 STAY_BENEFIT_EXPIRED:['保留场次已经开始，此次套餐权益已过期。','The held session has started; this package benefit has expired.'],
 STAY_BENEFIT_INVALID:['此权益当前不能兑换或改约，请查看订单状态。','This benefit cannot currently be redeemed or changed. Check the order status.'],
 STAY_NOT_CONFIRMED:['住宿尚未确认，暂不能预约套餐体验。','Accommodation must be confirmed before booking the included experience.'],
 STAY_TRANSITION_INVALID:['当前状态或时间不允许这项操作，请更新订单。','The current status or time does not allow this action. Refresh the order.'],
 STAY_CAPACITY_BELOW_BOOKED:['可售房量不能低于已确认的占用房量。','Inventory cannot be reduced below confirmed occupancy.'],
 STAY_INVENTORY_INVALID:['请输入有效日期、非负房价和0—1000间房量。','Enter a valid date, non-negative price and 0–1000 rooms.'],
 STAY_USE_ORDER_ACTION:['套餐体验请从关联住宿订单管理。','Manage package experiences from the accommodation order.'],
 FORBIDDEN:['你没有权限执行此操作。','You do not have permission to do this.'],
 DUPLICATE_INTENTION:['该场次已有你的预约，请先处理原记录。','You already have a request for this session.'],
}
export function stayError(error: unknown, zh: boolean){const raw=error instanceof Error?error.message:String(error);const item=Object.entries(ERRORS).find(([key])=>raw.includes(key));return item?item[1][zh?0:1]:zh?'住宿服务暂不可用，已保留输入。请稍后重试或联系酒店运营。':'Stay services are unavailable. Your entries are retained. Try again later or contact hotel operations.'}
export function searchStays(s: StaySearch){return rpc<StayQuote[]>('search_stays',{p_in:s.checkIn,p_out:s.checkOut,p_guests:s.guests})}
export function quoteStay(q: Pick<StayQuote,'room_id'|'plan_id'|'check_in'|'check_out'|'guests'>){return rpc<StayQuote>('quote_stay',{p_room:q.room_id,p_plan:q.plan_id,p_in:q.check_in,p_out:q.check_out,p_guests:q.guests})}
export function staySlots(id:string){return rpc<StaySlot[]>('stay_session_options',{p_booking:id})}
let clockCache:{at:number;promise:Promise<string>}|null=null
export function stayClock(){
 if(!clockCache||Date.now()-clockCache.at>60000){
  const at=Date.now();clockCache={at,promise:rpc<string>('stay_clock',{})}
  clockCache.promise.catch(()=>{if(clockCache?.at===at)clockCache=null})
 }
 return clockCache.promise
}
export function stayRateCalendar(room?:string){return rpc<StayNightRate[]>('stay_rate_calendar',{p_room:room??null})}
export function staySessionPreview(plan:string,checkIn:string,checkOut:string){return rpc<StaySessionOption[]>('stay_session_preview',{p_plan:plan,p_in:checkIn,p_out:checkOut})}
export function formatStaySession(iso:string,zh:boolean){return new Intl.DateTimeFormat(zh?'zh-CN':'en-GB',{timeZone:'Asia/Shanghai',month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit',hour12:false}).format(new Date(iso))}
export function transitionStay(id:string,status:StayStatus,reason='',session:string|null=null){return rpc('transition_stay_booking',{p_id:id,p_status:status,p_reason:reason,p_session:session})}
let version=0
export const useStayStore=create<{owner:string|null;bookings:StayBooking[];loading:boolean;error:string;refresh:()=>Promise<void>;reset:()=>void}>((set)=>({
 owner:null,bookings:[],loading:false,error:'',
 reset(){version++;set({owner:null,bookings:[],loading:false,error:''})},
 async refresh(){
  const id=useAppStore.getState().user?.id;if(!id)return;const current=++version;set({loading:true,error:''});
  try{const {data,error}=await requireCloud().from('stay_bookings').select('*,stay_entitlements(*)').order('created_at',{ascending:false});if(error)throw new Error(error.message);
   if(current!==version||useAppStore.getState().user?.id!==id)return;set({owner:id,bookings:(data??[]) as StayBooking[],loading:false})
  }catch(e){if(current===version&&useAppStore.getState().user?.id===id)set({loading:false,error:e instanceof Error?e.message:String(e)})}
 },
}))
