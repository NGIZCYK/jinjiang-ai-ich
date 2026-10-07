import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { resolveLoginTarget } from '../src/lib/demoAccounts'

const mock = vi.hoisted(() => ({
  getSession: vi.fn(), signInWithPassword: vi.fn(), onAuthStateChange: vi.fn(),
  single: vi.fn(), from: vi.fn(),
}))
vi.mock('../src/lib/cloud', () => {
  const cloud = { auth: mock, from: mock.from }
  return { cloud, requireCloud: () => cloud, rpc: vi.fn() }
})
beforeEach(() => { vi.resetModules(); vi.clearAllMocks(); vi.useFakeTimers() })
afterEach(() => vi.useRealTimers())

describe('login identity and destination', () => {
  it.each(['guest', 'ops'] as const)('waits for the %s role when SIGNED_IN arrives during profile loading', async role => {
    const session = { user: { id: 'demo-user', email: `${role}@example.test` } }
    mock.getSession.mockResolvedValueOnce({ data: { session: null } }).mockResolvedValue({ data: { session } })
    const profile = Promise.withResolvers<{ data: { id: string; name: string; role: string; batch_id: string }; error: null }>()
    mock.single.mockReturnValue(profile.promise)
    mock.from.mockImplementation(table => table === 'profiles'
      ? { select: () => ({ eq: () => ({ single: mock.single }) }) }
      : { select: () => ({ order: async () => ({ data: [], error: null }) }) })
    const { useAppStore } = await import('../src/lib/store')
    useAppStore.getState().initialize()
    await vi.advanceTimersByTimeAsync(0)
    const listener = mock.onAuthStateChange.mock.calls[0][0]
    mock.signInWithPassword.mockImplementation(async () => {
      listener('SIGNED_IN', session)
      return { data: { user: session.user }, error: null }
    })
    const login = useAppStore.getState().login(session.user.email, 'demo-password')
    await vi.advanceTimersByTimeAsync(0)
    expect(mock.single).toHaveBeenCalledTimes(1)
    expect(useAppStore.getState().ready).toBe(false)
    profile.resolve({ data: { id: 'demo-user', name: 'Demo', role, batch_id: 'demo' }, error: null })
    await expect(login).resolves.toEqual({ ok: true })
    expect(useAppStore.getState()).toMatchObject({ ready: true, user: { role } })
    expect(resolveLoginTarget(null, useAppStore.getState().user?.role)).toBe(role === 'ops' ? '/operations' : '/my')
  })
})
