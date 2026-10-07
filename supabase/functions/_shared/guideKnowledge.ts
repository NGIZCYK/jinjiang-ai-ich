import { searchICH } from './ichItems.ts'
import { analyzeGuideIntent, buildSuzhouContext, getSuzhouGuideSource, type GuideIntent } from './suzhouGuide.ts'
import type { GuideSource, ICHItem } from './guideContract.ts'

function sourceCategory(item: ICHItem): GuideSource['category'] {
  if (item.tags.includes('方案') || item.tags.includes('体验设计')) return 'prototype'
  if (item.tags.includes('工艺') || item.tags.includes('传统技法')) return 'practice'
  return 'documented'
}

function pickContext(query: string, language: 'zh' | 'en') {
  const list = searchICH(query, language, 3)
  const sources: GuideSource[] = list.map((item) => ({
    id: item.id,
    title: language === 'en' ? item.titleEn ?? item.title : item.title,
    category: sourceCategory(item),
    references: language === 'en' ? item.sourcesEn ?? item.sources : item.sources,
  }))
  const context = list
    .map((item) => {
      const title = language === 'en' ? item.titleEn ?? item.title : item.title
      const summary = language === 'en' ? item.summaryEn ?? item.summary : item.summary
      const body = language === 'en' ? item.bodyEn ?? item.body : item.body
      const references = language === 'en' ? item.sourcesEn ?? item.sources : item.sources
      return `[${sourceCategory(item).toUpperCase()}] ${title}\n${summary}\n${body}\nReferences: ${references.join('; ')}`
    })
    .join('\n\n')
  const first = list[0]
  const fallbackSnippet = first
    ? `${language === 'en' ? first.titleEn ?? first.title : first.title}: ${language === 'en' ? first.summaryEn ?? first.summary : first.summary} ${language === 'en' ? first.bodyEn ?? first.body : first.body}`
    : ''
  return { context, sources, matched: list.length > 0, fallbackSnippet }
}

export interface GuideKnowledge {
  context: string
  sources: GuideSource[]
  matched: boolean
  fallbackSnippet: string
  intent: GuideIntent
  huqiuAmbiguous: boolean
  timeSensitive: boolean
  firstVisit: boolean
}

export function buildGuideKnowledge(query: string, language: 'zh' | 'en'): GuideKnowledge {
  const project = pickContext(query, language)
  const analysis = analyzeGuideIntent(query)
  const cityContext = buildSuzhouContext(analysis, language)
  const sources = cityContext
    ? [...project.sources, getSuzhouGuideSource(language)]
    : project.sources

  return {
    context: [project.context, cityContext].filter(Boolean).join('\n\n'),
    sources,
    matched: project.matched || Boolean(cityContext),
    fallbackSnippet: project.fallbackSnippet,
    ...analysis,
  }
}

