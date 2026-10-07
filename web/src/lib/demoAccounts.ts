export type DemoAccountRole = 'guest' | 'ops'

export interface DemoAccount {
  readonly id: DemoAccountRole
  readonly role: DemoAccountRole
  readonly email: string
  readonly password: string
  readonly landingPath: '/my' | '/operations'
  readonly labelZh: string
  readonly labelEn: string
  readonly descriptionZh: string
  readonly descriptionEn: string
}

type DemoEnv = Record<string, string | boolean | undefined>

function textValue(value: string | boolean | undefined) {
  return typeof value === 'string' ? value.trim() : ''
}

export function readDemoAccounts(env: DemoEnv): readonly DemoAccount[] {
  if (String(env.VITE_SHOW_DEMO_ACCOUNTS).toLowerCase() !== 'true') return []

  const guestEmail = textValue(env.VITE_DEMO_GUEST_EMAIL)
  const guestPassword = textValue(env.VITE_DEMO_GUEST_PASSWORD)
  if (!guestEmail || !guestPassword) return []

  return [
    {
      id: 'guest',
      role: 'guest',
      email: guestEmail,
      password: guestPassword,
      landingPath: '/my',
      labelZh: '住客演示',
      labelEn: 'Guest demo',
      descriptionZh: '保存探索卡、提交体验意向并查看处理结果',
      descriptionEn: 'Save an exploration card, submit an interest and view its status',
    },

  ]
}

export function resolveLoginTarget(next: string | null, role: DemoAccountRole | undefined) {
  if (next?.startsWith('/') && !next.startsWith('//')) return next
  return role === 'ops' ? '/operations' : '/my'
}

export const demoAccounts = readDemoAccounts(import.meta.env)
