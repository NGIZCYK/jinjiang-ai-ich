// @vitest-environment jsdom
import { afterEach, expect, it } from 'vitest'
import { createElement } from 'react'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { LanguageProvider } from '../src/lib/i18n'
import { ImmersivePage } from '../src/pages/ImmersivePage'
import { useAppStore } from '../src/lib/store'

afterEach(cleanup)
it('keeps keyboard focus on the exhibit disclosure through open and close', () => {
  localStorage.clear(); sessionStorage.clear(); useAppStore.setState({ user: null })
  render(createElement(LanguageProvider, null, createElement(MemoryRouter, null, createElement(ImmersivePage))))
  const toggle = screen.getByRole('button', { name: /展开展签/ })
  const label = document.getElementById(toggle.getAttribute('aria-controls')!)!
  expect(label.hidden).toBe(true)
  toggle.focus(); fireEvent.click(toggle)
  expect(toggle.getAttribute('aria-expanded')).toBe('true')
  expect(label.hidden).toBe(false)
  expect(document.activeElement).toBe(toggle)
  fireEvent.click(toggle)
  expect(label.hidden).toBe(true)
  expect(document.activeElement).toBe(toggle)
  expect(screen.getByRole('link', { name: /继续向婉娘提问/ }).getAttribute('href')).toBe('/guide')
})
