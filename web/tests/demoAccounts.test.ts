import { describe, expect, it } from 'vitest'
import { readDemoAccounts, resolveLoginTarget } from '../src/lib/demoAccounts'

const complete = {
  VITE_SHOW_DEMO_ACCOUNTS: 'true',
  VITE_DEMO_GUEST_EMAIL: 'guest@example.test',
  VITE_DEMO_GUEST_PASSWORD: 'guest-test-password',
  VITE_DEMO_OPS_EMAIL: 'ops@example.test',
  VITE_DEMO_OPS_PASSWORD: 'ops-test-password',
}

describe('public demo-account configuration', () => {
  it('stays hidden unless explicitly enabled', () => {
    expect(readDemoAccounts({ ...complete, VITE_SHOW_DEMO_ACCOUNTS: 'false' })).toEqual([])
    expect(readDemoAccounts({ ...complete, VITE_SHOW_DEMO_ACCOUNTS: undefined })).toEqual([])
  })

  it('requires both complete demo accounts', () => {
    expect(readDemoAccounts({ ...complete, VITE_DEMO_OPS_PASSWORD: '' })).toEqual([])
    expect(readDemoAccounts({ ...complete, VITE_DEMO_OPS_EMAIL: ' ' })).toEqual([])
    expect(readDemoAccounts({ ...complete, VITE_DEMO_GUEST_EMAIL: '  ' })).toEqual([])
  })

  it('provides one guest and one operator who both land on the homepage', () => {
    const accounts = readDemoAccounts(complete)
    expect(accounts.map(({ role, email, landingPath }) => ({ role, email, landingPath }))).toEqual([
      { role: 'guest', email: 'guest@example.test', landingPath: '/' },
      { role: 'ops', email: 'ops@example.test', landingPath: '/' },
    ])
  })

  it('always uses the homepage after authentication', () => {
    expect(resolveLoginTarget()).toBe('/')
  })
})
