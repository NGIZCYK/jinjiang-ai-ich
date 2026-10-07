import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { askWanNiangStream } from '../src/lib/llm'
const { apiFetch } = vi.hoisted(() => ({ apiFetch: vi.fn() }))
vi.mock('../src/lib/cloud', () => ({ apiFetch }))
const frame = (event: string, data: unknown) => `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`
const sse = (text: string) => new Response(text, { headers: { 'Content-Type': 'text/event-stream' } })
beforeEach(() => {
  apiFetch.mockReset()
  vi.stubGlobal('window', { setTimeout, clearTimeout })
})
afterEach(() => vi.unstubAllGlobals())
describe('actual answer source through service failures', () => {
  it('identifies a completed online answer', async () => {
    apiFetch.mockResolvedValueOnce(sse(frame('meta', { requestId: 'r', provider: 'deepseek' })
      + frame('delta', { requestId: 'r', text: 'Online answer.' }) + frame('done', { requestId: 'r', content: 'Online answer.' })))
    expect(await askWanNiangStream('苏绣')).toMatchObject({ mode: 'deepseek', answerSource: 'deepseek', content: 'Online answer.' })
  })
  it('keeps interrupted model content distinct from a local answer', async () => {
    apiFetch.mockResolvedValueOnce(sse(frame('meta', { requestId: 'r', provider: 'deepseek' })
      + frame('delta', { requestId: 'r', text: 'Partial answer.' })))
    expect(await askWanNiangStream('苏绣')).toMatchObject({ mode: 'fallback', answerSource: 'deepseek-partial' })
    expect(apiFetch).toHaveBeenCalledTimes(1)
  })
  it('continues with the local guide when all network calls fail', async () => {
    apiFetch.mockRejectedValue(new TypeError('offline'))
    const result = await askWanNiangStream('苏绣为什么劈丝？')
    expect(result).toMatchObject({ mode: 'fallback', answerSource: 'local' })
    expect(result.content).toContain('丝')
    expect(result.sources.length).toBeGreaterThan(0)
  })
  it('does not resume a local response after cancellation', async () => {
    apiFetch.mockRejectedValue(new TypeError('offline'))
    const controller = new AbortController()
    const onDelta = vi.fn(() => controller.abort()), onDone = vi.fn()
    await expect(askWanNiangStream('苏绣', [], 'zh', { onDelta, onDone }, controller.signal))
      .rejects.toMatchObject({ name: 'AbortError' })
    expect(onDelta).toHaveBeenCalledTimes(1)
    expect(onDone).not.toHaveBeenCalled()
  })
})
