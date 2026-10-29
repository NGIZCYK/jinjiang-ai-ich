import { keywordSentiment } from './keywordSentiment'
import { buildGuideKnowledge, type GuideKnowledge } from '../../../supabase/functions/_shared/guideKnowledge.ts'
import { parseGuideSources } from '../../../supabase/functions/_shared/guideContract.ts'
import { normalizeCapabilities, capabilityChatMode, type GuideCapabilities, FALLBACK_CAPABILITIES } from './guideCapabilities'
export type { GuideCapabilities } from './guideCapabilities'
import { apiFetch } from './cloud'
import {
  analyzeGuideIntent,
  buildLocalSuzhouReply,
} from '../data/suzhouGuide'
import type { GuideAction, GuidePartyType, GuideSignal, GuideSource } from '../types'
import { readGuideStream } from './guideStream'
import type { Language } from './i18n'
import { inferSemanticPerformance, type SemanticPerformance } from './semanticPerformance'

export function sentimentOf(text: string): 'positive' | 'neutral' | 'negative' {
  return keywordSentiment(text)
}

/**
 * 将导览输入转换成最小化的匿名经营标签。它不保存原文、姓名或联系方式，
 * 只为课程原型的“导览 → 分析看板”反馈链路提供聚合数据。
 */
export function extractGuideSignal(text: string, language: Language): Omit<GuideSignal, 'id' | 'createdAt' | 'sourceMessageId'> | null {
  const topics: string[] = []
  if (/苏绣|刺绣|劈丝|针法|纹样|丝线|工艺|embroidery|silk|stitch|craft/i.test(text)) topics.push('craft')
  const hasExperienceTopic = /体验课|工坊|手作|预约|报名|workshop|book|reserve|atelier|hands-on/i.test(text)
    || (/行程|安排|itinerary|plan/i.test(text) && /苏绣|刺绣|非遗|体验|embroidery|heritage|experience/i.test(text))
  if (hasExperienceTopic) topics.push('experience')
  if (/故事|历史|文脉|织造|展陈|文化|history|story|culture|exhibition/i.test(text)) topics.push('culture')

  const hourMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:小时|小時|h(?:ours?)?)/i)
  const minuteMatch = text.match(/(\d+)\s*(?:分钟|分鐘|mins?|minutes?)/i)
  const stayHours = hourMatch ? Number(hourMatch[1]) : minuteMatch ? Number(minuteMatch[1]) / 60 : undefined
  const budgetMatch = text.match(/(?:预算|預算|花费|花費|费用|費用|人民币|人民幣|budget|¥|￥)\s*[：:约約]?\s*(\d{1,6})/i)
  const budget = budgetMatch ? Number(budgetMatch[1]) : undefined

  let partyType: GuidePartyType = 'unspecified'
  if (/一个人|独自|自己来|單獨|solo|alone|by myself/i.test(text)) partyType = 'solo'
  if (/孩子|亲子|小朋友|家人|父母|长辈|家庭|family|child|kids|parent/i.test(text)) partyType = 'family'
  if (/商务|商務|出差|客户|客戶|business|work trip|client/i.test(text)) partyType = 'business'

  if (topics.length === 0 && stayHours === undefined && budget === undefined && partyType === 'unspecified') return null
  return {
    language,
    topics,
    stayHours: stayHours && stayHours > 0 && stayHours <= 168 ? stayHours : undefined,
    budget: budget !== undefined && budget >= 0 && budget <= 100_000 ? budget : undefined,
    partyType,
    sentiment: sentimentOf(text),
  }
}

export function extractGuideAction(text: string, language: Language): GuideAction | undefined {
  const hasActionIntent = /预约|报名|记录.*意向|选择.*时段|体验.*安排|帮我安排|规划.*体验|行程|book|reserve|record.*preference|choose.*time|time slot|plan.*experience|itinerary/i.test(text)
  const hasEmbroideryExperienceContext = /苏绣|刺绣|非遗|工坊|手作|体验(?:课|活动|时段|安排)?|embroidery|heritage|workshop|atelier|hands-on|experience preference/i.test(text)
  if (!hasActionIntent || !hasEmbroideryExperienceContext) return undefined

  const durationMinutes = /(\d+(?:\.\d+)?)\s*(?:小时|小時|h(?:ours?)?)/i.test(text) || /(\d+)\s*(?:分钟|分鐘|mins?|minutes?)/i.test(text)
    ? parseDurationMinutes(text)
    : undefined
  const time = text.match(/(?:上午|下午|晚上)\s*\d{1,2}(?::\d{2}|点(?:半)?)?|(?:morning|afternoon|evening)\s*\d{1,2}(?::\d{2})?|\b\d{1,2}:\d{2}\b/i)?.[0]?.trim()
  const day = /周末|週末|weekend/i.test(text)
    ? (language === 'zh' ? '周末' : 'Weekend')
    : /工作日|weekday/i.test(text)
      ? (language === 'zh' ? '工作日' : 'Weekday')
      : ''
  const slot = [day, time].filter(Boolean).join(' ') || (language === 'zh' ? '待确认时段' : 'Time to be confirmed')
  return { type: 'record_preference', slot, durationMinutes }
}

const DEMO_REPLACES: { match: RegExp; reply: string }[] = [
  {
    match: /难|为什么|工艺|劈丝/,
    reply:
      '苏绣的细腻与丝线处理、针法组织和色彩过渡密切相关。工坊常以「劈丝」示意一根丝线如何被分成更细的丝缕，从而表现羽毛、水纹和花瓣的层次。不同师承与作品会采用不同分丝尺度，本原型中的 1/16、1/32 仅作体验分级，不是统一行业标准。\n\n如果你愿意，我可以继续介绍针法，或为你生成一份 90 分钟体验建议。',
  },
  {
    match: /推荐|行程|安排|两小时|2小时|90分钟|1小时/,
    reply:
      '可以先把住中体验分成四段：\n1) 公区数字长卷观察\n2) 沉浸非遗角材料探索\n3) 在教学人员指导下尝试基础起针\n4) 回看练习样片与材料养护说明\n\n具体时长、师资与材料由酒店和合作工坊确认；你可以在下方记录体验意向，或在「内容工作台」调整方案。',
  },
  {
    match: /预约|报名|几点|周末/,
    reply:
      '原型中提供工作日 14:00 / 16:00、周末 10:30 / 14:00 / 16:30 等演示时段。场次与容量目前用于验证预约流程，不代表酒店已正式开放。你可以在下方记录一个体验意向，并在「我的体验」查看确认单。',
  },
  {
    match: /价格|多少钱|收费|套餐/,
    reply:
      '目前页面展示的是课程原型，价格、师资、茶歇和装裱内容均为体验设计假设，尚未形成正式酒店产品。你可以先记录体验意向；若进入真实运营阶段，应由酒店、传承人或合作工坊共同确认价格与服务边界。',
  },
]

const ENGLISH_DEMO_REPLIES: { match: RegExp; reply: string }[] = [
  {
    match: /why|difficult|hard|craft|silk.?split|stitch/i,
    reply: `SU EMBROIDERY, UP CLOSE

• Craft focus — Silk splitting divides one strand into finer filaments, allowing soft transitions in petals, water and feathers.
• What makes it special — The craft values fineness, density, harmony and lustre rather than quick completion.
• Best first step — A prototype session can introduce the material and one small practice stitch, with attention to thread direction and tension.

Would you like a workshop outline or a recommendation for your available time?`,
  },
  {
    match: /itinerary|plan|two hours|2 hours|schedule|arrange/i,
    reply: `A TWO-HOUR CULTURAL PAUSE

01  Lobby story · 15 min
    Read the feature artwork and its Suzhou context.

02  Immersive gallery · 20 min
    Explore silk, stitch and concierge points at your pace.

03  Hands-on workshop · 60 min
    Try silk splitting and a foundational stitch.

04  Review & care notes · 25 min
    Review the practice sample and basic material-care guidance.

Would you like this adapted for a couple, a family, or a business guest?`,
  },
  {
    match: /book|booking|reserve|weekend|time slot/i,
    reply: `WORKSHOP BOOKING

Available prototype times
• Weekdays — 14:00 or 16:00
• Weekends — 10:30, 14:00 or 16:30

Times and capacity are prototype assumptions used to test the booking flow, not confirmed hotel inventory. Open My Stay when you are ready to record an experience preference.`,
  },
  {
    match: /price|cost|fee|how much|package/i,
    reply: `PROTOTYPE PRODUCT NOTE

The current workshop, tea pairing and keepsake details are service-design assumptions rather than a confirmed hotel offer. Pricing and capacity should be agreed with the hotel and the participating heritage practitioners before launch.

You may record an experience preference in My Stay to test the guest journey.`,
  },
]

export type ChatMode = 'deepseek' | 'demo' | 'fallback'

export { GUIDE_API_VERSION } from '../../../supabase/functions/_shared/guideContract.ts'

export async function getGuideCapabilities(): Promise<GuideCapabilities> {
  try {
    const response = await apiFetch('/api/capabilities', {
      headers: { Accept: 'application/json' },
      cache: 'no-store',
    })
    const contentType = response.headers.get('content-type') || ''
    if (!response.ok || !contentType.includes('application/json')) return { ...FALLBACK_CAPABILITIES }

    return normalizeCapabilities(await response.json())
  } catch {
    return { ...FALLBACK_CAPABILITIES }
  }
}

export async function getChatMode(): Promise<ChatMode> {
  const capabilities = await getGuideCapabilities()
  return capabilityChatMode(capabilities)
}

export interface WanNiangResult {
  answerSource: 'deepseek' | 'local' | 'deepseek-partial'
  content: string
  mode: 'deepseek' | 'demo' | 'fallback'
  sentiment: 'positive' | 'neutral' | 'negative'
  sources: GuideSource[]
  action?: GuideAction
  performance?: SemanticPerformance
}

export interface AskWanNiangStreamCallbacks {
  onMeta?: (meta: { requestId: string; provider: string; language: string }) => void
  onDelta?: (delta: string, accumulated: string) => void
  onDone?: (result: WanNiangResult) => void
  onError?: (error: Error) => void
}

function getLocalFallbackReply(
  question: string,
  language: Language,
  knowledge: GuideKnowledge,
  action?: GuideAction,
  forcedFallback = false,
): WanNiangResult {
  const analysis = analyzeGuideIntent(question)
  const localSuzhouReply = buildLocalSuzhouReply(question, analysis, language)
  const isPriceQuestion = /价格|多少钱|收费|套餐|price|cost|fee|how much|package/i.test(question)
  let content = ''

  if (knowledge.intent === 'project_itinerary') {
    content = generateItinerary(question, language).replace(/^#{1,3}\s+/gm, '').replace(/\*\*/g, '')
  } else if (knowledge.intent === 'project_booking') {
    const bookingReply = language === 'en' ? ENGLISH_DEMO_REPLIES[2]?.reply : DEMO_REPLACES[2]?.reply
    content = bookingReply || ''
  } else if (localSuzhouReply) {
    content = localSuzhouReply
  } else if (knowledge.intent === 'suxiu_craft') {
    if (isPriceQuestion) {
      content = language === 'en' ? ENGLISH_DEMO_REPLIES[3].reply : DEMO_REPLACES[3].reply
    } else if (knowledge.fallbackSnippet) {
      content = language === 'en'
        ? `${knowledge.fallbackSnippet}\n\nWould you like a closer explanation of the material, stitch or cultural context?`
        : `${knowledge.fallbackSnippet}\n\n如果你愿意，我可以继续从材料、针法或文化背景中的一个方向展开。`
    } else {
      content = language === 'en' ? ENGLISH_DEMO_REPLIES[0].reply : DEMO_REPLACES[0].reply
    }
  } else if (knowledge.matched && knowledge.fallbackSnippet) {
    content = language === 'en'
      ? `${knowledge.fallbackSnippet}\n\nThis is the locally available project reference; current public information should still be checked before a formal release.`
      : `${knowledge.fallbackSnippet}\n\n以上为当前可用的项目资料，正式发布前仍需核对公开来源。`
  } else {
    content = language === 'en'
      ? `The online model is temporarily unavailable, so I cannot give a reliable broad answer in local mode without inventing details. You can retry in a moment; the local guide can still explain Su embroidery, core Suzhou routes and the prototype cultural experience.`
      : `在线模型暂时不可用。为了不编造内容，本地模式无法可靠回答这个通用问题；你可以稍后重试。当前仍可继续询问苏绣工艺、苏州基础游览建议或项目体验安排。`
  }

  return {
    content,
    mode: forcedFallback ? ('fallback' as const) : ('demo' as const),
    answerSource: 'local',
    sentiment: sentimentOf(question),
    sources: knowledge.sources,
    action,
    performance: inferSemanticPerformance(question, content),
  }
}

export async function askWanNiang(
  question: string,
  history: { role: string; content: string }[] = [],
  language: Language = 'zh',
  signal?: AbortSignal,
): Promise<WanNiangResult> {
  const knowledge = buildGuideKnowledge(question, language)
  const action = extractGuideAction(question, language)
  let failed = false

  try {
    const res = await apiFetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        question,
        history,
        language,
      }),
      signal,
    })
    if (res.ok) {
      const data = await res.json() as { content?: string; provider?: string; sources?: unknown }
      if (data.content && data.provider === 'deepseek') {
        return {
          content: data.content,
          mode: 'deepseek' as const,
          answerSource: 'deepseek',
          sentiment: sentimentOf(question),
          sources: parseGuideSources(data.sources),
          action,
          performance: inferSemanticPerformance(question, data.content),
        }
      }
    } else {
      failed = true
    }
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error
    if (error instanceof Error && error.name === 'AbortError') throw error
    failed = true
    // 服务异常时保留本地演示回复，保证课堂演示不中断。
  }

  const currentMode = await getChatMode()
  return getLocalFallbackReply(question, language, knowledge, action, failed || currentMode !== 'demo')
}

/**
 * 婉娘 SSE 流式问答接口（任务书阶段B规范）
 * 1. 尝试使用 SSE 流式读取 DeepSeek 上游 token；
 * 2. 中途断网保留已接收内容并追加提示；
 * 3. DeepSeek 不可用或无密钥时自动调用本地知识回答并平滑模拟流式输出；
 * 4. 支持 AbortController 中途可靠停止。
 */
export async function askWanNiangStream(
  question: string,
  history: { role: string; content: string }[] = [],
  language: Language = 'zh',
  callbacks: AskWanNiangStreamCallbacks = {},
  signal?: AbortSignal,
): Promise<WanNiangResult> {
  const knowledge = buildGuideKnowledge(question, language)
  const action = extractGuideAction(question, language)

  try {
    const response = await apiFetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'text/event-stream',
      },
      body: JSON.stringify({
        question,
        history,
        language,
      }),
      signal,
    })

    if (signal?.aborted) {
      throw new DOMException('The user aborted a request.', 'AbortError')
    }

    if (response.ok) {
      const contentType = response.headers.get('content-type') || ''

      // 兼容旧版非流式 JSON 服务，避免把 JSON 或 SPA HTML 当成 SSE 后静默降级。
      if (contentType.includes('application/json')) {
        const data = await response.json() as { content?: string; provider?: string; sources?: unknown }
        if (data.provider === 'deepseek' && data.content?.trim()) {
          const content = data.content.trim()
          callbacks.onMeta?.({ requestId: 'json_compat', provider: 'deepseek', language })
          callbacks.onDelta?.(content, content)
          const result: WanNiangResult = {
            content,
            mode: 'deepseek',
            answerSource: 'deepseek',
            sentiment: sentimentOf(question),
            sources: parseGuideSources(data.sources),
            action,
            performance: inferSemanticPerformance(question, content),
          }
          callbacks.onDone?.(result)
          return result
        }
        throw new Error('导览接口返回了无效的 JSON 内容')
      }

      if (!contentType.includes('text/event-stream') || !response.body) {
        throw new Error('在线导览返回了不支持的格式，已保留本地导览；请检查服务配置。')
      }

      let serverSources: GuideSource[] = []
      let accumulatedText = ''
      let displayedText = ''
      let pendingDelta = ''
      let flushTimer: number | null = null
      let isDeepSeekDone = false
      let streamError: Error | null = null

      const flushBufferedDelta = () => {
        if (flushTimer !== null) {
          window.clearTimeout(flushTimer)
          flushTimer = null
        }
        if (signal?.aborted) { pendingDelta = ''; return }
        if (!pendingDelta) return
        const piece = pendingDelta
        pendingDelta = ''
        displayedText += piece
        callbacks.onDelta?.(piece, displayedText)
      }

      const bufferDelta = (delta: string) => {
        pendingDelta += delta
        if (pendingDelta.length >= 24 || /[。！？；.!?;]\s*$/.test(pendingDelta)) {
          flushBufferedDelta()
          return
        }
        if (flushTimer === null) {
          flushTimer = window.setTimeout(flushBufferedDelta, 40)
        }
      }

      const reader = response.body.getReader()
      try { await readGuideStream(reader, {
        onMeta: (meta) => { serverSources = parseGuideSources(meta.sources); callbacks.onMeta?.(meta) },
        onDelta: (delta, accumulated) => {
          accumulatedText = accumulated
          bufferDelta(delta)
        },
        onDone: (done) => {
          isDeepSeekDone = true
          if (done.sources !== undefined) serverSources = parseGuideSources(done.sources)
          if (done.content) accumulatedText = done.content
        },
        onError: (error) => {
          streamError = error instanceof Error ? error : new Error(error.message)
        },
      }, signal) } finally { flushBufferedDelta() }
      if (signal?.aborted) throw new DOMException('Request cancelled', 'AbortError')

      // 若服务端 done 内容比已展示内容更完整，补齐最后的尾段。
      if (accumulatedText.startsWith(displayedText) && accumulatedText.length > displayedText.length) {
        const tail = accumulatedText.slice(displayedText.length)
        displayedText = accumulatedText
        callbacks.onDelta?.(tail, displayedText)
      }

      if (streamError) callbacks.onError?.(streamError)

      if (isDeepSeekDone && accumulatedText.trim()) {
        const result: WanNiangResult = {
          content: accumulatedText,
          mode: 'deepseek',
          answerSource: 'deepseek',
          sentiment: sentimentOf(question),
          sources: serverSources,
          action,
          performance: inferSemanticPerformance(question, accumulatedText),
        }
        callbacks.onDone?.(result)
        return result
      }

      // 中途断网或异常但已有接收内容：保留已收到内容并给出可理解的失败提示
      if (accumulatedText.trim()) {
        const interruptedNotice = language === 'zh'
          ? '\n\n*(网络连接中断，已保留已生成内容)*'
          : '\n\n*(Connection interrupted, partial content retained)*'
        const finalContent = accumulatedText + interruptedNotice
        const result: WanNiangResult = {
          content: finalContent,
          mode: 'fallback',
          answerSource: 'deepseek-partial',
          sentiment: sentimentOf(question),
          sources: serverSources,
          action,
          performance: inferSemanticPerformance(question, finalContent),
        }
        callbacks.onDone?.(result)
        return result
      }
    } else {
      throw new Error(`导览服务请求失败：${response.status}`)
    }
  } catch (error) {
    if (signal?.aborted || (error instanceof Error && error.name === 'AbortError')) {
      throw error
    }
    callbacks.onError?.(error instanceof Error ? error : new Error(String(error)))
  }

  // DeepSeek 不可用或未返回时，自动调用本地知识模式回复
  const mode = await getChatMode()
  const fallback = getLocalFallbackReply(question, language, knowledge, action, mode !== 'demo')

  // 为本地回答提供平滑的流式增量吐字体验
  const chunkSize = 8
  let simulatedAccumulated = ''
  for (let i = 0; i < fallback.content.length; i += chunkSize) {
    if (signal?.aborted) {
      throw new DOMException('The user aborted a request.', 'AbortError')
    }
    const piece = fallback.content.slice(i, i + chunkSize)
    simulatedAccumulated += piece
    callbacks.onDelta?.(piece, simulatedAccumulated)
    await new Promise((r) => setTimeout(r, 20))
  }

  callbacks.onDone?.(fallback)
  return fallback
}

export interface GenerationContext {
  audience?: string
  channel?: string
}

function parseDurationMinutes(prefer: string): number {
  const p = prefer.toLowerCase().trim()
  const mMatch = p.match(/(\d+(?:\.\d+)?)\s*(?:分钟|min|m)/)
  if (mMatch) return Math.max(30, Math.round(parseFloat(mMatch[1])))
  const hMatch = p.match(/(\d+(?:\.\d+)?)\s*(?:小时|hour|h)/)
  if (hMatch) return Math.max(30, Math.round(parseFloat(hMatch[1]) * 60))
  if (p.includes('半小时') || p === '30') return 30
  if (p.includes('1.5') || p.includes('90')) return 90
  if (p.includes('2') || p.includes('120')) return 120
  if (p.includes('1') || p.includes('60')) return 60
  return 90
}

export function generateItinerary(prefer: string, language: Language = 'zh', context: GenerationContext = {}) {
  const audience = context.audience || (language === 'zh' ? '周末微度假住客' : 'Weekend escape guest')
  const channel = context.channel || (language === 'zh' ? '大堂礼宾屏' : 'Lobby concierge screen')
  const totalMin = parseDurationMinutes(prefer || (language === 'zh' ? '90 分钟' : '90 minutes'))
  
  // 动态精确分段时间表，确保各环节时长总和与住客输入严格一致
  const t1 = Math.max(3, Math.round(totalMin * 0.12))
  const t2 = Math.max(5, Math.round(totalMin * 0.18))
  const t4 = Math.max(5, Math.round(totalMin * 0.18))
  const t3 = totalMin - (t1 + t2 + t4)

  if (language === 'en') {
    return `# Su Embroidery Concierge Itinerary (${totalMin} Minutes)

**Guest Segment**: ${audience} · **Touchpoint**: ${channel}
**Total Duration**: ${totalMin} min (Schedule exact match: ${t1} + ${t2} + ${t3} + ${t4} = ${totalMin} min)

## 1. Feature Scroll Curatorial Tour (${t1} min)
- Observe the Prosperous Suzhou digital scroll interpretation
- Listen to Wanniang's narrative on Gusu textile origins and double-sided embroidery

## 2. Digital Texture Studio (${t2} min)
- Interactive exploration in the Lobby Concierge Atelier
- Inspect the 3x digital loupe across canal ripples and compare illustrative silk-splitting levels

## 3. Hands-on Artisan Workshop (${t3} min)
- Compare illustrative silk-splitting levels with an instructor
- Try one foundational stitch on a small practice sample, subject to atelier confirmation

## 4. Reflection & Take-home Notes (${t4} min)
- Review the motif and material choices made during the session
- Pack the practice sample and read its basic care notes

`
  }

  return `# 苏绣主题住中文化体验行程（${totalMin} 分钟）

**目标客群**：${audience} · **触达渠道**：${channel}
**总时长核验**：${totalMin} 分钟（环节严格对齐：${t1} + ${t2} + ${t3} + ${t4} = ${totalMin} 分钟）

## 1. 公区长卷典藏导览（${t1} 分钟）
- 驻足大堂《姑苏繁华图》长卷演绎，感悟阊门水关繁盛气象
- 婉娘依据项目知识卡介绍长卷出处、画面细节与苏州城市文脉

## 2. 数字纹理工坊探微（${t2} 分钟）
- 使用 3x 数字微距镜观察长卷演绎图中的纹理、色阶与局部构图
- 通过交互示意比较整股至 1/32 的相对粗细，观察细度变化与轮廓表现

## 3. 绣台起针体验（${t3} 分钟）
- 天然桑蚕丝剖丝演示与双手分丝体验
- 在教学人员指导下尝试基础针法，完成一枚练习样片

## 4. 回看与带走说明（${t4} 分钟）
- 回看纹样、丝色和针法选择，记录个人体验感受
- 整理练习样片并阅读基础养护说明

`
}

export function generateMarketingCopy(scene: string, language: Language = 'zh', context: GenerationContext = {}) {
  const audience = context.audience || (language === 'zh' ? '周末微度假住客' : 'Weekend escape guest')
  const channel = context.channel || (language === 'zh' ? '大堂礼宾屏' : 'Lobby concierge screen')
  if (language === 'en') {
    return `【Jinjiang Su Embroidery Themed Stay · ${scene || 'Weekend Escape'}】

Audience: ${audience}
Recommended touchpoint: ${channel}

Spend a night within the warp and weft of Gusu.
Outside the window is Jiangnan rain; on the silk are flowers and birds. Wanniang waits in the lobby to turn one thread into light and a weekend into a quieter Suzhou memory.

Experience concept: connect the room, lobby interpretation and workshop preference into one coherent guest journey.
For: couples on a short escape / family art learning / cultural travellers

#SuEmbroidery #IntangibleHeritage #JinjiangHotel #Suzhou`
  }
  return `【锦江苏绣主题房 · ${scene || '周末微度假'}】

目标住客：${audience}
推荐触点：${channel}

在姑苏的经纬里住一晚。
推开窗是江南烟雨，铺开的是丝线上的花鸟。婉娘会在公区等你，把一根丝劈成光，把一座城的雅致缝进这个周末。

体验构想：把主题客房、公区导览与工坊体验意向串联成一段完整住中旅程。
适合：情侣微度假 / 亲子美育 / 文化旅行者

#苏绣 #非遗体验 #锦江酒店 #姑苏`
}
