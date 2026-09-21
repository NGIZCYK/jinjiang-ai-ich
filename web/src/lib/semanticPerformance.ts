import type { AvatarEmotion, AvatarGesture } from '../components/avatar/avatarTypes'

export type AvatarPace = 'calm' | 'lively'

export interface SemanticPerformance {
  emotion: AvatarEmotion
  gesture: AvatarGesture
  pace: AvatarPace
}

export const VALID_EMOTIONS = new Set<AvatarEmotion>(['neutral', 'warm', 'thoughtful'])
export const VALID_GESTURES = new Set<AvatarGesture>(['none', 'introduce', 'emphasis', 'acknowledge'])
export const VALID_PACES = new Set<AvatarPace>(['calm', 'lively'])

export const DEFAULT_PERFORMANCE: SemanticPerformance = {
  emotion: 'neutral',
  gesture: 'none',
  pace: 'calm',
}

/**
 * 严格白名单校验器（任务书阶段F规范）
 * 服务端和前端都必须验证枚举。无法解析或不在白名单中时统一使用默认值。
 */
export function validateSemanticPerformance(raw: unknown): SemanticPerformance {
  if (!raw || typeof raw !== 'object') {
    return { ...DEFAULT_PERFORMANCE }
  }

  const obj = raw as Record<string, unknown>
  const emotion = typeof obj.emotion === 'string' && VALID_EMOTIONS.has(obj.emotion as AvatarEmotion)
    ? (obj.emotion as AvatarEmotion)
    : DEFAULT_PERFORMANCE.emotion

  const gesture = typeof obj.gesture === 'string' && VALID_GESTURES.has(obj.gesture as AvatarGesture)
    ? (obj.gesture as AvatarGesture)
    : DEFAULT_PERFORMANCE.gesture

  const pace = typeof obj.pace === 'string' && VALID_PACES.has(obj.pace as AvatarPace)
    ? (obj.pace as AvatarPace)
    : DEFAULT_PERFORMANCE.pace

  return { emotion, gesture, pace }
}

/**
 * 依据任务书阶段F表演约束进行语义推断：
 * 1. 一段回答最多触发 1–2 次明显动作；
 * 2. 工艺说明使用 thoughtful 或 introduce；
 * 3. 行程建议使用 warm 或 acknowledge；
 * 4. 安全提示、资料边界和错误信息使用 neutral 与 none；
 * 5. 禁止随机大幅摇头、持续摆动和频繁手势。
 */
export function inferSemanticPerformance(question: string, content: string): SemanticPerformance {
  const combined = `${question} ${content}`

  // 1. 错误、边界限制或免责声明 -> neutral / none
  if (/网络连接中断|抱歉|无法回答|敏感信息|不提供|官方最新信息|未配置|错误/i.test(content)) {
    return { emotion: 'neutral', gesture: 'none', pace: 'calm' }
  }

  // 2. 苏绣工艺与文化解读 -> thoughtful / introduce
  const isCraftTopic = /非遗|工艺|技艺|劈丝|针法|苏绣|刺绣|丝光|蚕丝|绣娘|双面绣|乱针绣|缂丝|织造|制作|工序|传承|历史|stitch|silk|embroidery|craft/i.test(combined)
  if (isCraftTopic) {
    return {
      emotion: 'thoughtful',
      gesture: 'introduce',
      pace: 'calm',
    }
  }

  // 3. 苏州行程、景点与住中建议 -> warm / acknowledge
  const isTravelTopic = /行程|游览|景点|路线|打卡|园林|平江路|山塘街|虎丘|拙政园|苏州博物馆|苏州|姑苏|美食|小吃|交通|门票|体验|预订|怎么去|itinerary|travel|suzhou/i.test(combined)
  if (isTravelTopic) {
    return {
      emotion: 'warm',
      gesture: 'acknowledge',
      pace: 'calm',
    }
  }

  // 4. 问候与礼貌互动 -> warm / none
  if (/你好|您好|感谢|谢谢|再见|hello|hi|welcome/i.test(combined)) {
    return {
      emotion: 'warm',
      gesture: 'acknowledge',
      pace: 'calm',
    }
  }

  return { ...DEFAULT_PERFORMANCE }
}
