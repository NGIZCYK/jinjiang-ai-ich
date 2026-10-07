import { beforeEach, describe, expect, it, vi } from 'vitest'
import { keywordSentiment } from '../src/lib/keywordSentiment'
import { sanitizeSpeechText } from '../src/lib/tts/speechText'
import { isKnownVersionMismatch } from '../src/lib/serviceCompatibility'
import { parseOperatingBrief } from '../../supabase/functions/_shared/operatingBrief'
import { requestOperatingBrief } from '../src/lib/analytics'
import { extractGuideSignal } from '../src/lib/llm'

const { apiFetch } = vi.hoisted(() => ({ apiFetch: vi.fn() }))
vi.mock('../src/lib/cloud', () => ({ apiFetch }))
const brief = {
  headline: 'Small pilot', decision: 'pilot', rationale: 'Only two test users.',
  actions: [{ action: 'Test the guide', metric: 'Unique users', target: '10' }],
  scaleGate: 'Validate the journey', pauseGate: 'Pause on access failures',
  limitation: 'Digital demonstration, not real attendance or revenue.',
}
beforeEach(() => vi.clearAllMocks())

describe('keyword expression trend', () => {
  it.each([
    ['不喜欢', 'negative'], ['不满意', 'negative'], ['没有推荐', 'negative'],
    ['喜欢但太贵', 'neutral'], ['很棒，但是太难了', 'neutral'],
    ['不喜欢这张画，但是推荐体验', 'neutral'], ['喜欢这个', 'positive'],
    ['不觉得差', 'neutral'], ['not bad', 'neutral'], ["I don't like this", 'negative'],
    ['不是很满意', 'negative'], ['不太贵', 'neutral'], ['not very satisfied', 'negative'], ['not too expensive', 'neutral'],
    ['I love it but it is too expensive', 'neutral'], ['I dislike it', 'negative'],
  ])('%s → %s', (input, expected) => expect(keywordSentiment(input)).toBe(expected))
  it('uses corrected expression labels in the signals submitted to the database', () => {
    expect(extractGuideSignal('不喜欢苏绣，预算100', 'zh')).toMatchObject({ topics: ['craft'], sentiment: 'negative', budget: 100 })
    expect(extractGuideSignal('喜欢苏绣但太贵', 'zh')).toMatchObject({ sentiment: 'neutral' })
  })
})

describe('speech formatting and service compatibility', () => {
  it('removes visual formatting and links while retaining price and uncertainty', () => {
    expect(sanitizeSpeechText('# **苏绣体验**\n- [体验](https://example.test/info)：¥128（演示价格，待确认）。\n```js\nsecret()\n```'))
      .toBe('苏绣体验 体验：¥128（演示价格，待确认）。')
    expect(sanitizeSpeechText('1. `Visit` (demo price; pending confirmation). https://example.test'))
      .toBe('Visit (demo price; pending confirmation).')
  })
  it('does not claim an unreachable or unversioned server is an old version', () => {
    for (const apiVersion of ['unavailable', 'unknown', '']) {
      expect(isKnownVersionMismatch({ stale: true, apiVersion })).toBe(false)
    }
    expect(isKnownVersionMismatch(null)).toBe(false)
    expect(isKnownVersionMismatch({ stale: true, apiVersion: '2026.09.15-guide-v2' })).toBe(true)
    expect(isKnownVersionMismatch({ stale: false, apiVersion: '2026.09.19-guide-v3' })).toBe(false)
  })
})

describe('operating brief contract', () => {
  it('accepts a complete brief, including an explicit pause with no actions', () => {
    expect(parseOperatingBrief(brief)).toEqual(brief)
    expect(parseOperatingBrief({ ...brief, decision: 'pause', actions: [] })?.decision).toBe('pause')
  })
  it.each([
    null, [], { ...brief, decision: undefined }, { ...brief, decision: ['pilot'] },
    { ...brief, scaleGate: ' ' }, { ...brief, headline: 'x'.repeat(501) },
    { ...brief, actions: 'Test' }, { ...brief, actions: [{ action: 'Test' }] },
    { ...brief, actions: Array(5).fill(brief.actions[0]) },
  ])('rejects incomplete or wrongly typed output (%#)', (value) => {
    expect(parseOperatingBrief(value)).toBeNull()
  })
  it('retains the existing request shape and returns validated output', async () => {
    apiFetch.mockResolvedValue(Response.json({ brief, provider: 'deepseek' }))
    expect(await requestOperatingBrief('zh', { batch: 'demo' })).toEqual({ brief, provider: 'deepseek' })
    expect(JSON.parse(apiFetch.mock.calls[0][1].body)).toEqual({ language: 'zh', analysis: { batch: 'demo' } })
  })
  it.each(['html', 'missing', 'network'])('shows a safe retry message for %s, not raw backend content', async (kind) => {
    if (kind === 'network') apiFetch.mockRejectedValue(new Error('Private upstream content'))
    else apiFetch.mockResolvedValue(kind === 'html' ? new Response('<html>private</html>') : Response.json({ brief: { headline: 'Incomplete' } }))
    await expect(requestOperatingBrief('zh', {})).rejects.toThrow('已有统计保留')
  })
})
