import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

export const LIVE_SITE = 'https://idyllic-bubblegum-1f5a5c.netlify.app'
export const DEMO_BACKEND = 'https://jhosvgldwgndpudwentv.supabase.co'
export const EXPECTED_SERVICE_REVISION = '2026.10.07-concierge-r1'

/** Public GET/OPTIONS requests only. Never accepts credentials or records response bodies. */
export async function checkLiveSite({ fetchImpl = fetch, site = LIVE_SITE, backend = DEMO_BACKEND } = {}) {
  const checks = []
  const run = async (name, url, init, verify) => {
    try {
      const response = await fetchImpl(url, {
        ...init, signal: AbortSignal.timeout(20_000), redirect: 'error',
        headers: { ...init?.headers, 'Cache-Control': 'no-cache' },
      })
      const result = await verify(response)
      return { name, status: response.status, ...result }
    } catch (error) {
      return { name, passed: false, error: error instanceof SyntaxError ? 'INVALID_JSON' : 'REQUEST_FAILED' }
    }
  }
  const acceptsSite = response => response.headers.get('Access-Control-Allow-Origin') === site
  const api = `${backend}/functions/v1/concierge`
  checks.push(...await Promise.all([
    run('website', site, {}, async response => ({
      passed: response.status === 200 && (response.headers.get('Content-Type') || '').includes('text/html'),
    })),
    run('python_snapshot', `${site}/analytics/analytics_snapshot.json`, {}, async response => {
      if (response.status !== 200) return { passed: false }
      const data = await response.json()
      const valid = Boolean(data && typeof data === 'object'
        && typeof data.generatedAt === 'string' && Number.isFinite(Date.parse(data.generatedAt))
        && Number.isInteger(data.sampleSize) && data.sampleSize > 0
        && Array.isArray(data.records) && data.records.length === data.sampleSize
        && Array.isArray(data.segments) && data.segments.length > 0
        && Array.isArray(data.revenueScenarios) && data.revenueScenarios.length > 0)
      return { passed: valid, ...(valid ? { generatedAt: data.generatedAt, sampleSize: data.sampleSize } : {}) }
    }),
    run('concierge_capabilities', `${api}/capabilities`, { headers: { Origin: site } }, async response => {
      if (response.status !== 200) return { passed: false }
      const data = await response.json()
      return {
        passed: acceptsSite(response) && data?.serviceRevision === EXPECTED_SERVICE_REVISION
          && data?.chat?.provider === 'deepseek' && data?.chat?.streaming === true,
        revisionMatches: data?.serviceRevision === EXPECTED_SERVICE_REVISION,
        onlineModelDeclared: data?.chat?.provider === 'deepseek',
      }
    }),
    run('chat_preflight', `${api}/chat`, { method: 'OPTIONS', headers: {
      Origin: site, 'Access-Control-Request-Method': 'POST',
      'Access-Control-Request-Headers': 'authorization,apikey,content-type',
    } }, async response => {
      const methods = (response.headers.get('Access-Control-Allow-Methods') || '').split(',').map(x => x.trim().toUpperCase())
      const headers = (response.headers.get('Access-Control-Allow-Headers') || '').split(',').map(x => x.trim().toLowerCase())
      return { passed: response.status === 204 && acceptsSite(response) && methods.includes('POST')
        && ['authorization', 'apikey', 'content-type'].every(header => headers.includes(header)) }
    }),
    run('foreign_origin_rejected', `${api}/capabilities`, { headers: { Origin: 'https://release-check.invalid' } }, async response => ({
      passed: response.status === 403 && !response.headers.get('Access-Control-Allow-Origin'),
    })),
  ]))
  return { checkedAt: new Date().toISOString(), site, backend, expectedServiceRevision: EXPECTED_SERVICE_REVISION,
    passed: checks.every(check => check.passed), checks }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const result = await checkLiveSite()
  console.log(JSON.stringify(result, null, 2))
  process.exitCode = result.passed ? 0 : 1
}
