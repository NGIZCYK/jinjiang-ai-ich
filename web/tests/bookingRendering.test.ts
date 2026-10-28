import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'
import { LanguageProvider } from '../src/lib/i18n'
import { CATALOG, type JourneyBooking } from '../src/lib/journey'
import { OperationsPage } from '../src/pages/OperationsPage'
import { MyPage } from '../src/pages/MyPage'

const state=vi.hoisted(()=>({journey:{} as Record<string,unknown>,user:{id:'guest-1',name:'Test guest',role:'guest',email:'guest@example.test'}}))
vi.mock('../src/lib/journeyStore',()=>({useJourneyStore:()=>state.journey}))
vi.mock('../src/lib/store',()=>({useAppStore:(select:(s:unknown)=>unknown)=>select({user:state.user})}))
vi.mock('../src/lib/cloud',()=>({cloud:null,requireCloud:vi.fn(),rpc:vi.fn()}))

// Matches the one-to-one PostgREST embed from feedback.booking_id (primary key).
const completed:JourneyBooking={id:'booking-1',user_id:'guest-1',session_id:'session-1',party_size:1,status:'completed',reason:'',created_at:'2026-10-01T10:00:00Z',batch_id:'demo',recommendation_id:null,sessions:{starts_at:'2026-10-01T10:00:00Z',experience_id:'workshop'},feedback:{rating:4,comment:'Helpful experience'}}
beforeEach(()=>{state.journey={bookings:[completed],catalog:CATALOG,sessions:[],recommendations:[],exploration:null,loading:false,error:'',refresh:vi.fn()}})
function render(page:typeof OperationsPage){return renderToStaticMarkup(createElement(LanguageProvider,null,createElement(MemoryRouter,null,createElement(page))))}
describe('pages with existing booking feedback',()=>{
 it('renders an operator booking with object feedback without crashing',()=>{
  const html=render(OperationsPage)
  expect(html).toContain('体验管理')
  expect(html).toContain('Helpful experience')
  expect(html).toContain('4/5')
 })
 it('shows an existing guest feedback instead of another submission form',()=>{
  const html=render(MyPage)
  expect(html).toContain('反馈已记录')
  expect(html).toContain('Helpful experience')
  expect(html).not.toContain('提交一次反馈')
 })
 it('renders both pages when the feedback relation is null',()=>{
  state.journey.bookings=[{...completed,feedback:null}]
  expect(render(OperationsPage)).toContain('体验管理')
  const html=render(MyPage)
  expect(html).toContain('提交一次反馈')
  expect(html).not.toContain('反馈已记录')
 })
})
