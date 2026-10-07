import { describe, expect, it } from 'vitest'
import {
  anchorToPercent,
  blinkInterval,
  EYE_ANCHOR,
  PUPPET_BASE_SIZE,
  spritePositionX,
} from '../src/components/avatar/puppetConfig'

// 口型贴片用例已随功能停用一并移除（素材异源，无法合成，见 docs/13 的 P1-1）。
// 讲话时的可见动效改由下颚律动承担（.puppet-jaw + --jaw-open），属 CSS 行为。

describe('blinkInterval 眨眼调度区间', () => {
  it('speaking 比 idle 眨得更频繁', () => {
    const idle = blinkInterval('idle', 'calm')
    const speaking = blinkInterval('speaking', 'calm')
    expect(speaking[1]).toBeLessThan(idle[1])
    expect(speaking[0]).toBeLessThan(idle[0])
  })
  it('thinking 眨眼间隔最长', () => {
    const thinking = blinkInterval('thinking', 'calm')
    const idle = blinkInterval('idle', 'calm')
    expect(thinking[0]).toBeGreaterThan(idle[0])
  })
  it('lively 节奏整体加快 20%', () => {
    const calm = blinkInterval('idle', 'calm')
    const lively = blinkInterval('idle', 'lively')
    expect(lively[0]).toBeCloseTo(calm[0] * 0.8)
    expect(lively[1]).toBeCloseTo(calm[1] * 0.8)
  })
  it('未知状态回落到 idle 区间', () => {
    expect(blinkInterval('mystery', 'calm')).toEqual(blinkInterval('idle', 'calm'))
  })
})

describe('anchorToPercent 锚点换算', () => {
  it('眼部锚点换算为相对 base 的百分比', () => {
    const pos = anchorToPercent({ ...EYE_ANCHOR, cx: EYE_ANCHOR.leftCx })
    expect(pos.left).toBeCloseTo(((EYE_ANCHOR.leftCx - EYE_ANCHOR.w / 2) / PUPPET_BASE_SIZE.width) * 100)
    expect(pos.top).toBeCloseTo(((EYE_ANCHOR.cy - EYE_ANCHOR.h / 2) / PUPPET_BASE_SIZE.height) * 100)
    expect(pos.width).toBeCloseTo((EYE_ANCHOR.w / PUPPET_BASE_SIZE.width) * 100)
    expect(pos.aspect).toBeCloseTo(EYE_ANCHOR.w / EYE_ANCHOR.h)
  })
  it('双眼锚点都在 base 画布内且左右不重叠', () => {
    const left = anchorToPercent({ ...EYE_ANCHOR, cx: EYE_ANCHOR.leftCx })
    const right = anchorToPercent({ ...EYE_ANCHOR, cx: EYE_ANCHOR.rightCx })
    expect(left.left).toBeGreaterThan(0)
    expect(right.left + right.width).toBeLessThan(100)
    expect(right.left).toBeGreaterThan(left.left + left.width)
  })
})

describe('spritePositionX 精灵格定位', () => {
  it('2 格眼部精灵首尾格定位正确', () => {
    expect(spritePositionX(1, 2)).toBe('100%')
    expect(spritePositionX(0, 2)).toBe('0%')
  })
  it('单格精灵兜底为 0%', () => {
    expect(spritePositionX(0, 1)).toBe('0%')
  })
  it('多格精灵中间格居中', () => {
    expect(spritePositionX(2, 5)).toBe('50%')
    expect(spritePositionX(4, 5)).toBe('100%')
  })
})
