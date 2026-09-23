import { describe, expect, it } from 'vitest'
import {
  anchorToPercent,
  blinkInterval,
  EYE_ANCHOR,
  MOUTH_ANCHOR,
  mouthHysteresisMs,
  PUPPET_BASE_SIZE,
  restMouthCell,
  selectMouthCell,
  spritePositionX,
} from '../src/components/avatar/puppetConfig'

describe('selectMouthCell 口型帧映射', () => {
  it('open 低于阈值时无论 form 都闭合', () => {
    expect(selectMouthCell(0, 0)).toBe(0)
    expect(selectMouthCell(0.11, 0.6)).toBe(0)
    expect(selectMouthCell(0.119, -0.9)).toBe(0)
  })
  it('圆唇优先于开口度', () => {
    expect(selectMouthCell(0.8, -0.35)).toBe(3)
    expect(selectMouthCell(0.3, -0.5)).toBe(3)
  })
  it('大张开映射到 aa 格', () => {
    expect(selectMouthCell(0.56, 0)).toBe(2)
    expect(selectMouthCell(0.9, 0.1)).toBe(2)
  })
  it('讲话时展唇沿用微张格，不闪回静默 smile 格', () => {
    expect(selectMouthCell(0.3, 0.4)).toBe(1)
    expect(selectMouthCell(0.54, 0.31)).toBe(1)
  })
  it('其余中开映射到 a 格', () => {
    expect(selectMouthCell(0.12, 0)).toBe(1)
    expect(selectMouthCell(0.4, 0.1)).toBe(1)
    expect(selectMouthCell(0.55, -0.29)).toBe(1)
  })
})

describe('restMouthCell 静默嘴格', () => {
  it('warm 情绪用抿笑格，其余闭合', () => {
    expect(restMouthCell('warm')).toBe(4)
    expect(restMouthCell('neutral')).toBe(0)
    expect(restMouthCell('thoughtful')).toBe(0)
  })
})

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

describe('mouthHysteresisMs 切格滞回', () => {
  it('calm 30ms / lively 20ms', () => {
    expect(mouthHysteresisMs('calm')).toBe(30)
    expect(mouthHysteresisMs('lively')).toBe(20)
  })
})

describe('anchorToPercent 锚点换算', () => {
  it('嘴部锚点换算为相对 base 的百分比', () => {
    const pos = anchorToPercent(MOUTH_ANCHOR)
    expect(pos.left).toBeCloseTo(((MOUTH_ANCHOR.cx - MOUTH_ANCHOR.w / 2) / PUPPET_BASE_SIZE.width) * 100)
    expect(pos.top).toBeCloseTo(((MOUTH_ANCHOR.cy - MOUTH_ANCHOR.h / 2) / PUPPET_BASE_SIZE.height) * 100)
    expect(pos.width).toBeCloseTo((MOUTH_ANCHOR.w / PUPPET_BASE_SIZE.width) * 100)
    expect(pos.aspect).toBeCloseTo(MOUTH_ANCHOR.w / MOUTH_ANCHOR.h)
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
  it('5 格精灵首尾格定位正确', () => {
    expect(spritePositionX(0, 5)).toBe('0%')
    expect(spritePositionX(4, 5)).toBe('100%')
    expect(spritePositionX(2, 5)).toBe('50%')
  })
  it('2 格精灵与单格兜底', () => {
    expect(spritePositionX(1, 2)).toBe('100%')
    expect(spritePositionX(0, 1)).toBe('0%')
  })
})
