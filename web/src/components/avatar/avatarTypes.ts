/**
 * 数字人状态机与渲染器通用类型定义
 * 依据《婉娘Live2D数字人实施任务书》5.1节与阶段A规范
 */

export type AvatarState =
  | 'idle'
  | 'listening'
  | 'thinking'
  | 'speaking'
  | 'paused'
  | 'error'

export type AvatarEmotion =
  | 'neutral'
  | 'warm'
  | 'thoughtful'

export type AvatarGesture =
  | 'none'
  | 'introduce'
  | 'emphasis'
  | 'acknowledge'

export type AvatarPace = 'calm' | 'lively'

/** 口型帧数据订阅源：rAF 每帧直推，绕开 React 重渲染。 */
export interface MouthSource {
  subscribe: (listener: (open: number, form: number) => void) => () => void
}

export type VisemeFrame = {
  offsetMs: number
  id: number
  mouthOpen: number
  mouthForm?: number
}

export interface AvatarStateCopy {
  idle: string
  listening: string
  thinking: string
  speaking: string
  paused: string
  error: string
}

export const AVATAR_STATE_TEXT: Record<'zh' | 'en', AvatarStateCopy> = {
  zh: {
    idle: '静候您的问题',
    listening: '正在倾听您的提问',
    thinking: '正在查阅相关线索与知识卡…',
    speaking: '正在为您讲解',
    paused: '已暂停生成',
    error: '服务连接异常 · 已转入静态接待',
  },
  en: {
    idle: 'Awaiting your question',
    listening: 'Listening to your question…',
    thinking: 'Reviewing relevant sources…',
    speaking: 'Explaining in voice',
    paused: 'Generation paused',
    error: 'Service connection error · Static mode',
  },
}

export interface AvatarStageProps {
  state: AvatarState
  emotion?: AvatarEmotion
  gesture?: AvatarGesture
  language: 'zh' | 'en'
  statusText?: string
  eyebrow?: string
  name?: string
  className?: string
  fallbackImage?: string
  mouthOpen?: number
  mouthForm?: number
  ttsMode?: 'viseme' | 'browser' | 'unavailable'
  useLive2D?: boolean
  modelPath?: string
  pace?: AvatarPace
  /** 默认 true；置 false 时跳过 puppet 渲染器直接用静态兜底。 */
  usePuppet?: boolean
}

export interface StaticAvatarProps {
  state: AvatarState
  emotion?: AvatarEmotion
  gesture?: AvatarGesture
  imageSrc?: string
  alt?: string
  className?: string
  mouthOpen?: number
  mouthForm?: number
  ttsMode?: 'viseme' | 'browser' | 'unavailable'
}

export interface PuppetAvatarProps {
  state: AvatarState
  emotion?: AvatarEmotion
  gesture?: AvatarGesture
  pace?: AvatarPace
  alt?: string
  className?: string
  /** 部件资源目录，默认 /avatar/wanniang-puppet */
  assetBase?: string
  /** 全部部件载入完成时通知舞台移除静态兜底层。 */
  onReady?: () => void
  /** 部件加载失败或 prefers-reduced-motion 时回调，交由舞台降级为静态形象。 */
  onFallback?: () => void
}
