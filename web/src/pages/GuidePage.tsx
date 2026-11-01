import { VoiceSettings } from '../components/VoiceSettings'
import { GuideSettings } from '../components/GuideSettings'
import { WANNIANG_PORTRAIT } from '../components/avatar/avatarPortrait'
import { isKnownVersionMismatch } from '../lib/serviceCompatibility'
import { capabilityChatMode } from '../lib/guideCapabilities'
import { RecommendationPanel } from '../components/RecommendationPanel'
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
    prototype: language === 'zh' ? '体验方案' : 'Experience concept',
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
  const [voiceSettingsOpen,setVoiceSettingsOpen]=useState(false)
  const speechEnabledRef = useRef(false)
  const activeRef = useRef(true)
  const gestureTimerRef = useRef<number | null>(null)
  const speechQueue = useSpeechQueue({ language })
  const [replyMode, setReplyMode] = useState<ChatMode>('demo')
  const [capabilities, setCapabilities] = useState<GuideCapabilities | null>(null)
  const [serviceNotice, setServiceNotice] = useState<'stale' | 'fallback' | 'error' | null>(null)
  const [signalError, setSignalError] = useState('')
  const [stopped, setStopped] = useState(false)
  const [speechStopped, setSpeechStopped] = useState(false)
  const [announcement, setAnnouncement] = useState('')
  const [streamingText, setStreamingText] = useState<string | null>(null)
  const [settingsOpen,setSettingsOpen]=useState(false)
  const [avatarPace, setAvatarPace] = useState<AvatarPace>('calm')
  const streamingAccumulatedRef = useRef('')
  const chatScrollRef = useRef<HTMLDivElement>(null)
  const initializedRef = useRef<Record<string, boolean>>({})
  const abortRef = useRef<AbortController | null>(null)
  const requestEpochRef = useRef(0)
  const currentLanguageRef = useRef(language)
  const streamOnlineRef = useRef(false)
  currentLanguageRef.current = language
  const live2dModelPath = (import.meta.env.VITE_WANNIANG_LIVE2D_MODEL || '').trim()
  const copy = language === 'zh'
    ? {
        title: '婉娘文化礼宾', name: '婉娘', roleShort: '文化礼宾', lead: '一位懂苏绣，也懂苏州停留节奏的当代文化向导。',
        knowledge: '苏绣工艺、苏州旅行与住中体验；相关参考随回答提供。', speak: '自动朗读新回复',
        mode: '回答来源', demo: '本地精选内容', deepseek: '在线生成回答', fallback: '本地精选内容',
        notice: '未登录可使用本地导览；在线回答和记录意向需登录。', signInNotice: '登录账户后可使用在线问答。当前为游客模式，回答来自本地导览。', signInOnline: '登录后在线问答', book: '查看我的行程', settings: '导览设置',
        welcomeKicker: '从一段苏州故事开始', welcomeTitle: '想先了解哪一处？', welcomeLead: '您可以从一件绣品、一段城中行程，或一场住中体验开始。', replyLabel: '婉娘',
        clear: '清空本语言', clearConfirm: '确认清空当前中文对话和会话预览标签吗？已进入测试统计的聚合记录不会被删除。', clearAll: '清空全部中英文记录', clearAllConfirm: '确认清空当前会话中的中英文对话与预览标签吗？已进入测试统计的聚合记录不会被删除。',
        privacy: '数据与隐私', privacyBody: '完整对话仅保留在当前浏览会话。未登录时，结构化兴趣标签也只保留在当前会话；登录后，主题、时长、预算、同行类型和情感会按账号所属测试批次保存，用于匿名汇总，不保存聊天原文。启用模型回复时，当前问题、最近 8 条对话与相关知识卡摘要会发送给 DeepSeek；请勿输入身份证、电话、订单号等敏感信息。',
        placeholder: '问苏绣、苏州景点、美食交通或住中安排…', send: '发送', stop: '停止', stopped: '已停止生成，你可以修改问题后重新发送。', loading: '婉娘正在整理回答…', read: '听婉娘讲解', stopRead: '停止朗读',
        ttsModeLabel: '语音模式', ttsViseme: '在线语音', ttsBrowser: '设备语音', ttsUnavailable: '语音暂不可用',
        restartNotice: '在线服务正在更新；可继续使用导览，回答来源以每次回复为准。', fallbackNotice: '在线回答暂时不可用，正在使用本地精选内容。', errorNotice: '回答中断，未保存不完整内容。问题已放回输入框，请重试。',
        signalSaveFailed: '导览可以继续，但本次结构化兴趣标签未写入测试统计。请检查网络后重新发送需求。',
        avatarIdle: '静候您的问题', avatarListening: '正在倾听您的提问', avatarThinking: '正在整理相关线索', avatarSpeaking: '正在为您讲解', avatarPaused: '已暂停',
        suggestions: ['苏绣为什么细腻？', '第一次去苏州有哪些推荐景点？', '帮我安排 2 小时苏绣体验', '体验时段如何选择？'],
        greeting: '你好，我是婉娘。可以和我聊聊苏绣工艺、苏州景点、美食、交通与行程规划，也可以告诉我你的兴趣和可用时间，一起找到适合这段停留的体验。',
      }
    : {
        title: 'Wanniang Cultural Concierge', name: 'Wanniang', roleShort: 'Cultural concierge', lead: 'A contemporary cultural guide attuned to Su embroidery and the rhythm of a Suzhou stay.',
        knowledge: 'Su embroidery, Suzhou travel and stay experiences. Relevant references accompany each reply.', speak: 'Auto-read new replies',
        mode: 'Answer source', demo: 'Curated local content', deepseek: 'Online generated answer', fallback: 'Curated local content',
        notice: 'Local guide is open to all; sign in for online answers and preference records.', signInNotice: 'Sign in to your account to use online Q&A. You are browsing as a guest, so replies use the local guide.', signInOnline: 'Sign in for online Q&A', book: 'View my journey', settings: 'Guide settings',
        welcomeKicker: 'Begin with a story of Suzhou', welcomeTitle: 'Where would you like to begin?', welcomeLead: 'Start with an embroidered work, a route through the city, or a cultural moment during your stay.', replyLabel: 'Wanniang',
        clear: 'Clear English chat', clearConfirm: 'Clear this English chat and its session preview tags? Aggregated study records already submitted will remain.', clearAll: 'Clear all Chinese and English records', clearAllConfirm: 'Clear chats and preview tags from this browser session? Aggregated study records already submitted will remain.',
        privacy: 'Data & privacy', privacyBody: 'Full chats stay in the current browser session. While signed out, structured interest tags also stay in this session only. When signed in, topic, time, budget, party type and sentiment are saved against the account cohort for anonymous aggregation; chat text is never stored in analytics. In model mode, the current question, latest 8 messages and relevant knowledge-card summaries are sent to DeepSeek. Do not enter identity numbers, phone numbers or booking references.',
        placeholder: 'Ask about Su embroidery, Suzhou sights, food, transport or your stay…', send: 'Send', stop: 'Stop', stopped: 'Generation stopped. You can revise the question and try again.', loading: 'Wanniang is preparing an answer…', read: 'Listen to Wanniang', stopRead: 'Stop voice',
        ttsModeLabel: 'Voice mode', ttsViseme: 'Online voice', ttsBrowser: 'Device voice', ttsUnavailable: 'Voice unavailable',
        restartNotice: 'The online service is being updated. You can continue using the guide; each reply shows its source.', fallbackNotice: 'Online answering is temporarily unavailable. This reply uses curated local content.', errorNotice: 'The reply was interrupted and incomplete text was not saved. Your question is back in the input field; please retry.',
        signalSaveFailed: 'The guide can continue, but this structured intent was not added to study metrics. Check the connection and send the request again.',
        avatarIdle: 'Awaiting your question', avatarListening: 'Listening to your question…', avatarThinking: 'Preparing relevant context…', avatarSpeaking: 'Explaining in voice', avatarPaused: 'Paused',
        suggestions: ['Why is Su embroidery so intricate?', 'What should a first-time visitor see in Suzhou?', 'Plan a 2-hour Su embroidery experience', 'How do I choose a workshop time?'],
        greeting: 'Hello, I am Wanniang. Ask me about Su embroidery, Suzhou sights, food, transport and stay planning. Share your interests and available time, and we can find an experience for your stay.',
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
      thinking: speechQueue.isPreparing?(language==='zh'?'正在准备语音…':'Preparing voice…'):copy.avatarThinking,
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
    setSpeechStopped(true)
  }

  useEffect(() => {
    requestEpochRef.current += 1
    const previous = abortRef.current
    abortRef.current = null
    previous?.abort()
    streamingAccumulatedRef.current = ''
    streamOnlineRef.current = false
    speechEnabledRef.current = false
    setSpeak(false)
    setLoading(false)
    setStreamingText(null)
    setStopped(false)
    setSpeechStopped(false)
    setSignalError('')
    setAnnouncement('')
    setServiceNotice(null)
    resetGesture()
    setListening(false)
  }, [language])

  useEffect(() => {
    activeRef.current = true
    return () => {
      activeRef.current = false
      requestEpochRef.current += 1
      speechEnabledRef.current = false
      abortRef.current?.abort()
      if (gestureTimerRef.current !== null) window.clearTimeout(gestureTimerRef.current)
    }
  }, [])

  function readMessageAloud(messageId: string, content: string, targetLanguage: 'zh' | 'en' = language) {
    speechQueue.stop()
    setStopped(false)
    setSpeechStopped(false)
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
    if (!text.trim() || loading || abortRef.current) return
    speechQueue.stop()
    resetGesture()
    const q = text.trim()
    const requestLanguage = language
    const requestEpoch = ++requestEpochRef.current
    const isCurrent = () => activeRef.current && requestEpochRef.current === requestEpoch && currentLanguageRef.current === requestLanguage
    const controller = new AbortController()
    abortRef.current = controller
    setStopped(false)
    setSpeechStopped(false)
    setAnnouncement('')
    setServiceNotice(isKnownVersionMismatch(capabilities) ? 'stale' : null)
    setInput('')
    setListening(false)
    streamingAccumulatedRef.current = ''
    streamOnlineRef.current = false
    setStreamingText('')
    const userMessage = addMessage({ role: 'user', content: q, language: requestLanguage, sentiment: sentimentOf(q) })
    const signal = extractGuideSignal(q, requestLanguage)
    if (signal) {
      void addGuideSignal({ ...signal, sourceMessageId: userMessage.id })
        .then(() => { if (isCurrent()) setSignalError('') })
        .catch(() => { if (isCurrent()) setSignalError(copy.signalSaveFailed) })
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
            if (!isCurrent() || controller.signal.aborted) return
            onlineResponse = true
            streamOnlineRef.current = true
            setReplyMode('deepseek')
            if (activeRef.current && !isKnownVersionMismatch(capabilities)) setServiceNotice(null)
          },
          onDelta: (delta, accumulated) => {
            if (!isCurrent() || controller.signal.aborted) return
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
            if (!isCurrent() || controller.signal.aborted) return
            if (isKnownVersionMismatch(capabilities)) setServiceNotice('stale')
            else if (capabilities?.chat.provider === 'deepseek') setServiceNotice('fallback')
          },
        },
        controller.signal,
      )
      if (!isCurrent() || controller.signal.aborted) return
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
      setAnnouncement(speechEnabledRef.current
        ? (requestLanguage === 'zh' ? '婉娘的回答已完成。' : 'Wanniang’s reply is ready.')
        : `${copy.replyLabel}：${result.content}`)
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
      if (!isCurrent()) return
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
      if (isCurrent()) {
        if (abortRef.current === controller) abortRef.current = null
        setLoading(false)
        setStreamingText(null)
        streamingAccumulatedRef.current = ''
      }
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
    const partial = streamingAccumulatedRef.current.trim()
    if (partial) addMessage({ role: 'assistant', content: partial, language, sentiment: 'neutral', answerSource: streamOnlineRef.current ? 'deepseek-partial' : 'local' })
    requestEpochRef.current += 1
    const controller = abortRef.current
    abortRef.current = null
    controller?.abort()
    streamingAccumulatedRef.current = ''
    setLoading(false)
    setStreamingText(null)
    setAnnouncement(language === 'zh' ? '回答已停止。' : 'The reply has stopped.')
  }

  // 阶段 G 无障碍：支持 Esc 键盘快捷键一键停止生成或停止当前朗读
  useEffect(() => {
    function handleGlobalKeyDown(e: globalThis.KeyboardEvent) {
      if (e.key === 'Escape' && !e.defaultPrevented && !voiceSettingsOpen) {
        if (loading) {
          stopGeneration()
        } else if (speechQueue.phase !== 'idle') {
          stopSpeech()
        }
      }
    }
    window.addEventListener('keydown', handleGlobalKeyDown)
    return () => window.removeEventListener('keydown', handleGlobalKeyDown)
  }, [loading, speechQueue.phase, voiceSettingsOpen])

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
    setSpeechStopped(false)
    setAnnouncement('')
    setInput('')
  }

  return (
    <div className={`guide-page guide-quiet ${hasConversation ? 'has-conversation' : 'is-welcoming'} ${voiceSettingsOpen ? 'voice-settings-open' : ''}`}>
      <header className="guide-letterhead">
        <div className="guide-letterhead-copy">
          <h1>{copy.name}<small>{copy.roleShort}</small></h1>
          <p>{copy.lead}</p>
        </div>
        <Link className="guide-journey-link" to="/my">{copy.book}<span aria-hidden="true">→</span></Link>
      </header>

      <div className="guide-layout">
        <aside className="guide-portrait-panel">
          <div className={`guide-portrait-frame is-${avatarState}`}>
            <AvatarStage
              state={avatarState}
              emotion={avatarEmotion}
              gesture={avatarGesture}
              language={language}
              statusText={avatarStatus}
              showStatus={false}
              name={copy.name}
              mouthOpen={speechQueue.mouthOpen}
              mouthSource={speechQueue.mouthSource}
              mouthForm={speechQueue.mouthForm}
              ttsMode={speechQueue.ttsMode}
              pace={avatarPace}
              fallbackImage={WANNIANG_PORTRAIT}
              usePuppet={false}
              useLive2D={false}
              modelPath={live2dModelPath || undefined}
            />
          </div>
          <div className="guide-portrait-info">
            <p className={`guide-avatar-status is-${avatarState}`} role="status" aria-live="polite">
              <span className={`guide-avatar-dot is-${avatarState}`} aria-hidden="true" />
              {avatarStatus}
            </p>
            <div className="guide-portrait-links">
              <VoiceSettings onOpenChange={setVoiceSettingsOpen} language={language} phase={speechQueue.phase} previewing={speechQueue.currentMessageId==='voice-preview'&&speechQueue.phase!=='idle'} mode={speechQueue.ttsMode} error={speechQueue.error} onPreview={text=>readMessageAloud('voice-preview',text,language)} onStop={()=>speechQueue.stop()} onPreferenceChange={()=>{speechEnabledRef.current=false;setSpeak(false);resetGesture();setStopped(false);setSpeechStopped(false)}}/>
              <button type="button" className="guide-settings-link" aria-haspopup="dialog" aria-expanded={settingsOpen} onClick={() => setSettingsOpen(true)}>{copy.settings}</button>
            </div>
          </div>
        </aside>

        <section className="guide-dialogue-panel" aria-label={copy.title}>
          {speechQueue.phase !== 'idle' && (
            <div className="guide-speaking-line" role="status">
              <span className="guide-speaking-dot" aria-hidden="true" />
              <span>{speechQueue.isPreparing?(language==='zh'?'正在准备语音…':'Preparing voice…'):copy.avatarSpeaking}</span>
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
          <div ref={chatScrollRef} className="guide-thread">
            {speechQueue.error&&<p className="guide-service-notice" role="alert">{speechQueue.error}</p>}
            {!user && (
              <p className="guide-service-notice" role="status">
                {copy.signInNotice}{' '}
                <Link className="underline underline-offset-4" to="/auth?next=%2Fguide">{copy.signInOnline}</Link>
              </p>
            )}
            {serviceNotice && (user || serviceNotice !== 'fallback') && (
              <p className="guide-service-notice" role="status">
                {serviceNotice === 'stale' ? copy.restartNotice : serviceNotice === 'error' ? copy.errorNotice : copy.fallbackNotice}
              </p>
            )}
            {signalError && <div className="guide-service-notice guide-service-fallback" role="alert">{signalError}</div>}
            {!hasConversation && (
              <div className="guide-start">
                <p className="guide-start-kicker">{copy.welcomeKicker}</p>
                <h2>{copy.welcomeTitle}</h2>
                <p className="guide-start-lead">{copy.welcomeLead}</p>
                <div className="guide-start-choices">
                  {[
                    [language === 'zh' ? '理解工艺' : 'Understand the craft', language === 'zh' ? '从劈丝、针法与丝光开始' : 'Begin with thread, stitches and lustre', copy.suggestions[0]],
                    [language === 'zh' ? '探索苏州' : 'Explore Suzhou', language === 'zh' ? '景点、美食、交通与游览建议' : 'Sights, food, transport and travel ideas', copy.suggestions[1]],
                    [language === 'zh' ? '规划停留' : 'Plan the stay', language === 'zh' ? '按可用时间组织一段文化体验' : 'Shape a cultural experience around your time', copy.suggestions[2]],
                  ].map(([title, body, prompt]) => (
                    <button key={title} type="button" disabled={loading} onClick={() => void send(prompt)}>
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
                            ? (language === 'zh' ? '在线回答 · 已中断' : 'Online answer · Interrupted')
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
                        <svg aria-hidden="true" width="15" height="15" viewBox="0 0 24 24" fill={isThisMessageSpeaking ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.6">{isThisMessageSpeaking ? <rect x="6" y="6" width="12" height="12" rx="1" /> : <><path d="M11 5 6 9H3v6h3l5 4V5Z" /><path d="M15 8a6 6 0 0 1 0 8" /></>}</svg>
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
                        </p>
                      </div>
                      <Link to={`/my?slot=${encodeURIComponent(m.action.slot)}${m.action.durationMinutes ? `&duration=${m.action.durationMinutes}` : ''}`}>
                        {language === 'zh' ? '去选择场次' : 'Choose a session'}<span aria-hidden="true">→</span>
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
            {speechStopped && <p className="guide-stopped" role="status">{language === 'zh' ? '朗读已停止。' : 'Voice playback stopped.'}</p>}
          </div>
          <p className="sr-only" role="status" aria-live="polite" aria-atomic="true">{announcement}</p>

          <footer className="guide-input">
            {hasConversation && (
              <div className="guide-followups">
                {copy.suggestions.slice(0, 3).map((suggestion) => (
                  <button key={suggestion} disabled={loading} onClick={() => void send(suggestion)}>{suggestion}</button>
                ))}
              </div>
            )}
            <form onSubmit={onSubmit}>
              <textarea
                aria-label={language==='zh'?'向婉娘提问':'Ask Wanniang'}
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
      <GuideSettings
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        language={language}
        copy={copy}
        replyMode={replyMode}
        ttsMode={speechQueue.ttsMode}
        speak={speak}
        onSpeakChange={setSpeechEnabled}
        signedIn={Boolean(user)}
        loading={loading}
        onClear={clearConversation}
      />
    </div>
  )
}
