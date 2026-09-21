import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// APIs are deployed as Supabase Edge Functions; Vite serves the frontend only.
export default defineConfig({ plugins: [react()], server: { port: 5180, host: true, open: false }, preview: { port: 5181, host: true } })
