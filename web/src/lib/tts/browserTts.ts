import type { SpeechPlayback, SpeechRequest, TtsProvider } from './types'

import { sanitizeSpeechText } from './speechText'

let cachedVoices: SpeechSynthesisVoice[] = []

/**
 * 异步获取当前环境可用的声音列表（包含 Edge/Chrome 的在线高品质神经网络声音）
 */
async function getAvailableVoices(): Promise<SpeechSynthesisVoice[]> {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return []
  if (cachedVoices.length > 0) return cachedVoices

  const immediate = window.speechSynthesis.getVoices()
  if (immediate.length > 0) {
    cachedVoices = immediate
    return immediate
  }

  return new Promise<SpeechSynthesisVoice[]>((resolve) => {
    let timeoutId: number
    const onVoicesChanged = () => {
      clearTimeout(timeoutId)
      window.speechSynthesis.removeEventListener('voiceschanged', onVoicesChanged)
      cachedVoices = window.speechSynthesis.getVoices()
      resolve(cachedVoices)
    }
    window.speechSynthesis.addEventListener('voiceschanged', onVoicesChanged, { once: true })
    timeoutId = window.setTimeout(() => {
      window.speechSynthesis.removeEventListener('voiceschanged', onVoicesChanged)
      cachedVoices = window.speechSynthesis.getVoices()
      resolve(cachedVoices)
    }, 250)
  })
}

/**
 * 智能音色挑选策略：
 * 优先匹配 Edge / Chrome 内置的高保真 Natural（超自然）微软晓晓/晓伊女声，
 * 消除 Windows 离线 SAPI 引擎（如 Microsoft Huihui）的机械机器人质感。
 */
export function pickBestVoice(voices: SpeechSynthesisVoice[], language: 'zh' | 'en'): SpeechSynthesisVoice | undefined {
  if (!voices || voices.length === 0) return undefined

  if (language === 'zh') {
    // 1. 最高优先级：微软超自然女声（小晓 Xiaoxiao / 晓伊 Xiaoyi）
    const xiaoxiao = voices.find((v) => /xiaoxiao/i.test(v.name) && (v.lang.startsWith('zh') || v.lang.includes('CN')))
    if (xiaoxiao) return xiaoxiao

    const xiaoyi = voices.find((v) => /xiaoyi/i.test(v.name) && (v.lang.startsWith('zh') || v.lang.includes('CN')))
    if (xiaoyi) return xiaoyi

    // 2. 次高优先级：任何标有 Natural 的中文声音（Edge/Windows 10/11 云端自然音色）
    const naturalZh = voices.find(
      (v) => /natural/i.test(v.name) && (v.lang.startsWith('zh') || v.lang.includes('CN') || v.lang.includes('cmn')),
    )
    if (naturalZh) return naturalZh

    // 3. 匹配 Google 普通话或在线高品质女声
    const googleZh = voices.find(
      (v) => (v.name.includes('Google') || /female/i.test(v.name) || /online/i.test(v.name)) && (v.lang.startsWith('zh') || v.lang.includes('CN')),
    )
    if (googleZh) return googleZh

    // 4. 任意中文语音托底
    const anyZh = voices.find((v) => v.lang.startsWith('zh') || v.lang.includes('CN') || v.lang.includes('cmn'))
    if (anyZh) return anyZh
  } else {
    // 英文优先匹配 Jenny / Aria / Natural
    const jenny = voices.find((v) => /jenny/i.test(v.name) && v.lang.startsWith('en'))
    if (jenny) return jenny

    const aria = voices.find((v) => /aria/i.test(v.name) && v.lang.startsWith('en'))
    if (aria) return aria

    const naturalEn = voices.find((v) => /natural/i.test(v.name) && v.lang.startsWith('en'))
    if (naturalEn) return naturalEn

    const anyEn = voices.find((v) => v.lang.startsWith('en'))
    if (anyEn) return anyEn
  }

  return voices[0]
}

/**
 * 基于浏览器原生 SpeechSynthesis 的高品质 TTS 适配器
 * 满足方案一：
 * 1. 智能匹配 Edge / Chrome 自然在线女声（如 Microsoft Xiaoxiao Natural）；
 * 2. 语速放缓至 0.88~0.90，语调微调至 1.04，契合江南文化礼宾的温婉从容；
 * 3. 剥离 Markdown 与符号，口语化自然呈现；
 * 4. 具备 Promise 播放控制与 AbortSignal 打断能力。
 */
export class BrowserTtsProvider implements TtsProvider {
  get mode(): 'browser' | 'unavailable' {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      return 'browser'
    }
    return 'unavailable'
  }

  async prepare(request: SpeechRequest, signal: AbortSignal): Promise<SpeechPlayback> {
    if (signal.aborted) {
      throw new DOMException('The user aborted speech playback.', 'AbortError')
    }

    if (this.mode === 'unavailable') {
      return {
        async play() {
          // 无语音合成能力时静默跳过
        },
        stop() {},
      }
    }

    const cleanText = sanitizeSpeechText(request.text)
    if (!cleanText) {
      return {
        async play() {},
        stop() {},
      }
    }

    // 异步解析当前环境的最优自然音色
    const voices = await getAvailableVoices()
    if (signal.aborted) throw new DOMException('Speech cancelled.', 'AbortError')
    const selectedVoice = pickBestVoice(voices, request.language)

    let isStopped = false
    let currentUtterance: SpeechSynthesisUtterance | null = null
    let settle: ((error?: Error) => void) | null = null

    const stopPlayback = () => {
      isStopped = true
      const ownsUtterance = currentUtterance !== null
      // cancel() does not reliably emit onend; release the waiting queue ourselves.
      settle?.()
      if (ownsUtterance && typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel()
      }
    }

    return {
      play: (onStart) => {
        return new Promise<void>((resolve, reject) => {
          if (signal.aborted || isStopped) {
            resolve()
            return
          }

          const utterance = new SpeechSynthesisUtterance(cleanText)
          currentUtterance = utterance
          if (selectedVoice) {
            utterance.voice = selectedVoice
          }
          utterance.lang = request.language === 'zh' ? 'zh-CN' : 'en-US'
          // 婉娘语速调优：0.88 从容温雅，避免急促；音调 1.04 略显清雅亲切
          utterance.rate = request.language === 'zh' ? 0.88 : 0.90
          utterance.pitch = request.language === 'zh' ? 1.04 : 1.02

          const onAbort = () => stopPlayback()
          const startTimer = window.setTimeout(() => {
            finish(new DOMException('Speech did not start.', 'TimeoutError'))
            window.speechSynthesis.cancel()
          }, 15000)
          const finish = (error?: Error) => {
            if (settle !== finish) return
            settle = null
            window.clearTimeout(startTimer)
            signal.removeEventListener('abort', onAbort)
            utterance.onstart = null
            utterance.onend = null
            utterance.onerror = null
            currentUtterance = null
            if (error) reject(error)
            else resolve()
          }
          settle = finish
          signal.addEventListener('abort', onAbort, { once: true })
          utterance.onstart = () => {
            window.clearTimeout(startTimer)
            if (!signal.aborted && !isStopped && currentUtterance === utterance) onStart?.()
          }
          utterance.onend = () => finish()

          utterance.onerror = (event) => {
            // 'canceled' 或 'interrupted' 属于正常停止，不作为异常抛出
            if (event.error === 'canceled' || event.error === 'interrupted' || isStopped) {
              finish()
            } else {
              finish(new Error('VOICE_PLAYBACK_ERROR'))
            }
          }

          try { window.speechSynthesis.speak(utterance) }
          catch { finish(new Error('VOICE_PLAYBACK_ERROR')) }
        })
      },
      stop: () => {
        stopPlayback()
      },
    }
  }
}

