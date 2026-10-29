// @vitest-environment jsdom
import { act, cleanup, renderHook, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useSpeechQueue } from '../src/hooks/useSpeechQueue'
import type { SpeechPlayback, SpeechRequest, TtsProvider } from '../src/lib/tts/types'
import { saveVoiceSettings, VOICE_DEFAULTS } from '../src/lib/tts/voiceSettings'
vi.mock('../src/lib/tts/ttsFactory',()=>({detectTtsMode:vi.fn(async()=> 'browser'),getTtsProvider:vi.fn()}))
const request:SpeechRequest={id:'r',text:'你好',language:'zh',messageId:'m'}
beforeEach(()=>{localStorage.clear();saveVoiceSettings('zh',{...VOICE_DEFAULTS.zh});Object.defineProperty(window,'speechSynthesis',{configurable:true,value:{cancel:vi.fn()}});vi.spyOn(console,'info').mockImplementation(()=>{})})
afterEach(()=>{cleanup();vi.restoreAllMocks()})
function playback(){let started:(()=>void)|undefined,finish:(()=>void)|undefined;const item:SpeechPlayback={play:vi.fn(callback=>{started=callback;return new Promise<void>(resolve=>{finish=resolve})}),stop:vi.fn(()=>finish?.())};return {item,start:()=>started?.()}}
describe('speech starts, stopping and stable portrait motion',()=>{
 it('enters playing only at actual audio start, without scheduling portrait animation frames',async()=>{
  const sound=playback();const provider:TtsProvider={mode:'browser',prepare:vi.fn(async()=>sound.item)}
  const frames=vi.spyOn(window,'requestAnimationFrame')
  const hook=renderHook(()=>useSpeechQueue({language:'zh',provider}))
  act(()=>hook.result.current.enqueue(request));await waitFor(()=>expect(sound.item.play).toHaveBeenCalled())
  expect(hook.result.current.phase).toBe('synthesizing')
  act(()=>sound.start());expect(hook.result.current.phase).toBe('playing');expect(frames).not.toHaveBeenCalled()
  act(()=>hook.result.current.stop());await waitFor(()=>expect(hook.result.current.phase).toBe('idle'));expect(sound.item.stop).toHaveBeenCalled();expect(hook.result.current.mouthOpen).toBe(0)
 })
 it('does not resume a late preparation after a language switch',async()=>{
  const sound=playback();let resolve!:(value:SpeechPlayback)=>void
  const provider:TtsProvider={mode:'browser',prepare:vi.fn(()=>new Promise(done=>{resolve=done}))}
  const hook=renderHook(({language}:{language:'zh'|'en'})=>useSpeechQueue({language,provider}),{initialProps:{language:'zh'}})
  act(()=>hook.result.current.enqueue(request));await waitFor(()=>expect(provider.prepare).toHaveBeenCalled())
  hook.rerender({language:'en'});await act(async()=>resolve(sound.item))
  expect(sound.item.play).not.toHaveBeenCalled();expect(hook.result.current.phase).toBe('idle')
 })
 it('stops playback when preferences change and does not resume on a late start callback',async()=>{
  const sound=playback();const provider:TtsProvider={mode:'browser',prepare:vi.fn(async()=>sound.item)}
  const hook=renderHook(()=>useSpeechQueue({language:'zh',provider}))
  act(()=>hook.result.current.enqueue(request));await waitFor(()=>expect(sound.item.play).toHaveBeenCalled());act(()=>sound.start())
  act(()=>saveVoiceSettings('zh',{voiceURI:'new-voice',rate:1}));act(()=>sound.start())
  expect(hook.result.current.phase).toBe('idle')
 })
 it('reports missing language voices once and clears the unusable queue',async()=>{
  const provider:TtsProvider={mode:'browser',prepare:vi.fn(async()=>{throw new Error('VOICE_LANGUAGE_UNAVAILABLE')})}
  const hook=renderHook(()=>useSpeechQueue({language:'zh',provider}));act(()=>hook.result.current.enqueue([request,{...request,id:'second'}]))
  await waitFor(()=>expect(hook.result.current.error).toContain('普通话音色'))
  expect(provider.prepare).toHaveBeenCalledTimes(1);expect(hook.result.current.queueLength).toBe(0);expect(hook.result.current.phase).toBe('idle')
 })
})
