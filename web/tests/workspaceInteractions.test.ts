// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createElement } from 'react'
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { LanguageProvider } from '../src/lib/i18n'
import { useAppStore } from '../src/lib/store'
import { StudioPage } from '../src/pages/StudioPage'
import { PremiumHomePage } from '../src/pages/PremiumHomePage'
import { Layout } from '../src/components/Layout'
import { OpsShell } from '../src/components/ops/OpsShell'
import { AuthPage } from '../src/pages/AuthPage'
import { readStudioDraft } from '../src/lib/studioDraft'
import { OpsTabs } from '../src/components/ops/OpsUI'
import { readContinuation, rememberContinuation } from '../src/lib/journeyFlow'

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
afterEach(()=>{cleanup();vi.restoreAllMocks();vi.useRealTimers();vi.unstubAllGlobals()})
describe('operator workspace drafts',()=>{
 it('restores edited text after leaving the page, with approval and checks reset',async()=>{
  const view=show(StudioPage)
  fireEvent.click(screen.getByRole('button',{name:'生成草稿'}))
  const editor=await screen.findByLabelText('正文')
  fireEvent.change(editor,{target:{value:'My edited draft'}})
  fireEvent.change(screen.getByLabelText('内容标题'),{target:{value:'Saved local title'}})
  await waitFor(()=>expect(readStudioDraft('ops-1')?.body).toBe('My edited draft'))
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
  expect(document.querySelector('.home-continue')).toBeNull()
  fireEvent.click(screen.getByRole('button',{name:'稍后再说'}))
  expect(readContinuation()).toBeNull()
  expect(screen.getByRole('link',{name:'咨询婉娘'}).getAttribute('href')).toBe('/guide')
 })
 it('pauses automatic artwork rotation until explicitly resumed',()=>{
  vi.useFakeTimers();show(PremiumHomePage)
  expect(screen.getByRole('heading',{name:'花下双猫'})).toBeTruthy()
  act(()=>vi.advanceTimersByTime(5600));expect(screen.getByRole('heading',{name:'鹤与玉兰'})).toBeTruthy()
  fireEvent.click(screen.getByRole('button',{name:'暂停自动轮换'}));act(()=>vi.advanceTimersByTime(11200))
  expect(screen.getByRole('heading',{name:'鹤与玉兰'})).toBeTruthy()
 })
 it('uses the portrait film and poster with explicit mobile playback and error fallback',()=>{
  vi.stubGlobal('matchMedia',vi.fn((query:string)=>({matches:false,media:query,addEventListener:vi.fn(),removeEventListener:vi.fn()})))
  const view=show(PremiumHomePage);expect(view.container.querySelector('video')).toBeNull()
  expect(view.container.querySelector('.home-film-media img')?.getAttribute('src')).toBe('/assets/home-embroidery-20261101-v2-mobile.webp')
  expect(screen.getByRole('button',{name:'播放影像'}).classList.contains('home-film-control-center')).toBe(true)
  fireEvent.click(screen.getByRole('button',{name:'播放影像'}))
  const video=view.container.querySelector('video')!
  expect(video.querySelector('source')?.getAttribute('src')).toBe('/videos/home-embroidery-20261101-v2-mobile.mp4')
  expect(video.autoplay&&video.loop&&video.playsInline).toBe(true)
  fireEvent.playing(video);expect(view.container.querySelector('.home-film-media.is-ready')).toBeTruthy()
  expect(screen.getByRole('button',{name:'暂停影像'}).classList.contains('home-film-control-center')).toBe(false)
  fireEvent.error(video);expect(view.container.querySelector('video')).toBeNull()
  expect(view.container.querySelector('.home-film-media.is-ready')).toBeNull()
  expect(view.container.querySelector('.home-film-control')).toBeNull()
  expect(screen.queryByText('空间概念图 · 非实景照片')).toBeNull()
 })
 it('automatically plays the landscape muted looping film on desktop',()=>{
  vi.stubGlobal('matchMedia',vi.fn((query:string)=>({matches:query.includes('min-width'),media:query,addEventListener:vi.fn(),removeEventListener:vi.fn()})))
  const view=show(PremiumHomePage),video=view.container.querySelector('video')!
  expect(video).not.toBeNull();expect(video.muted&&video.autoplay&&video.loop).toBe(true)
  expect(video.querySelector('source')?.getAttribute('src')).toBe('/videos/home-embroidery-20261101-v2-desktop.mp4')
  expect(screen.getByRole('button',{name:'暂停影像'})).toBeTruthy()
 })
 it('switches viewport-specific media without reusing a stale ready frame',()=>{
  const listeners=new Set<()=>void>()
  const query={matches:true,media:'(min-width: 768px)',addEventListener:(_type:string,fn:()=>void)=>listeners.add(fn),removeEventListener:(_type:string,fn:()=>void)=>listeners.delete(fn)}
  vi.stubGlobal('matchMedia',vi.fn((value:string)=>value.includes('min-width')?query:{matches:false,media:value,addEventListener:vi.fn(),removeEventListener:vi.fn()}))
  const view=show(PremiumHomePage);fireEvent.playing(view.container.querySelector('video')!)
  expect(view.container.querySelector('.home-film-media.is-ready')).toBeTruthy()
  act(()=>{query.matches=false;listeners.forEach(fn=>fn())})
  expect(view.container.querySelector('video')).toBeNull()
  expect(view.container.querySelector('.home-film-media img')?.getAttribute('src')).toContain('-mobile.webp')
  act(()=>{query.matches=true;listeners.forEach(fn=>fn())})
  expect(view.container.querySelector('source')?.getAttribute('src')).toContain('-desktop.mp4')
  expect(view.container.querySelector('.home-film-media.is-ready')).toBeNull()
 })
 it('pauses and resumes playback using the visible controls',async()=>{
  const view=show(PremiumHomePage),video=view.container.querySelector('video')!
  let paused=false
  Object.defineProperty(video,'paused',{get:()=>paused,configurable:true})
  const pause=vi.spyOn(video,'pause').mockImplementation(()=>{paused=true;fireEvent.pause(video)})
  const play=vi.spyOn(video,'play').mockImplementation(async()=>{paused=false;fireEvent.play(video);fireEvent.playing(video)})
  fireEvent.click(screen.getByRole('button',{name:'暂停影像'}));expect(pause).toHaveBeenCalledOnce()
  fireEvent.click(screen.getByRole('button',{name:'继续播放'}));await waitFor(()=>expect(play).toHaveBeenCalledOnce())
  expect(screen.getByRole('button',{name:'暂停影像'})).toBeTruthy()
 })
 it('keeps the video unloaded when the device requests data saving',()=>{
  Object.defineProperty(navigator,'connection',{value:{saveData:true},configurable:true})
  try{const view=show(PremiumHomePage);expect(view.container.querySelector('video')).toBeNull();expect(view.container.querySelector('.home-film-control')).toBeNull();expect(screen.queryByText('静态模式')).toBeNull()}
  finally{delete (navigator as any).connection}
 })
 it('returns to its poster when motion is disabled and waits for playback after re-enabling',()=>{
  const listeners=new Set<()=>void>()
  const motion={matches:false,addEventListener:(_type:string,fn:()=>void)=>listeners.add(fn),removeEventListener:(_type:string,fn:()=>void)=>listeners.delete(fn)}
  vi.stubGlobal('matchMedia',vi.fn((query:string)=>query.includes('reduced-motion')?motion:{matches:true,addEventListener:vi.fn(),removeEventListener:vi.fn()}))
  const view=show(PremiumHomePage);fireEvent.playing(view.container.querySelector('video')!)
  act(()=>{motion.matches=true;listeners.forEach(fn=>fn())})
  expect(view.container.querySelector('video')).toBeNull();expect(view.container.querySelector('.home-film-control')).toBeNull()
  act(()=>{motion.matches=false;listeners.forEach(fn=>fn())})
  expect(view.container.querySelector('video')).not.toBeNull();expect(view.container.querySelector('.home-film-media.is-ready')).toBeNull()
 })
 it('respects reduced motion for both the hero and artwork rotation',()=>{
  vi.useFakeTimers();vi.stubGlobal('matchMedia',vi.fn((query:string)=>({matches:true,media:query,addEventListener:vi.fn(),removeEventListener:vi.fn()})))
  const view=show(PremiumHomePage);expect(view.container.querySelector('video')).toBeNull()
  act(()=>vi.advanceTimersByTime(11200));expect(screen.getByRole('heading',{name:'花下双猫'})).toBeTruthy()
  expect((screen.getByRole('button',{name:'已按系统偏好停止自动轮换'}) as HTMLButtonElement).disabled).toBe(true)
 })
 it('keeps the guest site in preview mode and the operations workspace separate',async()=>{
  const guest=render(createElement(LanguageProvider,null,createElement(MemoryRouter,{initialEntries:['/']},createElement(Routes,null,createElement(Route,{element:createElement(Layout)},createElement(Route,{path:'*',element:createElement('div',null,'Page')}))))))
  expect(guest.container.querySelector('.guest-ui')).not.toBeNull()
  expect(screen.getByText('运营预览 · 住客端')).toBeTruthy()
  expect(screen.queryByRole('link',{name:'体验管理'})).toBeNull()
  expect(screen.queryByRole('button',{name:'住客体验'})).toBeNull()
  guest.unmount()
  render(createElement(LanguageProvider,null,createElement(MemoryRouter,{initialEntries:['/ops/experiences']},createElement(Routes,null,createElement(Route,{path:'/ops',element:createElement(OpsShell)},createElement(Route,{path:'experiences',element:createElement('div',null,'Ops page')}))))))
  await waitFor(()=>expect(screen.getAllByRole('link',{name:'体验管理'}).length).toBe(2))
  expect(screen.queryByRole('link',{name:'我的行程'})).toBeNull()
  expect(screen.queryByText('运营预览 · 住客端')).toBeNull()
  expect(screen.getAllByRole('link',{name:'总览'}).length).toBe(2)
  expect(document.querySelector('.guest-ui')).toBeNull()
 })
 it.each(['zh','en'])('introduces %s copy before the clean film and links onward to the chapters',language=>{
  localStorage.setItem('jj_language',language)
  const view=show(PremiumHomePage),film=screen.getByRole('region',{name:language==='zh'?'苏绣主题影像':'Embroidery film'})
  const intro=document.getElementById('home-introduction')!
  expect(within(film).queryByRole('heading')).toBeNull()
  expect(within(film).queryByRole('link',{name:language==='zh'?'咨询婉娘':'Meet Wanniang'})).toBeNull()
  expect(film.textContent?.trim()).toBe('')
  expect(view.container.querySelector('.home-hero-shade,.home-film-console,.home-film-progress')).toBeNull()
  expect(intro.compareDocumentPosition(film)&Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  const chapters=document.getElementById('stay-chapters')!
  expect(film.compareDocumentPosition(chapters)&Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  const arrow=within(film).getByRole('link',{name:language==='zh'?'向下探索住中三章':'Explore the three chapters below'})
  expect(arrow.getAttribute('href')).toBe('#stay-chapters');expect(chapters.tabIndex).toBe(-1)
  const chapterLinks=Array.from(chapters.querySelectorAll<HTMLAnchorElement>('.home-journey-item'))
  expect(chapterLinks.map(link=>link.getAttribute('href'))).toEqual(['/immersive?focus=artwork','/immersive?focus=silk','/immersive?focus=workbench'])
  expect(chapterLinks.map(link=>link.querySelector('img')?.getAttribute('src'))).toEqual(['/assets/suxiu-floral-huayun-card-20261104.webp','/assets/silk-pastel-tray-20261103.webp','/assets/suxiu-step-03-stitching.webp'])
  expect(chapterLinks.every(link=>link.querySelector('img')?.alt&&link.querySelector('h3')?.id===link.getAttribute('aria-labelledby'))).toBe(true)
  expect(within(intro).getByRole('link',{name:language==='zh'?'咨询婉娘':'Meet Wanniang'}).getAttribute('href')).toBe('/guide')
  expect(within(intro).getByRole('link',{name:language==='zh'?'开始探索':'Enter the embroidery atelier'}).getAttribute('href')).toBe('/immersive')
 })
 it('reveals chapter cards once and makes keyboard focus visible before the observer fires',()=>{
  let onIntersection:IntersectionObserverCallback=()=>{}
  const disconnect=vi.fn()
  vi.stubGlobal('IntersectionObserver',class{constructor(callback:IntersectionObserverCallback){onIntersection=callback}observe(){}disconnect(){disconnect()}})
  const view=show(PremiumHomePage),grid=view.container.querySelector<HTMLElement>('.home-journey-grid')!
  expect(grid.dataset.reveal).toBe('pending')
  fireEvent.focus(screen.getByRole('link',{name:'大堂 · 观绣'}))
  expect(grid.hasAttribute('data-reveal')).toBe(false)
  act(()=>onIntersection([{isIntersecting:true}] as IntersectionObserverEntry[],{} as IntersectionObserver))
  expect(grid.hasAttribute('data-reveal')).toBe(false)
  expect(disconnect).toHaveBeenCalled()
 })
 it('removes pending chapter motion immediately when reduced motion is enabled',()=>{
  let onIntersection:IntersectionObserverCallback=()=>{}
  const listeners=new Set<()=>void>()
  const motion={matches:false,addEventListener:(_type:string,fn:()=>void)=>listeners.add(fn),removeEventListener:(_type:string,fn:()=>void)=>listeners.delete(fn)}
  vi.stubGlobal('matchMedia',vi.fn((query:string)=>query.includes('reduced-motion')?motion:{matches:true,addEventListener:vi.fn(),removeEventListener:vi.fn()}))
  vi.stubGlobal('IntersectionObserver',class{constructor(callback:IntersectionObserverCallback){onIntersection=callback}observe(){}disconnect(){}})
  const view=show(PremiumHomePage),grid=view.container.querySelector<HTMLElement>('.home-journey-grid')!
  act(()=>onIntersection([{isIntersecting:true}] as IntersectionObserverEntry[],{} as IntersectionObserver))
  expect(grid.dataset.reveal).toBe('visible')
  act(()=>{motion.matches=true;listeners.forEach(fn=>fn())})
  expect(grid.hasAttribute('data-reveal')).toBe(false)
  expect(screen.getByRole('link',{name:'大堂 · 观绣'})).toBeTruthy()
  expect(view.container.querySelector('video')).toBeNull()
 })
 it.each([375,390,768,1366,1920])('uses the measured complete header height at %ipx and follows later header changes',width=>{
  let height=width<768?164:width<1216?176:124
  const callbacks=new Set<()=>void>();const disconnect=vi.fn()
  vi.stubGlobal('innerWidth',width)
  vi.stubGlobal('ResizeObserver',class{constructor(callback:()=>void){callbacks.add(callback)}observe(){}disconnect(){disconnect()}})
  vi.spyOn(HTMLElement.prototype,'getBoundingClientRect').mockImplementation(function(this:HTMLElement){return {height:this.tagName==='HEADER'?height:0,width} as DOMRect})
  const view=render(createElement(LanguageProvider,null,createElement(MemoryRouter,{initialEntries:['/']},createElement(Routes,null,createElement(Route,{element:createElement(Layout)},createElement(Route,{path:'/',element:createElement(PremiumHomePage)}))))))
  const shell=view.container.querySelector<HTMLElement>('.page-shell-home')!
  expect(shell.style.getPropertyValue('--home-header-height')).toBe(`${height}px`)
  expect(view.container.querySelector('.site-header-home-scrolled')).toBeNull()
  act(()=>{height+=24;callbacks.forEach(callback=>callback())})
  expect(shell.style.getPropertyValue('--home-header-height')).toBe(`${height}px`)
  view.unmount();expect(disconnect).toHaveBeenCalledOnce()
 })
})

describe('operations workspace tabs and content saves',()=>{
 it('supports keyboard navigation between tabs',()=>{
  const onChange=vi.fn()
  render(createElement(OpsTabs,{label:'Views',value:'requests',onChange,items:[{id:'requests',label:'Requests'},{id:'participants',label:'Participants'}],panelId:(id:string)=>`panel-${id}`}))
  const first=screen.getByRole('tab',{name:'Requests'})
  expect(first.getAttribute('aria-controls')).toBe('panel-requests')
  expect(first.getAttribute('tabindex')).toBe('0')
  expect(screen.getByRole('tab',{name:'Participants'}).getAttribute('tabindex')).toBe('-1')
  fireEvent.keyDown(first,{key:'ArrowRight'});expect(onChange).toHaveBeenCalledWith('participants')
  fireEvent.keyDown(first,{key:'End'});expect(onChange).toHaveBeenCalledWith('participants')
  fireEvent.keyDown(first,{key:'Home'});expect(onChange).toHaveBeenCalledWith('requests')
 })
 it('keeps a saved draft when the content library refresh fails',async()=>{
  useAppStore.setState({refreshContents:vi.fn(async()=>{throw new Error('REFRESH_FAILED')})})
  show(StudioPage)
  fireEvent.click(screen.getByRole('button',{name:'生成草稿'}))
  await screen.findByLabelText('正文')
  fireEvent.change(screen.getByLabelText('审核意见'),{target:{value:'Checked sources and duration'}})
  screen.getAllByRole('checkbox').forEach(box=>fireEvent.click(box))
  fireEvent.click(screen.getByRole('button',{name:'确认审核通过'}))
  fireEvent.click(screen.getByRole('button',{name:'保存到内容库'}))
  await screen.findByText(/内容已保存，但内容库刷新失败/)
  expect((screen.getByRole('button',{name:'保存到内容库'}) as HTMLButtonElement).disabled).toBe(true)
 })
})
