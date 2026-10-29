// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getTtsProvider, detectTtsMode } from '../src/lib/tts/ttsFactory'
import { saveVoiceSettings, VOICE_DEFAULTS } from '../src/lib/tts/voiceSettings'
const {apiFetch}=vi.hoisted(()=>({apiFetch:vi.fn()}))
vi.mock('../src/lib/cloud',()=>({apiFetch}))
beforeEach(()=>{localStorage.clear();saveVoiceSettings('zh',{...VOICE_DEFAULTS.zh});saveVoiceSettings('en',{...VOICE_DEFAULTS.en});Object.defineProperty(window,'speechSynthesis',{configurable:true,value:{getVoices:()=>[]}});apiFetch.mockResolvedValue(Response.json({mode:'viseme',token:'fake-token',region:'fake-region'}))})
describe('selected device voices are honoured even when an online provider is cached',()=>{
 it('switches the selected language to device playback and restores automatic service selection',async()=>{
  const online=await getTtsProvider('zh');expect(online.mode).toBe('viseme')
  saveVoiceSettings('zh',{voiceURI:'chosen-device-voice',rate:.94})
  expect((await getTtsProvider('zh')).mode).toBe('browser');expect(await detectTtsMode('zh')).toBe('browser')
  expect(await getTtsProvider('en')).toBe(online)
  saveVoiceSettings('zh',{...VOICE_DEFAULTS.zh});expect(await getTtsProvider('zh')).toBe(online)
 })
})
