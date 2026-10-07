import { useEffect, useMemo, useRef, useState } from 'react'
import type { PuppetAvatarProps } from './avatarTypes'
import { bindMouth } from './mouthBinding'
import {
  anchorToPercent,
  blinkInterval,
  EYE_ANCHOR,
  EYE_CELL_COUNT,
  EYE_CELLS,
  PUPPET_ASSET_BASE,
  spritePositionX,
} from './puppetConfig'

/**
 * 婉娘 puppet 渲染器：原脸立绘 + 眨眼、下颚律动与克制的状态动作。
 *
 * 口型贴片已停用：raw/mouths.png 与 raw/base.png 并非同源图像，原图下唇与唇角
 * 无法被覆盖，且色域不一致（素材偏暖粉、base 偏中性橄榄），offset-only 色彩校正
 * 无法消除；扩大嘴部盒只会把暖色块铺得更大。证伪过程见 docs/evidence/mouth-sprite-falsification/。
 * 讲话时的可见动效改由下颚律动承担——不做贴片合成，因此不产生接缝。
 * 若将来恢复口型，必须从 base 同源重绘嘴部帧。
 */
export function PuppetAvatar({
  state,
  emotion = 'neutral',
  gesture = 'none',
  pace = 'calm',
  alt = '婉娘文化礼宾',
  className = '',
  mouthOpen = 0,
  mouthSource,
  assetBase = PUPPET_ASSET_BASE,
  onReady,
  onFallback,
}: PuppetAvatarProps) {
  const [ready, setReady] = useState(false)
  const eyeLeftRef = useRef<HTMLDivElement | null>(null)
  const eyeRightRef = useRef<HTMLDivElement | null>(null)
  const jawRef = useRef<HTMLDivElement | null>(null)

  const eyeLeftPos = useMemo(() => anchorToPercent({ ...EYE_ANCHOR, cx: EYE_ANCHOR.leftCx }), [])
  const eyeRightPos = useMemo(() => anchorToPercent({ ...EYE_ANCHOR, cx: EYE_ANCHOR.rightCx }), [])

  // 资产预加载：任一失败即降级；reduced-motion 直接交回静态形象
  useEffect(() => {
    if (typeof window !== 'undefined'
      && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      onFallback?.()
      return
    }
    let cancelled = false
    const sources = ['base.webp', 'eyes.webp'].map((name) => `${assetBase}/${name}`)
    Promise.all(
      sources.map(
        (src) =>
          new Promise<void>((resolve, reject) => {
            const img = new Image()
            img.onload = () => resolve()
            img.onerror = () => reject(new Error(`asset failed: ${src}`))
            img.src = src
          }),
      ),
    )
      .then(() => {
        if (!cancelled) {
          setReady(true)
          onReady?.()
        }
      })
      .catch(() => {
        if (!cancelled) onFallback?.()
      })
    return () => {
      cancelled = true
    }
  }, [assetBase, onFallback, onReady])

  // 眨眼调度：纯 DOM class 切换，间隔随状态/节奏变化
  useEffect(() => {
    if (!ready) return
    let timer = 0
    let cancelled = false
    const blinkTimers = new Set<number>()
    const later = (callback: () => void, delay: number) => {
      const id = window.setTimeout(() => { blinkTimers.delete(id); if (!cancelled) callback() }, delay)
      blinkTimers.add(id)
    }

    const setEye = (cell: number | null) => {
      for (const el of [eyeLeftRef.current, eyeRightRef.current]) {
        if (!el) continue
        if (cell === null) {
          el.style.opacity = '0'
        } else {
          el.style.backgroundPosition = `${spritePositionX(cell, EYE_CELL_COUNT)} 0%`
          el.style.opacity = '1'
        }
      }
    }

    const blinkOnce = () => {
      setEye(EYE_CELLS.indexOf('half'))
      later(() => {
        if (cancelled) return
        setEye(EYE_CELLS.indexOf('closed'))
        later(() => {
          if (!cancelled) setEye(null)
        }, 90)
      }, 60)
    }

    const schedule = () => {
      if (cancelled) return
      const [min, max] = blinkInterval(state, pace)
      timer = window.setTimeout(() => {
        if (cancelled) return
        blinkOnce()
        schedule()
      }, min + Math.random() * (max - min))
    }
    setEye(null)
    if (state === 'paused' || state === 'error') return
    schedule()
    return () => {
      cancelled = true
      window.clearTimeout(timer)
      blinkTimers.forEach((id) => window.clearTimeout(id))
      setEye(null)
    }
  }, [ready, state, pace])

  // Subscribe directly to speech frames; no React render is needed per frame.
  useEffect(() => {
    const el = jawRef.current
    if (!el) return
    if (mouthSource) return bindMouth(el, mouthSource)
  }, [mouthSource, ready])

  useEffect(() => {
    if (mouthSource || !jawRef.current) return
    jawRef.current.style.setProperty('--jaw-open', Math.max(0, Math.min(1, Number.isFinite(mouthOpen) ? mouthOpen : 0)).toFixed(3))
  }, [mouthSource, mouthOpen, ready])

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const reduce = () => { if (media.matches) { setReady(false); onFallback?.() } }
    media.addEventListener('change', reduce)
    return () => media.removeEventListener('change', reduce)
  }, [onFallback])

  if (!ready) return null

  return (
    <div
      className={`puppet-avatar avatar-state-${state} avatar-emotion-${emotion} avatar-gesture-${gesture} ${className}`}
      data-state={state}
      data-emotion={emotion}
      data-gesture={gesture}
      data-pace={pace}
    >
      <div className="static-avatar-depth-glow" aria-hidden="true" />

      <div className="puppet-figure">
        <div className="puppet-canvas">
          {/* 下颚层：独立于 puppet-canvas 的呼吸动画与 puppet-figure 的点头动画，
              只承担讲话时的下颌律动，避免多个 animation 争抢同一 transform。 */}
          <div ref={jawRef} className="puppet-jaw">
            <img
              src={`${assetBase}/base.webp`}
              alt={alt}
              className="puppet-base"
              draggable={false}
            />
            <div
              ref={eyeLeftRef}
              className="puppet-part puppet-eye"
              aria-hidden="true"
              style={{
                left: `${eyeLeftPos.left}%`,
                top: `${eyeLeftPos.top}%`,
                width: `${eyeLeftPos.width}%`,
                aspectRatio: `${EYE_ANCHOR.w} / ${EYE_ANCHOR.h}`,
                backgroundImage: `url(${assetBase}/eyes.webp)`,
                backgroundSize: `${EYE_CELL_COUNT * 100}% 100%`,
              }}
            />
            <div
              ref={eyeRightRef}
              className="puppet-part puppet-eye puppet-eye-right"
              aria-hidden="true"
              style={{
                left: `${eyeRightPos.left}%`,
                top: `${eyeRightPos.top}%`,
                width: `${eyeRightPos.width}%`,
                aspectRatio: `${EYE_ANCHOR.w} / ${EYE_ANCHOR.h}`,
                backgroundImage: `url(${assetBase}/eyes.webp)`,
                backgroundSize: `${EYE_CELL_COUNT * 100}% 100%`,
              }}
            />
          </div>
        </div>
      </div>

      <div className="static-avatar-gleam" aria-hidden="true" />
    </div>
  )
}
