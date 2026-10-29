// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createElement } from 'react'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { LanguageProvider, useLanguage } from '../src/lib/i18n'

function LanguageControl() {
  const { language, setLanguage } = useLanguage()
  return createElement('button', { onClick: () => setLanguage('en') }, language)
}

afterEach(() => { cleanup(); vi.restoreAllMocks(); window.localStorage.clear() })

describe('language preference when browser storage is unavailable', () => {
  it('renders and switches language when access to storage is blocked', () => {
    vi.spyOn(window, 'localStorage', 'get').mockImplementation(() => {
      throw new DOMException('Storage blocked', 'SecurityError')
    })
    render(createElement(LanguageProvider, null, createElement(LanguageControl)))
    fireEvent.click(screen.getByRole('button', { name: 'zh' }))
    expect(screen.getByRole('button', { name: 'en' })).toBeTruthy()
    expect(document.documentElement.lang).toBe('en')
  })

  it('keeps a language change when storage writes fail', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('Quota exceeded', 'QuotaExceededError')
    })
    render(createElement(LanguageProvider, null, createElement(LanguageControl)))
    fireEvent.click(screen.getByRole('button', { name: 'zh' }))
    expect(screen.getByRole('button', { name: 'en' })).toBeTruthy()
    expect(document.title).toContain('Wanniang')
  })
})
