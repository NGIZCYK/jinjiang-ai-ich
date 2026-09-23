/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_WANNIANG_LIVE2D_MODEL?: string
  readonly VITE_SHOW_DEMO_ACCOUNTS?: string
  readonly VITE_DEMO_GUEST_EMAIL?: string
  readonly VITE_DEMO_GUEST_PASSWORD?: string
  readonly VITE_DEMO_OPS_EMAIL?: string
  readonly VITE_DEMO_OPS_PASSWORD?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
