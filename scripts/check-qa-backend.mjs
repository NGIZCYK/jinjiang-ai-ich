// Real Auth/API acceptance. Only uses the three accounts in the private QA manifest.
// Reports contain assertions, status and provider metadata, never tokens or answers.
import { createRequire } from 'node:module'
import { randomUUID } from 'node:crypto'
import { readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { DEMO_BACKEND, LIVE_SITE, EXPECTED_SERVICE_REVISION } from './check-live-site.mjs'
import { ROOT, QA_MANIFEST, TARGET_REF, validateManifest, managementQuery, ownershipGuard } from './qa-management.mjs'
const { createClient } = createRequire(resolve(ROOT, 'web/package.json'))('@supabase/supabase-js')
const PUBLIC_KEY = 'sb_publishable_IkfABWWuVZaZCRZ8cxOfVQ_1coxfRNN'
const reportPath = resolve(ROOT, '.cache/migration/qa-backend-report.json')
const report = { projectRef: TARGET_REF, checkedAt: new Date().toISOString(), checks: [] }
const assert = (condition, code = 'ASSERTION_FAILED') => { if (!condition) throw new Error(code) }
async function check(name, fn) {
  try { const details = await fn(); report.checks.push({ name, passed: true, ...details }) }
  catch (error) { report.checks.push({ name, passed: false, code: /^HTTP_\d+$/.test(error.message) ? error.message : 'ASSERTION_OR_REQUEST_FAILED' }) }
  await writeFile(reportPath, JSON.stringify(report, null, 2))
  console.log(JSON.stringify(report.checks.at(-1)))
}
async function rpc(client, name, args = {}) {
  const { data, error } = await client.rpc(name, args)
  assert(!error, 'RPC_FAILED')
  return data
}
async function endpoint(token, route, body, stream = false) {
  const response = await fetch(`${DEMO_BACKEND}/functions/v1/concierge/${route}`, {
    method: route === 'tts/token' ? 'GET' : 'POST',
    headers: { Origin: LIVE_SITE, apikey: PUBLIC_KEY, ...(token ? { Authorization: `Bearer ${token}` } : {}),
      'Content-Type': 'application/json', Accept: stream ? 'text/event-stream' : 'application/json' },
    ...(body ? { body: JSON.stringify(body) } : {}), signal: AbortSignal.timeout(60000),
  })
  assert(response.headers.get('Access-Control-Allow-Origin') === LIVE_SITE)
  return response
}
async function main() {
  assert(DEMO_BACKEND === `https://${TARGET_REF}.supabase.co`)
  const saved = JSON.parse(await readFile(QA_MANIFEST, 'utf8'))
  validateManifest(saved)
  const actors = []
  for (const account of saved.accounts) {
    const client = createClient(DEMO_BACKEND, PUBLIC_KEY, { auth: { persistSession: false, autoRefreshToken: false } })
    const { data, error } = await client.auth.signInWithPassword({ email: account.email, password: account.password })
    assert(!error && data.user?.id === account.id && data.user.user_metadata.qa_run_id === saved.runId, 'LOGIN_FAILED')
    actors.push({ ...account, client, token: data.session.access_token })
  }
  const [a, b, ops] = actors
  try {
    await check('real_auth_and_roles', async () => {
      for (const actor of actors) {
        const { data, error } = await actor.client.from('profiles').select('role').eq('id', actor.id).single()
        assert(!error && data.role === actor.role)
      }
      return { accounts: 3 }
    })
    await check('capabilities_revision', async () => {
      const r = await fetch(`${DEMO_BACKEND}/functions/v1/concierge/capabilities`, { headers: { Origin: LIVE_SITE }, signal: AbortSignal.timeout(20000) })
      const v = await r.json()
      assert(r.status === 200 && v.serviceRevision === EXPECTED_SERVICE_REVISION && v.chat.provider === 'deepseek' && v.tts.provider === 'browser')
      return { status: r.status, provider: v.chat.provider, voice: v.tts.provider }
    })
    await check('anonymous_chat_denied', async () => { const r = await endpoint(null, 'chat', { question: 'QA', language: 'zh' }); assert(r.status === 401); return { status: r.status } })
    await check('guest_operating_brief_denied', async () => { const r = await endpoint(a.token, 'analytics/brief', { analysis: { batch: 'pilot-01' } }); assert(r.status === 403); return { status: r.status } })
    let firstAnswer = ''
    const question = 'QA测试：苏绣为什么要劈丝？这里的1/16和1/32是统一标准吗？'
    await check('deepseek_zh_stream_and_references', async () => {
      const r = await endpoint(a.token, 'chat', { question, language: 'zh', history: [] }, true)
      assert(r.status === 200, `HTTP_${r.status}`)
      assert(r.headers.get('Content-Type')?.includes('text/event-stream'))
      const frames = (await r.text()).split(/\r?\n\r?\n/).filter(Boolean).map(frame => {
        const event = frame.match(/^event:\s*(\w+)/m)?.[1]
        const raw = frame.match(/^data:\s*(.+)$/m)?.[1]
        return { event, data: raw ? JSON.parse(raw) : {} }
      })
      const meta = frames.find(f => f.event === 'meta')?.data
      const done = frames.find(f => f.event === 'done')?.data
      assert(meta?.provider === 'deepseek' && meta.requestId && meta.sources?.length > 0)
      assert(frames.some(f => f.event === 'delta' && f.data.text?.length) && !frames.some(f => f.event === 'error'))
      assert(done?.requestId === meta.requestId && done.content?.trim() && done.sources?.length)
      assert(done.sources.every(s => s.id && s.title && Array.isArray(s.references)))
      firstAnswer = done.content
      return { status: r.status, provider: meta.provider, deltaEvents: frames.filter(f => f.event === 'delta').length, sourceCount: done.sources.length }
    })
    await check('deepseek_continuous_question', async () => {
      assert(firstAnswer)
      const r = await endpoint(a.token, 'chat', { question: 'QA测试：接着解释一下，这些示意层级在体验中应该怎样理解？', language: 'zh', history: [{ role: 'user', content: question }, { role: 'assistant', content: firstAnswer }] })
      assert(r.status === 200, `HTTP_${r.status}`); const v = await r.json(); assert(v.provider === 'deepseek' && v.content?.trim())
      return { status: r.status, provider: v.provider }
    })
    await check('deepseek_english_and_references', async () => {
      const r = await endpoint(b.token, 'chat', { question: 'QA test: Explain silk splitting in Su embroidery and whether 1/16 is a universal standard.', language: 'en' })
      assert(r.status === 200, `HTTP_${r.status}`); const v = await r.json(); assert(v.provider === 'deepseek' && v.content?.trim() && v.sources?.length)
      assert(/[a-z]{4}/i.test(v.content)); return { status: r.status, provider: v.provider, sourceCount: v.sources.length }
    })
    await check('deepseek_recommendation_explanation', async () => {
      const r = await endpoint(a.token, 'recommendation/explain', { experienceId: 'workshop', needs: { minutes: 90, budget: 150, party: 'solo', interest: 'craft' }, language: 'zh' })
      assert(r.status === 200, `HTTP_${r.status}`); const v = await r.json(); assert(v.provider === 'deepseek' && v.content?.trim() && v.content.includes('90') && v.content.includes('128'))
      return { status: r.status, provider: v.provider, exactDurationAndPrice: true }
    })
    await check('browser_voice_backend', async () => { const r = await endpoint(a.token, 'tts/token'); const v = await r.json(); assert(r.status === 200 && v.mode === 'browser' && v.token === null); return { status: r.status, mode: v.mode } })
    await check('guest_rpc_permissions', async () => {
      for (const [name, args] of [['trial_analytics', { p_batch: 'pilot-01' }], ['participant_roster', {}], ['save_reviewed_content', { p_type: 'copy', p_title: 'QA forbidden', p_content: 'QA', p_language: 'zh', p_notes: 'QA' }]]) {
        const { error } = await a.client.rpc(name, args); assert(error?.message === 'FORBIDDEN')
      }
      const { error } = await a.client.from('profiles').update({ role: 'ops' }).eq('id', a.id); assert(error)
      return { blockedOperations: 4 }
    })
    await check('guest_operator_workflow_and_isolation', async () => {
      saved.sessionId ||= randomUUID(); saved.requestId ||= randomUUID(); saved.signalRequest ||= randomUUID()
      await writeFile(QA_MANIFEST, JSON.stringify(saved, null, 2), { mode: 0o600 })
      await managementQuery(`begin; ${ownershipGuard(saved)}
        insert into public.sessions(id,experience_id,starts_at,capacity) values('${saved.sessionId}','workshop',now()+interval '2 days',8) on conflict(id) do nothing;
        commit; select true as qa_session_ready;`)
      await rpc(ops.client, 'assign_guest_batch', { p_user: a.id, p_batch: 'pilot-01' })
      await rpc(a.client, 'start_exploration')
      await rpc(a.client, 'save_exploration', { p_body: { motif: 'gate', palette: 'jade', levels: ['1/4', '1/16'], answer: 'relative' } })
      const recArgs = { p_experience: 'workshop', p_needs: { minutes: 90, budget: 150, party: 'solo', interest: 'craft' }, p_request: saved.requestId }
      const recommendationId = await rpc(a.client, 'save_recommendation', recArgs)
      assert(recommendationId === await rpc(a.client, 'save_recommendation', recArgs))
      const bookingArgs = { p_session: saved.sessionId, p_size: 1, p_request: saved.requestId, p_recommendation: recommendationId }
      const bookingId = await rpc(a.client, 'submit_intention', bookingArgs)
      assert(bookingId === await rpc(a.client, 'submit_intention', bookingArgs))
      saved.bookingId = bookingId; await writeFile(QA_MANIFEST, JSON.stringify(saved, null, 2), { mode: 0o600 })
      const signalArgs = { p_request: saved.signalRequest, p_language: 'zh', p_topics: ['craft'], p_stay_hours: 2, p_budget: 150, p_party_type: 'solo', p_sentiment: 'positive' }
      assert(await rpc(a.client, 'save_guide_signal', signalArgs) === await rpc(a.client, 'save_guide_signal', signalArgs))
      for (const [table, key, id] of [['profiles','id',a.id],['explorations','user_id',a.id],['preferences','user_id',a.id],['recommendations','user_id',a.id],['bookings','id',bookingId],['guide_signals','user_id',a.id]]) {
        const { data, error } = await b.client.from(table).select('*').eq(key,id); assert(!error && data.length === 0)
      }
      const { error: forbidden } = await b.client.rpc('transition_booking', { p_id: bookingId, p_status: 'cancelled', p_reason: 'QA forbidden attempt' }); assert(forbidden?.message === 'FORBIDDEN')
      const { error: moved } = await ops.client.rpc('assign_guest_batch', { p_user: a.id, p_batch: 'demo' }); assert(moved?.message === 'PARTICIPANT_HAS_ACTIVITY')
      const current = await a.client.from('bookings').select('status').eq('id',bookingId).single(); assert(!current.error)
      if (current.data.status === 'pending') await rpc(ops.client, 'transition_booking', { p_id: bookingId, p_status: 'confirmed', p_reason: 'QA confirmation; not real attendance' })
      const confirmed = await a.client.from('bookings').select('status').eq('id',bookingId).single(); assert(['confirmed','completed'].includes(confirmed.data?.status))
      if (confirmed.data.status === 'confirmed') await rpc(ops.client, 'transition_booking', { p_id: bookingId, p_status: 'completed', p_reason: 'QA simulation completed' })
      const complete = await a.client.from('bookings').select('status').eq('id',bookingId).single(); assert(complete.data?.status === 'completed')
      await rpc(a.client, 'submit_feedback', { p_booking: bookingId, p_rating: 5, p_comment: 'QA feedback only; not real operating evidence' })
      await rpc(a.client, 'submit_feedback', { p_booking: bookingId, p_rating: 5, p_comment: 'QA duplicate feedback' })
      const feedback = await a.client.from('feedback').select('booking_id').eq('booking_id',bookingId); assert(!feedback.error && feedback.data.length === 1)
      const history = await a.client.from('booking_history').select('id').eq('booking_id',bookingId); assert(!history.error && history.data.length === 3)
      const analysis = await rpc(ops.client, 'trial_analytics', { p_batch: 'pilot-01' }); assert(analysis.counts.length === 8 && analysis.counts.every(n => n >= 1))
      const contentId = await rpc(ops.client, 'save_reviewed_content', { p_type: 'copy', p_title: `QA ${saved.runId}`, p_content: 'QA reviewed content, not for publication', p_language: 'zh', p_notes: 'QA manual review' })
      const content = await ops.client.from('reviewed_contents').select('review_status').eq('id',contentId).single(); assert(!content.error && content.data.review_status === 'approved')
      return { hiddenTablesFromOtherGuest: 6, statusSynchronized: true, feedbackRows: 1, historyRows: 3, funnelStages: 8, studioApprovedSaved: true }
    })
    await check('deepseek_operating_brief', async () => {
      const r = await endpoint(ops.token, 'analytics/brief', { language: 'zh', analysis: { batch: 'pilot-01', scenario: 'QA migration acceptance', assumptions: {}, forecast: {}, ruleDecision: 'pilot' } })
      assert(r.status === 200, `HTTP_${r.status}`); const v = await r.json()
      assert(v.provider === 'deepseek' && ['pilot','pause'].includes(v.brief?.decision) && v.brief.rationale?.trim() && Array.isArray(v.brief.actions) && v.brief.limitation.includes('digital counts are not attendance or revenue'))
      return { status: r.status, provider: v.provider, decision: v.brief.decision, expansionGuarded: true }
    })
  } finally {
    for (const actor of actors) await actor.client.auth.signOut({scope:'local'})
    report.passed = report.checks.length > 0 && report.checks.every(c => c.passed)
    report.finishedAt = new Date().toISOString()
    await writeFile(reportPath, JSON.stringify(report, null, 2))
  }
  console.log(JSON.stringify({ passed: report.passed, checks: report.checks.length, failed: report.checks.filter(c => !c.passed).map(c => c.name), credentialsPrinted: false }))
  if (!report.passed) process.exitCode = 1
}
main().catch(() => { console.error(JSON.stringify({ passed: false, code: 'QA_BACKEND_CHECK_FAILED' })); process.exitCode = 1 })
