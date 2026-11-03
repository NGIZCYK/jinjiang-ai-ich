// @vitest-environment jsdom
import { afterEach, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { LobbyConciergeScene } from '../src/components/LobbyConciergeScene'
import { SilkFormStudy, SILK_FORM_IMAGE } from '../src/components/SilkFormStudy'

afterEach(cleanup)
it('studies form using bounded crops of the same artwork without changing a chosen palette', () => {
  const onExplore = vi.fn()
  const { container } = render(<MemoryRouter><LobbyConciergeScene language="zh" active="silk" focusRequest={0} onSelect={() => {}} onExplore={onExplore} /></MemoryRouter>)
  fireEvent.click(screen.getByRole('button', { name: '取色', exact: true }))
  fireEvent.click(screen.getByRole('button', { name: '选择漆朱荷粉' }))
  expect(onExplore).toHaveBeenLastCalledWith({ palette: 'rose' })
  onExplore.mockClear()
  fireEvent.click(screen.getByRole('button', { name: '丝光', exact: true }))
  expect(screen.getByRole('img', { name: '丝光 · 以线塑形' }).getAttribute('src')).toBe(SILK_FORM_IMAGE)
  const crops = new Set<string>()
  for (const name of ['看线向', '看色阶', '看层次']) {
    const button = screen.getByRole('button', { name, exact: true })
    fireEvent.click(button)
    expect(button.getAttribute('aria-pressed')).toBe('true')
    const detail = screen.getByRole('img', { name: `${name}：同一花瓣绣品的局部` })
    const crop = detail.getAttribute('viewBox')!
    crops.add(crop)
    const [x, y, width, height] = crop.split(' ').map(Number)
    expect(x).toBeGreaterThanOrEqual(0); expect(y).toBeGreaterThanOrEqual(0)
    expect(x + width).toBeLessThanOrEqual(1920); expect(y + height).toBeLessThanOrEqual(1280)
    expect(detail.querySelector('image')?.getAttribute('href')).toBe(SILK_FORM_IMAGE)
  }
  expect(crops.size).toBe(3)
  expect(onExplore).not.toHaveBeenCalled()
  expect(screen.queryByRole('button', { name: '左侧光' })).toBeNull()
  expect(container.querySelector('.silk-light-options')).toBeNull()
  fireEvent.click(screen.getByRole('button', { name: '取色', exact: true }))
  expect(screen.getByRole('button', { name: '选择漆朱荷粉' }).getAttribute('aria-pressed')).toBe('true')
})
it('localises the selected study without resetting the observation', () => {
  const { rerender } = render(<SilkFormStudy isZh />)
  fireEvent.click(screen.getByRole('button', { name: '看层次' }))
  rerender(<SilkFormStudy isZh={false} />)
  expect(screen.getByRole('button', { name: 'Overlapping layers' }).getAttribute('aria-pressed')).toBe('true')
  expect(screen.getByRole('img', { name: /Overlapping layers: a detail/ })).toBeTruthy()
  expect(screen.getByText(/boundaries where petals overlap/)).toBeTruthy()
})
