import type { VisemeFrame } from './types'

export interface VisemeMouthShape {
  mouthOpen: number // 0~1: 0=闭口, 0.2~0.35=小开口, 0.4~0.65=中开口, 0.7~1.0=大开口
  mouthForm: number // -1~1: 负数=圆唇, 正数=展唇
}

/**
 * 依据《婉娘Live2D数字人实施任务书》阶段D 381-389节口型收敛规范：
 * 将供应商（Azure Speech 0~21 号 Viseme ID）收敛为项目内部统一参数。
 */
export const AZURE_VISEME_MAP: Record<number, VisemeMouthShape> = {
  // 0: 静音 / 休息位（闭口）
  0: { mouthOpen: 0, mouthForm: 0 },
  // 1: ae, ax, ah（如 father, cat）- 大开口
  1: { mouthOpen: 0.75, mouthForm: 0.2 },
  // 2: aa（如 car）- 大开口
  2: { mouthOpen: 0.85, mouthForm: 0.1 },
  // 3: ao（如 call, thought）- 大开口，圆唇
  3: { mouthOpen: 0.7, mouthForm: -0.5 },
  // 4: ey, eh, uh（如 bed, say）- 中开口，微展唇
  4: { mouthOpen: 0.5, mouthForm: 0.3 },
  // 5: er（如 bird）- 中开口
  5: { mouthOpen: 0.45, mouthForm: -0.1 },
  // 6: y, iy, ih（如 see, sit）- 小开口，展唇
  6: { mouthOpen: 0.3, mouthForm: 0.7 },
  // 7: w, uw（如 too, boot）- 小开口，圆唇
  7: { mouthOpen: 0.25, mouthForm: -0.7 },
  // 8: ow（如 boat, home）- 中开口，圆唇
  8: { mouthOpen: 0.58, mouthForm: -0.6 },
  // 9: aw（如 cow, house）- 大开口
  9: { mouthOpen: 0.8, mouthForm: -0.3 },
  // 10: oy（如 boy, coin）- 中开口
  10: { mouthOpen: 0.65, mouthForm: 0.2 },
  // 11: ay（如 hide, my）- 大开口，展唇
  11: { mouthOpen: 0.8, mouthForm: 0.4 },
  // 12: h（如 hat, hope）- 中开口
  12: { mouthOpen: 0.4, mouthForm: 0 },
  // 13: r（如 run, red）- 小开口
  13: { mouthOpen: 0.35, mouthForm: -0.2 },
  // 14: l（如 look, light）- 小开口
  14: { mouthOpen: 0.35, mouthForm: 0.3 },
  // 15: s, z（如 see, zoo）- 小开口，展唇
  15: { mouthOpen: 0.22, mouthForm: 0.5 },
  // 16: sh, ch, jh, zh（如 she, child）- 小开口
  16: { mouthOpen: 0.32, mouthForm: -0.3 },
  // 17: th, dh（如 think, that）- 小开口
  17: { mouthOpen: 0.25, mouthForm: 0.2 },
  // 18: f, v（如 five, very）- 小开口，下唇近齿
  18: { mouthOpen: 0.2, mouthForm: 0.1 },
  // 19: d, t, n（如 do, to, no）- 小开口
  19: { mouthOpen: 0.3, mouthForm: 0.2 },
  // 20: k, g, ng（如 key, go, song）- 中开口
  20: { mouthOpen: 0.45, mouthForm: 0.1 },
  // 21: p, b, m（如 pop, boy, me）- 闭口，双唇紧闭
  21: { mouthOpen: 0, mouthForm: 0 },
}

/**
 * 将 Azure Viseme ID 映射为标准口型几何数据
 */
export function mapAzureVisemeToShape(visemeId: number): VisemeMouthShape {
  const shape = AZURE_VISEME_MAP[visemeId]
  if (shape) return shape
  return { mouthOpen: 0, mouthForm: 0 }
}

/**
 * 获取静息闭口形态
 */
export function getRestViseme(): VisemeMouthShape {
  return { mouthOpen: 0, mouthForm: 0 }
}

/**
 * 在关键帧序列中按毫秒时间轴做线性平滑插值，禁止嘴形瞬间跳变
 */
export function interpolateVisemeFrame(
  visemes: VisemeFrame[] | undefined,
  offsetMs: number,
): VisemeMouthShape {
  if (!visemes || visemes.length === 0) {
    return getRestViseme()
  }

  // 小于第一帧起始时间：返回第一帧口型
  if (offsetMs <= visemes[0].offsetMs) {
    const first = visemes[0]
    return {
      mouthOpen: first.mouthOpen,
      mouthForm: first.mouthForm ?? 0,
    }
  }

  // 大于最后一帧时间：超过 150ms 逐渐阻尼回位至 0，避免挂嘴
  const last = visemes[visemes.length - 1]
  if (offsetMs >= last.offsetMs) {
    const decayDuration = 150
    const delta = offsetMs - last.offsetMs
    if (delta >= decayDuration) {
      return getRestViseme()
    }
    const factor = 1 - delta / decayDuration
    return {
      mouthOpen: Math.max(0, last.mouthOpen * factor),
      mouthForm: (last.mouthForm ?? 0) * factor,
    }
  }

  // 二分查找当前 offsetMs 所处的区间 [visemes[i], visemes[i+1]]
  let low = 0
  let high = visemes.length - 1

  while (low <= high) {
    const mid = Math.floor((low + high) / 2)
    const current = visemes[mid]
    const next = visemes[mid + 1]

    if (current.offsetMs <= offsetMs && (!next || offsetMs < next.offsetMs)) {
      if (!next) {
        return { mouthOpen: current.mouthOpen, mouthForm: current.mouthForm ?? 0 }
      }
      const span = next.offsetMs - current.offsetMs
      const progress = span > 0 ? (offsetMs - current.offsetMs) / span : 0
      const currentForm = current.mouthForm ?? 0
      const nextForm = next.mouthForm ?? 0

      return {
        mouthOpen: Math.max(0, Math.min(1, current.mouthOpen + (next.mouthOpen - current.mouthOpen) * progress)),
        mouthForm: Math.max(-1, Math.min(1, currentForm + (nextForm - currentForm) * progress)),
      }
    }

    if (current.offsetMs > offsetMs) {
      high = mid - 1
    } else {
      low = mid + 1
    }
  }

  return getRestViseme()
}

/**
 * 没有 Viseme 时的低幅度节奏动画
 * 依据任务书 389 节规范：在代码中明确标记为 approximate fallback
 * 生成自然且低幅度的语韵律动（0.15~0.35 小中开口微动），不宣称精确口型同步。
 */
export function getApproximateFallbackViseme(elapsedMs: number): VisemeMouthShape {
  // [approximate fallback] 模拟汉语/英语音节节奏（约 3Hz，250-350ms 周期）
  const primaryWave = Math.sin(elapsedMs * 0.018)
  const secondaryWave = Math.sin(elapsedMs * 0.007)
  const positivePrimary = Math.max(0, primaryWave)

  // 口型在 0.16 到 0.34 之间自然微动
  const mouthOpen = 0.16 + 0.18 * positivePrimary * (0.7 + 0.3 * Math.max(0, secondaryWave))
  const mouthForm = 0.15 * Math.sin(elapsedMs * 0.011)

  return {
    mouthOpen: Number(mouthOpen.toFixed(3)),
    mouthForm: Number(mouthForm.toFixed(3)),
  }
}
