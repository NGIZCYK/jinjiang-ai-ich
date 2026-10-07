export const GUIDE_API_VERSION = '2026.09.19-guide-v3'
export interface ICHItem {
  id: string; title: string; titleEn?: string; summary: string; summaryEn?: string
  body: string; bodyEn?: string; tags: string[]; sources: string[]; sourcesEn?: string[]; searchTerms?: string[]
}
export interface GuideSource {
  id: string; title: string; category: 'documented' | 'practice' | 'prototype'; references: string[]
}
/** Optional metadata: older servers can still answer, without claiming local references were used. */
export function parseGuideSources(value: unknown): GuideSource[] {
  if (!Array.isArray(value)) return []
  return value.filter((s): s is GuideSource => Boolean(s && typeof s === 'object'
    && typeof s.id === 'string' && typeof s.title === 'string'
    && ['documented', 'practice', 'prototype'].includes(s.category)
    && Array.isArray(s.references) && s.references.every((r: unknown) => typeof r === 'string')))
}
