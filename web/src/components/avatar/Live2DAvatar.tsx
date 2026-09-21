import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react'
import type { AvatarEmotion, AvatarGesture, AvatarState } from './avatarTypes'

export interface Live2DController {
  setParameters(values: { mouthOpen: number; mouthForm: number }): void
  setPerformance?(values: { state: AvatarState; emotion: AvatarEmotion; gesture: AvatarGesture }): void
  resize?(): void
  destroy(): void
}

export interface WanniangLive2DRuntime {
  mount(canvas: HTMLCanvasElement, options: { modelPath: string }): Promise<Live2DController>
}

declare global {
  interface Window {
    WanniangLive2DRuntime?: WanniangLive2DRuntime
  }
}

export interface Live2DAvatarProps {
  state: AvatarState
  emotion?: AvatarEmotion
  gesture?: AvatarGesture
  mouthOpen?: number
  mouthForm?: number
  modelPath?: string
  className?: string
  onReady?: () => void
  onFallback?: () => void
}

/**
 * Live2D 的浏览器挂载边界。
 *
 * 本组件只在“已提供合法 Cubism 模型 + 已注册真实运行时适配器”时启用。
 * 它不会用空 Canvas 或整图缩放冒充 Live2D；缺少任一条件都会明确回退静态形象。
 * 运行时须在 window.WanniangLive2DRuntime.mount 中完成 Cubism 模型加载、渲染和参数写入。
 */
export function Live2DAvatar({
  state,
  emotion = 'neutral',
  gesture = 'none',
  mouthOpen = 0,
  mouthForm = 0,
  modelPath,
  className = '',
  onReady,
  onFallback,
}: Live2DAvatarProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const controllerRef = useRef<Live2DController | null>(null)
  const fallbackTriggeredRef = useRef(false)
  const [ready, setReady] = useState(false)

  const triggerFallback = useCallback(() => {
    if (fallbackTriggeredRef.current) return
    fallbackTriggeredRef.current = true
    setReady(false)
    onFallback?.()
  }, [onFallback])

  useEffect(() => {
    const canvas = canvasRef.current
    const runtime = window.WanniangLive2DRuntime
    if (!canvas || !modelPath || !runtime) {
      triggerFallback()
      return
    }

    let disposed = false
    fallbackTriggeredRef.current = false
    setReady(false)

    // 模型首次下载可能超过 500ms；以真实加载事件为准，并保留合理的安全超时。
    const timeoutTimer = window.setTimeout(triggerFallback, 12_000)

    void runtime.mount(canvas, { modelPath })
      .then((controller) => {
        if (disposed) {
          controller.destroy()
          return
        }
        window.clearTimeout(timeoutTimer)
        controllerRef.current = controller
        setReady(true)
        onReady?.()
      })
      .catch(triggerFallback)

    const handleContextLost = (event: Event) => {
      event.preventDefault()
      triggerFallback()
    }
    canvas.addEventListener('webglcontextlost', handleContextLost)

    const observer = typeof ResizeObserver !== 'undefined'
      ? new ResizeObserver(() => controllerRef.current?.resize?.())
      : null
    observer?.observe(canvas)

    return () => {
      disposed = true
      window.clearTimeout(timeoutTimer)
      observer?.disconnect()
      canvas.removeEventListener('webglcontextlost', handleContextLost)
      controllerRef.current?.destroy()
      controllerRef.current = null
    }
  }, [modelPath, onReady, triggerFallback])

  useEffect(() => {
    if (!ready) return
    controllerRef.current?.setParameters({
      mouthOpen: Math.max(0, Math.min(1, mouthOpen)),
      mouthForm: Math.max(-1, Math.min(1, mouthForm)),
    })
  }, [mouthForm, mouthOpen, ready])

  useEffect(() => {
    if (!ready) return
    controllerRef.current?.setPerformance?.({ state, emotion, gesture })
  }, [emotion, gesture, ready, state])

  return (
    <div
      className={`live2d-avatar-container avatar-state-${state} avatar-emotion-${emotion} avatar-gesture-${gesture} ${ready ? 'is-ready' : 'is-loading'} ${className}`}
      data-state={state}
      data-emotion={emotion}
      data-gesture={gesture}
      style={{
        '--avatar-mouth-open': mouthOpen,
        '--avatar-mouth-form': mouthForm,
      } as CSSProperties}
      aria-hidden="true"
    >
      <canvas ref={canvasRef} className="live2d-canvas" />
    </div>
  )
}
