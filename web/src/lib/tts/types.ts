import type { VisemeFrame } from '../../components/avatar/avatarTypes'

export type { VisemeFrame }

/**
 * TTS Provider 核心类型定义
 * 依据《婉娘Live2D数字人实施任务书》5.3节协议
 */

export type SpeechRequest = {
  id: string
  text: string
  language: 'zh' | 'en'
  messageId: string
}

export type SpeechPlayback = {
  play(onStart?: () => void): Promise<void>
  stop(): void
  visemes?: VisemeFrame[]
  durationMs?: number
}

export interface TtsProvider {
  readonly mode: 'viseme' | 'browser' | 'unavailable'
  prepare(request: SpeechRequest, signal: AbortSignal): Promise<SpeechPlayback>
}
