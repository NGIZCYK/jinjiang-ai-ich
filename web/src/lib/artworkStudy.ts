export const FLORAL_ARTWORK = {
  image: '/assets/suxiu-floral-huayun-20261103.webp',
  width: 1080,
  height: 1880,
  detailSize: 400,
  source: 'https://www.cnacs.net.cn/89/202409/6430.html',
}

export const FLORAL_SPOTS = [
  { id: 'huayun-pink-petal', xPct: 34, yPct: 60,
    labelZh: '粉瓣晕色', labelEn: 'Pink petal gradients',
    descZh: '沿着粉色花瓣观察由浅到深的过渡，留意线向如何顺着花瓣展开。',
    descEn: 'Follow the transition from pale to deeper pink and notice how the threads follow the petals.' },
  { id: 'huayun-white-petal', xPct: 65, yPct: 46,
    labelZh: '白瓣明暗', labelEn: 'Light on white petals',
    descZh: '比较白色花瓣上的亮部与淡紫阴影，观察浅色之间细微的层次。',
    descEn: 'Compare the white highlights and pale violet shadows, noticing subtle layers within light colours.' },
  { id: 'huayun-stamen', xPct: 80, yPct: 66,
    labelZh: '花蕊细节', labelEn: 'Stamen details',
    descZh: '观察橙红花蕊与浅色花瓣的对比，比较短线聚集形成的疏密变化。',
    descEn: 'Observe the orange-red centre against the pale petals and compare the density of the short threads.' },
  { id: 'huayun-ground', xPct: 24, yPct: 12,
    labelZh: '背景线向', labelEn: 'Background thread direction',
    descZh: '回看浅紫背景中交叠的线向，比较它与花瓣轮廓、色阶的关系。',
    descEn: 'Look at the overlapping directions in the violet ground and compare them with the petal contours and tones.' },
] as const

export type ArtworkPoint = { xPct: number; yPct: number }
const clamp = (n: number, low: number, high: number) => Math.max(low, Math.min(high, n))

/** One source-space crop drives both the SVG detail and the overview rectangle. */
export function artworkCrop(point: ArtworkPoint) {
  const { width, height, detailSize: size } = FLORAL_ARTWORK
  const x = Number.isFinite(point.xPct) ? point.xPct : 50
  const y = Number.isFinite(point.yPct) ? point.yPct : 50
  return { left: clamp(x / 100 * width - size / 2, 0, width - size),
    top: clamp(y / 100 * height - size / 2, 0, height - size), size }
}

/** Ignore padding outside the actual displayed image rather than shifting coordinates. */
export function pointOnArtwork(clientX: number, clientY: number, rect: Pick<DOMRect, 'left' | 'top' | 'width' | 'height'>): ArtworkPoint | null {
  if (rect.width <= 0 || rect.height <= 0) return null
  const x = (clientX - rect.left) / rect.width, y = (clientY - rect.top) / rect.height
  if (x < 0 || x > 1 || y < 0 || y > 1) return null
  return { xPct: x * 100, yPct: y * 100 }
}
