import type { Language } from './i18n'

const messages: Record<string, [string, string]> = {
  CAPACITY_EXCEEDED: ['该场次名额不足，请减少人数或选择其他场次。', 'Not enough places. Reduce the party size or choose another session.'],
  DUPLICATE_INTENTION: ['你已提交过该场次，请在下方查看处理结果。', 'You already have a request for this session. Check its status below.'],
  SESSION_UNAVAILABLE: ['该场次已结束或暂不可用，请刷新后重新选择。', 'This session is no longer available. Refresh and choose another.'],
  SIGN_IN_REQUIRED: ['请先登录，再继续操作。', 'Sign in before continuing.'],
  FORBIDDEN: ['当前账号没有此操作权限，请核对登录身份。', 'This account cannot perform this action. Check your signed-in role.'],
  INVALID_TRANSITION: ['记录状态已变化，请刷新后再操作。', 'The request status has changed. Refresh before continuing.'],
  REASON_REQUIRED: ['请填写未通过的原因，让住客知道如何调整。', 'Enter a decline reason so the guest knows what to change.'],
  INVALID_PARTY_SIZE: ['参与人数须为 1 至 8 人。', 'Party size must be between 1 and 8.'],
  PARTICIPANT_HAS_ACTIVITY: ['该参与者已有活动记录，不能再调整批次。', 'This participant has activity and their cohort is locked.'],
  COMPLETED_BOOKING_REQUIRED: ['流程完成后才能提交反馈，请先查看最新状态。', 'Feedback is available after completion. Check the current status.'],
  NO_MATCH: ['该体验不再符合当前需求，请重新获取推荐。', 'This experience no longer matches. Get a new recommendation.'],
  RATE_LIMIT: ['操作较频繁，请稍后重试。', 'Too many requests. Try again shortly.'],
}

export function actionError(error: unknown, language: Language) {
  const raw = error instanceof Error ? error.message : String((error as { message?: string })?.message ?? error)
  const known = Object.keys(messages).find(code => raw.includes(code))
  if (known) return messages[known][language === 'zh' ? 0 : 1]
  if (/failed to fetch|network|load failed|timeout|fetch failed/i.test(raw)) return language === 'zh'
    ? '连接暂时中断，请检查网络后重试。已填写的内容会保留。'
    : 'Connection interrupted. Check your network and retry; your entries are retained.'
  if (/Invalid login credentials/i.test(raw)) return language === 'zh' ? '邮箱或密码不正确，请核对后重试。' : 'Check your email and password and try again.'
  if (/Email not confirmed/i.test(raw)) return language === 'zh' ? '请先通过邮箱中的链接确认账号，再登录。' : 'Confirm your email before signing in.'
  if (/^[A-Z_]+$/.test(raw) || !raw) return language === 'zh' ? '暂时无法完成，请刷新记录后重试。' : 'Unable to finish. Refresh the records and retry.'
  return raw
}
