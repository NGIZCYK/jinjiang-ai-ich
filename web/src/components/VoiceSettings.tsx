import { useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import type { Language } from '../lib/i18n'
import { loadBrowserVoices, pickBestVoice } from '../lib/tts/browserVoices'
import { readVoiceSettings, saveVoiceSettings, VOICE_DEFAULTS, VOICE_SAMPLES, voiceKey, voiceMatchesLanguage, type VoiceSettings as Settings } from '../lib/tts/voiceSettings'

interface Props {
  language: Language
  phase: 'idle' | 'synthesizing' | 'playing'
  previewing: boolean
  mode: 'browser' | 'viseme' | 'unavailable'
  error?: string
  onPreview: (text: string) => void
  onStop: () => void
  onPreferenceChange: () => void
  onOpenChange?: (open: boolean) => void
}

export function VoiceSettings({ language, phase, previewing, mode, error, onPreview, onStop, onPreferenceChange, onOpenChange }: Props) {
  const rateId = useId(), voiceId = useId(), titleId = useId(), descriptionId = useId()
  const zh = language === 'zh', t = (a: string, b: string) => zh ? a : b
  const [settings, setSettings] = useState(() => readVoiceSettings(language))
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([])
  const [loading, setLoading] = useState(true)
  const [stored, setStored] = useState(true)
  const [open, setOpen] = useState(false)
  const [samplePending, setSamplePending] = useState(false)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const dialogRef = useRef<HTMLDialogElement>(null)
  const previewingRef = useRef(previewing)
  const sampleRequestedRef = useRef(false)
  const previousPreviewingRef = useRef(previewing)
  const stopRef = useRef(onStop)
  previewingRef.current = previewing
  stopRef.current = onStop

  useEffect(() => {
    if (previewing || error) setSamplePending(false)
    if (previousPreviewingRef.current && !previewing) sampleRequestedRef.current = false
    previousPreviewingRef.current = previewing
  }, [previewing, error])

  useEffect(() => {
    const controller = new AbortController()
    setSettings(readVoiceSettings(language)); setLoading(true)
    void loadBrowserVoices(controller.signal).then(value => {
      if (!controller.signal.aborted) { setVoices(value); setLoading(false) }
    }).catch(() => { if (!controller.signal.aborted) { setVoices([]); setLoading(false) } })
    const changed = () => setVoices(window.speechSynthesis.getVoices())
    window.speechSynthesis?.addEventListener('voiceschanged', changed)
    return () => { controller.abort(); window.speechSynthesis?.removeEventListener('voiceschanged', changed) }
  }, [language])

  useEffect(() => { onOpenChange?.(open) }, [open, onOpenChange])
  useEffect(() => {
    if (!open) return
    const dialog = dialogRef.current
    if (!dialog) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    // Native modal makes the page inert. The focus trap below also supports older hosts.
    try { dialog.showModal?.() } catch { /* use the accessible modal fallback */ }
    if (!dialog.open) dialog.setAttribute('open', '')
    dialog.querySelector<HTMLElement>('select')?.focus()
    return () => {
      document.body.style.overflow = previousOverflow
      if (previewingRef.current || sampleRequestedRef.current) stopRef.current()
      sampleRequestedRef.current = false
      triggerRef.current?.focus()
    }
  }, [open])

  const available = Array.from(new Map(voices.filter(voice => voiceMatchesLanguage(voice, language)).map(voice => [voiceKey(voice), voice])).values())
  const selectedMissing = !!settings.voiceURI && !available.some(voice => voiceKey(voice) === settings.voiceURI)
  const suggested = pickBestVoice(voices, language)
  function change(next: Settings) { sampleRequestedRef.current = false; setSamplePending(false); setSettings(next); setStored(saveVoiceSettings(language, next)); onPreferenceChange() }
  function close() { setSamplePending(false); setOpen(false) }

  return <div className="voice-settings">
    <button ref={triggerRef} type="button" className="voice-settings-trigger" aria-haspopup="dialog" aria-expanded={open} onClick={() => setOpen(true)}>
      {t('声音与试听', 'Voice & sample')}<span>{zh ? '中文' : 'English'} · {settings.rate.toFixed(2)}×</span><span aria-hidden="true">↗</span>
    </button>
    {open && createPortal(<div className="voice-settings-backdrop" onClick={event => { if (event.target === event.currentTarget) close() }}>
      <dialog ref={dialogRef} className="voice-settings-dialog" aria-modal="true" aria-labelledby={titleId} aria-describedby={descriptionId}
        onCancel={event => { event.preventDefault(); close() }} onClose={close}
        onClick={event => { if (event.target === event.currentTarget) { const bounds = event.currentTarget.getBoundingClientRect(); if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) close() } }}
        onKeyDown={event => {
          if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); close(); return }
          if (event.key !== 'Tab') return
          const items = Array.from(event.currentTarget.querySelectorAll<HTMLElement>('button:not([disabled]),select:not([disabled]),input:not([disabled]),[tabindex="0"]'))
          const first = items[0], last = items[items.length - 1]
          if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus() }
          else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus() }
        }}>
        <header className="voice-settings-heading"><div><p>{t('婉娘的声音', 'WANNIANG’S VOICE')}</p><h2 id={titleId}>{t('声音与试听', 'Voice & sample')}</h2></div><button type="button" onClick={close} aria-label={t('关闭声音设置', 'Close voice settings')}>×</button></header>
        <div className="voice-settings-content">
          <p id={descriptionId}>{t('先听一小段，再选择喜欢的声音。中文与英文分别保存设置。', 'Listen to a short sample, then choose your preferred voice. Chinese and English settings are saved separately.')}</p>
          <label htmlFor={voiceId}>{t('当前语言的音色', 'Voice for this language')}<select id={voiceId} className="input" value={settings.voiceURI} onChange={event => change({ ...settings, voiceURI: event.target.value })}>
            <option value="">{t('推荐音色（自动）', 'Recommended voice (automatic)')}</option>
            {selectedMissing && <option disabled value={settings.voiceURI}>{t('之前选择的音色当前不可用', 'Previously selected voice is unavailable')}</option>}
            {available.map(voice => <option key={voiceKey(voice)} value={voiceKey(voice)}>{voice.name} · {voice.lang}</option>)}
          </select></label>
          <small>{loading ? t('正在读取设备音色…', 'Loading device voices…') : selectedMissing ? t('请重新选择音色，或恢复推荐设置。', 'Choose another voice or restore the recommended settings.') : settings.voiceURI ? t('使用所选设备音色。', 'Using the selected device voice.') : mode === 'viseme' ? t('使用当前在线服务的推荐声音。', 'Using the available online voice service.') : suggested ? t(`此设备推荐：${suggested.name}`, `Device recommendation: ${suggested.name}`) : t('此设备暂无对应语言音色；可尝试推荐服务或检查系统语音。', 'No matching device voice. Try the recommended service or check system voices.')}</small>
          <label className="voice-rate-label" htmlFor={rateId}>{t('讲解语速', 'Speaking rate')}<span aria-hidden="true">{settings.rate.toFixed(2)}×</span><input id={rateId} type="range" aria-label={t('讲解语速', 'Speaking rate')} min="0.8" max="1.15" step="0.01" value={settings.rate} aria-valuetext={`${settings.rate.toFixed(2)}×`} onChange={event => change({ ...settings, rate: Number(event.target.value) })} /></label>
          <p className="voice-sample-text">{VOICE_SAMPLES[language]}</p>
          {error && <p className="voice-settings-error" role="alert">{error}</p>}
          <div className="voice-settings-actions"><button type="button" className="btn-primary" disabled={selectedMissing} onClick={() => { if (previewing || samplePending) { sampleRequestedRef.current = false; setSamplePending(false); onStop() } else { sampleRequestedRef.current = true; setSamplePending(true); onPreview(VOICE_SAMPLES[language]) } }}>{previewing || samplePending ? (samplePending || phase === 'synthesizing' ? t('取消准备', 'Cancel sample') : t('停止试听', 'Stop sample')) : t('试听当前声音', 'Try this voice')}</button><button type="button" className="journey-text-button" onClick={() => change({ ...VOICE_DEFAULTS[language] })}>{t('恢复推荐设置', 'Restore defaults')}</button></div>
          {!stored && <p role="status">{t('本次设置已生效，浏览器未能保存；关闭页面后可能需要重选。', 'Settings are active, but this browser could not save them for your next visit.')}</p>}
        </div>
      </dialog>
    </div>, document.body)}
  </div>
}
