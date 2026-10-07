import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { BrowserTtsProvider } from '../src/lib/tts/browserTts'
import { AzureVisemeTtsProvider } from '../src/lib/tts/azureTts'
import { sanitizeSpeechText } from '../src/lib/tts/speechText'
import type { SpeechRequest } from '../src/lib/tts/types'

const sdk = vi.hoisted(() => ({ instances: [] as any[] }))
vi.mock('microsoft-cognitiveservices-speech-sdk', () => ({
  SpeechConfig: { fromAuthorizationToken: () => ({}) },
  SpeechSynthesisOutputFormat: { Riff24Khz16BitMonoPcm: 1 },
  ResultReason: { SynthesizingAudioCompleted: 1 },
  SpeechSynthesizer: class {
    close = vi.fn()
    success: any
    failure: any
    text = ''
    constructor() { sdk.instances.push(this) }
    speakTextAsync(text: string, success: any, failure: any) { Object.assign(this, { text, success, failure }) }
  },
}))
const request: SpeechRequest = { id: 'generated-id', text: '**体验**（演示价格，待确认）', language: 'zh', messageId: 'message-id' }
let spoken: any[], audios: any[]
let cancel: ReturnType<typeof vi.fn>, revoke: ReturnType<typeof vi.fn>, createUrl: ReturnType<typeof vi.fn>

beforeEach(() => {
  sdk.instances.length = 0
  spoken = []; audios = []; cancel = vi.fn(); revoke = vi.fn(); createUrl = vi.fn(() => 'blob:test-voice')
  vi.stubGlobal('window', {
    setTimeout, clearTimeout,
    speechSynthesis: { getVoices: () => [{ name: 'Test', lang: 'zh-CN' }], cancel, speak: (value: any) => spoken.push(value) },
  })
  vi.stubGlobal('SpeechSynthesisUtterance', class { constructor(public text: string) {} })
  vi.stubGlobal('Audio', class {
    onplaying: any; onended: any; onerror: any
    pause = vi.fn(); play = vi.fn(async () => { this.onplaying?.() })
    constructor() { audios.push(this) }
  })
  vi.spyOn(URL, 'createObjectURL').mockImplementation(createUrl)
  vi.spyOn(URL, 'revokeObjectURL').mockImplementation(revoke)
})
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals() })

describe('browser voice cancellation', () => {
  it('settles immediately on stop even when the browser emits no end event', async () => {
    const playback = await new BrowserTtsProvider().prepare(request, new AbortController().signal)
    const started = vi.fn()
    const playing = playback.play(started)
    const lateStart = spoken[0].onstart
    playback.stop()
    await playing
    lateStart()
    expect(started).not.toHaveBeenCalled()
    expect(cancel).toHaveBeenCalledTimes(1)
    expect(spoken[0].text).toBe(sanitizeSpeechText(request.text))
  })
  it('does not let cleanup from a finished run cancel a new utterance', async () => {
    const provider = new BrowserTtsProvider()
    const old = await provider.prepare(request, new AbortController().signal)
    const oldPlaying = old.play()
    spoken[0].onend(); await oldPlaying
    const current = await provider.prepare({ ...request, id: 'new' }, new AbortController().signal)
    const playing = current.play()
    old.stop()
    expect(cancel).not.toHaveBeenCalled()
    current.stop(); await playing
  })
  it('aborts a queued utterance without resuming it later', async () => {
    const controller = new AbortController()
    const playback = await new BrowserTtsProvider().prepare(request, controller.signal)
    const playing = playback.play()
    controller.abort(); await playing
    await playback.play()
    expect(spoken).toHaveLength(1)
  })
})

async function prepareAzure(controller = new AbortController()) {
  const pending = new AzureVisemeTtsProvider({ token: 'test-token', region: 'testregion' }).prepare(request, controller.signal)
  await vi.waitFor(() => expect(sdk.instances).toHaveLength(1))
  return { pending, synth: sdk.instances[0], controller }
}
describe('Azure voice lifecycle', () => {
  it('releases synthesis on abort even if the SDK never calls its callbacks', async () => {
    const { pending, synth, controller } = await prepareAzure()
    const rejected = expect(pending).rejects.toMatchObject({ name: 'AbortError' })
    controller.abort(); await rejected
    synth.success({ reason: 1, audioData: new ArrayBuffer(8) })
    expect(synth.close).toHaveBeenCalled()
    expect(audios).toHaveLength(0)
    expect(createUrl).not.toHaveBeenCalled()
  })
  it('uses the same sanitized text, and stop releases audio and the queue', async () => {
    const { pending, synth, controller } = await prepareAzure()
    synth.success({ reason: 1, audioData: new ArrayBuffer(8) })
    const playback = await pending
    const started = vi.fn(), playing = playback.play(started)
    await Promise.resolve()
    expect(started).toHaveBeenCalledTimes(1)
    controller.abort(); await playing
    playback.stop()
    expect(synth.text).toBe(sanitizeSpeechText(request.text))
    expect(audios[0].pause).toHaveBeenCalledTimes(1)
    expect(revoke).toHaveBeenCalledExactlyOnceWith('blob:test-voice')
  })
  it('settles and releases resources after playback is blocked', async () => {
    const { pending, synth } = await prepareAzure()
    synth.success({ reason: 1, audioData: new ArrayBuffer(8) })
    const playback = await pending
    audios[0].play.mockRejectedValue(new DOMException('Private reason', 'NotAllowedError'))
    await expect(playback.play()).rejects.toThrow('VOICE_PLAYBACK_ERROR')
    expect(audios[0].pause).toHaveBeenCalled()
    expect(revoke).toHaveBeenCalledTimes(1)
  })
  it('rejects failed synthesis without exposing upstream details', async () => {
    const { pending, synth } = await prepareAzure()
    const rejected = expect(pending).rejects.toThrow('VOICE_SYNTHESIS_FAILED')
    synth.success({ reason: 0, errorDetails: 'Private input and upstream error' })
    await rejected
    expect(synth.close).toHaveBeenCalled()
  })
})
