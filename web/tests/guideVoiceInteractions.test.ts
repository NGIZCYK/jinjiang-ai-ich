// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createElement } from 'react'
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { LanguageProvider, useLanguage } from '../src/lib/i18n'
import { GuidePage } from '../src/pages/GuidePage'
import { useAppStore } from '../src/lib/store'
import { useJourneyStore } from '../src/lib/journeyStore'
import { CATALOG } from '../src/lib/journey'
import { WANNIANG_PORTRAIT } from '../src/components/avatar/avatarPortrait'
import { VOICE_DEFAULTS, saveVoiceSettings } from '../src/lib/tts/voiceSettings'
vi.mock('../src/lib/cloud',()=>({cloud:null,apiFetch:vi.fn(async()=>new Response('{}',{status:503})),rpc:vi.fn(),requireCloud:vi.fn()}))
vi.mock('../src/lib/tts/ttsFactory',async()=>{const {BrowserTtsProvider}=await import('../src/lib/tts/browserTts');return{detectTtsMode:vi.fn(async()=> 'browser'),getTtsProvider:vi.fn(async()=>new BrowserTtsProvider())}})
vi.mock('../src/lib/llm',async importOriginal=>{const original=await importOriginal<typeof import('../src/lib/llm')>();const {FALLBACK_CAPABILITIES}=await import('../src/lib/guideCapabilities');return{...original,getGuideCapabilities:vi.fn(async()=>FALLBACK_CAPABILITIES)}})
let spoken:any[]
const voices=[{voiceURI:'zh-voice',name:'Xiaoxiao',lang:'zh-CN'},{voiceURI:'en-voice',name:'Jenny',lang:'en-US'}] as SpeechSynthesisVoice[]
beforeEach(()=>{
 localStorage.clear();sessionStorage.clear();spoken=[];saveVoiceSettings('zh',{...VOICE_DEFAULTS.zh});saveVoiceSettings('en',{...VOICE_DEFAULTS.en})
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
  await screen.findByText('Voice & sample');expect(screen.getByRole('img')).toBe(portrait)
  expect(view.container.querySelector('.digital-human-stage.is-speaking')).toBeNull()
  fireEvent.click(screen.getByRole('button',{name:'Try this voice'}));await waitFor(()=>expect(spoken).toHaveLength(2))
  expect(spoken[1].voice.voiceURI).toBe('en-voice');expect(spoken[1].rate).toBe(.95);expect(spoken[1].text).toContain("I'm Wanniang")
 })
})
