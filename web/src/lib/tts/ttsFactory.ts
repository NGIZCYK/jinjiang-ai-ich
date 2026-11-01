import { readVoiceSettings } from './voiceSettings'
import type { Language } from '../i18n'
import { apiFetch } from '../cloud'
import { BrowserTtsProvider } from './browserTts'
import type { TtsProvider } from './types'

export interface TtsTokenResponse {
  mode: 'viseme' | 'browser'
  token?: string | null
  region?: string
  voiceZh?: string
  voiceEn?: string
  reason?: string
}

type TtsMode = 'viseme' | 'browser' | 'unavailable'
const deviceProvider = new BrowserTtsProvider()
// Retry automatic selection after a short outage without probing for every sentence.
const RETRY_AFTER_MS = 30_000
let cachedProvider: { value: TtsProvider; retryAt: number } | null = null
let cachedMode: { value: TtsMode; retryAt: number } | null = null
let providerRequest: Promise<TtsProvider> | null = null
let modeRequest: Promise<TtsMode> | null = null

function rememberMode(value: TtsMode) {
  cachedMode = { value, retryAt: Date.now() + RETRY_AFTER_MS }
  return value
}

async function probeMode(): Promise<TtsMode> {
  try {
    const res = await apiFetch('/api/tts/status', { headers: { Accept: 'application/json' }, cache: 'no-store', signal: AbortSignal.timeout(10000) })
    if (res.ok && (res.headers.get('content-type') || '').includes('application/json')) {
      const data = (await res.json()) as { provider?: string }
      if (data.provider === 'azure') return rememberMode('viseme')
    }
  } catch { /* Device playback remains available during a service outage. */ }
  // A slower status failure must not overwrite a successfully acquired online provider.
  return rememberMode(cachedProvider?.value.mode === 'viseme' ? 'viseme' : deviceProvider.mode)
}

/** Report automatic service availability, respecting an explicit language-specific device voice. */
export async function detectTtsMode(language: Language = 'zh'): Promise<TtsMode> {
  if (readVoiceSettings(language).voiceURI) return deviceProvider.mode
  if (cachedProvider?.value.mode === 'viseme') return 'viseme'
  if (cachedMode && Date.now() < cachedMode.retryAt) return cachedMode.value
  if (!modeRequest) modeRequest = probeMode().finally(() => { modeRequest = null })
  const mode = await modeRequest
  return readVoiceSettings(language).voiceURI ? deviceProvider.mode : mode
}

async function acquireProvider(): Promise<TtsProvider> {
  let value: TtsProvider = deviceProvider
  try {
    const res = await apiFetch('/api/tts/token', { headers: { Accept: 'application/json' }, cache: 'no-store', signal: AbortSignal.timeout(10000) })
    if (res.ok && (res.headers.get('content-type') || '').includes('application/json')) {
      const data = (await res.json()) as TtsTokenResponse
      if (data.mode === 'viseme' && data.token && data.region) {
        const { AzureVisemeTtsProvider } = await import('./azureTts')
        value = new AzureVisemeTtsProvider({ region: data.region, token: data.token, voiceZh: data.voiceZh, voiceEn: data.voiceEn })
      }
    }
  } catch { /* Retry automatic online selection after the bounded fallback interval. */ }
  // The online provider refreshes its own token; fallback choices expire instead.
  cachedProvider = { value, retryAt: value.mode === 'viseme' ? Infinity : Date.now() + RETRY_AFTER_MS }
  rememberMode(value.mode)
  return value
}

/** Share preparation across callers while allowing explicit device choices to take effect immediately. */
export async function getTtsProvider(language: Language = 'zh'): Promise<TtsProvider> {
  if (readVoiceSettings(language).voiceURI) return deviceProvider
  if (cachedProvider && Date.now() < cachedProvider.retryAt) return cachedProvider.value
  if (!providerRequest) providerRequest = acquireProvider().finally(() => { providerRequest = null })
  const value = await providerRequest
  // The preference may have changed while the network request was pending.
  return readVoiceSettings(language).voiceURI ? deviceProvider : value
}
