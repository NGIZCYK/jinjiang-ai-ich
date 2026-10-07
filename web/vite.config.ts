import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { validateDemoBuild } from './buildPolicy'

// APIs are deployed as Supabase Edge Functions; Vite serves the frontend only.
export default defineConfig(({ mode, command }) => {
  if (mode === 'demo' && command === 'build') validateDemoBuild(loadEnv(mode, process.cwd(), 'VITE_'))
  return { plugins: [react()], server: { port: 5180, host: true, open: false }, preview: { port: 5181, host: true } }
})
