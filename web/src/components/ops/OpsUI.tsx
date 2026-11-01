import { useEffect, useId, useRef, type ReactNode, type RefObject } from 'react'
import type { BookingStatus } from '../../lib/journey'
import { statusLabel } from '../../lib/journey'
import type { Language } from '../../lib/i18n'

export function OpsPageHeader({ eyebrow, title, description, actions }: {
  eyebrow: string
  title: string
  description?: string
  actions?: ReactNode
}) {
  return <header className="ops-page-head">
    <div className="ops-page-head-copy">
      <p className="ops-eyebrow">{eyebrow}</p>
      <h1>{title}</h1>
      {description && <p className="ops-page-desc">{description}</p>}
    </div>
    {actions && <div className="ops-page-actions">{actions}</div>}
  </header>
}

export function OpsStatus({ status, language }: { status: BookingStatus; language: Language }) {
  return <span className={`ops-status ops-status-${status}`}>
    <span className="ops-status-dot" aria-hidden="true" />
    {statusLabel(status, language)}
  </span>
}

export function OpsKpi({ label, value, meta }: { label: string; value: ReactNode; meta?: ReactNode }) {
  return <div className="ops-kpi">
    <span className="ops-kpi-label">{label}</span>
    <strong className="ops-kpi-value">{value}</strong>
    {meta && <span className="ops-kpi-meta">{meta}</span>}
  </div>
}

export function OpsEmpty({ title, children, action }: { title: string; children?: ReactNode; action?: ReactNode }) {
  return <div className="ops-empty">
    <span className="ops-empty-mark" aria-hidden="true">·</span>
    <strong>{title}</strong>
    {children && <p>{children}</p>}
    {action}
  </div>
}

export function OpsNotice({ children, error = false }: { children: ReactNode; error?: boolean }) {
  return <div className={`ops-notice ${error ? 'is-error' : ''}`} role={error ? 'alert' : 'status'}>{children}</div>
}

export interface OpsTabItem { id: string; label: string; count?: number }

export function OpsTabs({ items, value, onChange, label }: {
  items: OpsTabItem[]
  value: string
  onChange: (id: string) => void
  label: string
}) {
  return <div className="ops-tabs" role="tablist" aria-label={label}>
    {items.map(item => <button
      key={item.id}
      type="button"
      role="tab"
      aria-selected={value === item.id}
      className="ops-tab"
      onClick={() => onChange(item.id)}
    >
      {item.label}
      {typeof item.count === 'number' && <span className="ops-tab-count">{item.count}</span>}
    </button>)}
  </div>
}

export function OpsSegmented({ items, value, onChange, label }: {
  items: OpsTabItem[]
  value: string
  onChange: (id: string) => void
  label: string
}) {
  return <div className="ops-segmented" role="group" aria-label={label}>
    {items.map(item => <button
      key={item.id}
      type="button"
      aria-pressed={value === item.id}
      className="ops-segment"
      onClick={() => onChange(item.id)}
    >
      {item.label}
      {typeof item.count === 'number' && <span>{item.count}</span>}
    </button>)}
  </div>
}

function useModalDialog(open: boolean, dialogRef: RefObject<HTMLDialogElement | null>) {
  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return undefined
    if (!open) {
      if (dialog.open) dialog.close?.()
      return undefined
    }
    const previousOverflow = document.body.style.overflow
    const active = document.activeElement instanceof HTMLElement ? document.activeElement : null
    document.body.style.overflow = 'hidden'
    try { dialog.showModal?.() } catch { /* Fall back to the open attribute. */ }
    if (!dialog.open) dialog.setAttribute('open', '')
    const focusable = dialog.querySelector<HTMLElement>('[data-ops-autofocus],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),a[href]')
    focusable?.focus()
    return () => {
      document.body.style.overflow = previousOverflow
      if (dialog.open) dialog.close?.()
      active?.focus?.()
    }
  }, [open, dialogRef])
}

export function OpsDrawer({ open, onClose, title, subtitle, children, footer }: {
  open: boolean
  onClose: () => void
  title: string
  subtitle?: ReactNode
  children: ReactNode
  footer?: ReactNode
}) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const titleId = useId()
  useModalDialog(open, dialogRef)
  return <dialog
    ref={dialogRef}
    className="ops-drawer"
    aria-modal="true"
    aria-labelledby={titleId}
    onCancel={event => { event.preventDefault(); onClose() }}
    onClick={event => {
      if (event.target !== event.currentTarget) return
      const bounds = event.currentTarget.getBoundingClientRect()
      if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) onClose()
    }}
    onKeyDown={event => {
      if (event.key === 'Escape') { event.preventDefault(); onClose(); return }
      if (event.key !== 'Tab') return
      const items = Array.from(event.currentTarget.querySelectorAll<HTMLElement>('button:not([disabled]),select:not([disabled]),input:not([disabled]),textarea:not([disabled]),a[href],[tabindex="0"]'))
      const first = items[0]
      const last = items[items.length - 1]
      if (!first || !last) return
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
    }}
  >
    <div className="ops-drawer-panel">
      <header className="ops-drawer-head">
        <div>
          <h2 id={titleId}>{title}</h2>
          {subtitle && <div className="ops-drawer-sub">{subtitle}</div>}
        </div>
        <button type="button" className="ops-icon-button" onClick={onClose} aria-label="关闭 / Close">×</button>
      </header>
      <div className="ops-drawer-body">{children}</div>
      {footer && <footer className="ops-drawer-foot">{footer}</footer>}
    </div>
  </dialog>
}

export function OpsSheet({ open, onClose, title, children }: {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
}) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const titleId = useId()
  useModalDialog(open, dialogRef)
  return <dialog
    ref={dialogRef}
    className="ops-sheet"
    aria-modal="true"
    aria-labelledby={titleId}
    onCancel={event => { event.preventDefault(); onClose() }}
    onClick={event => {
      if (event.target !== event.currentTarget) return
      const bounds = event.currentTarget.getBoundingClientRect()
      if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) onClose()
    }}
  >
    <div className="ops-sheet-panel">
      <header className="ops-sheet-head">
        <h2 id={titleId}>{title}</h2>
        <button type="button" className="ops-icon-button" onClick={onClose} aria-label="关闭 / Close">×</button>
      </header>
      <div className="ops-sheet-body">{children}</div>
    </div>
  </dialog>
}
