import { Link } from 'react-router-dom'
import { useLanguage } from '../lib/i18n'

/** A labelled hand-off from the operations workspace to the real guest view. */
export function OpsPreviewBar() {
  const { language } = useLanguage()
  const zh = language === 'zh'
  return <div className="ops-preview-bar" role="note">
    <span className="ops-preview-tag">{zh ? '运营预览 · 住客端' : 'Operations preview · Guest site'}</span>
    <span className="ops-preview-text">{zh ? '正在以运营账号查看住客端。' : 'Viewing the guest site with an operations account.'}</span>
    <Link to="/ops">{zh ? '返回运营工作区' : 'Back to operations'} <span aria-hidden="true">→</span></Link>
  </div>
}
