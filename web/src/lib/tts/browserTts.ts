import type { SpeechPlayback, SpeechRequest, TtsProvider } from './types'
import { sanitizeSpeechText } from './speechText'
import { loadBrowserVoices, pickBestVoice } from './browserVoices'
import { readVoiceSettings, voiceKey, voiceMatchesLanguage } from './voiceSettings'
export { pickBestVoice } from './browserVoices'

/** Device voices are selected per language; unsupported languages never borrow another voice. */
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

    if (this.mode === 'unavailable') throw new Error('VOICE_UNAVAILABLE')

    const cleanText = sanitizeSpeechText(request.text)
    if (!cleanText) {
      return {
        async play() {},
        stop() {},
      }
    }

    // 异步解析当前环境的最优自然音色
    const voices = await loadBrowserVoices(signal)
    if (signal.aborted) throw new DOMException('Speech cancelled.', 'AbortError')
    const settings=readVoiceSettings(request.language)
    const selectedVoice=settings.voiceURI?voices.find(voice=>voiceKey(voice)===settings.voiceURI&&voiceMatchesLanguage(voice,request.language)):pickBestVoice(voices,request.language)
    if(!selectedVoice)throw new Error(settings.voiceURI?'VOICE_SELECTION_UNAVAILABLE':'VOICE_LANGUAGE_UNAVAILABLE')

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
          utterance.lang = selectedVoice.lang
          utterance.rate = settings.rate
          utterance.pitch = 1

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

