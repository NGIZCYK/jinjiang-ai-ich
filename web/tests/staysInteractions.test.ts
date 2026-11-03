// @vitest-environment jsdom
import { afterEach,beforeEach,describe,it,expect,vi } from 'vitest'
import { createElement as h } from 'react'
import { cleanup,fireEvent,render,screen,waitFor,within } from '@testing-library/react'
import { MemoryRouter,Route,Routes,useLocation } from 'react-router-dom'
import { LanguageProvider } from '../src/lib/i18n'
import { useAppStore } from '../src/lib/store'
import { useStayStore,addDays,shanghaiDate } from '../src/lib/stays'
import { StaysPage } from '../src/pages/StaysPage'
import { StayCheckoutPage } from '../src/pages/StayCheckoutPage'
import { StayOrderCard } from '../src/components/StayOrders'
import { OpsStaysPage } from '../src/pages/ops/OpsStaysPage'
import { RequireRole } from '../src/components/JourneyCommon'
import { continuationPath } from '../src/lib/journeyFlow'
import type { StayBooking,StayQuote } from '../src/lib/stays'
const api=vi.hoisted(()=>({rpc:vi.fn(),single:vi.fn(),from:vi.fn()}))
vi.mock('../src/lib/cloud',()=>({cloud:{},rpc:api.rpc,requireCloud:()=>({from:api.from})}))
const next=()=>addDays(shanghaiDate(),2)
function q(room='classic',plan='room_only'):StayQuote{return {room_id:room,plan_id:plan,check_in:next(),check_out:addDays(next(),1),guests:2,room_title_zh:'江南雅居大床房',room_title_en:'Jiangnan King',plan_title_zh:plan==='heritage'?'苏绣体验套餐':'纯住宿',plan_title_en:plan==='heritage'?'Embroidery stay':'Room only',nights:[{night:next(),price:68000}],room_total:68000,surcharge:plan==='heritage'?18000:0,total:plan==='heritage'?86000:68000,available:1,experience_id:plan==='heritage'?'workshop':null,token:'quote-1'}}
function show(element:ReturnType<typeof h>,path='/stays'){return render(h(LanguageProvider,null,h(MemoryRouter,{initialEntries:[path]},element)))}
function Destination(){const location=useLocation();return h('p',null,location.pathname+location.search)}
const calendar=Array.from({length:91},(_,index)=>({night:addDays(shanghaiDate(),index+1),price:68000,available:5}))
beforeEach(()=>{sessionStorage.clear();localStorage.clear();vi.clearAllMocks();useAppStore.setState({user:{id:'guest',name:'Guest',role:'guest',email:'guest@example.test'},ready:true});useStayStore.setState({bookings:[],loading:false,error:'',refresh:vi.fn(async()=>{})});api.single.mockResolvedValue({data:{starts_at:`${next()}T16:00:00+08:00`},error:null});api.from.mockImplementation((table:string)=>{const result={data:table==='stay_rooms'?[{id:'classic',title_zh:'江南雅居大床房',title_en:'Jiangnan King'}]:table==='stay_inventory'?[{room_id:'classic',night:next(),price:68000,capacity:5}]:[],error:null};const promise=Promise.resolve(result);const chain:any={select:()=>chain,eq:()=>chain,gte:()=>chain,lte:()=>chain,order:()=>promise,single:api.single,then:promise.then.bind(promise)};return chain});api.rpc.mockImplementation(async(name:string)=>name==='search_stays'?[q(),q('classic','heritage')]:name==='quote_stay'?q():name==='stay_rate_calendar'?calendar:name==='stay_session_preview'?[{id:'slot-1',starts_at:`${next()}T16:00:00+08:00`,available:8}]:'stay-reference')})
afterEach(()=>{cleanup();vi.restoreAllMocks()})
describe('Accommodation guest interactions',()=>{
 it('offers an explicit demonstration quote, package details and a booking link',async()=>{
  show(h(StaysPage));await screen.findByRole('link',{name:/查看明细并预订/});expect(screen.getByText(/房型、房价及房量为演示资料/)).toBeTruthy()
  fireEvent.click(screen.getByRole('button',{name:'入住与离店日期'}))
  fireEvent.click(screen.getByRole('button',{name:/苏绣体验套餐/}))
  const session=await screen.findByRole('button',{name:/16:00/})
  fireEvent.click(session)
  const card=screen.getByRole('article',{name:'江南雅居大床房'})
  expect(screen.getByText(/90 分钟入门工坊/)).toBeTruthy()
  const href=within(card).getByRole('link',{name:/查看明细并预订/}).getAttribute('href')!
  expect(href).toContain('plan=heritage');expect(href).toContain('session=slot-1');expect(href).toContain('sessionAt=')
 })
 it('invalidates a previous result when dates change instead of offering a stale price',async()=>{
  show(h(StaysPage));await screen.findByRole('link',{name:/查看明细并预订/})
  fireEvent.click(screen.getByRole('button',{name:'入住与离店日期'}))
  const target=document.querySelector(`[data-date="${addDays(shanghaiDate(),5)}"]`) as HTMLButtonElement
  fireEvent.click(target)
  expect(screen.queryByRole('link',{name:/查看明细并预订/})).toBeNull();expect(screen.getByText(/日期已更改/)).toBeTruthy()
  fireEvent.submit(screen.getByRole('form',{name:'查询客房'}));await screen.findByRole('link',{name:/查看明细并预订/})
  expect(api.rpc.mock.calls.filter(c=>c[0]==='search_stays')).toHaveLength(2)
  await screen.findByText(/已更新 · 1 个房型/)
  expect(document.querySelectorAll('.date-day-price')).toHaveLength(0)
 })
 it('provides understandable English labels and sold-out states',async()=>{
  localStorage.setItem('jj_language','en');api.rpc.mockImplementation(async(name:string)=>name==='search_stays'?[{...q(),available:0}]:name==='stay_rate_calendar'?calendar:name==='stay_session_preview'?[]:q())
  show(h(StaysPage));await screen.findByRole('button',{name:'Unavailable'})
  expect(screen.getByRole('button',{name:'Unavailable'}).hasAttribute('disabled')).toBe(true);expect(screen.getByRole('button',{name:'Check-in and check-out'})).toBeTruthy();expect(screen.queryByRole('link',{name:/Review & request/})).toBeNull()
 })
 it('requires review consent, prevents duplicate submits and navigates to an order receipt',async()=>{
  let resolveSubmit:(value:string)=>void=()=>{};api.rpc.mockImplementation((name:string)=>name==='quote_stay'?Promise.resolve(q()):new Promise<string>(resolve=>{resolveSubmit=resolve}))
  show(h(Routes,null,h(Route,{path:'/stays/book',element:h(StayCheckoutPage)}),h(Route,{path:'/my',element:h(Destination)})),`/stays/book?room=classic&plan=room_only&in=${next()}&out=${addDays(next(),1)}&guests=2`)
  const button=await screen.findByRole('button',{name:/提交住宿申请/});expect(button.hasAttribute('disabled')).toBe(true);fireEvent.click(screen.getByRole('checkbox'));fireEvent.click(button);fireEvent.click(button)
  expect(api.rpc.mock.calls.filter(c=>c[0]==='submit_stay_request')).toHaveLength(1);resolveSubmit('stay-reference');await screen.findByText('/my?tab=stays&stay=stay-reference')
 })
 it('refreshes changed prices and requires renewed consent rather than retrying silently',async()=>{
  let quotes=0;api.rpc.mockImplementation(async(name:string)=>{if(name==='quote_stay')return ++quotes===1?q():{...q(),total:70000,token:'quote-2',nights:[{night:next(),price:70000}]};throw new Error('STAY_PRICE_CHANGED')})
  show(h(StayCheckoutPage),`/stays/book?room=classic&plan=room_only&in=${next()}&out=${addDays(next(),1)}&guests=2`);await screen.findByRole('button',{name:/提交住宿申请/});fireEvent.click(screen.getByRole('checkbox'));fireEvent.click(screen.getByRole('button',{name:/提交住宿申请/}))
  await screen.findByText(/报价与上次查看时不同/);expect((screen.getByRole('checkbox') as HTMLInputElement).checked).toBe(false);expect(screen.getByRole('button',{name:/提交住宿申请/}).hasAttribute('disabled')).toBe(true)
 })
 it('keeps the checkout route as a safe post-login continuation',async()=>{
  useAppStore.setState({user:null});const path=`/stays/book?room=classic&plan=room_only&in=${next()}&out=${addDays(next(),1)}&guests=2`
  show(h(Routes,null,h(Route,{path:'/stays/book',element:h(RequireRole,null,h(StayCheckoutPage))}),h(Route,{path:'/auth',element:h(Destination)})),path)
  await screen.findByText('/auth?next='+encodeURIComponent(path));expect(continuationPath(path)).toBe(path);expect(continuationPath('//evil.example/stays')).toBeNull();expect(continuationPath('/stays/book/other')).toBeNull()
 })
 it('preserves the displayed held session after a failed change and explains the failure',async()=>{
  const b:StayBooking={id:'stay-one',user_id:'guest',batch_id:'demo',room_id:'classic',plan_id:'heritage',check_in:next(),check_out:addDays(next(),2),guests:2,status:'confirmed',quote:q('classic','heritage'),reason:'',created_at:new Date().toISOString(),stay_entitlements:{id:'ent-one',session_id:'held-slot',seats:2,status:'held',activity_booking_id:null}}
  api.rpc.mockImplementation(async(name:string)=>{if(name==='stay_session_options')return [{id:'held-slot',starts_at:`${next()}T16:00:00+08:00`,available:2,is_held:true},{id:'other-slot',starts_at:`${addDays(next(),1)}T16:00:00+08:00`,available:2,is_held:false}];throw new Error('STAY_BENEFIT_UNAVAILABLE')})
  show(h(StayOrderCard,{booking:b}));fireEvent.click(screen.getByRole('button',{name:'预约套餐体验'}));const select=await screen.findByLabelText('入住期间可选场次');fireEvent.change(select,{target:{value:'other-slot'}});fireEvent.click(screen.getByRole('button',{name:'确认场次'}))
  await screen.findByRole('alert');expect(screen.getByText(/已保留名额/)).toBeTruthy();expect(screen.getByText(/原有订单或保留名额未改变/)).toBeTruthy()
 })
 it('requires an explicit second action before cancelling accommodation',async()=>{
  const b:StayBooking={id:'stay-one',user_id:'guest',batch_id:'demo',room_id:'classic',plan_id:'room_only',check_in:next(),check_out:addDays(next(),1),guests:2,status:'pending',quote:q(),reason:'',created_at:new Date().toISOString(),stay_entitlements:null}
  show(h(StayOrderCard,{booking:b}));fireEvent.click(screen.getByRole('button',{name:'取消住宿申请'}));expect(api.rpc).not.toHaveBeenCalled();fireEvent.click(screen.getByRole('button',{name:'保留订单'}));expect(api.rpc).not.toHaveBeenCalled()
 })
})

describe('Accommodation operations interactions',()=>{
 it('saves nightly rates through the validating RPC and retains entered values after a rejection',async()=>{
  useAppStore.setState({user:{id:'ops',name:'Operator',role:'ops',email:'ops@example.test'}})
  show(h(OpsStaysPage),'/ops/stays');fireEvent.click(screen.getByRole('button',{name:'房价房量'}));fireEvent.click(screen.getByRole('button',{name:'查看14天'}));const rate=await screen.findByLabelText('每晚房价（元）');fireEvent.change(rate,{target:{value:'700.50'}})
  api.rpc.mockRejectedValue(new Error('STAY_CAPACITY_BELOW_BOOKED'));fireEvent.click(screen.getByRole('button',{name:'保存当日'}));await screen.findByRole('alert')
  expect(api.rpc).toHaveBeenCalledWith('set_stay_inventory',{p_room:'classic',p_night:next(),p_price:70050,p_capacity:5});expect((rate as HTMLInputElement).value).toBe('700.50');expect(screen.getByText(/可售房量不能低于/)).toBeTruthy()
 })
})
