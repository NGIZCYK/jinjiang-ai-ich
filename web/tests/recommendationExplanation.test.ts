import { beforeEach, describe, expect, it, vi } from 'vitest'
import { CATALOG, DEFAULT_NEEDS, type Locale } from '../src/lib/journey'
import { buildRecommendationExplanation, requestRecommendationExplanation } from '../src/lib/recommendationExplanation'

const mock = vi.hoisted(() => ({ apiFetch: vi.fn() }))
vi.mock('../src/lib/cloud', () => mock)
beforeEach(() => { mock.apiFetch.mockReset() })

describe('full recommendation explanations', () => {
  it.each(CATALOG.flatMap(experience => (['zh', 'en'] as Locale[]).map(language => ({ experience, language }))))('explains $experience.id in $language with exact constraints and next steps', ({ experience, language }) => {
    const text = buildRecommendationExplanation(experience, DEFAULT_NEEDS, language)
    expect(text.split('\n\n')).toHaveLength(3)
    expect(text).toContain(String(experience.minutes))
    expect(text).toContain(`¥${experience.price}`)
    expect(text).toContain(language === 'zh' ? '我的行程' : 'My Journey')
    expect(text).not.toMatch(/演示费用|课程原型|当前使用规则|demo price|course prototype|Rule-based explanation/)
    expect(language === 'zh' ? text.length : text.split(/\s+/).length).toBeGreaterThan(language === 'zh' ? 200 : 100)
  })

  it('uses the selected catalog duration, price and party rather than hardcoded defaults', () => {
    const text = buildRecommendationExplanation({ ...CATALOG[0], minutes: 20, price: 12.5 }, { ...DEFAULT_NEEDS, minutes: 50, budget: 30, party: 'family' }, 'zh')
    expect(text).toContain('20 分钟、费用 ¥12.5/人')
    expect(text).toContain('30 分钟和 ¥17.5/人')
    expect(text).toContain('与家人同行')
    expect(text).not.toMatch(/10:30|14:00|16:30|已预约|预约成功/)
  })

  it.each(['unauthorized', 'network error', 'invalid JSON', 'empty', 'too short', 'notice'])('provides a full explanation after %s', async failure => {
    if (failure === 'unauthorized') mock.apiFetch.mockResolvedValue(new Response(null, { status: 401 }))
    if (failure === 'network error') mock.apiFetch.mockRejectedValue(new Error('Failed to fetch'))
    if (failure === 'invalid JSON') mock.apiFetch.mockResolvedValue(new Response('{broken'))
    if (failure === 'empty') mock.apiFetch.mockResolvedValue(Response.json({ content: '' }))
    if (failure === 'too short') mock.apiFetch.mockResolvedValue(Response.json({ content: '15 分钟，符合预算。' }))
    if (failure === 'notice') mock.apiFetch.mockResolvedValue(Response.json({ content: '课程原型，演示费用。'.repeat(20) }))
    const text = await requestRecommendationExplanation(CATALOG[0], DEFAULT_NEEDS, 'zh')
    expect(text).toBe(buildRecommendationExplanation(CATALOG[0], DEFAULT_NEEDS, 'zh'))
    expect(JSON.parse(mock.apiFetch.mock.calls[0][1].body)).toEqual({ experienceId: 'scroll', needs: DEFAULT_NEEDS, language: 'zh' })
  })

  it('preserves a useful online explanation and its paragraphs', async () => {
    const content = buildRecommendationExplanation(CATALOG[1], DEFAULT_NEEDS, 'en')
    mock.apiFetch.mockResolvedValue(Response.json({ content }))
    expect(await requestRecommendationExplanation(CATALOG[1], DEFAULT_NEEDS, 'en')).toBe(content)
  })
})
