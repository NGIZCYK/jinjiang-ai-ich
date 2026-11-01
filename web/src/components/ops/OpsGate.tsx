import { Link } from 'react-router-dom'
import { useLanguage } from '../../lib/i18n'

export function OpsGate({ state, detail }: { state: 'loading' | 'forbidden' | 'error'; detail?: string }) {
  const { language } = useLanguage()
  const zh = language === 'zh'
  return <div className="ops-gate">
    <div className="ops-gate-card">
      <span className="ops-gate-seal" aria-hidden="true">绣</span>
      <p className="ops-eyebrow">JINJIANG SUZHOU · OPERATIONS</p>
      <h1>{zh ? '运营工作台' : 'Operations workspace'}</h1>
      {state === 'loading' && <p role="status">{zh ? '正在恢复运营会话…' : 'Restoring your operations session…'}</p>}
      {state === 'forbidden' && <p>{zh ? '此页面仅向酒店运营开放。请使用运营账号登录。' : 'This area is available to hotel operations only. Sign in with an operations account.'}</p>}
      {state === 'error' && <>
        <p>{zh ? '暂时无法确认运营身份，请重新登录后重试。' : 'Your operations access could not be confirmed. Sign in again and retry.'}</p>
        {detail && <p className="ops-gate-detail">{detail}</p>}
      </>}
      <div className="ops-gate-actions">
        <Link className="ops-btn ops-btn-primary" to="/auth">{zh ? '前往登录' : 'Sign in'}</Link>
        <Link className="ops-btn ops-btn-secondary" to="/">{zh ? '返回住客首页' : 'Back to guest home'}</Link>
      </div>
    </div>
  </div>
}
