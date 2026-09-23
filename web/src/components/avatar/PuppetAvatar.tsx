import { useEffect, useMemo, useRef, useState } from 'react'
import type { PuppetAvatarProps } from './avatarTypes'
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
 * 婉娘 puppet 渲染器：原脸立绘 + 眨眼与克制的状态动作。
 * 旧口型贴片与原脸并非同源，静默时会出绿边、朗读时会出现不自然的嘴形，
 * 故默认不再叠加。待获得严格配准的素材后再恢复口型同步。
 */
export function PuppetAvatar({
  state,
  emotion = 'neutral',
  gesture = 'none',
  pace = 'calm',
  alt = '婉娘文化礼宾',
  className = '',
  assetBase = PUPPET_ASSET_BASE,
  onReady,
  onFallback,
}: PuppetAvatarProps) {
  const [ready, setReady] = useState(false)
  const eyeLeftRef = useRef<HTMLDivElement | null>(null)
  const eyeRightRef = useRef<HTMLDivElement | null>(null)

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
      window.setTimeout(() => {
        if (cancelled) return
        setEye(EYE_CELLS.indexOf('closed'))
        window.setTimeout(() => {
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
    schedule()
    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [ready, state, pace])

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

      <div className="static-avatar-gleam" aria-hidden="true" />
    </div>
  )
}
