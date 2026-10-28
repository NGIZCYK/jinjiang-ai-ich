import { describe, expect, it, vi } from 'vitest'
import { createClient } from '@supabase/supabase-js'
import { authOptions } from '../src/lib/cloud'

describe('fresh visit authentication', () => {
 it('ignores legacy stored operator sessions', async () => {
  const storage={getItem:vi.fn(()=>JSON.stringify({access_token:'old-operator-token',refresh_token:'old-refresh',expires_at:9999999999,user:{id:'operator'}})),setItem:vi.fn(),removeItem:vi.fn()}
  const client=createClient('https://example.supabase.co','public-test-key',{auth:{...authOptions,autoRefreshToken:false,storage}})
  const {data,error}=await client.auth.getSession()
  expect(error).toBeNull()
  expect(data.session).toBeNull()
  expect(storage.getItem).not.toHaveBeenCalled()
  expect(storage.setItem).not.toHaveBeenCalled()
 })
})
