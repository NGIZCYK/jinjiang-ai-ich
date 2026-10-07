import { useCallback, useEffect, useState } from 'react'
import { AVATAR_STATE_TEXT, type AvatarStageProps } from './avatarTypes'
import { Live2DAvatar } from './Live2DAvatar'
import { PuppetAvatar } from './PuppetAvatar'
import { StaticAvatar } from './StaticAvatar'

/**
 * 页面唯一的数字人舞台入口。
 * 静态礼宾形象负责首屏和故障兜底；puppet 偶动画资产就绪后接管显示；
 * 只有合法模型与真实运行时均就绪后，Live2D 才会接管，避免空 Canvas、黑屏或能力标注失真。
 */
export function AvatarStage({
  state,
  emotion = 'neutral',
  gesture = 'none',
  language,
  statusText,
  eyebrow,
  name = '婉娘',
  className = '',
  fallbackImage,
  mouthOpen = 0,
  mouthSource,
  mouthForm = 0,
  ttsMode = 'browser',
  useLive2D = false,
  modelPath,
  pace = 'calm',
  usePuppet = true,
}: AvatarStageProps) {
  const [live2dFailed, setLive2dFailed] = useState(false)
  const [live2dReady, setLive2dReady] = useState(false)
  const [puppetFailed, setPuppetFailed] = useState(false)
  const [puppetReady, setPuppetReady] = useState(false)

  useEffect(() => {
    setLive2dFailed(false)
    setLive2dReady(false)
  }, [modelPath, useLive2D])

  // 若未显式传入状态文案，则按内部多语言状态字典回退
  const resolvedStatus = statusText || AVATAR_STATE_TEXT[language][state] || AVATAR_STATE_TEXT[language].idle
  const stageStateClass = `is-${state}`
  const accessibilityLabel = `${name}：${resolvedStatus}`

  const canUseLive2D = useLive2D && Boolean(modelPath) && !live2dFailed
  const showLive2D = canUseLive2D && live2dReady
  const handleLive2DReady = useCallback(() => setLive2dReady(true), [])
  const handleLive2DFallback = useCallback(() => {
    setLive2dReady(false)
    setLive2dFailed(true)
  }, [])
  const handlePuppetReady = useCallback(() => setPuppetReady(true), [])
  const handlePuppetFallback = useCallback(() => {
    setPuppetReady(false)
    setPuppetFailed(true)
  }, [])

  return (
    <div
      className={`digital-human-stage guide-host-stage ${stageStateClass} ${className}`}
      aria-label={accessibilityLabel}
    >
      {/* 顶部业务标识 */}
      {eyebrow && <span className="digital-human-eyebrow">{eyebrow}</span>}

      {/* 静态形象承担首屏与故障降级，puppet/Live2D 就绪后无闪烁接管。 */}
      {!showLive2D && !puppetReady && (
        <StaticAvatar
          state={state}
          emotion={emotion}
          gesture={gesture}
          imageSrc={fallbackImage}
          alt={name}
          ttsMode={ttsMode}
        />
      )}
      {!showLive2D && usePuppet && !puppetFailed && (
        <PuppetAvatar
          state={state}
          emotion={emotion}
          gesture={gesture}
          pace={pace}
          alt={name}
          mouthOpen={mouthOpen}
          mouthSource={mouthSource}
          onReady={handlePuppetReady}
          onFallback={handlePuppetFallback}
        />
      )}
      {canUseLive2D && (
        <Live2DAvatar
          state={state}
          emotion={emotion}
          gesture={gesture}
          mouthOpen={mouthOpen}
          mouthForm={mouthForm}
          modelPath={modelPath}
          onReady={handleLive2DReady}
          onFallback={handleLive2DFallback}
        />
      )}

      {/* 底部边缘状态胶囊：置于舞台下缘，确保不遮挡面部 */}
      <div className="digital-human-status" aria-live="polite">
        <span className={`status-dot status-dot-${state}`} aria-hidden="true" />
        <span className="status-text">{resolvedStatus}</span>
      </div>
    </div>
  )
}
