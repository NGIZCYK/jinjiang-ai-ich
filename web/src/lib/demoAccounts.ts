export type DemoAccountRole = 'guest' | 'ops'

export interface DemoAccount {
  readonly id: DemoAccountRole
  readonly role: DemoAccountRole
  readonly email: string
  readonly password: string
  readonly landingPath: '/'
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
  const opsEmail = textValue(env.VITE_DEMO_OPS_EMAIL)
  const opsPassword = textValue(env.VITE_DEMO_OPS_PASSWORD)
  if (!guestEmail || !guestPassword || !opsEmail || !opsPassword) return []

  return [
    {
      id: 'guest',
      role: 'guest',
      email: guestEmail,
      password: guestPassword,
      landingPath: '/',
      labelZh: '住客账户',
      labelEn: 'Guest account',
      descriptionZh: '保存探索卡、提交体验意向并查看处理结果',
      descriptionEn: 'Save an exploration card, submit an interest and view its status',
    },
    {
      id: 'ops',
      role: 'ops',
      email: opsEmail,
      password: opsPassword,
      landingPath: '/',
      labelZh: '运营账户',
      labelEn: 'Operations account',
      descriptionZh: '处理体验意向并查看运营数据',
      descriptionEn: 'Process experience requests and review operations data',
    },
  ]
}

export function resolveLoginTarget() {
  return '/'
}

export const demoAccounts = readDemoAccounts(import.meta.env)
