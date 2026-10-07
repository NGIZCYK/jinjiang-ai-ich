// Privileged QA changes use the Management API, without expanding Data API grants.
import { spawnSync } from 'node:child_process'
import { writeFile, mkdir, unlink } from 'node:fs/promises'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { randomUUID } from 'node:crypto'

export const TARGET_REF = 'jhosvgldwgndpudwentv'
export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
export const QA_MANIFEST = resolve(ROOT, '.cache/migration/qa-accounts.json')
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
export function validateManifest(saved, allowPartial = false) {
  const expected = ['guest-a:guest', 'guest-b:guest', 'operator:ops']
  const count = saved.accounts?.length
  if (saved.projectRef !== TARGET_REF || !uuid.test(saved.runId) || !Array.isArray(saved.accounts)
    || count < 1 || count > 3 || (!allowPartial && count !== 3)
    || new Set(saved.accounts.map(a => a.id)).size !== count
    || saved.accounts.some(a => !uuid.test(a.id))
    || saved.accounts.some((a, index) => `${a.label}:${a.role}` !== expected[index])
    || (saved.sessionId && !uuid.test(saved.sessionId))) throw new Error('QA_MANIFEST_INVALID')
}
export function ownershipGuard(saved) {
  validateManifest(saved)
  return `do $qa$ begin
    if (select count(*) from auth.users where id in (${saved.accounts.map(a => `'${a.id}'::uuid`).join(',')})
      and raw_user_meta_data->>'qa_run_id'='${saved.runId}')<>3
    then raise exception 'QA_OWNERSHIP_MISMATCH'; end if;
  end $qa$;`
}
export async function managementQuery(sql) {
  const cli = process.env.QA_SUPABASE_CLI
  if (!cli) throw new Error('QA_CLI_REQUIRED')
  const file = resolve(ROOT, `.cache/migration/qa-query-${randomUUID()}.sql`)
  await mkdir(dirname(file), { recursive: true })
  await writeFile(file, sql, { mode: 0o600 })
  try {
    const result = spawnSync(cli, ['db', 'query', '--linked', '--project-ref', TARGET_REF, '--file', file, '--output', 'json'],
      { cwd: ROOT, encoding: 'utf8', timeout: 90000, windowsHide: true })
    if (result.status !== 0) throw new Error('QA_MANAGEMENT_QUERY_FAILED')
    // Never include database/CLI responses in errors or logs.
    const value = JSON.parse(result.stdout.slice(result.stdout.indexOf('{')))
    if (!Array.isArray(value.rows)) throw new Error('QA_MANAGEMENT_QUERY_FAILED')
    return value.rows
  } finally { await unlink(file) }
}
