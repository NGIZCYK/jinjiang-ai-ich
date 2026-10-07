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

function text(value: unknown, maxLength: number): value is string {
  return typeof value === 'string' && value.trim().length > 0 && value.length <= maxLength
}

/** Reject incomplete results instead of manufacturing an operational decision. */
export function parseOperatingBrief(value: unknown): AiOperatingBrief | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  const raw = value as Record<string, unknown>
  if (typeof raw.decision !== 'string' || !['pilot', 'scale', 'pause'].includes(raw.decision)
    || !text(raw.headline, 500) || !text(raw.rationale, 4000)
    || !text(raw.scaleGate, 2000) || !text(raw.pauseGate, 2000) || !text(raw.limitation, 2000)
    || !Array.isArray(raw.actions) || raw.actions.length > 4) return null
  const actions: AiOperatingBrief['actions'] = []
  for (const item of raw.actions) {
    if (!item || typeof item !== 'object' || Array.isArray(item)) return null
    const row = item as Record<string, unknown>
    if (!text(row.action, 500) || !text(row.metric, 500) || !text(row.target, 500)) return null
    actions.push({ action: row.action.trim(), metric: row.metric.trim(), target: row.target.trim() })
  }
  return {
    headline: raw.headline.trim(), decision: raw.decision as OperatingDecision,
    rationale: raw.rationale.trim(), actions, scaleGate: raw.scaleGate.trim(),
    pauseGate: raw.pauseGate.trim(), limitation: raw.limitation.trim(),
  }
}
