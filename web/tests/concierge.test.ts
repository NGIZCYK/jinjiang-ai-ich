import { beforeEach, describe, expect, it, vi } from 'vitest'
import { readFileSync } from 'node:fs'
import { createHash, randomUUID } from 'node:crypto'
import { runInNewContext } from 'node:vm'
import ts from 'typescript'
import { parseOperatingBrief } from '../../supabase/functions/_shared/operatingBrief'
import { readGuideStream } from '../src/lib/guideStream'
import { GUIDE_API_VERSION, GUIDE_SERVICE_REVISION } from '../../supabase/functions/_shared/guideContract'
import { buildGuideKnowledge } from '../../supabase/functions/_shared/guideKnowledge'
import { allowedOrigins, corsHeaders } from '../../supabase/functions/_shared/origins'

// Execute the real Edge handler with mocked external services; no online model calls or writes.
const source = readFileSync(new URL('../../supabase/functions/concierge/index.ts', import.meta.url), 'utf8')
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText
const validBrief = {
  headline: 'Pilot', decision: 'pilot', rationale: 'A small digital sample.', actions: [],
  scaleGate: 'Complete validation', pauseGate: 'Access problems', limitation: 'No real revenue inferred.',
}
let handler: (req: Request) => Promise<Response>
let role: string, signedIn: boolean, quotaLimited: boolean
let env: Record<string, string>, logs: string[]
let upstream: ReturnType<typeof vi.fn>, rpc: ReturnType<typeof vi.fn>
const observations = { counts: [2, 1, 1, 1, 0], guideIntent: { uniqueUsers: 2, averageBudget: 150 } }

beforeEach(() => {
  role = 'ops'; signedIn = true; quotaLimited = false; logs = []
  env = { SUPABASE_URL: 'https://test.supabase.co', SUPABASE_ANON_KEY: 'test-key', DEEPSEEK_API_KEY: 'test-model-secret' }
  rpc = vi.fn(async (name: string) => name === 'trial_analytics'
    ? { data: observations, error: null }
    : { data: null, error: quotaLimited ? { message: 'RATE_LIMIT' } : null })
  const client = {
    auth: { getUser: async () => ({ data: { user: signedIn ? { id: 'user-id' } : null }, error: null }) }, rpc,
    from: (table: string) => {
      const builder: any = { select: () => builder, eq: () => builder, single: async () => ({
        data: table === 'profiles' ? { role } : { id: 'scroll', minutes: 15, price: 0, parties: ['solo'], active: true },
        error: null,
      }) }
      return builder
    },
  }
  upstream = vi.fn(async () => Response.json({ choices: [{ message: { content: JSON.stringify(validBrief) }, finish_reason: 'stop' }] }))
  runInNewContext(compiled, {
    exports: {}, require: (name: string) => {
      if (name.includes('operatingBrief')) return { parseOperatingBrief }
      if (name.includes('guideContract')) return { GUIDE_API_VERSION, GUIDE_SERVICE_REVISION }
      if (name.includes('guideKnowledge')) return { buildGuideKnowledge }
      if (name.includes('origins')) return { allowedOrigins, corsHeaders }
      return { createClient: () => client }
    },
    Deno: { env: { get: (name: string) => env[name] }, serve: (value: typeof handler) => { handler = value } },
    fetch: upstream, Request, Response, Headers, URL, TextEncoder, TextDecoder, ReadableStream, AbortSignal,
    crypto: { randomUUID }, performance, console: { info: (value: string) => logs.push(value) },
  })
})
function call(route: string, body?: unknown, stream = false) {
  return handler(new Request(`https://test.supabase.co/functions/v1/concierge/${route}`, {
    method: body === undefined ? 'GET' : 'POST',
    headers: { Authorization: 'Bearer test-session', 'Content-Type': 'application/json', ...(stream ? { Accept: 'text/event-stream' } : {}) },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  }))
}
const modelRequest = () => JSON.parse(upstream.mock.calls[0][1].body)

describe('chat and recommendation regression boundaries', () => {
  it('retains the system knowledge, model, generation settings, and history filtering', async () => {
    role = 'guest'
    upstream.mockResolvedValue(Response.json({ choices: [{ message: { content: 'Existing answer' } }] }))
    const history = Array.from({ length: 12 }, (_, n) => ({ role: n % 2 ? 'assistant' : 'user', content: `${n}:` + 'a'.repeat(2100) }))
    // Stay under the existing 24KB body cap.
    history[0].content = 'Old 0'; history[1].content = 'Old 1'
    const response = await call('chat', { question: 'Original question', language: 'zh', history })
    expect(response.status).toBe(200)
    expect(await response.json()).toMatchObject({ provider: 'deepseek', content: 'Existing answer', sources: expect.any(Array) })
    const body = modelRequest()
    expect(Object.keys(body).sort()).toEqual(['max_tokens', 'messages', 'model', 'stream', 'temperature'])
    expect(body).toMatchObject({ model: 'deepseek-chat', max_tokens: 1200, temperature: 0.4, stream: false })
    const knowledge = body.messages[0].content.split('\nTrusted project references retrieved by the server:')[0].replace(/ Reply in Chinese\.$/, '')
    expect(createHash('sha256').update(knowledge.replace(/\r\n/g, '\n')).digest('hex'))
      .toBe('b84f473d32e630f988f89484fa58142ef1091de488fb3a2df30d8e865b504c21')
    expect(body.messages).toHaveLength(12)
    expect(body.messages[1].content).toHaveLength(2000)
    expect(body.messages[1].content.startsWith('2:')).toBe(true)
    expect(body.messages.at(-1)).toEqual({ role: 'user', content: 'Original question' })
    expect(logs).toHaveLength(0)
  })
  it('keeps meta/delta/done SSE compatible with the existing frontend reader', async () => {
    role = 'guest'
    upstream.mockResolvedValue(new Response('data: {"choices":[{"delta":{"content":"苏绣"}}]}\n\ndata: {"choices":[{"delta":{"content":"导览"}}]}\n\ndata: [DONE]\n\n'))
    const response = await call('chat', { question: '苏绣', language: 'zh' }, true)
    const meta = vi.fn(), delta = vi.fn(), done = vi.fn(), error = vi.fn()
    await readGuideStream(response.body!.getReader(), { onMeta: meta, onDelta: delta, onDone: done, onError: error })
    expect(meta).toHaveBeenCalledWith(expect.objectContaining({ requestId: expect.any(String), provider: 'deepseek', language: 'zh', sources: expect.any(Array) }))
    expect(delta).toHaveBeenLastCalledWith('导览', '苏绣导览')
    expect(done.mock.calls[0][0].content).toBe('苏绣导览')
    expect(error).not.toHaveBeenCalled()
    expect(modelRequest().stream).toBe(true)
    expect(modelRequest()).not.toHaveProperty('response_format')
    expect(response.headers.get('X-Request-Id')).toBeNull()
  })
  it('keeps recommendation validation and requests a fuller grounded explanation', async () => {
    const needs = { minutes: 15, budget: 0, party: 'solo' }
    expect((await call('recommendation/explain', { experienceId: 'scroll', needs })).status).toBe(200)
    expect(modelRequest().messages[1].content).toContain('Keep the exact duration and per-person catalog price.')
    expect(modelRequest().messages[1].content).toContain('three short paragraphs')
    expect(modelRequest().messages[1].content).toContain('Do not invent dates, inventory, instructors, benefits or confirmed bookings.')
    expect(modelRequest()).not.toHaveProperty('response_format')
    upstream.mockClear()
    expect((await call('recommendation/explain', { experienceId: 'scroll', needs: { ...needs, minutes: 1 } })).status).toBe(400)
    expect(upstream).not.toHaveBeenCalled()
  })
  it('uses the same public version identifier on both sides', async () => {
    const capabilities = await (await call('capabilities')).json()
    expect(capabilities.apiVersion).toBe(GUIDE_API_VERSION)
  })
})

describe('operating brief validation, permissions and private diagnostics', () => {
  it('uses JSON mode only for the brief and gets observations from the selected DB cohort', async () => {
    const response = await call('analytics/brief', { language: 'zh', analysis: { batch: 'demo', privateMarker: 'PRIVATE_OPERATOR_DATA' } })
    expect(response.status).toBe(200)
    expect(await response.json()).toMatchObject({ brief: { ...validBrief, limitation: expect.stringContaining(validBrief.limitation) }, provider: 'deepseek' })
    expect(modelRequest().response_format).toEqual({ type: 'json_object' })
    expect(rpc).toHaveBeenCalledWith('trial_analytics', { p_batch: 'demo' })
    expect(modelRequest().messages[1].content).toContain(`Server observations for cohort demo: ${JSON.stringify(observations)}`)
    const log = JSON.parse(logs[0])
    expect(log).toMatchObject({ route: 'analytics/brief', outcome: 'success', status: 200, durationMs: expect.any(Number) })
    expect(response.headers.get('X-Request-Id')).toBe(log.requestId)
    expect(logs.join('')).not.toMatch(/PRIVATE_OPERATOR_DATA|test-model-secret|test-session|Small digital|headline/)
  })
  it.each(['broken JSON', 'missing fields', 'truncated'])('rejects %s without manufacturing a decision', async (kind) => {
    const content = kind === 'broken JSON' ? 'Not JSON' : JSON.stringify(kind === 'missing fields' ? { headline: 'Incomplete' } : validBrief)
    upstream.mockResolvedValue(Response.json({ choices: [{ message: { content }, finish_reason: kind === 'truncated' ? 'length' : 'stop' }] }))
    const response = await call('analytics/brief', { analysis: { batch: 'pilot-01' } })
    expect(response.status).toBe(502)
    expect(await response.json()).toMatchObject({ code: 'INVALID_BRIEF' })
    expect(JSON.parse(logs[0]).errorType).toBe('INVALID_BRIEF')
  })
  it('still denies guests and enforces quota before contacting the model', async () => {
    role = 'guest'
    expect((await call('analytics/brief', { analysis: {} })).status).toBe(403)
    expect(upstream).not.toHaveBeenCalled()
    role = 'ops'; quotaLimited = true
    expect((await call('analytics/brief', { analysis: {} })).status).toBe(429)
    expect(upstream).not.toHaveBeenCalled()
    expect(JSON.parse(logs.at(-1)!).errorType).toBe('RATE_LIMIT')
  })
  it('reports a token-service failure as a browser fallback without logging a secret', async () => {
    env.AZURE_SPEECH_KEY = 'private-speech-key'; env.AZURE_SPEECH_REGION = 'eastasia'
    upstream.mockResolvedValue(new Response('Private service details', { status: 503 }))
    const response = await call('tts/token')
    expect(await response.json()).toMatchObject({ mode: 'browser', token: null })
    expect(JSON.parse(logs[0])).toMatchObject({ outcome: 'browser_fallback', errorType: 'VOICE_TOKEN_UNAVAILABLE' })
    expect(logs.join('')).not.toMatch(/private-speech-key|Private service details|test-session/)
  })
})
