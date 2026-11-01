// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createElement } from 'react'
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { LanguageProvider } from '../src/lib/i18n'
import { CATALOG, type JourneyBooking } from '../src/lib/journey'
import { useAppStore } from '../src/lib/store'
import { useJourneyStore } from '../src/lib/journeyStore'
import { MyPage } from '../src/pages/MyPage'
import { RecommendationPanel } from '../src/components/RecommendationPanel'

const cloud=vi.hoisted(()=>({rpc:vi.fn(),single:vi.fn(),apiFetch:vi.fn()}))
vi.mock('../src/lib/cloud',()=>({cloud:null,rpc:cloud.rpc,apiFetch:cloud.apiFetch,requireCloud:()=>({from:()=>({select(){return this},eq(){return this},single:cloud.single})})}))
const slot={id:'slot-1',experience_id:'workshop',starts_at:'2027-01-01T06:00:00Z',available:5,capacity:5}
const rec={id:'rec-1',experience_id:'workshop',needs:{minutes:90,budget:150,party:'solo' as const,interest:'craft' as const},created_at:''}
function show(component:typeof MyPage|typeof RecommendationPanel,path='/my?recommendation=rec-1') {
  return render(createElement(LanguageProvider,null,createElement(MemoryRouter,{initialEntries:[path]},createElement(component))))
}
beforeEach(()=>{
 sessionStorage.clear();localStorage.clear();cloud.rpc.mockReset();cloud.single.mockReset();cloud.apiFetch.mockReset()
 useAppStore.setState({user:{id:'guest-1',name:'Guest',role:'guest',email:'guest@example.test'},ready:true,authError:'',guideSignals:[]})
 useJourneyStore.setState({exploration:null,recommendations:[rec],bookings:[],catalog:CATALOG,sessions:[slot],loading:false,error:'',needs:null,refresh:vi.fn(async()=>{useJourneyStore.setState(s=>({catalog:s.catalog.map(e=>({...e})),recommendations:s.recommendations.map(r=>({...r}))}))})})
 cloud.single.mockResolvedValue({data:{status:'pending'},error:null})
})
afterEach(cleanup)
describe('guest booking interactions',()=>{
 it('keeps internal refresh diagnostics out of the guest notice',()=>{
  useJourneyStore.setState({error:'Could not find the function public.available_sessions in the schema cache'})
  show(MyPage,'/my')
  expect(screen.getByText(/暂时无法更新行程/)).toBeTruthy()
  expect(screen.queryByText(/public\.available_sessions/)).toBeNull()
 })
 it('localises network refresh errors while retaining the selected session',()=>{
  localStorage.setItem('jj_language','en')
  show(MyPage,'/my')
  fireEvent.change(screen.getByLabelText('Date & session'),{target:{value:slot.id}})
  act(()=>useJourneyStore.setState({error:'Failed to fetch'}))
  expect(screen.getByText(/Connection interrupted/)).toBeTruthy()
  expect((screen.getByLabelText('Date & session') as HTMLSelectElement).value).toBe(slot.id)
 })
 it('retains session and party size when shared records refresh',async()=>{
  show(MyPage)
  fireEvent.change(screen.getByLabelText('具体日期与场次'),{target:{value:slot.id}})
  fireEvent.change(screen.getByLabelText('参与人数'),{target:{value:'2'}})
  fireEvent.click(screen.getByRole('button',{name:'更新行程'}))
  await waitFor(()=>expect(useJourneyStore.getState().refresh).toHaveBeenCalled())
  expect((screen.getByLabelText('具体日期与场次') as HTMLSelectElement).value).toBe(slot.id)
  expect((screen.getByLabelText('参与人数') as HTMLInputElement).value).toBe('2')
 })
 it('clears a session that is no longer available after refresh',()=>{
  show(MyPage);fireEvent.change(screen.getByLabelText('具体日期与场次'),{target:{value:slot.id}})
  act(()=>useJourneyStore.setState({sessions:[]}))
  expect((screen.getByLabelText('具体日期与场次') as HTMLSelectElement).value).toBe('')
  expect((screen.getByRole('button',{name:'提交意向'}) as HTMLButtonElement).disabled).toBe(true)
 })
 it('retains the idempotency key on failure, then starts a new submission after success and withdrawal',async()=>{
  let status='pending';const keys:string[]=[];let failed=false
  cloud.rpc.mockImplementation(async(name,args)=>{if(name==='transition_booking'){status='cancelled';return}keys.push(args.p_request);if(!failed){failed=true;throw new Error('Failed to fetch')}status='pending';return `booking-${keys.length}`})
  cloud.single.mockImplementation(async()=>({data:{status},error:null}))
  show(MyPage,'/my')
  fireEvent.change(screen.getByLabelText('具体日期与场次'),{target:{value:slot.id}})
  fireEvent.click(screen.getByRole('button',{name:'提交意向'}))
  await screen.findByText(/连接暂时中断/)
  expect((screen.getByLabelText('具体日期与场次') as HTMLSelectElement).value).toBe(slot.id)
  fireEvent.click(screen.getByRole('button',{name:'提交意向'}))
  await screen.findByText('已收到你的体验意向')
  expect(keys[0]).toBe(keys[1])
  expect((screen.getByLabelText('具体日期与场次') as HTMLSelectElement).value).toBe('')
  const booking:JourneyBooking={id:'booking-2',user_id:'guest-1',session_id:slot.id,party_size:1,status:'pending',reason:'',created_at:'',batch_id:'demo',recommendation_id:null,sessions:slot,feedback:null}
  act(()=>useJourneyStore.setState({bookings:[booking]}))
  fireEvent.click(screen.getByRole('button',{name:'撤回意向'}));await waitFor(()=>expect(status).toBe('cancelled'))
  fireEvent.change(screen.getByLabelText('具体日期与场次'),{target:{value:slot.id}})
  fireEvent.click(screen.getByRole('button',{name:'提交意向'}))
  await waitFor(()=>expect(keys).toHaveLength(3));expect(keys[2]).not.toBe(keys[1])
 })
 it('does not show success for a server-returned withdrawn request',async()=>{
  cloud.rpc.mockResolvedValue('old-booking');cloud.single.mockResolvedValue({data:{status:'cancelled'},error:null})
  show(MyPage,'/my');fireEvent.change(screen.getByLabelText('具体日期与场次'),{target:{value:slot.id}})
  fireEvent.click(screen.getByRole('button',{name:'提交意向'}))
  await screen.findByText(/记录状态已变化/);expect(screen.queryByText('已收到你的体验意向')).toBeNull()
 })
 it('shows carried time preferences and clearly labels a waitlist submission',()=>{
  act(()=>useJourneyStore.setState({sessions:[{...slot,available:0}]}))
  show(MyPage,'/my?slot=周末%2014:00&duration=90')
  expect(screen.getByText(/周末 14:00/)).toBeTruthy()
  fireEvent.change(screen.getByLabelText('具体日期与场次'),{target:{value:slot.id}})
  expect(screen.getByRole('button',{name:'提交候补意向'})).toBeTruthy()
  expect(screen.getByText(/提交不代表获得名额/)).toBeTruthy()
 })
 it('applies only guest-confirmed conversational requirements and preserves unmentioned fields',()=>{
  useAppStore.setState({guideSignals:[{id:'s',sourceMessageId:'m',language:'zh',createdAt:1,topics:['craft'],stayHours:.5,budget:0,partyType:'family',sentiment:'neutral'}]})
  show(RecommendationPanel,'/guide')
  expect((screen.getByLabelText('可用时间（分钟）') as HTMLInputElement).value).toBe('90')
  fireEvent.click(screen.getByRole('button',{name:'使用这些需求'}))
  expect((screen.getByLabelText('可用时间（分钟）') as HTMLInputElement).value).toBe('30')
  expect((screen.getByLabelText('单人预算（元）') as HTMLInputElement).value).toBe('0')
  expect((screen.getByLabelText('同行类型') as HTMLSelectElement).value).toBe('family')
 })
})
