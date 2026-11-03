// @vitest-environment jsdom
import { afterEach,beforeEach,describe,it,expect,vi } from 'vitest'
import { createElement as h } from 'react'
import { act,cleanup,fireEvent,render,screen,waitFor,within } from '@testing-library/react'
import { MemoryRouter,Route,Routes,useLocation } from 'react-router-dom'
import { LanguageProvider } from '../src/lib/i18n'
import { StaysPage } from '../src/pages/StaysPage'
import { RoomDetailPage } from '../src/pages/RoomDetailPage'
import { RoomPhoto } from '../src/components/RoomPhoto'
import { ROOMS } from '../src/data/roomPresentation'
import { addDays,shanghaiDate } from '../src/lib/stays'
const api=vi.hoisted(()=>({rpc:vi.fn()}))
vi.mock('../src/lib/cloud',()=>({cloud:{},rpc:api.rpc,requireCloud:vi.fn()}))
const arrival=()=>addDays(shanghaiDate(),3)
function quote(room='classic',plan='room_only'){const r=ROOMS.find(r=>r.id===room)!;return {room_id:room,plan_id:plan,check_in:arrival(),check_out:addDays(arrival(),2),guests:2,room_title_zh:r.title.zh,room_title_en:r.title.en,plan_title_zh:plan==='heritage'?'苏绣体验套餐':'纯住宿',plan_title_en:plan==='heritage'?'Embroidery stay':'Room only',nights:[{night:arrival(),price:68000},{night:addDays(arrival(),1),price:68000}],room_total:136000,surcharge:plan==='heritage'?18000:0,total:plan==='heritage'?154000:136000,available:1,experience_id:plan==='heritage'?'workshop':null,token:'quote-'+room}}
function Location(){const location=useLocation();return h('output',{'aria-label':'Current route'},location.pathname+location.search)}
function show(path='/stays'){return render(h(LanguageProvider,null,h(MemoryRouter,{initialEntries:[path]},h(Location),h(Routes,null,h(Route,{path:'/stays',element:h(StaysPage)}),h(Route,{path:'/stays/:roomId',element:h(RoomDetailPage)}))))) }
const calendar=()=>Array.from({length:91},(_,index)=>({night:addDays(shanghaiDate(),index+1),price:68000,available:5}))
const sessions=()=>[{id:'slot-1',starts_at:`${arrival()}T16:00:00+08:00`,available:8}]
beforeEach(()=>{sessionStorage.clear();localStorage.clear();vi.clearAllMocks();api.rpc.mockImplementation(async(name:string)=>name==='stay_rate_calendar'?calendar():name==='stay_session_preview'?sessions():ROOMS.flatMap(r=>[quote(r.id),quote(r.id,'heritage')]))})
afterEach(()=>{cleanup();vi.restoreAllMocks()})
describe('Room discovery and booking continuity',()=>{
 it('keeps all room imagery and differentiating features available when rates fail',async()=>{
  api.rpc.mockRejectedValue(new Error('NETWORK_ERROR'));show();await screen.findByRole('alert')
  for(const room of ROOMS){const card=screen.getByRole('article',{name:room.title.zh});expect(within(card).getByRole('img').getAttribute('src')).toContain(room.id+'-main');expect(within(card).getByRole('img').getAttribute('src')).toContain(room.id==='suite'?'/20261102/':'/20261102-v2/');expect(within(card).getByText(room.features[0].title.zh)).toBeTruthy();expect(within(card).getByRole('link',{name:/了解这间客房/})).toBeTruthy()}
  expect(screen.queryByRole('link',{name:/查看明细并预订/})).toBeNull()
 })
 it('filters static room descriptions even while the price service is unavailable',async()=>{
  api.rpc.mockRejectedValue(new Error('OFFLINE'));show();await screen.findByRole('alert');fireEvent.click(screen.getByRole('button',{name:'苏绣主题'}))
  expect(screen.queryByRole('article',{name:'江南雅居大床房'})).toBeNull();expect(screen.getByRole('article',{name:'苏绣主题大床房'})).toBeTruthy();expect(screen.getByRole('article',{name:'苏绣主题套房'})).toBeTruthy()
 })
 it('preserves dates, occupancy, category and selected package through detail and back',async()=>{
  const query=`in=${arrival()}&out=${addDays(arrival(),2)}&guests=2&category=theme`
  show('/stays?'+query);const suite=screen.getByRole('article',{name:'苏绣主题套房'});await within(suite).findByRole('link',{name:/查看明细并预订/});fireEvent.click(screen.getByRole('button',{name:'入住与离店日期'}));fireEvent.click(screen.getByRole('button',{name:/苏绣体验套餐/}));fireEvent.click(within(suite).getByRole('link',{name:/了解这间客房/}))
  await screen.findByRole('heading',{level:1,name:'苏绣主题套房'});expect(screen.getByRole('button',{name:'入住与离店日期'}).textContent).toContain(arrival().replace(/-/g,'/'))
  fireEvent.click(screen.getByRole('button',{name:'入住与离店日期'}));expect(document.querySelector('.date-day-price')?.textContent).toContain('¥');expect(screen.getByRole('button',{name:'入住与离店日期'}).textContent).toContain('苏绣体验')
  const booking=await screen.findByRole('link',{name:/查看明细并预订/});expect(booking.getAttribute('href')).toContain('plan=heritage');expect(booking.getAttribute('href')).toContain('category=theme')
  fireEvent.click(screen.getByRole('link',{name:/返回客房总览/}));await screen.findByRole('heading',{level:1,name:'在苏州，留一晚给手艺。'});expect(screen.queryByRole('article',{name:'江南雅居大床房'})).toBeNull();fireEvent.click(screen.getByRole('button',{name:'入住与离店日期'}));expect(screen.getByRole('button',{name:/苏绣体验套餐/}).getAttribute('aria-pressed')).toBe('true')
 })
 it('shows a useful missing-room page instead of an unrelated homepage',()=>{
  show('/stays/not-a-room');expect(screen.getByRole('heading',{name:'未找到这间客房'})).toBeTruthy();expect(screen.getByRole('link',{name:'返回客房总览'}).getAttribute('href')).toBe('/stays');expect(api.rpc).not.toHaveBeenCalled()
 })
 it('does not silently replace invalid incoming dates with a different quoted stay',async()=>{
  show('/stays/suite?in=not-a-date&out=2020-01-01&guests=2');await screen.findByRole('alert');expect(screen.getByRole('heading',{level:1,name:'苏绣主题套房'})).toBeTruthy();expect(api.rpc.mock.calls.filter(c=>c[0]==='search_stays')).toHaveLength(0);expect(screen.queryByRole('link',{name:/查看明细并预订/})).toBeNull()
 })
 it('discards an old quote that arrives after the user changes the dates',async()=>{
  let finish:(rows:unknown[])=>void=()=>{};api.rpc.mockImplementation(()=>new Promise(resolve=>{finish=resolve}));show();fireEvent.click(screen.getByRole('button',{name:'入住与离店日期'}));fireEvent.click(document.querySelector(`[data-date="${addDays(shanghaiDate(),5)}"]`) as HTMLButtonElement)
  await act(async()=>{finish([quote()])});expect(screen.queryByRole('link',{name:/查看明细并预订/})).toBeNull();expect(screen.getByRole('article',{name:'江南雅居大床房'})).toBeTruthy()
 })
 it('presents English room stories, design qualifiers and non-exclusive digital guidance',async()=>{
  localStorage.setItem('jj_language','en');show('/stays/embroidery');await screen.findByRole('heading',{name:'Embroidery King',level:1});expect(screen.getByText('Discover silk in the details.')).toBeTruthy();expect(screen.getByText(/not confirmed facilities/)).toBeTruthy();expect(screen.getByText(/not an exclusive package benefit/)).toBeTruthy()
 })
})
describe('Room photo gallery accessibility',()=>{
 it('supports keyboard image changes, focus containment and restoring the trigger on close',async()=>{
  show('/stays/suite');const trigger=screen.getByRole('button',{name:'查看客房图集，共2张'});trigger.focus();fireEvent.click(trigger);const dialog=screen.getByRole('dialog',{name:'苏绣主题套房'});expect(document.body.style.overflow).toBe('hidden')
  expect(within(dialog).getByRole('img').getAttribute('src')).toContain('suite-main');fireEvent.keyDown(dialog,{key:'ArrowRight'});expect(within(dialog).getByRole('img').getAttribute('src')).toContain('suite-detail')
  const last=within(dialog).getByRole('button',{name:'下一张客房图片'});last.focus();fireEvent.keyDown(dialog,{key:'Tab'});expect(document.activeElement).toBe(within(dialog).getByRole('button',{name:'关闭客房图集'}))
  fireEvent.keyDown(dialog,{key:'Escape'});expect(screen.queryByRole('dialog')).toBeNull();expect(document.activeElement).toBe(trigger);expect(document.body.style.overflow).toBe('')
 })
 it('opens the detail photo directly and offers visible image controls',()=>{
  show('/stays/classic');fireEvent.click(screen.getByRole('button',{name:'放大查看客房细节'}));const dialog=screen.getByRole('dialog');expect(within(dialog).getByRole('img').getAttribute('src')).toContain('classic-detail');fireEvent.click(within(dialog).getByRole('button',{name:'上一张客房图片'}));expect(within(dialog).getByRole('img').getAttribute('src')).toContain('classic-main');fireEvent.click(within(dialog).getByRole('button',{name:'关闭客房图集'}));expect(screen.queryByRole('dialog')).toBeNull()
 })
 it('retains an accessible concept description when an image fails',()=>{
  render(h(LanguageProvider,null,h(RoomPhoto,{image:ROOMS[1].images[0],priority:true})));const img=screen.getByRole('img');expect(img.getAttribute('width')).toBe('1440');expect(img.getAttribute('fetchpriority')).toBe('high');expect(img.getAttribute('srcset')).toContain('960w');fireEvent.error(img);expect(screen.getByRole('img').getAttribute('aria-label')).toContain('苏绣主题大床房');expect(screen.getByText('空间概念图暂不可用')).toBeTruthy()
 })
})
