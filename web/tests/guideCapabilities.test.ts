import { describe, expect, it } from 'vitest'
import { capabilityChatMode, normalizeCapabilities } from '../src/lib/guideCapabilities'
import { GUIDE_API_VERSION } from '../../supabase/functions/_shared/guideContract'
import { validateDemoBuild, DEMO_BACKEND } from '../buildPolicy'
describe('capability and release boundaries', () => {
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
  it('blocks formal backend and privileged credentials in a demo build', () => {
    const env = {VITE_SUPABASE_URL:DEMO_BACKEND, VITE_SHOW_DEMO_ACCOUNTS:'true',VITE_DEMO_GUEST_EMAIL:'guest@example.test',VITE_DEMO_GUEST_PASSWORD:'public-test'}
    expect(() => validateDemoBuild(env)).not.toThrow()
    expect(() => validateDemoBuild({...env,VITE_SUPABASE_URL:'https://formal.example.test'})).toThrow()
    expect(() => validateDemoBuild({...env,VITE_DEMO_OPS_PASSWORD:'private-test'})).toThrow()
  })
})
