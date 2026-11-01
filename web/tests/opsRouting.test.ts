// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createElement } from 'react'
import { cleanup, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { LanguageProvider } from '../src/lib/i18n'
import { useAppStore } from '../src/lib/store'
import { LegacyOpsRedirect } from '../src/components/ops/LegacyOpsRedirect'
import { RequireOps } from '../src/components/ops/RequireOps'

function LocationProbe() {
  const location = useLocation()
  return createElement('div', null, `${location.pathname}|${location.search}|${location.hash}`)
}

function showShell(initial: string) {
  return render(createElement(LanguageProvider, null, createElement(MemoryRouter, { initialEntries: [initial] }, createElement(Routes, null,
    createElement(Route, { path: '/operations', element: createElement(LegacyOpsRedirect, { to: '/ops/experiences' }) }),
    createElement(Route, { path: '/ops/experiences', element: createElement(LocationProbe) }),
  ))))
}

beforeEach(() => {
  localStorage.clear()
  sessionStorage.clear()
  useAppStore.setState({ ready: true, user: null, authError: '' })
})

afterEach(cleanup)

describe('operations routing and access', () => {
  it('redirects the old operations URL and keeps its query and hash', () => {
    showShell('/operations?status=pending#top')
    expect(screen.getByText('/ops/experiences|?status=pending|#top')).toBeTruthy()
  })

  it('sends signed-out visitors to sign in with the operations return path', () => {
    render(createElement(LanguageProvider, null, createElement(MemoryRouter, { initialEntries: ['/ops'] }, createElement(Routes, null,
      createElement(Route, { path: '/ops', element: createElement(RequireOps, null, createElement('div', null, 'workspace')) }),
      createElement(Route, { path: '/auth', element: createElement(LocationProbe) }),
    ))))
    expect(screen.getByText('/auth|?next=%2Fops|')).toBeTruthy()
  })

  it('shows the operations gate to a signed-in guest', () => {
    useAppStore.setState({ ready: true, user: { id: 'guest-1', name: 'Guest', role: 'guest', email: 'guest@example.test' }, authError: '' })
    render(createElement(LanguageProvider, null, createElement(MemoryRouter, { initialEntries: ['/ops'] }, createElement(RequireOps, null, createElement('div', null, 'workspace')))))
    expect(screen.getByText('此页面仅向酒店运营开放。请使用运营账号登录。')).toBeTruthy()
    expect(screen.queryByText('workspace')).toBeNull()
  })

  it('renders the workspace for an operations account', () => {
    useAppStore.setState({ ready: true, user: { id: 'ops-1', name: 'Operator', role: 'ops', email: 'ops@example.test' }, authError: '' })
    render(createElement(LanguageProvider, null, createElement(MemoryRouter, { initialEntries: ['/ops'] }, createElement(RequireOps, null, createElement('div', null, 'workspace')))))
    expect(screen.getByText('workspace')).toBeTruthy()
  })
})
