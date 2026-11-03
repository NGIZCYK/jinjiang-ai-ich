// @vitest-environment jsdom
import { afterEach, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { ArtworkStudy } from '../src/components/ArtworkStudy'
import { FLORAL_ARTWORK, FLORAL_SPOTS, artworkCrop, pointOnArtwork } from '../src/lib/artworkStudy'
import { LEGACY_MOTIFS, MOTIFS, progress } from '../src/lib/journey'

afterEach(cleanup)
it('maps only the image rectangle at different display scales and clamps crops to native bounds', () => {
  for (const scale of [.2, .34, .5]) {
    const rect = { left: 100, top: 80, width: 1080 * scale, height: 1880 * scale }
    const mapped = pointOnArtwork(100 + rect.width * .34, 80 + rect.height * .6, rect)!
    expect(mapped.xPct).toBeCloseTo(34); expect(mapped.yPct).toBeCloseTo(60)
    expect(pointOnArtwork(99, 80, rect)).toBeNull()
    expect(pointOnArtwork(100 + rect.width + 1, 80, rect)).toBeNull()
  }
  expect(pointOnArtwork(0, 0, { left: 0, top: 0, width: 0, height: 0 })).toBeNull()
  expect(artworkCrop({ xPct: -100, yPct: -100 })).toEqual({ left: 0, top: 0, size: 400 })
  expect(artworkCrop({ xPct: 200, yPct: 200 })).toEqual({ left: 680, top: 1480, size: 400 })
})
it('uses the same crop for the marker and detail at every labelled observation point', () => {
  const onExplore = vi.fn()
  const { container } = render(<ArtworkStudy language="zh" focusRequest={0} onExplore={onExplore} />)
  for (const spot of FLORAL_SPOTS) {
    fireEvent.click(screen.getByRole('button', { name: new RegExp(spot.labelZh) }))
    const crop = artworkCrop(spot)
    expect(screen.getByRole('img', { name: '与全图观察框对应的原图局部' }).getAttribute('viewBox')).toBe(`${crop.left} ${crop.top} 400 400`)
    const marker = container.querySelector('.floral-crop-marker') as HTMLElement
    expect(parseFloat(marker.style.left)).toBeCloseTo(crop.left / 1080 * 100)
    expect(parseFloat(marker.style.top)).toBeCloseTo(crop.top / 1880 * 100)
    expect(onExplore).toHaveBeenLastCalledWith({ motif: spot.id })
  }
  expect(container.querySelector('svg image')?.getAttribute('href')).toBe(FLORAL_ARTWORK.image)
})
it('supports arbitrary image clicks, edge crops and keyboard adjustments without guessing a motif', () => {
  const onExplore = vi.fn()
  const { container } = render(<ArtworkStudy language="zh" focusRequest={0} onExplore={onExplore} />)
  const image = container.querySelector('.floral-canvas img') as HTMLImageElement
  image.getBoundingClientRect = () => ({ left: 20, top: 40, width: 300, height: 522 } as DOMRect)
  const canvas = screen.getByRole('button', { name: '在全图中选择观察位置' })
  fireEvent.click(canvas, { detail: 1, clientX: 320, clientY: 562 })
  const detail = screen.getByRole('img', { name: '与全图观察框对应的原图局部' })
  expect(detail.getAttribute('viewBox')).toBe('680 1480 400 400')
  expect(onExplore).not.toHaveBeenCalled()
  fireEvent.keyDown(canvas, { key: 'ArrowLeft' })
  fireEvent.keyDown(canvas, { key: 'Home' })
  expect(onExplore).toHaveBeenLastCalledWith({ motif: FLORAL_SPOTS[0].id })
  const crop = artworkCrop(FLORAL_SPOTS[0])
  expect(detail.getAttribute('viewBox')).toBe(`${crop.left} ${crop.top} 400 400`)
  fireEvent.keyDown(canvas, { key: 'ArrowRight' })
  expect(detail.getAttribute('viewBox')).not.toBe(`${crop.left} ${crop.top} 400 400`)
})
it('resets on a focus request, localises labels, and reports a missing image honestly', () => {
  const { container, rerender } = render(<ArtworkStudy language="zh" focusRequest={0} />)
  fireEvent.click(screen.getByRole('button', { name: /花蕊细节/ }))
  rerender(<ArtworkStudy language="en" focusRequest={1} />)
  expect(screen.getByRole('button', { name: /Pink petal gradients/ }).getAttribute('aria-pressed')).toBe('true')
  expect(screen.getByRole('button', { name: 'Choose an observation position on the artwork' })).toBeTruthy()
  fireEvent.error(container.querySelector('.floral-canvas img')!)
  expect(screen.getByRole('status').textContent).toContain('could not load')
  expect(screen.queryByRole('img', { name: /Source image detail/ })).toBeNull()
})
it('keeps legacy labels and completion semantics alongside new floral choices', () => {
  for (const motif of [...LEGACY_MOTIFS, ...FLORAL_SPOTS.map(s => [s.id, s.labelZh, s.labelEn])]) {
    expect(MOTIFS.find(m => m[0] === motif[0])).toEqual(motif)
    expect(progress({ motif: motif[0], palette: 'jade', levels: ['full', '1/4'], answer: 'relative' })).toBe(3)
  }
  expect(progress({ motif: 'fake', palette: 'jade', levels: ['full', '1/4'], answer: 'relative' })).toBe(2)
})
