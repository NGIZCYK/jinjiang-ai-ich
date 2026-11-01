import type { ReactNode } from 'react'

function Glyph({ children }: { children: ReactNode }) {
  return <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">{children}</svg>
}

export function OverviewIcon() {
  return <Glyph><rect x="3.5" y="3.5" width="6.5" height="6.5" rx="1.2" /><rect x="14" y="3.5" width="6.5" height="6.5" rx="1.2" /><rect x="3.5" y="14" width="6.5" height="6.5" rx="1.2" /><rect x="14" y="14" width="6.5" height="6.5" rx="1.2" /></Glyph>
}

export function ExperiencesIcon() {
  return <Glyph><path d="M4 6.5h16M4 12h16M4 17.5h10" /><circle cx="19" cy="17.5" r="1.6" /></Glyph>
}

export function StudioIcon() {
  return <Glyph><path d="M4 20h16" /><path d="M6.5 16.5 16 7a2.1 2.1 0 0 1 3 3l-9.5 9.5L5 20l1.5-3.5Z" /></Glyph>
}

export function InsightsIcon() {
  return <Glyph><path d="M4 20V4M4 20h16" /><path d="M8 16v-4M12 16V8M16 16v-6" /></Glyph>
}

export function ExternalIcon() {
  return <Glyph><path d="M14 5h5v5" /><path d="m19 5-8 8" /><path d="M18 14v4.5a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 4 18.5v-11A1.5 1.5 0 0 1 5.5 6H10" /></Glyph>
}

export function CloseIcon() {
  return <Glyph><path d="m6 6 12 12M18 6 6 18" /></Glyph>
}

export function ChevronIcon() {
  return <Glyph><path d="m8 10 4 4 4-4" /></Glyph>
}
