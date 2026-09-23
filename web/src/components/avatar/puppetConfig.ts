/**
 * 婉娘 puppet 数字人的资产与锚点配置。
 * 锚点数值由 scripts/postprocess_avatar.py 生成（anchors.json），
 * 以 base.webp 的 1024x1472 像素坐标系为基准，组件内换算为百分比定位。
 */

export const PUPPET_ASSET_BASE = '/avatar/wanniang-puppet'

export const PUPPET_BASE_SIZE = { width: 1024, height: 1472 } as const

/** 嘴型精灵格序，与 mouths.webp 横向排列一致。 */
export const MOUTH_CELLS = ['closed', 'a', 'aa', 'o', 'smile'] as const
/** 眼部贴片精灵格序，与 eyes.webp 横向排列一致（仅闭眼/半闭，睁眼用 base 原图）。 */
export const EYE_CELLS = ['closed', 'half'] as const

export const MOUTH_ANCHOR = { cx: 512, cy: 432, w: 142, h: 96 } as const
export const EYE_ANCHOR = { leftCx: 452, rightCx: 576, cy: 307, w: 100, h: 50 } as const

export const MOUTH_CELL_COUNT = MOUTH_CELLS.length
export const EYE_CELL_COUNT = EYE_CELLS.length

/**
 * 口型帧 → 精灵格映射（纯函数，供单测）。
 * open: 0 闭合 ~ 1 大张；form: -1 圆唇 ~ 1 展唇。
 */
export function selectMouthCell(open: number, form: number): number {
  if (open < 0.12) return 0 // closed（情绪层可在静默时改写为 smile）
  if (form < -0.3) return 3 // o 圆唇
  if (open > 0.55) return 2 // aa 大张
  if (form > 0.3) return 1 // smile 格只用于静默情绪，讲话时沿用微张格避免嘴型闪隐
  return 1 // a 微张
}

/** 静默时的嘴格：warm 情绪用抿笑，其余闭合。 */
export function restMouthCell(emotion: string): number {
  return emotion === 'warm' ? 4 : 0
}

/** 眨眼间隔区间 [min, max] ms，按状态区分；lively 节奏整体加快。 */
export const BLINK_INTERVALS: Record<string, readonly [number, number]> = {
  idle: [3000, 5000],
  listening: [2600, 4200],
  thinking: [5000, 7000],
  speaking: [2000, 3500],
  paused: [4000, 6000],
  error: [4000, 6000],
}

export function blinkInterval(state: string, pace: string): readonly [number, number] {
  const range = BLINK_INTERVALS[state] ?? BLINK_INTERVALS.idle
  if (pace === 'lively') return [range[0] * 0.8, range[1] * 0.8]
  return range
}

/** 口型切格滞回时长：目标格需持续该时长才切换，抑制帧间抖动。 */
export function mouthHysteresisMs(pace: string): number {
  return pace === 'lively' ? 20 : 30
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
