import { useEffect, useMemo, useRef, useState } from 'react'
import {
  AVATAR_STATE_TEXT,
  type AvatarEmotion,
  type AvatarGesture,
  type AvatarState,
} from '../components/avatar/avatarTypes'

export interface UseAvatarDirectorOptions {
  language: 'zh' | 'en'
  isGenerating?: boolean
  isSpeaking?: boolean
  isStopped?: boolean
  hasError?: boolean
  customStatusMap?: Partial<Record<AvatarState, string>>
}

export interface UseAvatarDirectorReturn {
  state: AvatarState
  emotion: AvatarEmotion
  gesture: AvatarGesture
  statusText: string
  setListening: (active?: boolean) => void
  setThinking: () => void
  setSpeaking: () => void
  setPaused: () => void
  setError: () => void
  setIdle: () => void
  setEmotion: (emotion: AvatarEmotion) => void
  setGesture: (gesture: AvatarGesture) => void
  reset: () => void
}

/**
 * 婉娘统一人物状态机
 * 满足《婉娘Live2D数字人实施任务书》5.1节与阶段A规范：
 * 1. 严格遵守状态转移规则：
 *    idle → listening → thinking → speaking → idle
 *                         ↓           ↓
 *                       error       paused
 * 2. 用户输入聚焦时进入 listening；
 * 3. 提交后立即进入 thinking，不得继续停留于 listening；
 * 4. 语音朗读启动进入 speaking；
 * 5. 停止生成或朗读进入 paused，短暂展示后自动恢复 idle；
 * 6. 异常时转入 error 并降级，随后可恢复；
 * 7. 单一可信状态源，并根据当前语言产出语义化状态文案。
 */
export function useAvatarDirector({
  language,
  isGenerating = false,
  isSpeaking = false,
  isStopped = false,
  hasError = false,
  customStatusMap,
}: UseAvatarDirectorOptions): UseAvatarDirectorReturn {
  const [internalState, setInternalState] = useState<AvatarState>('idle')
  const [emotion, setEmotion] = useState<AvatarEmotion>('neutral')
  const [gesture, setGesture] = useState<AvatarGesture>('none')
  const [isInputFocused, setIsInputFocused] = useState(false)

  const timerRef = useRef<number | null>(null)

  const clearTimer = () => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }

  // 组件卸载时清理定时器
  useEffect(() => {
    return () => clearTimer()
  }, [])

  // 监听外部响应式属性，驱动状态机
  useEffect(() => {
    clearTimer()

    if (hasError) {
      setInternalState('error')
      // 错误提示保留 2.5 秒后回退到 idle
      timerRef.current = window.setTimeout(() => {
        setInternalState('idle')
      }, 2500)
      return
    }

    if (isStopped) {
      setInternalState('paused')
      // 停止状态展示 1.8 秒后回退到 idle
      timerRef.current = window.setTimeout(() => {
        setInternalState('idle')
      }, 1800)
      return
    }

    if (isSpeaking) {
      setInternalState('speaking')
      return
    }

    if (isGenerating) {
      // 正在查阅/思考，不可停留于 listening
      setInternalState('thinking')
      return
    }

    if (isInputFocused) {
      setInternalState('listening')
      return
    }

    setInternalState('idle')
  }, [hasError, isStopped, isSpeaking, isGenerating, isInputFocused])

  const setListening = (active = true) => {
    setIsInputFocused(active)
    if (active && !isGenerating && !isSpeaking) {
      setInternalState('listening')
    } else if (!active && internalState === 'listening') {
      setInternalState('idle')
    }
  }

  const setThinking = () => {
    clearTimer()
    setInternalState('thinking')
  }

  const setSpeaking = () => {
    clearTimer()
    setInternalState('speaking')
  }

  const setPaused = () => {
    clearTimer()
    setInternalState('paused')
    timerRef.current = window.setTimeout(() => {
      setInternalState('idle')
    }, 1800)
  }

  const setError = () => {
    clearTimer()
    setInternalState('error')
    timerRef.current = window.setTimeout(() => {
      setInternalState('idle')
    }, 2500)
  }

  const setIdle = () => {
    clearTimer()
    setIsInputFocused(false)
    setInternalState('idle')
  }

  const reset = () => {
    clearTimer()
    setIsInputFocused(false)
    setInternalState('idle')
    setEmotion('neutral')
    setGesture('none')
  }

  // 计算当前文案
  const statusText = useMemo(() => {
    if (customStatusMap?.[internalState]) {
      return customStatusMap[internalState]!
    }
    const dictionary = AVATAR_STATE_TEXT[language] || AVATAR_STATE_TEXT.zh
    return dictionary[internalState] || dictionary.idle
  }, [customStatusMap, internalState, language])

  return {
    state: internalState,
    emotion,
    gesture,
    statusText,
    setListening,
    setThinking,
    setSpeaking,
    setPaused,
    setError,
    setIdle,
    setEmotion,
    setGesture,
    reset,
  }
}
