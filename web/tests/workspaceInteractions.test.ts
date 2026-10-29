// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createElement } from 'react'
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { LanguageProvider } from '../src/lib/i18n'
import { useAppStore } from '../src/lib/store'
import { StudioPage } from '../src/pages/StudioPage'
import { PremiumHomePage } from '../src/pages/PremiumHomePage'
import { Layout } from '../src/components/Layout'
import { AuthPage } from '../src/pages/AuthPage'
import { readStudioDraft } from '../src/lib/studioDraft'
import { rememberContinuation } from '../src/lib/journeyFlow'

const api=vi.hoisted(()=>({fetch:vi.fn()}))
vi.mock('../src/lib/cloud',()=>({cloud:{},apiFetch:api.fetch,requireCloud:vi.fn(),rpc:vi.fn()}))
function show(component:typeof StudioPage|typeof PremiumHomePage){return render(createElement(LanguageProvider,null,createElement(MemoryRouter,null,createElement(component))))}
beforeEach(()=>{
 sessionStorage.clear();localStorage.clear();api.fetch.mockResolvedValue(new Response('{}',{status:503}))
 useAppStore.setState({user:{id:'ops-1',name:'Operator',role:'ops',email:'ops@example.test'},ready:true,contents:[],refreshContents:vi.fn(async()=>{})})
 vi.stubGlobal('matchMedia',vi.fn((query:string)=>({matches:query.includes('min-width'),media:query,addEventListener:vi.fn(),removeEventListener:vi.fn()})))
 vi.stubGlobal('requestAnimationFrame',(callback:FrameRequestCallback)=>setTimeout(callback,0))
 vi.stubGlobal('cancelAnimationFrame',clearTimeout)
 window.scrollTo=vi.fn();Element.prototype.scrollIntoView=vi.fn()
})
afterEach(()=>{cleanup();vi.useRealTimers();vi.unstubAllGlobals()})
describe('operator workspace drafts',()=>{
 it('restores edited text after leaving the page, with approval and checks reset',async()=>{
  const view=show(StudioPage)
  fireEvent.click(screen.getByRole('button',{name:'生成草稿'}))
  const editor=await screen.findByLabelText('正文')
  fireEvent.change(editor,{target:{value:'My edited draft'}})
  fireEvent.change(screen.getByLabelText('内容标题'),{target:{value:'Saved local title'}})
  expect(readStudioDraft('ops-1')?.body).toBe('My edited draft')
  view.unmount();show(StudioPage)
  expect((screen.getByLabelText('正文') as HTMLTextAreaElement).value).toBe('My edited draft')
  expect((screen.getByLabelText('内容标题') as HTMLInputElement).value).toBe('Saved local title')
  expect((screen.getByRole('button',{name:'保存到内容库'}) as HTMLButtonElement).disabled).toBe(true)
  expect(screen.getAllByRole('checkbox').every(el=>!(el as HTMLInputElement).checked)).toBe(true)
  expect(readStudioDraft('different-account')).toBeNull()
 })
 it('keeps edited content when regeneration is cancelled',async()=>{
  show(StudioPage);fireEvent.click(screen.getByRole('button',{name:'生成草稿'}))
  const editor=await screen.findByLabelText('正文');fireEvent.change(editor,{target:{value:'Keep this draft'}})
  const confirm=vi.spyOn(window,'confirm').mockReturnValue(false)
  fireEvent.click(screen.getByRole('button',{name:'重新生成草稿'}))
  expect(confirm).toHaveBeenCalled();expect((editor as HTMLTextAreaElement).value).toBe('Keep this draft');confirm.mockRestore()
 })
})
describe('homepage continuation and motion',()=>{
 it('lands on the homepage after login and retains the original task',async()=>{
  const originalLogin=useAppStore.getState().login
  useAppStore.setState({user:null,login:vi.fn(async()=>{useAppStore.setState({user:{id:'guest',name:'Guest',role:'guest',email:'guest@example.test'}});return {ok:true}})})
  try{
   render(createElement(LanguageProvider,null,createElement(MemoryRouter,{initialEntries:['/auth?next=%2Fguide%23recommendations']},createElement(Routes,null,createElement(Route,{path:'/auth',element:createElement(AuthPage)}),createElement(Route,{path:'/',element:createElement(PremiumHomePage)})))))
   fireEvent.change(screen.getByLabelText('邮箱'),{target:{value:'guest@example.test'}});fireEvent.change(screen.getByLabelText('密码'),{target:{value:'test-password'}})
   fireEvent.click(screen.getByRole('button',{name:'登录并继续'}))
   await screen.findByRole('heading',{name:'住进苏州，也住进一门手艺。'})
   expect(screen.getAllByRole('link',{name:/继续刚才的操作/}).every(link=>link.getAttribute('href')==='/guide#recommendations')).toBe(true)
  }finally{useAppStore.setState({login:originalLogin})}
 })
 it('keeps the homepage landing and offers the original task as a separate continuation',()=>{
  rememberContinuation('/immersive#exploration-task');show(PremiumHomePage)
  expect(screen.getAllByRole('link',{name:/继续刚才的操作/}).every(link=>link.getAttribute('href')==='/immersive#exploration-task')).toBe(true)
  expect(screen.getByRole('link',{name:/查看我的行程/}).getAttribute('href')).toBe('/my')
 })
 it('pauses automatic artwork rotation until explicitly resumed',()=>{
  vi.useFakeTimers();show(PremiumHomePage)
  expect(screen.getByRole('heading',{name:'花下双猫'})).toBeTruthy()
  act(()=>vi.advanceTimersByTime(5600));expect(screen.getByRole('heading',{name:'鹤与玉兰'})).toBeTruthy()
  fireEvent.click(screen.getByRole('button',{name:'暂停自动轮换'}));act(()=>vi.advanceTimersByTime(11200))
  expect(screen.getByRole('heading',{name:'鹤与玉兰'})).toBeTruthy()
 })
 it('uses a still mobile hero until the guest requests the film',()=>{
  vi.stubGlobal('matchMedia',vi.fn((query:string)=>({matches:false,media:query,addEventListener:vi.fn(),removeEventListener:vi.fn()})))
  const view=show(PremiumHomePage);expect(view.container.querySelector('video')).toBeNull()
  fireEvent.click(screen.getByRole('button',{name:'播放影像'}));expect(view.container.querySelector('video')).not.toBeNull()
 })
 it('respects reduced motion for both the hero and artwork rotation',()=>{
  vi.useFakeTimers();vi.stubGlobal('matchMedia',vi.fn((query:string)=>({matches:true,media:query,addEventListener:vi.fn(),removeEventListener:vi.fn()})))
  const view=show(PremiumHomePage);expect(view.container.querySelector('video')).toBeNull()
  act(()=>vi.advanceTimersByTime(11200));expect(screen.getByRole('heading',{name:'花下双猫'})).toBeTruthy()
  expect((screen.getByRole('button',{name:'已按系统偏好停止自动轮换'}) as HTMLButtonElement).disabled).toBe(true)
 })
 it('separates guest navigation and operations navigation',async()=>{
  render(createElement(LanguageProvider,null,createElement(MemoryRouter,{initialEntries:['/operations']},createElement(Routes,null,createElement(Route,{element:createElement(Layout)},createElement(Route,{path:'*',element:createElement('div',null,'Page')}))))))
  await waitFor(()=>expect(screen.getAllByRole('link',{name:'体验管理'}).length).toBe(2))
  expect(screen.queryByRole('link',{name:'我的行程'})).toBeNull()
  fireEvent.click(screen.getByRole('button',{name:'住客体验'}))
  await waitFor(()=>expect(screen.getAllByRole('link',{name:'我的行程'}).length).toBe(2))
  expect(screen.queryByRole('link',{name:'体验管理'})).toBeNull()
 })
})
