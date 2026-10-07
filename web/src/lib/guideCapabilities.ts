import { GUIDE_API_VERSION } from '../../../supabase/functions/_shared/guideContract.ts'
export interface GuideCapabilities {
  apiVersion: string
  serviceRevision?: string
  /** A version notice alone must not disable a compatible online protocol. */
  stale: boolean
  available: boolean
  chat: { provider: 'deepseek' | 'demo'; streaming: boolean }
  tts: { provider: 'azure' | 'browser'; viseme: boolean }
  avatar: { mode: 'live2d' | 'static'; modelConfigured: boolean }
}
export const FALLBACK_CAPABILITIES: GuideCapabilities = {
  apiVersion: 'unavailable', stale: false, available: false,
  chat: { provider: 'demo', streaming: false }, tts: { provider: 'browser', viseme: false },
  avatar: { mode: 'static', modelConfigured: false },
}
export function normalizeCapabilities(value: unknown): GuideCapabilities {
  if (!value || typeof value !== 'object') return { ...FALLBACK_CAPABILITIES }
  const data = value as Partial<GuideCapabilities>
  if (!data.chat || !['deepseek', 'demo'].includes(data.chat.provider)) return { ...FALLBACK_CAPABILITIES }
  const apiVersion = typeof data.apiVersion === 'string' ? data.apiVersion : 'unknown'
  const modelConfigured = data.avatar?.modelConfigured === true
  return {
    apiVersion, stale: apiVersion !== GUIDE_API_VERSION, available: true,
    ...(typeof data.serviceRevision === 'string' ? { serviceRevision: data.serviceRevision } : {}),
    chat: { provider: data.chat.provider, streaming: data.chat.streaming === true },
    tts: { provider: data.tts?.provider === 'azure' ? 'azure' : 'browser', viseme: data.tts?.viseme === true },
    avatar: { mode: data.avatar?.mode === 'live2d' && modelConfigured ? 'live2d' : 'static', modelConfigured },
  }
}
export function capabilityChatMode(capabilities: GuideCapabilities): 'deepseek' | 'demo' | 'fallback' {
  return capabilities.available ? capabilities.chat.provider : 'fallback'
}
