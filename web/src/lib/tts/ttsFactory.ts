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

let cachedProvider: TtsProvider | null = null
let cachedMode: 'viseme' | 'browser' | 'unavailable' | null = null

/**
 * 检测当前系统可用的最高级别 TTS 模式
 * 级别 1：Azure Viseme 模式（配置了 AZURE_SPEECH_KEY & REGION）
 * 级别 2：浏览器原生 SpeechSynthesis 模式（approximate fallback 节奏口型）
 * 级别 3：静音托底模式（unavailable）
 */
export async function detectTtsMode(): Promise<'viseme' | 'browser' | 'unavailable'> {
  if (cachedMode) return cachedMode

  try {
    const res = await apiFetch('/api/tts/token', { headers: { Accept: 'application/json' }, cache: 'no-store' })
    if (res.ok && (res.headers.get('content-type') || '').includes('application/json')) {
      const data = (await res.json()) as TtsTokenResponse
      if (data.mode === 'viseme' && data.token && data.region) {
        cachedMode = 'viseme'
        return 'viseme'
      }
    }
  } catch {
    // 忽略网络或服务不可达
  }

  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    cachedMode = 'browser'
    return 'browser'
  }

  cachedMode = 'unavailable'
  return 'unavailable'
}

/**
 * 动态工厂：按可用凭据自动升级或回退 TtsProvider 实例
 */
export async function getTtsProvider(): Promise<TtsProvider> {
  if (cachedProvider) return cachedProvider

  try {
    const res = await apiFetch('/api/tts/token', { headers: { Accept: 'application/json' }, cache: 'no-store' })
    if (res.ok && (res.headers.get('content-type') || '').includes('application/json')) {
      const data = (await res.json()) as TtsTokenResponse
      if (data.mode === 'viseme' && data.token && data.region) {
        const { AzureVisemeTtsProvider } = await import('./azureTts')
        cachedProvider = new AzureVisemeTtsProvider({
          region: data.region,
          token: data.token,
          voiceZh: data.voiceZh,
          voiceEn: data.voiceEn,
        })
        cachedMode = 'viseme'
        return cachedProvider
      }
    }
  } catch {
    // 降级至浏览器模式
  }

  cachedProvider = new BrowserTtsProvider()
  cachedMode = cachedProvider.mode
  return cachedProvider
}
