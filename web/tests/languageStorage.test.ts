// @vitest-environment jsdom
import { createElement } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { LanguageProvider, useLanguage } from '../src/lib/i18n'

function Controls() {
  const { language, setLanguage } = useLanguage()
  return createElement('div', null, createElement('p', null, language), createElement('button', { onClick: () => setLanguage(language === 'zh' ? 'en' : 'zh') }, 'Switch language'))
}
beforeEach(() => { localStorage.clear(); window.history.replaceState({}, '', '/') })
afterEach(() => { cleanup(); vi.restoreAllMocks() })

describe('language changes without browser persistence', () => {
  it('keeps the application usable when storage reads and writes are denied', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new DOMException('Denied', 'SecurityError') })
    const write = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new DOMException('Denied', 'SecurityError') })
    render(createElement(LanguageProvider, null, createElement(Controls)))
    expect(screen.getByText('zh')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Switch language' }))
    expect(screen.getByText('en')).toBeTruthy()
    expect(document.documentElement.lang).toBe('en')
    expect(document.title).toContain('Wanniang')
    expect(write).toHaveBeenCalledTimes(2)
  })

  it('honours an explicit URL language when storage is full', () => {
    window.history.replaceState({}, '', '/guide?lang=en')
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new DOMException('Full', 'QuotaExceededError') })
    render(createElement(LanguageProvider, null, createElement(Controls)))
    expect(screen.getByText('en')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Switch language' }))
    expect(screen.getByText('zh')).toBeTruthy()
    expect(document.documentElement.lang).toBe('zh-CN')
  })
})
