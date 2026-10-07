import { apiFetch } from './cloud'
import type { Language } from './i18n'

import { parseOperatingBrief } from '../../../supabase/functions/_shared/operatingBrief'
export type { AiOperatingBrief, OperatingDecision } from '../../../supabase/functions/_shared/operatingBrief'

export async function requestOperatingBrief(language: Language, analysis: Record<string, unknown>) {
  try {
    const response = await apiFetch('/api/analytics/brief', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ language, analysis }),
    })
    const payload = await response.json() as { brief?: unknown; provider?: string }
    const brief = parseOperatingBrief(payload?.brief)
    if (!response.ok || !brief) throw new Error('INVALID_BRIEF')
    brief.decision = brief.decision === 'pause' ? 'pause' : 'pilot'
    return { brief, provider: payload.provider === 'deepseek' ? 'deepseek' : 'fallback' as const }
  } catch {
    throw new Error(language === 'zh' ? 'AI 运营简报生成失败，请重试；已有统计保留。' : 'The operating brief could not be generated. Please retry; existing statistics are retained.')
  }
}
