import { apiFetch } from '../cloud'
import type { SpeechPlayback, SpeechRequest, TtsProvider, VisemeFrame } from './types'
import { mapAzureVisemeToShape } from './visemeMapper'

export interface AzureTtsOptions {
  region: string
  token: string
  voiceZh?: string
  voiceEn?: string
}

/**
 * 满足《婉娘Live2D数字人实施任务书》阶段D规范：
 * 1. 采用服务端签发的短时临时令牌（token），长期凭据绝不暴露至前端；
 * 2. 动态加载 Speech SDK，首屏体积零污染；
 * 3. 监听 visemeReceived 事件，将 Azure 0~21 号 ID 转换为 mouthOpen 与 mouthForm；
 * 4. 具备毫秒级时间轴与中止响应。
 */
export class AzureVisemeTtsProvider implements TtsProvider {
  readonly mode: 'viseme' = 'viseme'
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

  /**
   * 如 Token 快超过 9 分钟（Azure 临时 Token 寿命一般为 10 分钟），静默续期
   */
  private async ensureFreshToken(): Promise<string> {
    const tenMinutes = 9 * 60 * 1000
    if (Date.now() - this.tokenFetchedAt < tenMinutes) {
      return this.token
    }

    try {
      const res = await apiFetch('/api/tts/token')
      if (res.ok) {
        const data = await res.json()
        if (data.token) {
          this.token = data.token
          this.tokenFetchedAt = Date.now()
        }
      }
    } catch {
      // 续期失败则沿用当前 token 尝试
    }
    return this.token
  }

  async prepare(request: SpeechRequest, signal: AbortSignal): Promise<SpeechPlayback> {
    if (signal.aborted) {
      return {
        play: async () => {},
        stop: () => {},
      }
    }

    // 动态按需加载 Azure Speech SDK
    const SpeechSDK = await import('microsoft-cognitiveservices-speech-sdk')
    const token = await this.ensureFreshToken()

    const speechConfig = SpeechSDK.SpeechConfig.fromAuthorizationToken(token, this.region)
    speechConfig.speechSynthesisVoiceName = request.language === 'zh' ? this.voiceZh : this.voiceEn
    speechConfig.speechSynthesisOutputFormat = SpeechSDK.SpeechSynthesisOutputFormat.Riff24Khz16BitMonoPcm

    // 创建纯内存合成器（不直接绑定默认声卡，以便精确控制音频生命周期与 URL 播放）
    const synthesizer = new SpeechSDK.SpeechSynthesizer(speechConfig, null as any)

    const visemes: VisemeFrame[] = []

    synthesizer.visemeReceived = (_sender, event) => {
      // audioOffset 单位为 100-nanosecond ticks (1 tick = 10^-4 ms)
      const offsetMs = Math.round(event.audioOffset / 10000)
      const shape = mapAzureVisemeToShape(event.visemeId)

      visemes.push({
        offsetMs,
        id: event.visemeId,
        mouthOpen: shape.mouthOpen,
        mouthForm: shape.mouthForm,
      })
    }

    return new Promise<SpeechPlayback>((resolve, reject) => {
      if (signal.aborted) {
        try {
          synthesizer.close()
        } catch {}
        resolve({
          play: async () => {},
          stop: () => {},
        })
        return
      }

      signal.addEventListener('abort', () => {
        try {
          synthesizer.close()
        } catch {}
      })

      synthesizer.speakTextAsync(
        request.text,
        (result) => {
          if (signal.aborted) {
            try {
              synthesizer.close()
            } catch {}
            resolve({
              play: async () => {},
              stop: () => {},
            })
            return
          }

          if (result.reason === SpeechSDK.ResultReason.SynthesizingAudioCompleted && result.audioData) {
            const blob = new Blob([result.audioData], { type: 'audio/wav' })
            const audioUrl = URL.createObjectURL(blob)
            const audio = new Audio(audioUrl)

            let isEnded = false
            let resolvePlayback: (() => void) | null = null

            const stopPlayback = () => {
              if (isEnded) return
              isEnded = true
              try {
                audio.pause()
                audio.currentTime = 0
                URL.revokeObjectURL(audioUrl)
                synthesizer.close()
              } catch {}
              if (resolvePlayback) resolvePlayback()
            }

            const playback: SpeechPlayback = {
              visemes,
              durationMs: visemes.length > 0 ? visemes[visemes.length - 1].offsetMs + 200 : undefined,
              play: (onStart) => {
                if (signal.aborted) {
                  stopPlayback()
                  return Promise.resolve()
                }

                return new Promise<void>((res) => {
                  resolvePlayback = res
                  audio.onplay = () => onStart?.()

                  audio.onended = () => {
                    stopPlayback()
                  }

                  audio.onerror = () => {
                    stopPlayback()
                  }

                  audio.play().catch(() => {
                    stopPlayback()
                  })
                })
              },
              stop: stopPlayback,
            }

            resolve(playback)
          } else {
            try {
              synthesizer.close()
            } catch {}
            reject(new Error(`Azure TTS 合成未完成: ${result.errorDetails || result.reason}`))
          }
        },
        (error) => {
          try {
            synthesizer.close()
          } catch {}
          reject(new Error(`Azure TTS 合成异常: ${error}`))
        },
      )
    })
  }
}
