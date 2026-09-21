import type { GuideSignal } from '../types'

/**
 * 匿名访客标签只用于当前浏览会话的界面预览。正式统计由 Supabase 按账号与
 * 测试批次保存；这里从不承担运营统计，也不保存聊天原文。
 */
const GUIDE_SIGNALS_KEY = 'jj_v3_session_guide_signals'
const MAX_SIGNALS = 200

const LANGUAGES = ['zh', 'en'] as const
const PARTY_TYPES = ['solo', 'family', 'business', 'unspecified'] as const
const SENTIMENTS = ['positive', 'neutral', 'negative'] as const

export function safeSessionStorage(): Pick<Storage, 'getItem' | 'setItem' | 'removeItem'> | null {
  try {
    if (typeof sessionStorage === 'undefined') return null
    return sessionStorage
  } catch {
    return null
  }
}

function isGuideSignal(value: unknown): value is GuideSignal {
  if (!value || typeof value !== 'object') return false
  const signal = value as Record<string, unknown>
  return typeof signal.id === 'string'
    && typeof signal.sourceMessageId === 'string'
    && LANGUAGES.includes(signal.language as typeof LANGUAGES[number])
    && Array.isArray(signal.topics)
    && signal.topics.every((topic) => typeof topic === 'string')
    && (signal.stayHours === undefined || typeof signal.stayHours === 'number')
    && (signal.budget === undefined || typeof signal.budget === 'number')
    && PARTY_TYPES.includes(signal.partyType as typeof PARTY_TYPES[number])
    && SENTIMENTS.includes(signal.sentiment as typeof SENTIMENTS[number])
    && typeof signal.createdAt === 'number'
}

export function loadGuideSignals(storage: Pick<Storage, 'getItem'> | null = safeSessionStorage()): GuideSignal[] {
  if (!storage) return []
  try {
    const parsed: unknown = JSON.parse(storage.getItem(GUIDE_SIGNALS_KEY) ?? 'null')
    if (!Array.isArray(parsed)) return []
    return parsed.filter(isGuideSignal).slice(0, MAX_SIGNALS)
  } catch {
    return []
  }
}

export function persistGuideSignals(
  signals: GuideSignal[],
  storage: Pick<Storage, 'getItem' | 'setItem' | 'removeItem'> | null = safeSessionStorage(),
): void {
  if (!storage) return
  try {
    const trimmed = signals.slice(0, MAX_SIGNALS)
    if (trimmed.length === 0) storage.removeItem(GUIDE_SIGNALS_KEY)
    else storage.setItem(GUIDE_SIGNALS_KEY, JSON.stringify(trimmed))
  } catch {
    // 存储不可用（隐私模式/配额）时静默降级为仅内存，不影响对话。
  }
}
