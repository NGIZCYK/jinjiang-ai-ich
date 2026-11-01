import { useEffect, useId, useRef } from 'react'
import type { ChatMode } from '../lib/llm'
import type { Language } from '../lib/i18n'

export interface GuideSettingsCopy {
  settings: string
  mode: string
  demo: string
  deepseek: string
  fallback: string
  ttsModeLabel: string
  ttsViseme: string
  ttsBrowser: string
  ttsUnavailable: string
  speak: string
  knowledge: string
  notice: string
  privacy: string
  privacyBody: string
  clear: string
  clearAll: string
}

interface Props {
  open: boolean
  onClose: () => void
  language: Language
  copy: GuideSettingsCopy
  replyMode: ChatMode
  ttsMode: 'browser' | 'viseme' | 'unavailable'
  speak: boolean
  onSpeakChange: (enabled: boolean) => void
  signedIn: boolean
  loading: boolean
  onClear: (scope: 'current' | 'all') => void
}

/** One quiet place for the guide's technical and privacy controls. */
export function GuideSettings({ open, onClose, language, copy, replyMode, ttsMode, speak, onSpeakChange, signedIn, loading, onClear }: Props) {
  const zh = language === 'zh'
  const dialogRef = useRef<HTMLDialogElement>(null)
  const titleId = useId()

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return undefined
    if (!open) {
      if (dialog.open) dialog.close?.()
      dialog.removeAttribute('open')
      return undefined
    }
    const previousOverflow = document.body.style.overflow
    const active = document.activeElement instanceof HTMLElement ? document.activeElement : null
    document.body.style.overflow = 'hidden'
    try { dialog.showModal?.() } catch { /* The open attribute is the fallback. */ }
    if (!dialog.open) dialog.setAttribute('open', '')
    dialog.querySelector<HTMLElement>('[data-guide-settings-close]')?.focus()
    return () => {
      document.body.style.overflow = previousOverflow
      if (dialog.open) dialog.close?.()
      dialog.removeAttribute('open')
      active?.focus?.()
    }
  }, [open])

  const answerMode = replyMode === 'deepseek' ? copy.deepseek : replyMode === 'fallback' ? copy.fallback : copy.demo
  const voiceMode = ttsMode === 'viseme' ? copy.ttsViseme : ttsMode === 'browser' ? copy.ttsBrowser : copy.ttsUnavailable

  return <dialog
    ref={dialogRef}
    className="guide-settings-dialog"
    aria-modal="true"
    aria-labelledby={titleId}
    onCancel={event => { event.preventDefault(); onClose() }}
    onKeyDown={event => {
      if (event.key === 'Escape') { event.preventDefault(); onClose(); return }
      if (event.key !== 'Tab') return
      const items = Array.from(event.currentTarget.querySelectorAll<HTMLElement>('button:not([disabled]),input:not([disabled]),a[href],summary'))
      const first = items[0]
      const last = items[items.length - 1]
      if (!first || !last) return
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
    }}
    onClick={event => {
      if (event.target !== event.currentTarget) return
      const bounds = event.currentTarget.getBoundingClientRect()
      if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) onClose()
    }}
  >
    <div className="guide-settings-panel">
      <header className="guide-settings-head">
        <h2 id={titleId}>{copy.settings}</h2>
        <button type="button" data-guide-settings-close onClick={onClose} aria-label={zh ? '关闭导览设置' : 'Close guide settings'}>×</button>
      </header>
      <div className="guide-settings-body">
        <div className="guide-settings-row"><span>{copy.mode}</span><strong>{answerMode}</strong></div>
        <div className="guide-settings-row"><span>{copy.ttsModeLabel}</span><strong>{voiceMode}</strong></div>
        <label className="guide-settings-check">
          <input type="checkbox" checked={speak} onChange={event => onSpeakChange(event.target.checked)} />
          <span>{copy.speak}</span>
        </label>
        <p className="guide-settings-note">{copy.knowledge}</p>
        {!signedIn && <p className="guide-settings-note">{copy.notice}</p>}
        <details className="guide-settings-privacy">
          <summary>{copy.privacy}</summary>
          <p>{copy.privacyBody}</p>
        </details>
        <div className="guide-settings-clear">
          <button type="button" disabled={loading} onClick={() => onClear('current')}>{copy.clear}</button>
          <button type="button" disabled={loading} onClick={() => onClear('all')}>{copy.clearAll}</button>
        </div>
      </div>
    </div>
  </dialog>
}
