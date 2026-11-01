// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createElement } from 'react'
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { LanguageProvider, useLanguage } from '../src/lib/i18n'
import { GuidePage } from '../src/pages/GuidePage'
import { useAppStore } from '../src/lib/store'
import { useJourneyStore } from '../src/lib/journeyStore'
import { CATALOG } from '../src/lib/journey'
import { WANNIANG_PORTRAIT } from '../src/components/avatar/avatarPortrait'
import { VOICE_DEFAULTS, saveVoiceSettings } from '../src/lib/tts/voiceSettings'
import { askWanNiangStream } from '../src/lib/llm'
vi.mock('../src/lib/cloud',()=>({cloud:null,apiFetch:vi.fn(async()=>new Response('{}',{status:503})),rpc:vi.fn(),requireCloud:vi.fn()}))
vi.mock('../src/lib/tts/ttsFactory',async()=>{const {BrowserTtsProvider}=await import('../src/lib/tts/browserTts');return{detectTtsMode:vi.fn(async()=> 'browser'),getTtsProvider:vi.fn(async()=>new BrowserTtsProvider())}})
vi.mock('../src/lib/llm',async importOriginal=>{const original=await importOriginal<typeof import('../src/lib/llm')>();const {FALLBACK_CAPABILITIES}=await import('../src/lib/guideCapabilities');return{...original,askWanNiangStream:vi.fn(original.askWanNiangStream),getGuideCapabilities:vi.fn(async()=>FALLBACK_CAPABILITIES)}})
let spoken:any[]
const voices=[{voiceURI:'zh-voice',name:'Xiaoxiao',lang:'zh-CN'},{voiceURI:'en-voice',name:'Jenny',lang:'en-US'}] as SpeechSynthesisVoice[]
beforeEach(()=>{
 localStorage.clear();sessionStorage.clear();spoken=[];saveVoiceSettings('zh',{...VOICE_DEFAULTS.zh});saveVoiceSettings('en',{...VOICE_DEFAULTS.en})
 vi.mocked(askWanNiangStream).mockReset()
 const synth=Object.assign(new EventTarget(),{getVoices:()=>voices,speak:(utterance:unknown)=>spoken.push(utterance),cancel:vi.fn()});Object.defineProperty(window,'speechSynthesis',{configurable:true,value:synth})
 vi.stubGlobal('SpeechSynthesisUtterance',class{constructor(public text:string){}})
 vi.stubGlobal('matchMedia',()=>({matches:false,addEventListener:vi.fn(),removeEventListener:vi.fn()}))
 HTMLElement.prototype.scrollTo=vi.fn();vi.spyOn(console,'info').mockImplementation(()=>{})
 useAppStore.setState({user:null,messages:[],guideSignals:[],ready:true})
 useJourneyStore.setState({catalog:CATALOG,exploration:null,needs:null,recommendations:[],bookings:[],sessions:[]})
})
afterEach(()=>{cleanup();vi.restoreAllMocks();vi.unstubAllGlobals()})
function Switch(){const {language,setLanguage}=useLanguage();return createElement('button',{onClick:()=>setLanguage(language==='zh'?'en':'zh')},'Switch test language')}
function show(){return render(createElement(LanguageProvider,null,createElement(MemoryRouter,null,createElement(Switch),createElement(GuidePage))))}
describe('guide preview is wired to real speech queue and portrait state',()=>{
 it('explains that guest replies are local and links to sign-in instead of claiming an outage',async()=>{
  vi.mocked(askWanNiangStream).mockResolvedValue({content:'Local guide reply for this test',mode:'fallback',sentiment:'neutral',sources:[],answerSource:'local'})
  show()
  expect(screen.getByText('登录账户后可使用在线问答。当前为游客模式，回答来自本地导览。')).toBeTruthy()
  expect(screen.getByRole('link',{name:'登录后在线问答'}).getAttribute('href')).toBe('/auth?next=%2Fguide')
  const input=screen.getByRole('textbox');fireEvent.change(input,{target:{value:'苏绣是什么'}});fireEvent.submit(input.closest('form')!)
  await screen.findByText('Local guide reply for this test')
  expect(screen.queryByText('在线回答暂时不可用，正在使用本地精选内容。')).toBeNull()
 })
 it('starts a sample, retains the portrait, stops playback and prevents a late restart',async()=>{
  const view=show(),portrait=screen.getByRole('img');fireEvent.click(screen.getByText('声音与试听'))
  await waitFor(()=>expect(view.container.querySelector('.voice-settings-open')).not.toBeNull())
  fireEvent.click(screen.getByRole('button',{name:'试听当前声音'}));await waitFor(()=>expect(spoken).toHaveLength(1))
  expect(spoken[0].voice.voiceURI).toBe('zh-voice');expect(spoken[0].rate).toBe(.94)
  const start=spoken[0].onstart;act(()=>start())
  await waitFor(()=>expect(view.container.querySelector('.digital-human-stage.is-speaking')).not.toBeNull())
  expect(screen.getByRole('img')).toBe(portrait);expect(portrait.getAttribute('src')).toBe(WANNIANG_PORTRAIT)
  fireEvent.click(screen.getByRole('button',{name:'停止试听'}));act(()=>start())
  await waitFor(()=>expect(view.container.querySelector('.digital-human-stage.is-speaking')).toBeNull())
 })
 it('stops the old language and previews English with the same portrait',async()=>{
  const view=show(),portrait=screen.getByRole('img');fireEvent.click(screen.getByText('声音与试听'))
  fireEvent.click(screen.getByRole('button',{name:'试听当前声音'}));await waitFor(()=>expect(spoken).toHaveLength(1));act(()=>spoken[0].onstart())
  fireEvent.click(screen.getByRole('button',{name:'Switch test language'}))
  await screen.findByRole('dialog',{name:'Voice & sample'});expect(screen.getByRole('img')).toBe(portrait)
  expect(view.container.querySelector('.digital-human-stage.is-speaking')).toBeNull()
  fireEvent.click(screen.getByRole('button',{name:'Try this voice'}));await waitFor(()=>expect(spoken).toHaveLength(2))
  expect(spoken[1].voice.voiceURI).toBe('en-voice');expect(spoken[1].rate).toBe(.95);expect(spoken[1].text).toContain("I'm Wanniang")
 })
})

describe('guide generation lifecycle and accessible feedback',()=>{
 function submit(text:string){const input=screen.getByRole('textbox');fireEvent.change(input,{target:{value:text}});fireEvent.submit(input.closest('form')!)}
 const answer=(content:string)=>({content,mode:'deepseek' as const,sentiment:'neutral' as const,sources:[],answerSource:'deepseek' as const})
 it('preserves an unsent question when switching interface language without starting a request',()=>{
  show()
  fireEvent.change(screen.getByRole('textbox'),{target:{value:'我想了解苏绣工坊，同行有两位朋友'}})
  fireEvent.click(screen.getByRole('button',{name:'Switch test language'}))
  expect((screen.getByRole('textbox',{name:'Ask Wanniang'}) as HTMLTextAreaElement).value).toBe('我想了解苏绣工坊，同行有两位朋友')
  expect(askWanNiangStream).not.toHaveBeenCalled()
  fireEvent.click(screen.getByRole('button',{name:'Switch test language'}))
  expect((screen.getByRole('textbox',{name:'向婉娘提问'}) as HTMLTextAreaElement).value).toBe('我想了解苏绣工坊，同行有两位朋友')
 })
 it('cancels the previous language and ignores its late callbacks and final result during a new request',async()=>{
  const requests:{callbacks:any;signal:AbortSignal;resolve:(value:any)=>void}[]=[]
  vi.mocked(askWanNiangStream).mockImplementation((_q,_history,_language,callbacks,signal)=>new Promise(resolve=>requests.push({callbacks,signal:signal!,resolve})))
  useAppStore.getState().addMessage({role:'user',content:'之前的问题',language:'zh'})
  useAppStore.getState().addMessage({role:'assistant',content:'之前已完成的中文回答',language:'zh'})
  const view=show();submit('中文新问题');expect(requests).toHaveLength(1)
  act(()=>requests[0].callbacks.onDelta('中文片段','中文片段'));expect(screen.getByText('中文片段')).toBeTruthy()
  fireEvent.click(screen.getByRole('button',{name:'Switch test language'}))
  expect(requests[0].signal.aborted).toBe(true);expect(screen.queryByText('中文片段')).toBeNull()
  expect((screen.getByRole('textbox') as HTMLTextAreaElement).disabled).toBe(false)
  submit('English question');act(()=>requests[1].callbacks.onDelta('English partial','English partial'))
  await act(async()=>{requests[0].callbacks.onDelta('迟到内容','迟到内容');requests[0].resolve(answer('迟到完整回答'))})
  expect(screen.getByText('English partial')).toBeTruthy();expect((screen.getByRole('textbox') as HTMLTextAreaElement).disabled).toBe(true)
  expect(useAppStore.getState().messages.some(message=>message.content==='迟到完整回答')).toBe(false)
  await act(async()=>requests[1].resolve(answer('English complete')))
  expect(view.container.querySelector('.sr-only[role="status"]')?.textContent).toContain('English complete')
  expect((screen.getByRole('textbox') as HTMLTextAreaElement).disabled).toBe(false)
  fireEvent.click(screen.getByRole('button',{name:'Switch test language'}));expect(screen.getByText('之前已完成的中文回答')).toBeTruthy()
 })
 it('stops an uncooperative stream immediately, preserves its partial once, and protects the next request',async()=>{
  const requests:{callbacks:any;signal:AbortSignal;resolve:(value:any)=>void}[]=[]
  vi.mocked(askWanNiangStream).mockImplementation((_q,_history,_language,callbacks,signal)=>new Promise(resolve=>requests.push({callbacks,signal:signal!,resolve})))
  show();submit('问题一');act(()=>{requests[0].callbacks.onMeta();requests[0].callbacks.onDelta('部分回答','部分回答')})
  fireEvent.click(screen.getByRole('button',{name:'停止'}));expect(requests[0].signal.aborted).toBe(true)
  expect((screen.getByRole('textbox') as HTMLTextAreaElement).disabled).toBe(false)
  expect(useAppStore.getState().messages.filter(message=>message.content==='部分回答')).toHaveLength(1)
  submit('问题二');act(()=>requests[1].callbacks.onDelta('新的片段','新的片段'))
  await act(async()=>requests[0].resolve(answer('不应保存')))
  expect(screen.getByText('新的片段')).toBeTruthy();expect((screen.getByRole('textbox') as HTMLTextAreaElement).disabled).toBe(true)
  await act(async()=>requests[1].resolve(answer('第二个完整回答')))
  expect(useAppStore.getState().messages.some(message=>message.content==='不应保存')).toBe(false)
 })
 it('reports stopping completed-answer audio as voice playback, without a generation-stopped warning',async()=>{
  useAppStore.getState().addMessage({role:'user',content:'已完成的问题',language:'zh'})
  useAppStore.getState().addMessage({role:'assistant',content:'一段已经完成的回答。',language:'zh'})
  show();fireEvent.click(screen.getByRole('button',{name:'听婉娘讲解'}));await waitFor(()=>expect(spoken).toHaveLength(1));act(()=>spoken[0].onstart())
  fireEvent.click(screen.getAllByRole('button',{name:'停止朗读'})[0])
  expect(screen.getByText('朗读已停止。')).toBeTruthy();expect(screen.queryByText(/已停止生成，你可以/)).toBeNull()
 })
 it('keeps one portrait and no duplicate page-level host chrome',()=>{
  const view=show()
  expect(screen.getAllByRole('heading',{level:1})).toHaveLength(1)
  expect(view.container.querySelectorAll('img')).toHaveLength(1)
  expect(screen.queryByText('私人会话')).toBeNull()
 })
 it('marks the portrait frame with the current state for the ambient background',()=>{
  const view=show(),frame=view.container.querySelector('.guide-portrait-frame')!,dot=view.container.querySelector('.guide-avatar-dot')!
  expect(frame.className).toContain('is-idle')
  expect(dot.className).toContain('is-idle')
  fireEvent.focus(screen.getByRole('textbox'))
  expect(frame.className).toContain('is-listening')
  expect(dot.className).toContain('is-listening')
  fireEvent.blur(screen.getByRole('textbox'))
  expect(frame.className).toContain('is-idle')
  expect(dot.className).toContain('is-idle')
 })
 it('opens guide settings from the portrait controls',()=>{
  show()
  fireEvent.click(screen.getByRole('button',{name:'导览设置'}))
  const dialog=screen.getByRole('dialog',{name:'导览设置'})
  expect(within(dialog).getByText('回答来源')).toBeTruthy()
  expect(within(dialog).getByLabelText('自动朗读新回复')).toBeTruthy()
  fireEvent.keyDown(dialog,{key:'Escape'})
  expect(dialog.hasAttribute('open')).toBe(false)
 })
})
