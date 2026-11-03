// @vitest-environment node
import { afterEach, expect, it, vi } from 'vitest'

const createClient = vi.hoisted(() => vi.fn(() => ({
  auth: { getSession: async () => ({ data: { session: null } }) },
})))
vi.mock('@supabase/supabase-js', () => ({ createClient }))
afterEach(() => { vi.unstubAllEnvs(); vi.restoreAllMocks() })

it('keeps accommodation review API requests on loopback despite inherited cloud configuration', async () => {
  vi.resetModules()
  vi.stubEnv('MODE', 'stays')
  vi.stubEnv('VITE_ENABLE_STAYS', 'false')
  vi.stubEnv('VITE_SUPABASE_URL', 'https://must-not-contact.supabase.co')
  vi.stubEnv('VITE_SUPABASE_PUBLISHABLE_KEY', 'must-not-use')
  const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('{}'))
  const { apiFetch } = await import('../src/lib/cloud')
  const { STAYS_ENABLED } = await import('../src/lib/stayConfig')
  expect(STAYS_ENABLED).toBe(true)
  expect(createClient).toHaveBeenCalledWith('http://127.0.0.1:54329', 'local-demonstration-anon', expect.any(Object))
  await apiFetch('/api/capabilities')
  expect(fetchSpy).toHaveBeenCalledOnce()
  expect(fetchSpy.mock.calls[0][0]).toBe('http://127.0.0.1:54329/functions/v1/concierge/capabilities')
})
