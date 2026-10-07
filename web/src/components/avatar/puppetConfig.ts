/**
 * 婉娘 puppet 数字人的资产与锚点配置。
 * 锚点数值由 scripts/postprocess_avatar.py 生成（anchors.json），
 * 以 base.webp 的 1024x1472 像素坐标系为基准，组件内换算为百分比定位。
 *
 * 口型贴片已停用：raw/mouths.png 与 raw/base.png 并非同源图像，
 * 原图下唇与唇角无法被覆盖，且色域不一致（素材偏暖粉、base 偏中性橄榄），
 * offset-only 色彩校正无法消除；扩大嘴部盒只会把暖色块铺得更大。
 * 证伪过程见 docs/evidence/mouth-sprite-falsification/，结论见 docs/13 的 P1-1。
 * 若将来恢复口型，必须从 base 同源重绘嘴部帧，不得复用旧贴片。
 */

export const PUPPET_ASSET_BASE = '/avatar/wanniang-puppet'

export const PUPPET_BASE_SIZE = { width: 1024, height: 1472 } as const

/** 眼部贴片精灵格序，与 eyes.webp 横向排列一致（仅闭眼/半闭，睁眼用 base 原图）。 */
export const EYE_CELLS = ['closed', 'half'] as const

export const EYE_ANCHOR = { leftCx: 452, rightCx: 576, cy: 307, w: 100, h: 50 } as const

export const EYE_CELL_COUNT = EYE_CELLS.length

/** 眨眼间隔区间 [min, max] ms，按状态区分；lively 节奏整体加快。 */
export const BLINK_INTERVALS: Record<string, readonly [number, number]> = {
  idle: [3000, 5000],
  listening: [2600, 4200],
  thinking: [5500, 7700],
  speaking: [2000, 3500],
  paused: [4000, 6000],
  error: [4000, 6000],
}

export function blinkInterval(state: string, pace: string): readonly [number, number] {
  const range = BLINK_INTERVALS[state] ?? BLINK_INTERVALS.idle
  if (pace === 'lively') return [range[0] * 0.8, range[1] * 0.8]
  return range
}

/** 锚点像素坐标 → 相对 base 的百分比定位。 */
export function anchorToPercent(anchor: { cx: number; cy: number; w: number; h: number }) {
  return {
    left: ((anchor.cx - anchor.w / 2) / PUPPET_BASE_SIZE.width) * 100,
    top: ((anchor.cy - anchor.h / 2) / PUPPET_BASE_SIZE.height) * 100,
    width: (anchor.w / PUPPET_BASE_SIZE.width) * 100,
    aspect: anchor.w / anchor.h,
  }
}

/** 精灵格 → background-position 百分比（配合 background-size: N*100% 100%）。 */
export function spritePositionX(cell: number, count: number): string {
  if (count <= 1) return '0%'
  return `${(cell / (count - 1)) * 100}%`
}
