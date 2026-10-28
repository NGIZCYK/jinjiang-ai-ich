import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { resolveLoginTarget } from '../src/lib/demoAccounts'

const mock = vi.hoisted(() => ({
  getSession: vi.fn(), signInWithPassword: vi.fn(), onAuthStateChange: vi.fn(),
  single: vi.fn(), from: vi.fn(), signOut: vi.fn(),
}))
vi.mock('../src/lib/cloud', () => {
  const cloud = { auth: mock, from: mock.from }
  return { cloud, requireCloud: () => cloud, rpc: vi.fn() }
})
beforeEach(() => { vi.resetModules(); vi.resetAllMocks(); vi.useFakeTimers() })
afterEach(() => vi.useRealTimers())

describe('login identity and destination', () => {
  async function setup() {
    const session = {user:{id:'demo-user',email:'guest@example.test'}}
    mock.getSession.mockResolvedValueOnce({data:{session:null}}).mockResolvedValue({data:{session}})
    mock.single.mockResolvedValue({data:{id:'demo-user',name:'Guest',role:'guest',batch_id:'demo'},error:null})
    mock.from.mockImplementation(() => ({select:()=>({eq:()=>({single:mock.single})})}))
    mock.signInWithPassword.mockResolvedValue({data:{user:session.user},error:null})
    mock.signOut.mockResolvedValue({error:null})
    const {useAppStore:store} = await import('../src/lib/store')
    store.getState().initialize()
    await vi.advanceTimersByTimeAsync(0)
    return {store,session,listener:mock.onAuthStateChange.mock.calls[0][0]}
  }

  it('does not clear an authenticated identity for a delayed duplicate SIGNED_IN', async () => {
    const {store,session,listener}=await setup()
    mock.signInWithPassword.mockImplementation(async()=>{listener('SIGNED_IN',session);return {data:{user:session.user},error:null}})
    await store.getState().login('guest@example.test','password')
    const states: unknown[]=[]
    const unsubscribe=store.subscribe(state=>states.push(state.user))
    await vi.advanceTimersByTimeAsync(0)
    expect(states).not.toContain(null)
    expect(mock.single).toHaveBeenCalledTimes(1)
    unsubscribe()
  })

  it('ignores a queued signout after the next explicit login', async () => {
    const {store,listener}=await setup()
    await store.getState().login('guest@example.test','password')
    mock.signOut.mockImplementation(async()=>{listener('SIGNED_OUT',null);return {error:null}})
    await store.getState().logout()
    expect(store.getState().user).toBeNull()
    await store.getState().login('guest@example.test','password')
    await vi.advanceTimersByTimeAsync(0)
    expect(store.getState()).toMatchObject({ready:true,user:{id:'demo-user'}})
  })

  it('does not restore an in-flight profile after logout', async () => {
    const {store}=await setup()
    const profile=Promise.withResolvers<any>()
    mock.single.mockReturnValue(profile.promise)
    const login=store.getState().login('guest@example.test','password')
    await vi.advanceTimersByTimeAsync(0)
    await store.getState().logout()
    profile.resolve({data:{id:'demo-user',name:'Guest',role:'guest',batch_id:'demo'},error:null})
    await login
    expect(store.getState()).toMatchObject({ready:true,user:null})
  })

  it('leaves a usable signed-out state if the profile request throws', async () => {
    const {store}=await setup()
    mock.single.mockRejectedValue(new Error('Profile offline'))
    await expect(store.getState().login('guest@example.test','password')).resolves.toEqual({ok:false,error:'Profile offline'})
    expect(store.getState()).toMatchObject({ready:true,user:null})
  })

  it('ignores a queued INITIAL_SESSION event after explicit login', async () => {
    const {store}=await setup()
    // INITIAL_SESSION can also arrive after an explicit authentication event.
    const listener=mock.onAuthStateChange.mock.calls[0][0]
    listener('INITIAL_SESSION',null)
    await store.getState().login('guest@example.test','password')
    await vi.advanceTimersByTimeAsync(0)
    expect(store.getState().user?.id).toBe('demo-user')
  })
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
