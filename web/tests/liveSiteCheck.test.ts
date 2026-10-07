import { describe, expect, it, vi } from 'vitest'
import { checkLiveSite, LIVE_SITE, EXPECTED_SERVICE_REVISION } from '../../scripts/check-live-site.mjs'
import { GUIDE_SERVICE_REVISION } from '../../supabase/functions/_shared/guideContract'

function responses(options: { stale?: boolean; demo?: boolean; denied?: boolean; wildcard?: boolean; brokenSnapshot?: boolean } = {}) {
  return vi.fn(async (url: string, init: RequestInit = {}) => {
    const headers = new Headers(init.headers)
    const origin = headers.get('Origin')
    if (origin === 'https://release-check.invalid') return Response.json({ error: 'Origin not allowed' }, { status: 403 })
    const cors = { 'Access-Control-Allow-Origin': options.wildcard ? '*' : LIVE_SITE }
    if (options.denied && origin) return Response.json({ error: 'Origin not allowed' }, { status: 403 })
    if (init.method === 'OPTIONS') return new Response(null, { status: 204, headers: {
      ...cors, 'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
      'Access-Control-Allow-Headers': 'authorization,apikey,content-type,x-client-info',
    } })
    if (url.endsWith('/capabilities')) return Response.json({
      serviceRevision: options.stale ? 'old' : GUIDE_SERVICE_REVISION,
      chat: { provider: options.demo ? 'demo' : 'deepseek', streaming: true },
    }, { headers: cors })
    if (url.endsWith('.json')) return options.brokenSnapshot ? new Response('<html>SPA fallback</html>') : Response.json({
      generatedAt: '2026-10-07T01:13:00.963015', sampleSize: 2, records: [{}, {}], segments: [{}], revenueScenarios: [{}],
    })
    return new Response('<html>Website</html>', { headers: { 'Content-Type': 'text/html' } })
  })
}

describe('read-only release checks', () => {
  it('requires the current revision, online capability and exact website CORS', async () => {
    expect(EXPECTED_SERVICE_REVISION).toBe(GUIDE_SERVICE_REVISION)
    const fetchImpl = responses()
    const report = await checkLiveSite({ fetchImpl })
    expect(report.passed).toBe(true)
    expect(report.checks).toHaveLength(5)
    for (const [, init] of fetchImpl.mock.calls) {
      expect(['GET', 'OPTIONS']).toContain(init.method || 'GET')
      expect(init.body).toBeUndefined()
      expect(new Headers(init.headers).has('Authorization')).toBe(false)
      expect(new Headers(init.headers).has('apikey')).toBe(false)
    }
  })
  it.each([
    { stale: true }, { demo: true }, { denied: true }, { wildcard: true }, { brokenSnapshot: true },
  ])('fails rather than approving incomplete deployment (%j)', async options => {
    expect((await checkLiveSite({ fetchImpl: responses(options) })).passed).toBe(false)
  })
  it('reports network failures without recording raw errors or response bodies', async () => {
    const fetchImpl = vi.fn(async () => { throw new Error('PRIVATE_AUTH_OR_MODEL_TEXT') })
    const report = await checkLiveSite({ fetchImpl })
    expect(report.passed).toBe(false)
    expect(report.checks.every(check => check.error === 'REQUEST_FAILED')).toBe(true)
    expect(JSON.stringify(report)).not.toContain('PRIVATE_AUTH_OR_MODEL_TEXT')
  })
})
