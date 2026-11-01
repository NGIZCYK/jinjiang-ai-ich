// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { saveVoiceSettings, VOICE_DEFAULTS } from '../src/lib/tts/voiceSettings'

const { apiFetch } = vi.hoisted(() => ({ apiFetch: vi.fn() }))
vi.mock('../src/lib/cloud', () => ({ apiFetch }))
vi.mock('../src/lib/tts/azureTts', () => ({ AzureVisemeTtsProvider: class { readonly mode = 'viseme'; constructor(readonly options: unknown) {} } }))

beforeEach(() => {
  vi.resetModules()
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date('2026-10-29T00:00:00Z'))
  localStorage.clear()
  saveVoiceSettings('zh', { ...VOICE_DEFAULTS.zh })
  saveVoiceSettings('en', { ...VOICE_DEFAULTS.en })
  Object.defineProperty(window, 'speechSynthesis', { configurable: true, value: { getVoices: () => [] } })
  apiFetch.mockReset()
  apiFetch.mockImplementation(async (path: string) => Response.json(path.endsWith('/status') ? { provider: 'azure' } : { mode: 'viseme', token: 'fake-token', region: 'fake-region' }))
})
afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks() })

function deferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>(done => { resolve = done })
  return { promise, resolve }
}

describe('automatic voice service recovery and explicit device choices', () => {
  it('honours the selected language and restores a cached online provider', async () => {
    const { getTtsProvider, detectTtsMode } = await import('../src/lib/tts/ttsFactory')
    const online = await getTtsProvider('zh')
    expect(online.mode).toBe('viseme')
    saveVoiceSettings('zh', { voiceURI: 'chosen-device-voice', rate: .94 })
    expect((await getTtsProvider('zh')).mode).toBe('browser')
    expect(await detectTtsMode('zh')).toBe('browser')
    expect(await getTtsProvider('en')).toBe(online)
    saveVoiceSettings('zh', { ...VOICE_DEFAULTS.zh })
    expect(await getTtsProvider('zh')).toBe(online)
  })

  it('retries the online provider after a bounded fallback interval', async () => {
    const { getTtsProvider } = await import('../src/lib/tts/ttsFactory')
    apiFetch.mockResolvedValueOnce(new Response('', { status: 503 }))
    expect((await getTtsProvider('zh')).mode).toBe('browser')
    expect((await getTtsProvider('en')).mode).toBe('browser')
    expect(apiFetch).toHaveBeenCalledTimes(1)
    vi.setSystemTime(Date.now() + 30_001)
    expect((await getTtsProvider('zh')).mode).toBe('viseme')
    expect(apiFetch).toHaveBeenCalledTimes(2)
  })

  it('retries an unavailable device fallback when the online service returns', async () => {
    Reflect.deleteProperty(window, 'speechSynthesis')
    const { getTtsProvider } = await import('../src/lib/tts/ttsFactory')
    apiFetch.mockRejectedValueOnce(new Error('Failed to fetch'))
    expect((await getTtsProvider('en')).mode).toBe('unavailable')
    vi.setSystemTime(Date.now() + 30_001)
    expect((await getTtsProvider('en')).mode).toBe('viseme')
  })

  it('deduplicates status requests and recovers from an initial network error', async () => {
    const { detectTtsMode } = await import('../src/lib/tts/ttsFactory')
    const pending = deferred<Response>()
    apiFetch.mockReturnValueOnce(pending.promise)
    const requests = [detectTtsMode('zh'), detectTtsMode('en')]
    expect(apiFetch).toHaveBeenCalledTimes(1)
    pending.resolve(new Response('', { status: 503 }))
    expect(await Promise.all(requests)).toEqual(['browser', 'browser'])
    await detectTtsMode('zh')
    expect(apiFetch).toHaveBeenCalledTimes(1)
    vi.setSystemTime(Date.now() + 30_001)
    expect(await detectTtsMode('zh')).toBe('viseme')
    expect(apiFetch).toHaveBeenCalledTimes(2)
  })

  it('shares provider preparation but honours a device choice made during the request', async () => {
    const { getTtsProvider } = await import('../src/lib/tts/ttsFactory')
    const pending = deferred<Response>()
    apiFetch.mockReturnValueOnce(pending.promise)
    const chinese = getTtsProvider('zh'), english = getTtsProvider('en')
    expect(apiFetch).toHaveBeenCalledTimes(1)
    saveVoiceSettings('zh', { voiceURI: 'chosen-during-request', rate: .94 })
    pending.resolve(Response.json({ mode: 'viseme', token: 'token', region: 'region' }))
    expect((await chinese).mode).toBe('browser')
    const online = await english
    expect(online.mode).toBe('viseme')
    saveVoiceSettings('zh', { ...VOICE_DEFAULTS.zh })
    expect(await getTtsProvider('zh')).toBe(online)
  })

  it('honours a device voice selected during a shared status request', async () => {
    const { detectTtsMode } = await import('../src/lib/tts/ttsFactory')
    const pending = deferred<Response>()
    apiFetch.mockReturnValueOnce(pending.promise)
    const chinese = detectTtsMode('zh'), english = detectTtsMode('en')
    saveVoiceSettings('zh', { voiceURI: 'chosen-during-probe', rate: .94 })
    pending.resolve(Response.json({ provider: 'azure' }))
    expect(await chinese).toBe('browser')
    expect(await english).toBe('viseme')
    expect(apiFetch).toHaveBeenCalledTimes(1)
  })

  it('does not let a slow failed status probe replace an acquired online mode', async () => {
    const { detectTtsMode, getTtsProvider } = await import('../src/lib/tts/ttsFactory')
    const status = deferred<Response>()
    apiFetch.mockImplementation(async (path: string) => path.endsWith('/status') ? status.promise : Response.json({ mode: 'viseme', token: 'token', region: 'region' }))
    const mode = detectTtsMode('zh')
    expect((await getTtsProvider('en')).mode).toBe('viseme')
    status.resolve(new Response('', { status: 503 }))
    expect(await mode).toBe('viseme')
    expect(await detectTtsMode('en')).toBe('viseme')
  })
})
