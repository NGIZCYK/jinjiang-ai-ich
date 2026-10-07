import { isKnownVersionMismatch } from '../lib/serviceCompatibility'
import { capabilityChatMode } from '../lib/guideCapabilities'
import { RecommendationPanel } from '../components/RecommendationPanel'
import { FloatingWanNiangAssistant } from '../components/FloatingWanNiangAssistant'
import { FormEvent, KeyboardEvent, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { AvatarStage } from '../components/avatar/AvatarStage'
import type { AvatarPace } from '../components/avatar/avatarTypes'
import { useAvatarDirector } from '../hooks/useAvatarDirector'
import { useSpeechQueue } from '../hooks/useSpeechQueue'
import { useLanguage } from '../lib/i18n'
import {
  askWanNiangStream,
  extractGuideSignal,
  getGuideCapabilities,
  sentimentOf,
  type ChatMode,
  type GuideCapabilities,
} from '../lib/llm'
import { SentenceSegmenter, splitIntoSentences } from '../lib/sentenceSegmenter'
import { useAppStore } from '../lib/store'
import type { SpeechRequest } from '../lib/tts/types'
import type { GuideSource } from '../types'

function InlineText({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g)
  return parts.map((part, index) => part.startsWith('**') && part.endsWith('**')
    ? <strong key={`${part}-${index}`}>{part.slice(2, -2)}</strong>
    : <span key={`${part}-${index}`}>{part}</span>)
}

function GuideMessageContent({ content }: { content: string }) {
  const blocks = content.trim().split(/\n\s*\n/).filter(Boolean)
  return (
    <div className="guide-message-content">
      {blocks.map((block, blockIndex) => {
        const lines = block.split('\n').map((line) => line.trim()).filter(Boolean)
        if (!lines.length) return null
        const heading = lines[0].match(/^#{1,3}\s+(.+)/)
        if (heading && lines.length === 1) {
          return <h3 key={blockIndex}><InlineText text={heading[1]} /></h3>
        }
        const ordered = lines.every((line) => /^\d+[.)]\s+/.test(line))
        if (ordered) {
          return (
            <ol key={blockIndex}>
              {lines.map((line, lineIndex) => <li key={lineIndex}><InlineText text={line.replace(/^\d+[.)]\s+/, '')} /></li>)}
            </ol>
          )
        }
        const unordered = lines.every((line) => /^[-•]\s+/.test(line))
        if (unordered) {
          return (
            <ul key={blockIndex}>
              {lines.map((line, lineIndex) => <li key={lineIndex}><InlineText text={line.replace(/^[-•]\s+/, '')} /></li>)}
            </ul>
          )
        }
        if (lines.length === 1 && /^[A-Z][A-Z\s,&:—-]{5,}$/.test(lines[0])) {
          return <h3 key={blockIndex}><InlineText text={lines[0]} /></h3>
        }
        return (
          <p key={blockIndex}>
            {lines.map((line, lineIndex) => (
              <span key={lineIndex}>
                <InlineText text={line.replace(/^>\s*/, '')} />
                {lineIndex < lines.length - 1 && <br />}
              </span>
            ))}
          </p>
        )
      })}
    </div>
  )
}

function SourceDisclosure({ sources, language }: { sources?: GuideSource[]; language: 'zh' | 'en' }) {
  if (!sources?.length) return null
  const category = {
    documented: language === 'zh' ? '文献线索' : 'Documented lead',
    practice: language === 'zh' ? '工艺经验' : 'Craft practice',
    prototype: language === 'zh' ? '原型设想' : 'Prototype assumption',
  }
  return (
    <details className="guide-sources">
      <summary>{language === 'zh' ? `参考与核验 · ${sources.length} 项` : `Sources & verification · ${sources.length}`}</summary>
      <div className="guide-source-list">
        {sources.map((source) => (
          <div key={source.id} className="guide-source-item">
            <div>
              <strong>{source.title}</strong>
              <span>{category[source.category]}</span>
            </div>
            <p>{source.references.join(language === 'zh' ? '；' : '; ')}</p>
          </div>
        ))}
      </div>
    </details>
  )
}

export function GuidePage() {
  const messages = useAppStore((s) => s.messages)
  const addMessage = useAppStore((s) => s.addMessage)
  const clearMessages = useAppStore((s) => s.clearMessages)
  const addGuideSignal = useAppStore((s) => s.addGuideSignal)
  const clearGuideSignals = useAppStore((s) => s.clearGuideSignals)
  const user = useAppStore((s) => s.user)
  const { language } = useLanguage()
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [speak, setSpeak] = useState(false)
  const speechEnabledRef = useRef(false)
  const activeRef = useRef(true)
  const gestureTimerRef = useRef<number | null>(null)
  const speechQueue = useSpeechQueue({ language })
  const [replyMode, setReplyMode] = useState<ChatMode>('demo')
  const [capabilities, setCapabilities] = useState<GuideCapabilities | null>(null)
  const [serviceNotice, setServiceNotice] = useState<'stale' | 'fallback' | 'error' | null>(null)
  const [signalError, setSignalError] = useState('')
  const [stopped, setStopped] = useState(false)
  const [streamingText, setStreamingText] = useState<string | null>(null)
  const [isStageCollapsedMobile, setIsStageCollapsedMobile] = useState(false)
  const [avatarPace, setAvatarPace] = useState<AvatarPace>('calm')
  const streamingAccumulatedRef = useRef('')
  const chatScrollRef = useRef<HTMLDivElement>(null)
  const initializedRef = useRef<Record<string, boolean>>({})
  const abortRef = useRef<AbortController | null>(null)
  const live2dModelPath = (import.meta.env.VITE_WANNIANG_LIVE2D_MODEL || '').trim()
  const copy = language === 'zh'
    ? {
        title: '婉娘文化礼宾', name: '婉娘', lead: '一位懂苏绣，也懂苏州停留节奏的当代文化向导。', status: '私人文化礼宾',
        profile: '锦江苏州 · 当代江南文化礼宾', knowledge: '苏绣与苏州资料增强 + DeepSeek 通识', service: '苏绣工艺 · 苏州旅行 · 住中体验', speak: '自动朗读新回复',
        mode: '回答服务', demo: '本地精选内容', deepseek: 'DeepSeek 在线回答', fallback: '本地安全回答',
        notice: '未登录可使用本地导览；在线回答和记录意向需登录。', book: '查看我的行程', private: '私人会话', online: '可开始导览', reconnect: '服务版本不同', offline: '在线服务暂不可用', settings: '导览设置',
        welcomeKicker: '今晚，从一段苏州故事开始', welcomeTitle: '想先了解哪一处？', welcomeLead: '您可以从一件绣品、一段城中行程，或一场住中体验开始。', replyLabel: '婉娘',
        clear: '清空本语言', clearConfirm: '确认清空当前中文对话和会话预览标签吗？已进入测试统计的聚合记录不会被删除。', clearAll: '清空全部中英文记录', clearAllConfirm: '确认清空当前会话中的中英文对话与预览标签吗？已进入测试统计的聚合记录不会被删除。',
        privacy: '数据与隐私', privacyBody: '完整对话仅保留在当前浏览会话。未登录时，结构化兴趣标签也只保留在当前会话；登录后，主题、时长、预算、同行类型和情感会按账号所属测试批次保存，用于匿名汇总，不保存聊天原文。启用模型回复时，当前问题、最近 8 条对话与相关知识卡摘要会发送给 DeepSeek；请勿输入身份证、电话、订单号等敏感信息。',
        placeholder: '问苏绣、苏州景点、美食交通或住中安排…', send: '发送', stop: '停止', stopped: '已停止生成，你可以修改问题后重新发送。', loading: '婉娘正在整理回答…', read: '听婉娘讲解', stopRead: '暂停讲解',
        ttsModeLabel: '语音模式', ttsViseme: 'Azure 语音 · 已获取口型数据', ttsBrowser: '浏览器语音 · 自然微动', ttsUnavailable: '语音暂不可用',
        avatarModeLabel: '人物呈现', avatarLive2d: 'Live2D 模型', avatarPuppet: '动态立绘 · 保留原脸表情', restartNotice: '服务版本与页面不同；可用接口将继续使用，回答来源以每次回复为准。', fallbackNotice: '在线回答暂时不可用，本次已切换为经过边界控制的本地回答。', errorNotice: '回答中断，未保存不完整内容。问题已放回输入框，请重试。',
        collapseStage: '收起礼宾', expandStage: '展开礼宾', signalSaveFailed: '导览可以继续，但本次结构化兴趣标签未写入测试统计。请检查网络后重新发送需求。',
        avatarEyebrow: '当代江南文化礼宾', avatarIdle: '静候您的问题', avatarListening: '正在倾听您的提问', avatarThinking: '正在整理相关线索', avatarSpeaking: '正在为您讲解', avatarPaused: '已暂停',
        suggestions: ['苏绣为什么细腻？', '第一次去苏州有哪些推荐景点？', '帮我安排 2 小时苏绣体验', '体验时段如何选择？'],
        greeting: '你好，我是婉娘。除了苏绣工艺与项目体验，我也可以和你聊苏州景点、美食、交通与行程规划。涉及本项目时，我会区分文献线索、工艺经验和课程原型；涉及票价、营业时间等实时信息，会提醒你查询官方最新信息。',
      }
    : {
        title: 'Wanniang Cultural Concierge', name: 'Wanniang', lead: 'A contemporary cultural guide attuned to Su embroidery and the rhythm of a Suzhou stay.', status: 'Private cultural concierge',
        profile: 'Jinjiang Suzhou · Contemporary Jiangnan Concierge', knowledge: 'Suzhou references + DeepSeek general knowledge', service: 'Su embroidery · Suzhou travel · Stay experiences', speak: 'Auto-read new replies',
        mode: 'Answer service', demo: 'Curated local content', deepseek: 'DeepSeek online answer', fallback: 'Safe local answer',
        notice: 'Local guide is open to all; sign in for online answers and preference records.', book: 'View my journey', private: 'Private conversation', online: 'Guide is available', reconnect: 'Service version differs', offline: 'Online service unavailable', settings: 'Guide settings',
        welcomeKicker: 'Begin with a story of Suzhou', welcomeTitle: 'Where would you like to begin?', welcomeLead: 'Start with an embroidered work, a route through the city, or a cultural moment during your stay.', replyLabel: 'Wanniang',
        clear: 'Clear English chat', clearConfirm: 'Clear this English chat and its session preview tags? Aggregated study records already submitted will remain.', clearAll: 'Clear all Chinese and English records', clearAllConfirm: 'Clear chats and preview tags from this browser session? Aggregated study records already submitted will remain.',
        privacy: 'Data & privacy', privacyBody: 'Full chats stay in the current browser session. While signed out, structured interest tags also stay in this session only. When signed in, topic, time, budget, party type and sentiment are saved against the account cohort for anonymous aggregation; chat text is never stored in analytics. In model mode, the current question, latest 8 messages and relevant knowledge-card summaries are sent to DeepSeek. Do not enter identity numbers, phone numbers or booking references.',
        placeholder: 'Ask about Su embroidery, Suzhou sights, food, transport or your stay…', send: 'Send', stop: 'Stop', stopped: 'Generation stopped. You can revise the question and try again.', loading: 'Wanniang is preparing an answer…', read: 'Listen to Wanniang', stopRead: 'Pause voice',
        ttsModeLabel: 'Voice mode', ttsViseme: 'Azure voice · Viseme data available', ttsBrowser: 'Browser voice · Subtle portrait motion', ttsUnavailable: 'Voice unavailable',
        avatarModeLabel: 'Character mode', avatarLive2d: 'Live2D model', avatarPuppet: 'Animated portrait · Natural expression', restartNotice: 'The service version differs from this page. Compatible interfaces remain available; each reply shows its actual source.', fallbackNotice: 'Online answering is temporarily unavailable. This reply uses the bounded local guide.', errorNotice: 'The reply was interrupted and incomplete text was not saved. Your question is back in the input field; please retry.',
        collapseStage: 'Collapse Host', expandStage: 'Expand Host', signalSaveFailed: 'The guide can continue, but this structured intent was not added to study metrics. Check the connection and send the request again.',
        avatarEyebrow: 'CONTEMPORARY JIANGNAN CONCIERGE', avatarIdle: 'Awaiting your question', avatarListening: 'Listening to your question…', avatarThinking: 'Preparing relevant context…', avatarSpeaking: 'Explaining in voice', avatarPaused: 'Paused',
        suggestions: ['Why is Su embroidery so intricate?', 'What should a first-time visitor see in Suzhou?', 'Plan a 2-hour Su embroidery experience', 'How do I choose a workshop time?'],
        greeting: 'Hello, I am Wanniang. I can help with Su embroidery, Suzhou sights, food, transport and stay planning. For this project I distinguish documented leads, craft practice and prototype assumptions; for time-sensitive details I will suggest checking current official information.',
      }
  const visibleMessages = useMemo(
    () => messages.filter((message) => (message.language ?? 'zh') === language),
    [language, messages],
  )
  const {
    state: avatarState,
    emotion: avatarEmotion,
    gesture: avatarGesture,
    statusText: avatarStatus,
    setListening,
    setEmotion,
    setGesture,
  } = useAvatarDirector({
    language,
    isGenerating: loading || speechQueue.isPreparing,
    isSpeaking: speechQueue.isPlaying,
    isStopped: stopped,
    customStatusMap: {
      idle: copy.avatarIdle,
      listening: copy.avatarListening,
      thinking: copy.avatarThinking,
      speaking: copy.avatarSpeaking,
      paused: copy.avatarPaused,
    },
  })
  const hasConversation = visibleMessages.some((message) => message.role === 'user')
  const conversationMessages = hasConversation
    ? visibleMessages.filter((message, index) => !(index === 0 && message.role === 'assistant'))
    : []

  useEffect(() => {
    const container = chatScrollRef.current
    if (!container) return
    container.scrollTo({
      top: container.scrollHeight,
      behavior: visibleMessages.length > 1 || streamingText ? 'smooth' : 'auto',
    })
  }, [visibleMessages, streamingText, loading])

  useEffect(() => {
    if (initializedRef.current[language]) return
    const hasGreeting = visibleMessages.some(
      (m) => m.role === 'assistant' && (m.language ?? 'zh') === language
    )
    if (!hasGreeting && visibleMessages.length === 0) {
      initializedRef.current[language] = true
      addMessage({
        role: 'assistant',
        content: copy.greeting,
        language,
        sentiment: 'positive',
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language, visibleMessages.length])

  useEffect(() => {
    let cancelled = false
    void getGuideCapabilities().then((nextCapabilities) => {
      if (cancelled) return
      setCapabilities(nextCapabilities)
      setReplyMode(capabilityChatMode(nextCapabilities))
      if (!nextCapabilities.available) setServiceNotice('fallback')
      else if (isKnownVersionMismatch(nextCapabilities)) setServiceNotice('stale')
    })
    return () => { cancelled = true }
    // 文案会随语言切换，能力检测只需在首次加载时执行。
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function resetGesture() {
    if (gestureTimerRef.current !== null) window.clearTimeout(gestureTimerRef.current)
    gestureTimerRef.current = null
    setGesture('none')
  }

  function setSpeechEnabled(enabled: boolean) {
    speechEnabledRef.current = enabled
    setSpeak(enabled)
    if (!enabled) stopSpeech()
    else setStopped(false)
  }

  function stopSpeech() {
    speechEnabledRef.current = false
    setSpeak(false)
    speechQueue.stop()
    resetGesture()
    setStopped(true)
  }

  useEffect(() => {
    activeRef.current = true
    return () => {
      activeRef.current = false
      speechEnabledRef.current = false
      abortRef.current?.abort()
      if (gestureTimerRef.current !== null) window.clearTimeout(gestureTimerRef.current)
    }
  }, [])

  function readMessageAloud(messageId: string, content: string, targetLanguage: 'zh' | 'en' = language) {
    speechQueue.stop()
    setStopped(false)
    resetGesture()
    const sentences = splitIntoSentences(content, targetLanguage)
    const requests: SpeechRequest[] = sentences.map((sentence, index) => ({
      id: `manual_${messageId}_${index}`,
      text: sentence,
      language: targetLanguage,
      messageId,
    }))
    speechQueue.enqueue(requests)
  }

  async function send(text: string) {
    if (!text.trim() || loading) return
    speechQueue.stop()
    resetGesture()
    const q = text.trim()
    const requestLanguage = language
    const controller = new AbortController()
    abortRef.current = controller
    setStopped(false)
    setServiceNotice(isKnownVersionMismatch(capabilities) ? 'stale' : null)
    setInput('')
    setListening(false)
    streamingAccumulatedRef.current = ''
    setStreamingText('')
    const userMessage = addMessage({ role: 'user', content: q, language: requestLanguage, sentiment: sentimentOf(q) })
    const signal = extractGuideSignal(q, requestLanguage)
    if (signal) {
      void addGuideSignal({ ...signal, sourceMessageId: userMessage.id })
        .then(() => { if (activeRef.current) setSignalError('') })
        .catch(() => { if (activeRef.current) setSignalError(copy.signalSaveFailed) })
    }
    setLoading(true)
    const history = visibleMessages.map((m) => ({ role: m.role, content: m.content }))
    const segmenter = new SentenceSegmenter({ language: requestLanguage })
    const streamSpeechId = `stream_${Date.now()}`
    let streamSentenceIdx = 0
    let onlineResponse = false

    try {
      const result = await askWanNiangStream(
        q,
        history,
        requestLanguage,
        {
          onMeta: () => {
            onlineResponse = true
            if (!activeRef.current || controller.signal.aborted) return
            setReplyMode('deepseek')
            if (activeRef.current && !isKnownVersionMismatch(capabilities)) setServiceNotice(null)
          },
          onDelta: (delta, accumulated) => {
            if (!activeRef.current || controller.signal.aborted) return
            streamingAccumulatedRef.current = accumulated
            setStreamingText(accumulated)
            if (speechEnabledRef.current) {
              const sentences = segmenter.feed(delta)
              if (sentences.length > 0) {
                const requests: SpeechRequest[] = sentences.map((sentence) => ({
                  id: `${streamSpeechId}_${streamSentenceIdx++}`,
                  text: sentence,
                  language: requestLanguage,
                  messageId: streamSpeechId,
                }))
                speechQueue.enqueue(requests)
              }
            }
          },
          onError: () => {
            if (!activeRef.current) return
            if (isKnownVersionMismatch(capabilities)) setServiceNotice('stale')
            else if (capabilities?.chat.provider === 'deepseek') setServiceNotice('fallback')
          },
        },
        controller.signal,
      )
      if (!activeRef.current) return
      setReplyMode(result.mode)
      if (result.mode === 'fallback') {
        setServiceNotice(isKnownVersionMismatch(capabilities) ? 'stale' : 'fallback')
      } else if (result.mode === 'demo') {
        setServiceNotice(null)
      }
      if (result.performance) {
        setEmotion(result.performance.emotion)
        setGesture(result.performance.gesture)
        setAvatarPace(result.performance.pace)
        if (result.performance.gesture !== 'none') {
          gestureTimerRef.current = window.setTimeout(() => {
            setGesture('none')
          }, 2800)
        }
      }
      addMessage({
        role: 'assistant',
        content: result.content,
        language: requestLanguage,
        sentiment: result.sentiment,
        sources: result.sources,
        answerSource: result.answerSource,
        action: result.action,
      })
      setStreamingText(null)
      streamingAccumulatedRef.current = ''
      if (speechEnabledRef.current) {
        const remaining = segmenter.flush()
        if (remaining.length > 0) {
          const requests: SpeechRequest[] = remaining.map((sentence) => ({
            id: `${streamSpeechId}_${streamSentenceIdx++}`,
            text: sentence,
            language: requestLanguage,
            messageId: streamSpeechId,
          }))
          speechQueue.enqueue(requests)
        }
      }
    } catch (error) {
      if (!activeRef.current) return
      if (error instanceof Error && error.name === 'AbortError') {
        speechQueue.stop()
        setGesture('none')
        setStopped(true)
        const partial = streamingAccumulatedRef.current.trim()
        if (partial) {
          addMessage({
            role: 'assistant',
            content: partial,
            language: requestLanguage,
            sentiment: 'neutral',
            answerSource: onlineResponse ? 'deepseek-partial' : 'local',
          })
        }
      } else {
        speechQueue.stop()
        setInput(q)
        setServiceNotice('error')
      }
    } finally {
      if (abortRef.current === controller) abortRef.current = null
      if (activeRef.current) {
        setLoading(false)
        setStreamingText(null)
      }
      streamingAccumulatedRef.current = ''
    }
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    void send(input)
  }

  function onInputKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault()
      void send(input)
    }
  }

  function stopGeneration() {
    speechQueue.stop()
    resetGesture()
    setStopped(true)
    abortRef.current?.abort()
  }

  // 阶段 G 无障碍：支持 Esc 键盘快捷键一键停止生成或停止当前朗读
  useEffect(() => {
    function handleGlobalKeyDown(e: globalThis.KeyboardEvent) {
      if (e.key === 'Escape') {
        if (loading) {
          stopGeneration()
        } else if (speechQueue.phase !== 'idle') {
          stopSpeech()
        }
      }
    }
    window.addEventListener('keydown', handleGlobalKeyDown)
    return () => window.removeEventListener('keydown', handleGlobalKeyDown)
  }, [loading, speechQueue.phase])

  function clearConversation(scope: 'current' | 'all') {
    const prompt = scope === 'all' ? copy.clearAllConfirm : copy.clearConfirm
    if (!window.confirm(prompt)) return
    speechQueue.stop()
    resetGesture()
    setEmotion('neutral')
    if (scope === 'all') {
      clearMessages()
      clearGuideSignals()
      initializedRef.current = {}
    } else {
      clearMessages(language)
      clearGuideSignals(language)
      delete initializedRef.current[language]
    }
    setStopped(false)
    setInput('')
  }

  return (
    <div className="guide-page">
      <header className="guide-page-head">
        <div>
          <p className="eyebrow">PRIVATE CULTURAL CONCIERGE</p>
          <h1>{copy.title}</h1>
        </div>
        <p>{copy.lead}</p>
      </header>

      <div className={`guide-concierge-shell ${hasConversation ? 'has-conversation' : 'is-welcoming'} ${isStageCollapsedMobile ? 'stage-collapsed-mobile' : ''}`}>
        <aside className={`guide-host ${isStageCollapsedMobile ? 'is-collapsed' : ''}`}>
          <div className="guide-host-mobile-bar">
            <button
              type="button"
              className="guide-mobile-toggle-btn"
              onClick={() => setIsStageCollapsedMobile((prev) => !prev)}
            >
              <span>{copy.name}</span>
              <small>{isStageCollapsedMobile ? copy.expandStage : copy.collapseStage}</small>
            </button>
          </div>
          <div className="guide-host-body">
            <AvatarStage
              state={avatarState}
              emotion={avatarEmotion}
              gesture={avatarGesture}
              language={language}
              statusText={avatarStatus}
              eyebrow={copy.avatarEyebrow}
              name={copy.name}
              mouthOpen={speechQueue.mouthOpen}
              mouthSource={speechQueue.mouthSource}
              mouthForm={speechQueue.mouthForm}
              ttsMode={speechQueue.ttsMode}
              pace={avatarPace}
              fallbackImage="/avatar/wanniang-puppet/poster.webp"
              useLive2D={Boolean(live2dModelPath && capabilities?.avatar.modelConfigured)}
              modelPath={live2dModelPath || undefined}
            />
            <div className="guide-host-caption">
              <div>
                <h2>{copy.name}</h2>
                <p>{copy.profile}</p>
              </div>
              <p>{copy.service}</p>
              <Link to="/my">{copy.book}<span aria-hidden="true">→</span></Link>
            </div>
          </div>
        </aside>

        <section className="guide-dialogue">
          {isStageCollapsedMobile && speechQueue.phase !== 'idle' && (
            <div className="guide-mobile-speaking-strip">
              <span className="status-dot status-dot-speaking" aria-hidden="true" />
              <span>{copy.avatarSpeaking}</span>
              <button
                type="button"
                onClick={stopSpeech}
                aria-keyshortcuts="Escape"
                title={language === 'zh' ? '停止播放 (Esc)' : 'Stop playing (Esc)'}
              >
                {copy.stopRead}
              </button>
            </div>
          )}
          <header className="guide-dialogue-head">
            <div>
              <span>{copy.private}</span>
              <small>{isKnownVersionMismatch(capabilities) ? copy.reconnect : capabilities?.stale ? copy.offline : copy.online}</small>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  const next = !speak
                  setSpeechEnabled(next)
                }}
                className={`text-xs px-2.5 py-1 rounded-full border transition-all flex items-center gap-1.5 font-serif ${
                  speak
                    ? 'border-jade bg-jade/10 text-jade font-medium shadow-xs'
                    : 'border-stone-300 bg-stone-50 text-stone-600 hover:border-stone-400'
                }`}
                title={speak ? (language === 'zh' ? '点击静音（关闭自动讲解）' : 'Mute auto voice') : (language === 'zh' ? '点击开启自动讲解' : 'Enable auto voice')}
              >
                <span aria-hidden="true" className="text-[11px]">{speak ? '🔊' : '🔇'}</span>
                <span>{speak ? (language === 'zh' ? '自动讲解' : 'Voice on') : (language === 'zh' ? '已静音' : 'Muted')}</span>
              </button>

              <details className="guide-controls">
              <summary>{copy.settings}</summary>
              <div className="guide-controls-panel">
                <div className="guide-mode-row">
                  <span>{copy.mode}</span>
                  <strong>{replyMode === 'deepseek' ? copy.deepseek : replyMode === 'fallback' ? copy.fallback : copy.demo}</strong>
                </div>
                <div className="guide-mode-row">
                  <span>{copy.ttsModeLabel}</span>
                  <strong>
                    {speechQueue.ttsMode === 'viseme'
                      ? copy.ttsViseme
                      : speechQueue.ttsMode === 'browser'
                      ? copy.ttsBrowser
                      : copy.ttsUnavailable}
                  </strong>
                </div>
                <div className="guide-mode-row">
                  <span>{copy.avatarModeLabel}</span>
                  <strong>{live2dModelPath && capabilities?.avatar.modelConfigured ? copy.avatarLive2d : copy.avatarPuppet}</strong>
                </div>
                <p>{copy.knowledge}</p>
                <label>
                  <input
                    type="checkbox"
                    checked={speak}
                    onChange={(e) => {
                      setSpeechEnabled(e.target.checked)
                    }}
                  />
                  {copy.speak}
                </label>
                {!user && <p>{copy.notice}</p>}
                <details className="guide-privacy">
                  <summary>{copy.privacy}</summary>
                  <p>{copy.privacyBody}</p>
                </details>
                <div className="guide-clear-actions">
                  <button type="button" disabled={loading} onClick={() => clearConversation('current')}>{copy.clear}</button>
                  <button type="button" disabled={loading} onClick={() => clearConversation('all')}>{copy.clearAll}</button>
                </div>
              </div>
            </details>
          </div>
        </header>

          <div ref={chatScrollRef} className="guide-message-scroll">
            {serviceNotice && (
              <p className="guide-service-notice" role="status">
                {serviceNotice === 'stale' ? copy.restartNotice : serviceNotice === 'error' ? copy.errorNotice : copy.fallbackNotice}
              </p>
            )}
            {signalError && <div className="guide-service-notice guide-service-fallback" role="alert">{signalError}</div>}
            {!hasConversation && (
              <div className="guide-welcome">
                <p>{copy.welcomeKicker}</p>
                <h2>{copy.welcomeTitle}</h2>
                <span>{copy.welcomeLead}</span>
                <div className="guide-welcome-choices">
                  {[
                    [language === 'zh' ? '理解工艺' : 'Understand the craft', language === 'zh' ? '从劈丝、针法与丝光开始' : 'Begin with thread, stitches and lustre', copy.suggestions[0]],
                    [language === 'zh' ? '探索苏州' : 'Explore Suzhou', language === 'zh' ? '景点、美食、交通与游览建议' : 'Sights, food, transport and travel ideas', copy.suggestions[1]],
                    [language === 'zh' ? '规划停留' : 'Plan the stay', language === 'zh' ? '按可用时间组织一段文化体验' : 'Shape a cultural experience around your time', copy.suggestions[2]],
                  ].map(([title, body, prompt], index) => (
                    <button key={title} type="button" disabled={loading} onClick={() => void send(prompt)}>
                      <small>0{index + 1}</small>
                      <strong>{title}</strong>
                      <span>{body}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {conversationMessages.map((m) => {
              const isAssistant = m.role === 'assistant'
              const isThisMessageSpeaking = speechQueue.phase !== 'idle' && speechQueue.currentMessageId === m.id
              return (
                <article key={m.id} className={isAssistant ? 'guide-assistant-message' : 'guide-user-message'}>
                  {isAssistant && <span className="guide-speaker">{copy.replyLabel}</span>}
                  <div className={m.role === 'user' ? 'chat-bubble-user' : 'chat-bubble-bot'}>
                    {isAssistant ? <GuideMessageContent content={m.content} /> : m.content}
                  </div>
                  {isAssistant && (
                    <div className="guide-message-tools">
                      {m.answerSource && <span className="guide-answer-source">
                        {m.answerSource === 'deepseek' ? copy.deepseek
                          : m.answerSource === 'deepseek-partial'
                            ? (language === 'zh' ? 'DeepSeek 部分回答 · 已中断' : 'Partial DeepSeek answer · Interrupted')
                            : copy.demo}
                      </span>}
                      <button
                        type="button"
                        onClick={() =>
                          isThisMessageSpeaking
                            ? stopSpeech()
                            : readMessageAloud(m.id, m.content, language)
                        }
                        className={`inline-flex items-center gap-1 text-[11px] font-serif transition-colors ${
                          isThisMessageSpeaking
                            ? 'text-jade font-semibold'
                            : 'text-stone-500 hover:text-jade'
                        }`}
                        title={isThisMessageSpeaking ? copy.stopRead : copy.read}
                      >
                        <span aria-hidden="true">{isThisMessageSpeaking ? '⏹' : '🔊'}</span>
                        <span>{isThisMessageSpeaking ? copy.stopRead : copy.read}</span>
                      </button>
                    </div>
                  )}
                  {isAssistant && <SourceDisclosure sources={m.sources} language={language} />}
                  {isAssistant && m.action?.type === 'record_preference' && (
                    <div className="guide-preference-card">
                      <div>
                        <span>{language === 'zh' ? '住中礼遇意向' : 'STAY EXPERIENCE PREFERENCE'}</span>
                        <strong>{language === 'zh' ? '苏绣入门体验' : 'Su Embroidery Introduction'}</strong>
                        <p>
                          {m.action.slot}
                          {m.action.durationMinutes ? ` · ${m.action.durationMinutes} ${language === 'zh' ? '分钟' : 'min'}` : ''}
                          {' · '}{language === 'zh' ? '场次与内容待合作方确认' : 'Time and inclusions require partner confirmation'}
                        </p>
                      </div>
                      <Link to={`/my?slot=${encodeURIComponent(m.action.slot)}&course=suxiu-class${m.action.durationMinutes ? `&duration=${m.action.durationMinutes}` : ''}`}>
                        {language === 'zh' ? '收入我的行程' : 'Add to my journey'}<span aria-hidden="true">→</span>
                      </Link>
                    </div>
                  )}
                </article>
              )
            })}

            {streamingText !== null && (
              <article className="guide-assistant-message is-streaming">
                <span className="guide-speaker">{copy.replyLabel}</span>
                <div className="chat-bubble-bot">
                  {streamingText ? (
                    <>
                      <GuideMessageContent content={streamingText} />
                      <span className="guide-streaming-cursor" aria-hidden="true" />
                    </>
                  ) : (
                    <div className="guide-streaming-pending">
                      <span className="guide-spinner" aria-hidden="true" />
                      <span>{copy.loading}</span>
                    </div>
                  )}
                </div>
              </article>
            )}

            {loading && (
              <div className="guide-loading-row">
                <button
                  type="button"
                  onClick={stopGeneration}
                  className="guide-stop-btn"
                  aria-keyshortcuts="Escape"
                  title={language === 'zh' ? '停止生成 (Esc)' : 'Stop generation (Esc)'}
                >
                  <span className="guide-stop-icon" aria-hidden="true" />
                  {copy.stop}
                </button>
              </div>
            )}
            {stopped && <p className="guide-stopped" role="status">{copy.stopped}</p>}
          </div>

          <footer className="guide-composer">
            {hasConversation && (
              <div className="guide-followups">
                {copy.suggestions.slice(0, 3).map((suggestion) => (
                  <button key={suggestion} disabled={loading} onClick={() => void send(suggestion)}>{suggestion}</button>
                ))}
              </div>
            )}
            <form onSubmit={onSubmit}>
              <textarea
                placeholder={copy.placeholder}
                value={input}
                rows={1}
                maxLength={2000}
                disabled={loading}
                onChange={(e) => setInput(e.target.value)}
                onFocus={() => setListening(true)}
                onBlur={() => {
                  if (!input.trim()) setListening(false)
                }}
                onKeyDown={onInputKeyDown}
              />
              <button type="submit" disabled={loading || !input.trim()}>
                {copy.send}<span aria-hidden="true">→</span>
              </button>
            </form>
          </footer>
        </section>
      </div>
      <RecommendationPanel />
      <FloatingWanNiangAssistant
        active={loading || speechQueue.phase !== 'idle'}
        disabled={loading}
        onPrompt={(prompt) => void send(prompt)}
      />
    </div>
  )
}
