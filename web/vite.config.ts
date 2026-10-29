import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { validateDemoBuild } from './buildPolicy'
import { realpathSync } from 'node:fs'

// APIs are deployed as Supabase Edge Functions; Vite serves the frontend only.
export default defineConfig(({ mode, command }) => {
  if (mode === 'demo' && command === 'build') validateDemoBuild(loadEnv(mode, process.cwd(), 'VITE_'))
  return { plugins: [react(), { name: 'local-project-identity', apply: 'serve', configureServer(server) {
    server.middlewares.use('/__project_identity', (_req,res) => {
      res.setHeader('Content-Type','application/json');res.setHeader('Cache-Control','no-store')
      res.end(JSON.stringify({root:realpathSync(process.cwd()),mode}))
    })
  } }], server: { port: 5180, host: '127.0.0.1', open: false }, preview: { port: 5181, host: '127.0.0.1' } }
})
