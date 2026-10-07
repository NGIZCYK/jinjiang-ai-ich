// Creates only three dedicated QA accounts in the new demo project.
// Admin key: stdin only; never stored or printed. Credentials remain in ignored .cache.
import { createRequire } from 'node:module'
import { randomBytes, randomUUID } from 'node:crypto'
import { mkdir, writeFile, readFile, unlink, access } from 'node:fs/promises'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { DEMO_BACKEND } from './check-live-site.mjs'
import { managementQuery, ownershipGuard, validateManifest } from './qa-management.mjs'

const TARGET_REF = 'jhosvgldwgndpudwentv'
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const output = resolve(root, '.cache/migration/qa-accounts.json')
const require = createRequire(resolve(root, 'web/package.json'))
const { createClient } = require('@supabase/supabase-js')

async function main() {
  if (DEMO_BACKEND !== `https://${TARGET_REF}.supabase.co`) throw new Error('TARGET_MISMATCH')
  const mode = process.argv[2]
  if (!['--create', '--resume', '--cleanup'].includes(mode)) throw new Error('EXPLICIT_MODE_REQUIRED')
  if (mode === '--create') {
    try { await access(output); throw new Error('QA_ACCOUNTS_ALREADY_PREPARED') }
    catch (error) { if (error.code !== 'ENOENT') throw error }
  }
  let input = ''
  for await (const chunk of process.stdin) input += chunk
  const { projectRef, adminKey } = JSON.parse(input)
  if (projectRef !== TARGET_REF || typeof adminKey !== 'string' || !adminKey) throw new Error('TARGET_OR_KEY_INVALID')
  if (adminKey.split('.').length === 3) {
    const claims = JSON.parse(Buffer.from(adminKey.split('.')[1], 'base64url').toString())
    if (claims.ref !== TARGET_REF || claims.role !== 'service_role') throw new Error('ADMIN_KEY_TARGET_MISMATCH')
  } else if (!adminKey.startsWith('sb_secret_') || /[•*]/.test(adminKey)) throw new Error('ADMIN_KEY_INVALID')
  const admin = createClient(DEMO_BACKEND, adminKey, { auth: { persistSession: false, autoRefreshToken: false } })
  if (mode === '--cleanup') {
    const saved = JSON.parse(await readFile(output, 'utf8'))
    validateManifest(saved, true)
    const owned = []
    for (const account of saved.accounts) {
      const { data, error } = await admin.auth.admin.getUserById(account.id)
      if (error?.status === 404) continue
      if (error || data.user?.user_metadata?.qa_run_id !== saved.runId) throw new Error('QA_OWNERSHIP_MISMATCH')
      owned.push(account.id)
    }
    if (owned.length) {
      // Clear QA-owned references before deleting users; never delete another actor's rows.
      const ids = owned.map(id => `'${id}'::uuid`).join(',')
      await managementQuery(`begin;
        do $qa$ begin
          if exists(select 1 from auth.users where id in (${ids}) and raw_user_meta_data->>'qa_run_id' is distinct from '${saved.runId}')
          or exists(select 1 from public.reviewed_contents where reviewer_id in (${ids}) and user_id not in (${ids}))
          or exists(select 1 from public.booking_history h join public.bookings b on b.id=h.booking_id
            where h.actor_id in (${ids}) and b.user_id not in (${ids}))
          then raise exception 'QA_OWNERSHIP_MISMATCH'; end if;
        end $qa$;
        delete from public.reviewed_contents where user_id in (${ids});
        delete from public.bookings where user_id in (${ids});
        ${saved.sessionId ? `delete from public.sessions where id='${saved.sessionId}'::uuid and not exists(select 1 from public.bookings where session_id='${saved.sessionId}'::uuid);` : ''}
        commit;
        select true as qa_business_cleanup_passed;`)
      for (const id of owned) {
        const { error } = await admin.auth.admin.deleteUser(id)
        if (error) throw new Error('QA_USER_CLEANUP_FAILED')
      }
    }
    const allIds = saved.accounts.map(account => `'${account.id}'::uuid`).join(',')
    const rows = await managementQuery(`select
      (select count(*) from auth.users where id in (${allIds})) as remaining_accounts,
      (select count(*) from public.profiles where id in (${allIds})) as remaining_profiles,
      (select count(*) from public.bookings where user_id in (${allIds})) as remaining_bookings,
      (select count(*) from public.reviewed_contents where user_id in (${allIds})) as remaining_contents,
      ${saved.sessionId ? `(select count(*) from public.sessions where id='${saved.sessionId}'::uuid)` : '0'} as remaining_sessions;`)
    if (!rows[0] || Object.values(rows[0]).some(count => Number(count) !== 0)) throw new Error('QA_CLEANUP_NOT_COMPLETE')
    const report = { projectRef: TARGET_REF, runId: saved.runId, deletedAccounts: owned.length,
      noQaResidueVerified: true, checkedAt: new Date().toISOString() }
    await writeFile(resolve(root, '.cache/migration/qa-account-cleanup.json'), JSON.stringify(report, null, 2))
    await unlink(output)
    console.log(JSON.stringify({ ...report, credentialsFileRemoved: true }))
    return
  }
  const saved = mode === '--resume' ? JSON.parse(await readFile(output, 'utf8')) : null
  if (saved) validateManifest(saved)
  const runId = saved?.runId || randomUUID()
  const accounts = saved?.accounts || []
  await mkdir(dirname(output), { recursive: true })
  if (!saved) for (const [label, role] of [['guest-a', 'guest'], ['guest-b', 'guest'], ['operator', 'ops']]) {
    const email = `qa-${runId.slice(0, 8)}-${label}@hotel.local`
    const password = `Qa!${randomBytes(24).toString('hex')}`
    const { data, error } = await admin.auth.admin.createUser({
      email, password, email_confirm: true,
      user_metadata: { name: `QA migration ${label}`, qa_run_id: runId },
    })
    if (error || !data.user) throw new Error('QA_USER_CREATE_FAILED')
    accounts.push({ label, role, id: data.user.id, email, password })
    // Persist immediately so a partial failure cannot lose the QA cleanup UUIDs.
    await writeFile(output, JSON.stringify({ projectRef: TARGET_REF, runId, accounts }, null, 2), { mode: 0o600 })
  }
  const journal = saved || { projectRef: TARGET_REF, runId, accounts }
  await managementQuery(`begin; ${ownershipGuard(journal)}
    update public.profiles set role='ops' where id='${accounts.find(a => a.role === 'ops').id}'::uuid;
    commit; select true as qa_role_assigned;`)
  for (const { id, email, password, role } of accounts) {
    const { data: identity, error: identityError } = await admin.auth.admin.getUserById(id)
    if (identityError || identity.user?.user_metadata?.qa_run_id !== runId) throw new Error('QA_OWNERSHIP_MISMATCH')
    const client = createClient(DEMO_BACKEND,
      'sb_publishable_IkfABWWuVZaZCRZ8cxOfVQ_1coxfRNN',
      { auth: { persistSession: false, autoRefreshToken: false } })
    const { data: signedIn, error: signInError } = await client.auth.signInWithPassword({ email, password })
    if (signInError || signedIn.user?.id !== id) throw new Error('QA_LOGIN_FAILED')
    const { data: profile, error: profileError } = await client.from('profiles').select('role').eq('id', id).single()
    if (profileError || profile?.role !== role) throw new Error('QA_PROFILE_ROLE_MISMATCH')
    await client.auth.signOut()
  }
  console.log(JSON.stringify({ projectRef: TARGET_REF, qaAccountsCreated: accounts.length,
    passwordsPrinted: false, adminKeyStored: false, loginAndRoleVerified: true }))
}

main().catch(error => {
  console.error(JSON.stringify({ passed: false, code: [
    'TARGET_MISMATCH', 'EXPLICIT_MODE_REQUIRED', 'QA_ACCOUNTS_ALREADY_PREPARED',
    'TARGET_OR_KEY_INVALID', 'ADMIN_KEY_TARGET_MISMATCH', 'ADMIN_KEY_INVALID',
    'QA_USER_CREATE_FAILED', 'QA_ROLE_ASSIGN_FAILED', 'QA_LOGIN_FAILED', 'QA_PROFILE_ROLE_MISMATCH',
    'QA_MANIFEST_INVALID', 'QA_OWNERSHIP_MISMATCH', 'QA_CONTENT_CLEANUP_FAILED',
    'QA_BOOKING_CLEANUP_FAILED', 'QA_USER_CLEANUP_FAILED',
    'QA_CLI_REQUIRED', 'QA_MANAGEMENT_QUERY_FAILED',
    'QA_CLEANUP_NOT_COMPLETE',
  ].includes(error.message) ? error.message : 'QA_PREPARATION_FAILED' }))
  process.exitCode = 1
})
