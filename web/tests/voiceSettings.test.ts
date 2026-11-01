// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createElement } from 'react'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { VoiceSettings } from '../src/components/VoiceSettings'
import { BrowserTtsProvider } from '../src/lib/tts/browserTts'
import { loadBrowserVoices, pickBestVoice } from '../src/lib/tts/browserVoices'
import { readVoiceSettings, saveVoiceSettings, VOICE_DEFAULTS, VOICE_SAMPLES, voiceMatchesLanguage } from '../src/lib/tts/voiceSettings'
import { speechMarkup } from '../src/lib/tts/speechMarkup'

const voice=(name:string,lang:string,uri=name)=>({name,lang,voiceURI:uri,default:false,localService:true} as SpeechSynthesisVoice)
let voices:SpeechSynthesisVoice[],spoken:SpeechSynthesisUtterance[]
let synth:EventTarget&{getVoices:()=>SpeechSynthesisVoice[];speak:(value:SpeechSynthesisUtterance)=>void;cancel:()=>void}
beforeEach(()=>{
 localStorage.clear();saveVoiceSettings('zh',{...VOICE_DEFAULTS.zh});saveVoiceSettings('en',{...VOICE_DEFAULTS.en})
 voices=[voice('Microsoft Xiaoxiao','zh-CN'),voice('Microsoft Jenny','en-US')];spoken=[]
 synth=Object.assign(new EventTarget(),{getVoices:()=>voices,speak:(value:SpeechSynthesisUtterance)=>spoken.push(value),cancel:vi.fn()})
 Object.defineProperty(window,'speechSynthesis',{configurable:true,value:synth})
 vi.stubGlobal('SpeechSynthesisUtterance',class{constructor(public text:string){}})
})
afterEach(()=>{cleanup();vi.restoreAllMocks();vi.unstubAllGlobals()})
describe('voice choice and stored preferences',()=>{
 it('never falls back to another language and prioritizes suitable known voices',()=>{
  expect(pickBestVoice([voice('French','fr-FR')],'zh')).toBeUndefined()
  expect(pickBestVoice([voice('Chinese','zh-CN')],'en')).toBeUndefined()
  expect(pickBestVoice([voice('Other','zh-CN'),...voices],'zh')?.name).toContain('Xiaoxiao')
  expect(voiceMatchesLanguage(voice('Cantonese','zh-HK'),'zh')).toBe(false)
  expect(voiceMatchesLanguage(voice('Mandarin','cmn-CN'),'zh')).toBe(true)
 })
 it('stores Chinese and English separately and uses neutral pitch',async()=>{
  saveVoiceSettings('zh',{voiceURI:'Microsoft Xiaoxiao',rate:1.02})
  expect(readVoiceSettings('en')).toEqual(VOICE_DEFAULTS.en)
  const provider=new BrowserTtsProvider();const playback=await provider.prepare({id:'1',text:'你好',language:'zh',messageId:'m'},new AbortController().signal)
  const playing=playback.play();expect(spoken[0].voice).toBe(voices[0]);expect(spoken[0].rate).toBe(1.02);expect(spoken[0].pitch).toBe(1);expect(spoken[0].lang).toBe('zh-CN')
  playback.stop();await playing
 })
 it('reports missing selected or language voices rather than silently switching',async()=>{
  const provider=new BrowserTtsProvider();saveVoiceSettings('zh',{voiceURI:'missing',rate:.94})
  await expect(provider.prepare({id:'1',text:'你好',language:'zh',messageId:'m'},new AbortController().signal)).rejects.toThrow('VOICE_SELECTION_UNAVAILABLE')
  saveVoiceSettings('zh',{...VOICE_DEFAULTS.zh});voices=[voice('English','en-US')]
  await expect(provider.prepare({id:'2',text:'你好',language:'zh',messageId:'m'},new AbortController().signal)).rejects.toThrow('VOICE_LANGUAGE_UNAVAILABLE')
 })
 it('refreshes the voice list when voices become available and honours cancellation',async()=>{
  voices=[];const controller=new AbortController();const pending=loadBrowserVoices(controller.signal)
  voices=[voice('Jenny','en-US')];synth.dispatchEvent(new Event('voiceschanged'));expect(await pending).toEqual(voices)
  voices=[];const next=new AbortController();const waiting=loadBrowserVoices(next.signal);next.abort();await expect(waiting).rejects.toMatchObject({name:'AbortError'})
 })
 it('escapes SSML and applies the same language-specific speaking rate online',()=>{
  const markup=speechMarkup('A & B <test>','en','Jenny"',.95)
  expect(markup).toContain('rate="-5%"');expect(markup).toContain('A &amp; B &lt;test&gt;');expect(markup).toContain('Jenny&quot;');expect(markup).not.toContain('pitch=')
 })
})
describe('voice settings interactions',()=>{
 it('opens a modal, traps keyboard focus, stops a preview on close and returns focus to its trigger',async()=>{
  const props={language:'zh' as const,phase:'idle' as 'idle'|'playing',previewing:false,mode:'browser' as const,onPreview:vi.fn(),onStop:vi.fn(),onPreferenceChange:vi.fn()}
  const view=render(createElement(VoiceSettings,props)),trigger=screen.getByRole('button',{name:/声音与试听/})
  trigger.focus();fireEvent.click(trigger)
  const dialog=await screen.findByRole('dialog',{name:'声音与试听'})
  expect(dialog.getAttribute('aria-modal')).toBe('true');expect(document.body.style.overflow).toBe('hidden')
  expect(document.activeElement).toBe(screen.getByLabelText('当前语言的音色'))
  const first=screen.getByRole('button',{name:'关闭声音设置'}),last=screen.getByRole('button',{name:'恢复推荐设置'})
  first.focus();fireEvent.keyDown(first,{key:'Tab',shiftKey:true});expect(document.activeElement).toBe(last)
  fireEvent.keyDown(last,{key:'Tab'});expect(document.activeElement).toBe(first)
  view.rerender(createElement(VoiceSettings,{...props,phase:'playing',previewing:true}))
  fireEvent.keyDown(dialog,{key:'Escape'})
  expect(screen.queryByRole('dialog')).toBeNull();expect(document.activeElement).toBe(trigger)
  expect(document.body.style.overflow).toBe('');expect(props.onStop).toHaveBeenCalledOnce()
 })
 it('can cancel a sample before the provider reports preparing and displays errors inside the modal',async()=>{
  const props={language:'zh' as const,phase:'idle' as const,previewing:false,mode:'browser' as const,onPreview:vi.fn(),onStop:vi.fn(),onPreferenceChange:vi.fn()}
  const view=render(createElement(VoiceSettings,props));fireEvent.click(screen.getByRole('button',{name:/声音与试听/}))
  fireEvent.click(screen.getByRole('button',{name:'试听当前声音'}));expect(screen.getByRole('button',{name:'取消准备'})).toBeTruthy()
  fireEvent.keyDown(screen.getByRole('dialog'),{key:'Escape'});expect(props.onStop).toHaveBeenCalledOnce()
  fireEvent.click(screen.getByRole('button',{name:/声音与试听/}));view.rerender(createElement(VoiceSettings,{...props,error:'此设备暂无中文音色。'}))
  expect(screen.getByRole('alert').textContent).toBe('此设备暂无中文音色。')
 })
 it('previews the active language and restores saved preferences on a later visit',async()=>{
  const props={language:'zh' as const,phase:'idle' as const,previewing:false,mode:'browser' as const,onPreview:vi.fn(),onStop:vi.fn(),onPreferenceChange:vi.fn()}
  const view=render(createElement(VoiceSettings,props));fireEvent.click(screen.getByText('声音与试听'))
  await screen.findByRole('option',{name:'Microsoft Xiaoxiao · zh-CN'})
  fireEvent.change(screen.getByLabelText('当前语言的音色'),{target:{value:'Microsoft Xiaoxiao'}})
  fireEvent.change(screen.getByLabelText('讲解语速'),{target:{value:'1.01'}})
  fireEvent.click(screen.getByRole('button',{name:'试听当前声音'}));expect(props.onPreview).toHaveBeenCalledWith(VOICE_SAMPLES.zh)
  view.unmount();render(createElement(VoiceSettings,{...props,language:'en'}));fireEvent.click(screen.getByText('Voice & sample'))
  await screen.findByRole('option',{name:'Microsoft Jenny · en-US'})
  expect((screen.getByLabelText('Voice for this language') as HTMLSelectElement).value).toBe('')
  fireEvent.click(screen.getByRole('button',{name:'Try this voice'}));expect(props.onPreview).toHaveBeenLastCalledWith(VOICE_SAMPLES.en)
  cleanup();render(createElement(VoiceSettings,props));fireEvent.click(screen.getByText('声音与试听'))
  await waitFor(()=>expect((screen.getByLabelText('讲解语速') as HTMLInputElement).value).toBe('1.01'))
  expect((screen.getByLabelText('当前语言的音色') as HTMLSelectElement).value).toBe('Microsoft Xiaoxiao')
 })
 it('keeps settings working if browser storage fails',async()=>{
  const setter=vi.spyOn(Storage.prototype,'setItem').mockImplementation(()=>{throw new Error('quota')})
  const props={language:'zh' as const,phase:'idle' as const,previewing:false,mode:'browser' as const,onPreview:vi.fn(),onStop:vi.fn(),onPreferenceChange:vi.fn()}
  render(createElement(VoiceSettings,props));fireEvent.click(screen.getByText('声音与试听'));await screen.findByRole('option',{name:'Microsoft Xiaoxiao · zh-CN'})
  fireEvent.change(screen.getByLabelText('讲解语速'),{target:{value:'1.03'}})
  expect(readVoiceSettings('zh').rate).toBe(1.03);expect(screen.getByText(/浏览器未能保存/)).toBeTruthy();setter.mockRestore()
 })
})
