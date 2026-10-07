import { describe, expect, it } from 'vitest'
import { capabilityChatMode, normalizeCapabilities } from '../src/lib/guideCapabilities'
import { GUIDE_API_VERSION, GUIDE_SERVICE_REVISION } from '../../supabase/functions/_shared/guideContract'
import { validateDemoBuild, DEMO_BACKEND } from '../buildPolicy'
import { DEMO_BACKEND as CHECK_BACKEND } from '../../scripts/check-live-site.mjs'
describe('capability and release boundaries', () => {
  it('preserves deployment revisions without requiring them from compatible older servers', () => {
    const server = { apiVersion: GUIDE_API_VERSION, chat: { provider: 'deepseek', streaming: true } }
    const revised = normalizeCapabilities({ ...server, serviceRevision: GUIDE_SERVICE_REVISION })
    expect(revised.serviceRevision).toBe(GUIDE_SERVICE_REVISION)
    expect(capabilityChatMode(revised)).toBe('deepseek')
    const older = normalizeCapabilities(server)
    expect(older.serviceRevision).toBeUndefined()
    expect(capabilityChatMode(older)).toBe('deepseek')
  })
  it('keeps a compatible DeepSeek service online despite version differences', () => {
    const caps = normalizeCapabilities({ apiVersion: 'older', chat: { provider: 'deepseek', streaming: true } })
    expect(caps.stale).toBe(true)
    expect(capabilityChatMode(caps)).toBe('deepseek')
  })
  it('uses the shared version and reports local provider accurately', () => {
    const caps = normalizeCapabilities({ apiVersion: GUIDE_API_VERSION, chat: { provider: 'demo' } })
    expect(caps.stale).toBe(false)
    expect(capabilityChatMode(caps)).toBe('demo')
  })
  it.each([null, {}, {chat:{provider:'made-up'}}, 'HTML'])('falls back on unusable capabilities %j', value => {
    expect(capabilityChatMode(normalizeCapabilities(value))).toBe('fallback')
  })
  it('requires two demo accounts while blocking other backends', () => {
    expect(DEMO_BACKEND).toBe('https://jhosvgldwgndpudwentv.supabase.co')
    expect(CHECK_BACKEND).toBe(DEMO_BACKEND)
    const env = {VITE_SUPABASE_URL:DEMO_BACKEND, VITE_SHOW_DEMO_ACCOUNTS:'true',VITE_DEMO_GUEST_EMAIL:'guest@example.test',VITE_DEMO_GUEST_PASSWORD:'public-test',VITE_DEMO_OPS_EMAIL:'ops@example.test',VITE_DEMO_OPS_PASSWORD:'ops-public-test'}
    expect(() => validateDemoBuild(env)).not.toThrow()
    expect(() => validateDemoBuild({...env,VITE_SUPABASE_URL:'https://formal.example.test'})).toThrow()
    expect(() => validateDemoBuild({...env,VITE_SUPABASE_URL:'https://uxfxhqdfrzkafekrbzcf.supabase.co'})).toThrow()
    expect(() => validateDemoBuild({...env,VITE_SUPABASE_URL:'https://itfpnfaieurelroxbrvy.supabase.co'})).toThrow()
    expect(() => validateDemoBuild({...env,VITE_DEMO_OPS_PASSWORD:''})).toThrow()
    expect(() => validateDemoBuild({...env,VITE_DEMO_OPS_EMAIL:''})).toThrow()
  })
})
