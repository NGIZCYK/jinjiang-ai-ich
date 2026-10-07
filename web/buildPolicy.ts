export const DEMO_BACKEND = 'https://uxfxhqdfrzkafekrbzcf.supabase.co'
/** Public demo is never built against the formal project, even if hosting env overrides the local file. */
export function validateDemoBuild(env: Record<string, string | undefined>) {
  if (env.VITE_SUPABASE_URL?.replace(/\/$/, '') !== DEMO_BACKEND) throw new Error('Demo build requires the isolated demo backend.')
  if (env.VITE_DEMO_OPS_PASSWORD || env.VITE_DEMO_OPS_EMAIL) throw new Error('Remove public operations credentials from the hosting/build environment.')
  if (env.VITE_SHOW_DEMO_ACCOUNTS !== 'true' || !env.VITE_DEMO_GUEST_EMAIL || !env.VITE_DEMO_GUEST_PASSWORD) throw new Error('Demo guest access is not configured.')
}
