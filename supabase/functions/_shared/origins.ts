export const DEMO_ORIGIN = 'https://idyllic-bubblegum-1f5a5c.netlify.app'
export function allowedOrigins(config = ''): string[] {
  return [...new Set([DEMO_ORIGIN, 'http://localhost:5180', 'http://127.0.0.1:5180',
    'http://localhost:5181', 'http://127.0.0.1:5181', ...config.split(',')].map(s => s.trim()).filter(Boolean))]
}
export function corsHeaders(origin: string, origins: string[]): Record<string, string> | null {
  if (origin && !origins.includes(origin)) return null
  return { Vary: 'Origin', 'Access-Control-Allow-Headers': 'authorization,apikey,content-type,x-client-info',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS', ...(origin ? { 'Access-Control-Allow-Origin': origin } : {}) }
}
