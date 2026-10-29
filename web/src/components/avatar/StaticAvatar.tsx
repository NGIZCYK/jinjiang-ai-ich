import { useEffect, useState } from 'react'
import type { StaticAvatarProps } from './avatarTypes'
import { WANNIANG_PORTRAIT } from './avatarPortrait'

/** 静态主视觉与 Live2D 故障降级渲染器。 */
export function StaticAvatar({
  state,
  emotion = 'neutral',
  gesture = 'none',
  imageSrc = WANNIANG_PORTRAIT,
  alt = '婉娘文化礼宾',
  className = '',
  ttsMode = 'browser',
}: StaticAvatarProps) {
  const [loadError, setLoadError] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)
  useEffect(()=>{setLoadError(false);setIsLoaded(false)},[imageSrc])

  const stateClass = `avatar-state-${state}`
  const emotionClass = `avatar-emotion-${emotion}`
  const gestureClass = `avatar-gesture-${gesture}`

  return (
    <div
      className={`static-avatar-container ${stateClass} ${emotionClass} ${gestureClass} ${className}`}
      data-state={state}
      data-emotion={emotion}
      data-gesture={gesture}
      data-tts-mode={ttsMode}
    >
      {/* 景深环境微光层 */}
      <div className="static-avatar-depth-glow" aria-hidden="true" />

      {/* 丝线微光浮层 */}
      <div className="static-avatar-gleam" aria-hidden="true" />

      {/* 礼宾形象图片 */}
      {!loadError ? (
        <img
          src={imageSrc}
          alt={alt}
          className={`static-avatar-image ${isLoaded ? 'is-loaded' : 'is-loading'}`}
          onLoad={() => setIsLoaded(true)}
          onError={() => setLoadError(true)}
          draggable={false}
        />
      ) : (
        <div className="static-avatar-fallback-art" aria-hidden="true">
          <div className="static-avatar-fallback-silhouette" />
          <span className="static-avatar-fallback-caption">{alt}</span>
        </div>
      )}
    </div>
  )
}
