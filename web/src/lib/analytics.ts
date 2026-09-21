import { apiFetch } from './cloud'
import type { Language } from './i18n'

export type OperatingDecision = 'pilot' | 'scale' | 'pause'

export interface AiOperatingBrief {
  headline: string
  decision: OperatingDecision
  rationale: string
  actions: { action: string; metric: string; target: string }[]
  scaleGate: string
  pauseGate: string
  limitation: string
}

function asText(value: unknown, fallback: string) {
  return typeof value === 'string' && value.trim() ? value.trim().slice(0, 500) : fallback
}

function asBrief(value: unknown): AiOperatingBrief | null {
  if (!value || typeof value !== 'object') return null
  const raw = value as Record<string, unknown>
  const decision = raw.decision === 'scale' || raw.decision === 'pause' || raw.decision === 'pilot'
    ? raw.decision
    : 'pilot'
  const actions = Array.isArray(raw.actions)
    ? raw.actions.slice(0, 4).flatMap((item) => {
        if (!item || typeof item !== 'object') return []
        const row = item as Record<string, unknown>
        return [{
          action: asText(row.action, ''),
          metric: asText(row.metric, ''),
          target: asText(row.target, ''),
        }].filter((action) => action.action)
      })
    : []
  return {
    headline: asText(raw.headline, '运营分析简报'),
    decision,
    rationale: asText(raw.rationale, '请结合当前经营参数进行小规模试点。'),
    actions,
    scaleGate: asText(raw.scaleGate, '达到预设转化、到课和 ROI 门槛后扩大。'),
    pauseGate: asText(raw.pauseGate, '若连续试点未达到门槛，则暂停并复核假设。'),
    limitation: asText(raw.limitation, '该结论依据当前测试批次的聚合行为与课程合成经营假设。'),
  }
}

export async function requestOperatingBrief(language: Language, analysis: Record<string, unknown>) {
  const response = await apiFetch('/api/analytics/brief', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ language, analysis }),
  })
  const payload = await response.json() as { brief?: unknown; provider?: string; error?: string }
  const brief = asBrief(payload.brief)
  if (!response.ok || !brief) throw new Error(payload.error || 'AI 运营简报暂时不可用')
  return { brief, provider: payload.provider === 'deepseek' ? 'deepseek' : 'fallback' as const }
}
