import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { MouthSource } from '../components/avatar/avatarTypes'
import { BrowserTtsProvider } from '../lib/tts/browserTts'
import { detectTtsMode, getTtsProvider } from '../lib/tts/ttsFactory'
import type { SpeechPlayback, SpeechRequest, TtsProvider } from '../lib/tts/types'
import { logVoiceRequest, voiceErrorType } from '../lib/serviceDiagnostics'
import {
  getApproximateFallbackViseme,
  getRestViseme,
  interpolateVisemeFrame,
} from '../lib/tts/visemeMapper'

export interface UseSpeechQueueOptions {
  provider?: TtsProvider
  language: 'zh' | 'en'
  onSentenceStart?: (request: SpeechRequest) => void
  onSentenceEnd?: (request: SpeechRequest) => void
  onQueueEmpty?: () => void
}

export type SpeechQueuePhase = 'idle' | 'synthesizing' | 'playing'

export interface UseSpeechQueueReturn {
  enqueue: (items: SpeechRequest | SpeechRequest[]) => void
  stop: () => void
  phase: SpeechQueuePhase
  isPreparing: boolean
  isPlaying: boolean
  currentSpeechId: string | null
  currentMessageId: string | null
  queueLength: number
  mouthOpen: number
  mouthForm: number
  /** 口型帧订阅源（每帧直推，供 puppet 渲染器绕开 React 使用）。 */
  mouthSource: MouthSource
  ttsMode: 'viseme' | 'browser' | 'unavailable'
}

const defaultBrowserTtsProvider = new BrowserTtsProvider()

/**
 * 严格串行的句子级语音队列。
 * 每次 stop 都递增运行代号，旧异步任务即使稍后返回，也不能清空或覆盖新队列。
 * “正在准备”与“实际播放”分开记录，人物只在音频真正开始时进入 speaking。
 */
export function useSpeechQueue({
  provider,
  language,
  onSentenceStart,
  onSentenceEnd,
  onQueueEmpty,
}: UseSpeechQueueOptions): UseSpeechQueueReturn {
  const [phase, setPhase] = useState<SpeechQueuePhase>('idle')
  const [currentSpeechId, setCurrentSpeechId] = useState<string | null>(null)
  const [currentMessageId, setCurrentMessageId] = useState<string | null>(null)
  const [queueLength, setQueueLength] = useState(0)
  const [mouthOpen, setMouthOpen] = useState(0)
  const [mouthForm, setMouthForm] = useState(0)
  const [ttsMode, setTtsMode] = useState<'viseme' | 'browser' | 'unavailable'>('browser')

  const queueRef = useRef<SpeechRequest[]>([])
  const runIdRef = useRef(0)
  const processingRunRef = useRef<number | null>(null)
  const currentPlaybackRef = useRef<SpeechPlayback | null>(null)
  const currentAbortRef = useRef<AbortController | null>(null)
  const currentLanguageRef = useRef(language)
  const animationFrameRef = useRef<number | null>(null)
  const mouthFrameRef = useRef({ open: 0, form: 0 })
  const mouthListenersRef = useRef(new Set<(open: number, form: number) => void>())
  const lastMouthStateSyncRef = useRef(0)

  // 口型每帧只写 ref 并直推订阅者；React state 以约 5Hz 节流同步，兼容旧链路。
  const publishMouth = useCallback((open: number, form: number, forceState = false) => {
    mouthFrameRef.current = { open, form }
    mouthListenersRef.current.forEach((listener) => listener(open, form))
    const now = performance.now()
    if (forceState || now - lastMouthStateSyncRef.current >= 200) {
      lastMouthStateSyncRef.current = now
      setMouthOpen(open)
      setMouthForm(form)
    }
  }, [])

  const subscribeMouth = useCallback((listener: (open: number, form: number) => void) => {
    mouthListenersRef.current.add(listener)
    const current = mouthFrameRef.current
    listener(current.open, current.form)
    return () => {
      mouthListenersRef.current.delete(listener)
    }
  }, [])

  const mouthSource = useMemo<MouthSource>(() => ({ subscribe: subscribeMouth }), [subscribeMouth])

  useEffect(() => {
    let cancelled = false
    void detectTtsMode().then((mode) => { if (!cancelled) setTtsMode(mode) })
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    currentLanguageRef.current = language
  }, [language])

  const stopAnimation = useCallback(() => {
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = null
    }
    const rest = getRestViseme()
    publishMouth(rest.mouthOpen, rest.mouthForm, true)
  }, [publishMouth])

  const stop = useCallback(() => {
    // 使所有仍在 await 的旧任务失效，防止停止后快速重播产生双队列。
    runIdRef.current += 1
    processingRunRef.current = null
    queueRef.current = []
    setQueueLength(0)

    const controller = currentAbortRef.current
    currentAbortRef.current = null
    controller?.abort()

    const playback = currentPlaybackRef.current
    currentPlaybackRef.current = null
    playback?.stop()

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel()
    }

    stopAnimation()
    setPhase('idle')
    setCurrentSpeechId(null)
    setCurrentMessageId(null)
  }, [stopAnimation])

  useEffect(() => {
    stop()
  }, [language, stop])

  useEffect(() => () => stop(), [stop])

  const startMouthAnimation = useCallback((playback: SpeechPlayback, controller: AbortController, runId: number) => {
    stopAnimation()
    const startTime = performance.now()
    const hasVisemes = Boolean(playback.visemes?.length)

    const tick = () => {
      if (controller.signal.aborted || runIdRef.current !== runId) {
        if (runIdRef.current === runId) stopAnimation()
        return
      }

      const elapsedMs = performance.now() - startTime
      const shape = hasVisemes
        ? interpolateVisemeFrame(playback.visemes, elapsedMs)
        : getApproximateFallbackViseme(elapsedMs)
      publishMouth(shape.mouthOpen, shape.mouthForm)
      animationFrameRef.current = requestAnimationFrame(tick)
    }

    animationFrameRef.current = requestAnimationFrame(tick)
  }, [publishMouth, stopAnimation])

  const processQueue = useCallback(async () => {
    const runId = runIdRef.current
    if (processingRunRef.current === runId) return
    processingRunRef.current = runId

    let activeProvider: TtsProvider
    try {
      activeProvider = provider || await getTtsProvider()
    } catch {
      activeProvider = defaultBrowserTtsProvider
    }

    if (runIdRef.current !== runId) return
    setTtsMode(activeProvider.mode)

    while (runIdRef.current === runId && queueRef.current.length > 0) {
      const nextRequest = queueRef.current.shift()!
      setQueueLength(queueRef.current.length)
      if (nextRequest.language !== currentLanguageRef.current) continue

      const controller = new AbortController()
      currentAbortRef.current = controller
      setCurrentSpeechId(nextRequest.id)
      setCurrentMessageId(nextRequest.messageId)
      setPhase('synthesizing')

      let playback: SpeechPlayback | null = null
      let didStart = false
      const startedAt = performance.now()
      let outcome: 'success' | 'cancelled' | 'error' = 'success'
      let errorType: string | undefined

      try {
        try {
          playback = await activeProvider.prepare(nextRequest, controller.signal)
        } catch (error) {
          if (controller.signal.aborted || activeProvider.mode !== 'viseme') throw error
          logVoiceRequest(nextRequest.id, activeProvider.mode, startedAt, 'error', voiceErrorType(error))
          activeProvider = defaultBrowserTtsProvider
          setTtsMode(activeProvider.mode)
          playback = await activeProvider.prepare(nextRequest, controller.signal)
        }
        if (controller.signal.aborted || runIdRef.current !== runId) {
          playback.stop()
          continue
        }

        currentPlaybackRef.current = playback
        await playback.play(() => {
          if (controller.signal.aborted || runIdRef.current !== runId) return
          didStart = true
          setPhase('playing')
          onSentenceStart?.(nextRequest)
          startMouthAnimation(playback!, controller, runId)
        })
      } catch (error) {
        outcome = controller.signal.aborted ? 'cancelled' : 'error'
        errorType = voiceErrorType(error)
        // 单句合成失败时继续后续队列，页面文本回答不受影响。
      } finally {
        playback?.stop()
        if (controller.signal.aborted || runIdRef.current !== runId) outcome = 'cancelled'
        logVoiceRequest(nextRequest.id, activeProvider.mode, startedAt, outcome, errorType)
        if (runIdRef.current === runId) stopAnimation()
        if (currentAbortRef.current === controller) currentAbortRef.current = null
        if (currentPlaybackRef.current === playback) currentPlaybackRef.current = null
        if (didStart && runIdRef.current === runId) onSentenceEnd?.(nextRequest)
      }
    }

    if (processingRunRef.current === runId) {
      processingRunRef.current = null
      if (runIdRef.current === runId) {
        setPhase('idle')
        setCurrentSpeechId(null)
        setCurrentMessageId(null)
        stopAnimation()
        onQueueEmpty?.()
      }
    }
  }, [onQueueEmpty, onSentenceEnd, onSentenceStart, provider, startMouthAnimation, stopAnimation])

  const enqueue = useCallback((items: SpeechRequest | SpeechRequest[]) => {
    const list = (Array.isArray(items) ? items : [items]).filter((item) => Boolean(item.text.trim()))
    if (!list.length) return
    queueRef.current.push(...list)
    setQueueLength(queueRef.current.length)
    void processQueue()
  }, [processQueue])

  return {
    enqueue,
    stop,
    phase,
    isPreparing: phase === 'synthesizing',
    isPlaying: phase === 'playing',
    currentSpeechId,
    currentMessageId,
    queueLength,
    mouthOpen,
    mouthForm,
    mouthSource,
    ttsMode,
  }
}
