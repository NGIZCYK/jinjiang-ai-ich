// Local acceptance fixture only. Vite's production entry does not include this page.
import React, { useCallback, useMemo, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { AvatarStage } from '../../src/components/avatar/AvatarStage'
import { PuppetAvatar } from '../../src/components/avatar/PuppetAvatar'
import { StaticAvatar } from '../../src/components/avatar/StaticAvatar'
import { useSpeechQueue } from '../../src/hooks/useSpeechQueue'
import { useAvatarDirector } from '../../src/hooks/useAvatarDirector'
import type { SpeechPlayback, TtsProvider } from '../../src/lib/tts/types'
import '../../src/index.css'

function VoicePanel({ provider }: { provider: TtsProvider }) {
  const voice = useSpeechQueue({ language: 'zh', provider })
  const [stopped, setStopped] = useState(false)
  const director = useAvatarDirector({ language: 'zh', isGenerating: voice.isPreparing, isSpeaking: voice.isPlaying, isStopped: stopped })
  const enqueue = (id: string) => { setStopped(false); voice.enqueue({ id, text: '模拟讲解（演示价格，待确认）。', language: 'zh', messageId: id }) }
  return <section>
    <p>队列状态：{voice.phase}</p><p>人物状态：{director.state}</p>
    <button onClick={() => enqueue('first')}>提问 1</button>{' '}
    <button onClick={() => enqueue('second')}>提问 2</button>{' '}
    <button onClick={() => { voice.stop(); setStopped(true) }}>停止语音</button>
    <div style={{ maxWidth: 320, marginTop: 20 }}><AvatarStage state={director.state} language="zh" /></div>
  </section>
}
function FailedImage() {
  const [failed, setFailed] = useState(false)
  const fallback = useCallback(() => setFailed(true), [])
  return <section>
    <p>图片状态：{failed ? '已降级为静态人物' : '正在加载'}</p>
    <div className="digital-human-stage" style={{ width: 320 }}>
      {failed ? <StaticAvatar state="idle" /> : <PuppetAvatar state="idle" assetBase="/missing-test-portrait" onFallback={fallback} />}
    </div>
  </section>
}
function Fixture() {
  const [mounted, setMounted] = useState(true), [imageFailure, setImageFailure] = useState(false)
  const [active, setActive] = useState(0)
  const pending = useMemo(() => new Map<string, () => void>(), [])
  const provider = useMemo<TtsProvider>(() => ({
    mode: 'browser',
    // Deliberately ignore abort during prepare to simulate a late external response.
    prepare: (request) => new Promise<SpeechPlayback>((resolve) => pending.set(request.id, () => {
      pending.delete(request.id)
      let running = false, settle: (() => void) | undefined
      resolve({
        play: (onStart) => new Promise<void>((done) => { running = true; settle = done; setActive(n => n + 1); onStart?.() }),
        stop: () => { if (running) { running = false; setActive(n => n - 1); settle?.() } },
      })
    })),
  }), [pending])
  return <main style={{ padding: 32 }}>
    <h1>本地验收：语音竞态与人物降级</h1>
    <p>模拟播放数量：{active}</p>
    <button onClick={() => pending.get('first')?.()}>返回请求 1</button>{' '}
    <button onClick={() => pending.get('second')?.()}>返回请求 2</button>{' '}
    <button onClick={() => setMounted(value => !value)}>{mounted ? '离开语音页面' : '进入语音页面'}</button>{' '}
    <button onClick={() => setImageFailure(true)}>模拟图片失败</button>
    {mounted && <VoicePanel provider={provider} />}
    {imageFailure && <FailedImage />}
  </main>
}
createRoot(document.getElementById('root')!).render(<React.StrictMode><Fixture /></React.StrictMode>)
