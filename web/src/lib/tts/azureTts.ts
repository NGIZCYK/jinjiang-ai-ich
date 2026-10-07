import { apiFetch } from '../cloud'
import type { SpeechPlayback, SpeechRequest, TtsProvider, VisemeFrame } from './types'
import { mapAzureVisemeToShape } from './visemeMapper'
import { sanitizeSpeechText } from './speechText'

export interface AzureTtsOptions {
  region: string
  token: string
  voiceZh?: string
  voiceEn?: string
}

export class AzureVisemeTtsProvider implements TtsProvider {
  readonly mode = 'viseme' as const
  private region: string
  private token: string
  private voiceZh: string
  private voiceEn: string
  private tokenFetchedAt: number

  constructor(options: AzureTtsOptions) {
    this.region = options.region
    this.token = options.token
    this.voiceZh = options.voiceZh || 'zh-CN-XiaoxiaoNeural'
    this.voiceEn = options.voiceEn || 'en-US-JennyNeural'
    this.tokenFetchedAt = Date.now()
  }

  private async ensureFreshToken(signal: AbortSignal): Promise<string> {
    if (Date.now() - this.tokenFetchedAt < 9 * 60 * 1000) return this.token
    const response = await apiFetch('/api/tts/token', { signal })
    if (!response.ok) throw new Error('VOICE_TOKEN_UNAVAILABLE')
    const data = await response.json()
    if (typeof data.token !== 'string' || !data.token) throw new Error('VOICE_TOKEN_UNAVAILABLE')
    this.token = data.token
    this.tokenFetchedAt = Date.now()
    return this.token
  }

  async prepare(request: SpeechRequest, signal: AbortSignal): Promise<SpeechPlayback> {
    signal.throwIfAborted()
    const cleanText = sanitizeSpeechText(request.text)
    if (!cleanText) return { play: async () => {}, stop() {} }
    const SpeechSDK = await import('microsoft-cognitiveservices-speech-sdk')
    signal.throwIfAborted()
    const token = await this.ensureFreshToken(signal)
    signal.throwIfAborted()
    const config = SpeechSDK.SpeechConfig.fromAuthorizationToken(token, this.region)
    config.speechSynthesisVoiceName = request.language === 'zh' ? this.voiceZh : this.voiceEn
    config.speechSynthesisOutputFormat = SpeechSDK.SpeechSynthesisOutputFormat.Riff24Khz16BitMonoPcm
    const synthesizer = new SpeechSDK.SpeechSynthesizer(config, null as any)
    const visemes: VisemeFrame[] = []
    synthesizer.visemeReceived = (_sender, event) => {
      visemes.push({ offsetMs: Math.round(event.audioOffset / 10000), id: event.visemeId, ...mapAzureVisemeToShape(event.visemeId) })
    }

    return new Promise<SpeechPlayback>((resolve, reject) => {
      let prepared = false
      let ended = false
      let audio: HTMLAudioElement | null = null
      let audioUrl: string | null = null
      let settlePlayback: ((error?: Error) => void) | null = null
      const closeSynthesizer = () => { try { synthesizer.close() } catch { /* already closed */ } }
      const cleanup = () => {
        if (ended) return
        ended = true
        window.clearTimeout(timer)
        signal.removeEventListener('abort', onAbort)
        closeSynthesizer()
        if (audio) {
          audio.onplaying = audio.onended = audio.onerror = null
          try { audio.pause() } catch { /* Continue releasing resources if the media element failed. */ }
        }
        if (audioUrl) URL.revokeObjectURL(audioUrl)
      }
      const failPreparation = (error: Error) => {
        if (prepared || ended) return
        cleanup()
        reject(error)
      }
      const onAbort = () => {
        if (!prepared) failPreparation(new DOMException('Speech cancelled.', 'AbortError'))
        else { cleanup(); settlePlayback?.() }
      }
      const timer = window.setTimeout(() => failPreparation(new DOMException('Speech synthesis timed out.', 'TimeoutError')), 45000)
      signal.addEventListener('abort', onAbort, { once: true })
      if (signal.aborted) { onAbort(); return }
      try {
        synthesizer.speakTextAsync(cleanText, (result) => {
          if (ended || signal.aborted) return
          if (result.reason !== SpeechSDK.ResultReason.SynthesizingAudioCompleted || !result.audioData) {
            failPreparation(new Error('VOICE_SYNTHESIS_FAILED'))
            return
          }
          try {
            audioUrl = URL.createObjectURL(new Blob([result.audioData], { type: 'audio/wav' }))
            audio = new Audio(audioUrl)
            prepared = true
            window.clearTimeout(timer)
            closeSynthesizer()
            resolve({
              visemes,
              play: (onStart) => {
                if (ended || signal.aborted) { cleanup(); return Promise.resolve() }
                return new Promise<void>((done, fail) => {
                  settlePlayback = (error) => {
                    settlePlayback = null
                    cleanup()
                    if (error) fail(error)
                    else done()
                  }
                  audio!.onplaying = () => { if (!ended && !signal.aborted) onStart?.() }
                  audio!.onended = () => settlePlayback?.()
                  audio!.onerror = () => settlePlayback?.(new Error('VOICE_PLAYBACK_ERROR'))
                  audio!.play().catch(() => settlePlayback?.(new Error('VOICE_PLAYBACK_ERROR')))
                })
              },
              stop: () => { cleanup(); settlePlayback?.() },
            })
          } catch {
            prepared = false
            failPreparation(new Error('VOICE_AUDIO_UNAVAILABLE'))
          }
        }, () => failPreparation(new Error('VOICE_SYNTHESIS_FAILED')))
      } catch {
        failPreparation(new Error('VOICE_SYNTHESIS_FAILED'))
      }
    })
  }
}
