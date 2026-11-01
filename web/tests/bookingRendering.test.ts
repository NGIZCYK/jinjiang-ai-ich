// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createElement } from 'react'
import { cleanup, render, screen, fireEvent, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { LanguageProvider } from '../src/lib/i18n'
import { CATALOG, type JourneyBooking } from '../src/lib/journey'
import { OperationsPage } from '../src/pages/OperationsPage'
import { MyPage } from '../src/pages/MyPage'

const state=vi.hoisted(()=>({journey:{} as Record<string,unknown>,user:{id:'guest-1',name:'Test guest',role:'guest',email:'guest@example.test'}}))
vi.mock('../src/lib/journeyStore',()=>({useJourneyStore:()=>state.journey}))
vi.mock('../src/lib/store',()=>({useAppStore:(select:(s:unknown)=>unknown)=>select({user:state.user})}))
vi.mock('../src/lib/cloud',()=>({cloud:null,requireCloud:vi.fn(),rpc:vi.fn(async()=>[])}))

// Matches the one-to-one PostgREST embed from feedback.booking_id (primary key).
const completed:JourneyBooking={id:'booking-1',user_id:'guest-1',session_id:'session-1',party_size:1,status:'completed',reason:'',created_at:'2026-10-01T10:00:00Z',batch_id:'demo',recommendation_id:null,sessions:{starts_at:'2026-10-01T10:00:00Z',experience_id:'workshop'},feedback:{rating:4,comment:'Helpful experience'}}
beforeEach(()=>{state.journey={bookings:[completed],catalog:CATALOG,sessions:[],recommendations:[],exploration:null,loading:false,error:'',refresh:vi.fn()}})
afterEach(cleanup)
function renderPage(page:typeof OperationsPage|typeof MyPage){const view=render(createElement(LanguageProvider,null,createElement(MemoryRouter,null,createElement(page))));return view.container.innerHTML}
function renderOperator(){
  const view=render(createElement(LanguageProvider,null,createElement(MemoryRouter,null,createElement(OperationsPage))))
  fireEvent.click(screen.getByRole('button',{name:/^全部/}))
  fireEvent.click(screen.getByRole('button',{name:'查看与处理'}))
  return view.container.innerHTML
}
describe('pages with existing booking feedback',()=>{
 it('renders an operator booking with object feedback without crashing',()=>{
  const html=renderOperator()
  expect(html).toContain('体验管理')
  expect(html).toContain('Helpful experience')
  expect(html).toContain('4/5')
 })
 it('shows an existing guest feedback instead of another submission form',()=>{
  const html=renderPage(MyPage)
  expect(html).toContain('反馈已记录')
  expect(html).toContain('Helpful experience')
  expect(html).not.toContain('提交一次反馈')
 })
 it('renders both pages when the feedback relation is null',()=>{
  state.journey.bookings=[{...completed,feedback:null}]
  expect(renderOperator()).toContain('体验管理');cleanup()
  const html=renderPage(MyPage)
  expect(html).toContain('提交一次反馈')
  expect(html).not.toContain('反馈已记录')
 })
 it('closes the request drawer with Escape',()=>{
  state.journey.bookings=[completed]
  renderOperator()
  const dialog=document.querySelector('dialog')
  expect(dialog).toBeTruthy()
  expect(within(dialog!).getByRole('heading',{name:'处理记录'})).toBeTruthy()
  fireEvent.keyDown(dialog!,{key:'Escape'})
  expect(within(dialog!).queryByRole('heading',{name:'处理记录'})).toBeNull()
 })
})
