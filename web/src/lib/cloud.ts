import { createClient } from '@supabase/supabase-js'
const url = import.meta.env.VITE_SUPABASE_URL?.trim()
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim()
export const cloud = url && key ? createClient(url, key) : null
export const CLOUD_NOTICE = '共享服务尚未配置，暂不能登录或保存。Shared service is not configured; sign-in and cloud saving are unavailable.'
export function requireCloud() { if (!cloud) throw new Error(CLOUD_NOTICE); return cloud }
export async function rpc<T>(name: string, args: Record<string, unknown> = {}): Promise<T> {
  const { data, error } = await requireCloud().rpc(name,args)
  if (error) throw new Error(error.message)
  return data as T
}
export async function apiFetch(path: string, init: RequestInit = {}) {
  if (!cloud) return new Response(JSON.stringify({ error: CLOUD_NOTICE }), { status:503, headers:{'Content-Type':'application/json'} })
  const { data } = await cloud.auth.getSession()
  const headers = new Headers(init.headers)
  headers.set('apikey', key!)
  if (data.session) headers.set('Authorization', `Bearer ${data.session.access_token}`)
  const route = path.replace(/^\/api\//,'')
  return fetch(`${url}/functions/v1/concierge/${route}`, { ...init, headers })
}
