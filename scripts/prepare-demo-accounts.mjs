// Initial setup of the explicitly authorized replacement demo project.
// Service key enters via stdin only. Private operator credentials stay in ignored cache.
import { createRequire } from 'node:module'
import { randomBytes } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { DEMO_BACKEND } from './check-live-site.mjs'
import { ROOT, TARGET_REF, managementQuery } from './qa-management.mjs'
const { createClient } = createRequire(resolve(ROOT, 'web/package.json'))('@supabase/supabase-js')
const output = resolve(ROOT, '.cache/migration/demo-accounts.json')
const rebuildId = '2026.10.07-new-account-demo'
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const requireOk = (value) => { if (!value) throw new Error('DEMO_SETUP_CHECK_FAILED') }
async function main() {
  requireOk(DEMO_BACKEND === `https://${TARGET_REF}.supabase.co`)
  let input = ''; for await (const chunk of process.stdin) input += chunk
  const { projectRef, adminKey } = JSON.parse(input)
  requireOk(projectRef === TARGET_REF && typeof adminKey === 'string')
  const claims = JSON.parse(Buffer.from(adminKey.split('.')[1], 'base64url').toString())
  requireOk(claims.ref === TARGET_REF && claims.role === 'service_role')
  const admin = createClient(DEMO_BACKEND, adminKey, { auth: { persistSession: false, autoRefreshToken: false } })
  const demoEnv = await readFile(resolve(ROOT, 'web/.env.demo'), 'utf8')
  const envValue = name => demoEnv.match(new RegExp(`^${name}=(.+)$`, 'm'))?.[1].trim()
  const publicKey = envValue('VITE_SUPABASE_PUBLISHABLE_KEY')
  const guestEmail = envValue('VITE_DEMO_GUEST_EMAIL'), guestPassword = envValue('VITE_DEMO_GUEST_PASSWORD')
  requireOk(publicKey && guestEmail && guestPassword)
  let saved
  try { saved = JSON.parse(await readFile(output, 'utf8')) }
  catch (error) { if (error.code !== 'ENOENT') throw error }
  saved ||= { projectRef: TARGET_REF, rebuildId, accounts: [] }
  requireOk(saved.projectRef === TARGET_REF && saved.rebuildId === rebuildId && Array.isArray(saved.accounts))
  requireOk(saved.accounts.length <= 2 && saved.accounts.every((a, i) => uuid.test(a.id) && a.role === ['guest','ops'][i]))
  await mkdir(resolve(ROOT, '.cache/migration'), { recursive: true })
  const expected = [
    { role: 'guest', email: guestEmail, password: guestPassword, name: '公开演示住客' },
    { role: 'ops', email: 'ops-demo@hotel.local', password: `Ops!${randomBytes(24).toString('hex')}`, name: '演示运营' },
  ]
  for (let i = saved.accounts.length; i < expected.length; i++) {
    const account = expected[i]
    const { data, error } = await admin.auth.admin.createUser({ email: account.email, password: account.password,
      email_confirm: true, user_metadata: { name: account.name, demo_rebuild_id: rebuildId } })
    requireOk(!error && data.user)
    saved.accounts.push({ ...account, id: data.user.id })
    await writeFile(output, JSON.stringify(saved, null, 2), { mode: 0o600 })
  }
  for (const account of saved.accounts) {
    const { data, error } = await admin.auth.admin.getUserById(account.id)
    requireOk(!error && data.user?.user_metadata?.demo_rebuild_id === rebuildId)
  }
  const ids = saved.accounts.map(a => `'${a.id}'::uuid`).join(',')
  const seed = await readFile(resolve(ROOT, 'supabase/seed.sql'), 'utf8')
  const rows = await managementQuery(`begin;
    do $setup$ begin
      if (select count(*) from auth.users)<>2 or
        (select count(*) from auth.users where id in (${ids}) and raw_user_meta_data->>'demo_rebuild_id'='${rebuildId}')<>2
      then raise exception 'NEW_DEMO_OWNERSHIP_MISMATCH'; end if;
    end $setup$;
    update public.profiles set role='ops' where id='${saved.accounts[1].id}'::uuid;
    ${saved.slotsInitialized ? '' : `do $slots$ begin if exists(select 1 from public.sessions) then raise exception 'NEW_DEMO_SLOTS_NOT_EMPTY'; end if; end $slots$;\n${seed}`}
    commit; select count(*) as demo_slots from public.sessions;`)
  requireOk(rows[0]?.demo_slots >= 42)
  saved.slotsInitialized = true
  await writeFile(output, JSON.stringify(saved, null, 2), { mode: 0o600 })
  for (const account of saved.accounts) {
    const client = createClient(DEMO_BACKEND, publicKey, { auth: { persistSession: false, autoRefreshToken: false } })
    const { data, error } = await client.auth.signInWithPassword({ email: account.email, password: account.password })
    requireOk(!error && data.user?.id === account.id)
    const profile = await client.from('profiles').select('role,batch_id').eq('id', account.id).single()
    requireOk(!profile.error && profile.data.role === account.role && profile.data.batch_id === 'demo')
    const sessions = await client.rpc('available_sessions')
    requireOk(!sessions.error && sessions.data.length >= 42)
    await client.auth.signOut()
  }
  const ops = saved.accounts[1]
  const localEnvPath = resolve(ROOT, 'web/.env.demo.local')
  let localEnv = ''; try { localEnv = await readFile(localEnvPath, 'utf8') } catch (error) { if (error.code !== 'ENOENT') throw error }
  localEnv = localEnv.replace(/^DEMO_OPS_(?:EMAIL|PASSWORD)=.*\r?\n?/gm, '').trimEnd()
  await writeFile(localEnvPath, `${localEnv}\nDEMO_OPS_EMAIL=${ops.email}\nDEMO_OPS_PASSWORD=${ops.password}\n`, { mode: 0o600 })
  await writeFile(resolve(ROOT, '.cache/migration/运营登录凭据.md'),
    `# 新演示项目运营登录\n\n仅适用于 ${TARGET_REF}。旧密码不能登录本项目。\n\n官网：https://idyllic-bubblegum-1f5a5c.netlify.app/auth\n\n邮箱：${ops.email}\n\n密码：${ops.password}\n\n运营账号手工登录。此文件已被 Git 忽略，不得公开。\n`, { mode: 0o600 })
  const report = { projectRef: TARGET_REF, rebuiltWithoutOldData: true, accounts: 2, slots: rows[0].demo_slots,
    loginAndRolesVerified: true, operatorPasswordRegenerated: true, serverKeyStored: false, checkedAt: new Date().toISOString() }
  await writeFile(resolve(ROOT, '.cache/migration/demo-setup-report.json'), JSON.stringify(report, null, 2))
  console.log(JSON.stringify(report))
}
main().catch(() => { console.error(JSON.stringify({ passed: false, code: 'DEMO_SETUP_FAILED', resumeManifestRetained: true })); process.exitCode = 1 })
