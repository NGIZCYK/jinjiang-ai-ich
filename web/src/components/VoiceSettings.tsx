import { useEffect, useId, useState } from 'react'
import type { Language } from '../lib/i18n'
import { loadBrowserVoices, pickBestVoice } from '../lib/tts/browserVoices'
import { readVoiceSettings, saveVoiceSettings, VOICE_DEFAULTS, VOICE_SAMPLES, voiceKey, voiceMatchesLanguage, type VoiceSettings as Settings } from '../lib/tts/voiceSettings'

interface Props {
  language:Language
  phase:'idle'|'synthesizing'|'playing'
  previewing:boolean
  mode:'browser'|'viseme'|'unavailable'
  onPreview:(text:string)=>void
  onStop:()=>void
  onPreferenceChange:()=>void
  onOpenChange?:(open:boolean)=>void
}
export function VoiceSettings({language,phase,previewing,mode,onPreview,onStop,onPreferenceChange,onOpenChange}:Props) {
  const rateId=useId(),voiceId=useId()
  const zh=language==='zh',t=(a:string,b:string)=>zh?a:b
  const [settings,setSettings]=useState(()=>readVoiceSettings(language))
  const [voices,setVoices]=useState<SpeechSynthesisVoice[]>([])
  const [loading,setLoading]=useState(true)
  const [stored,setStored]=useState(true)
  useEffect(()=>{
    const controller=new AbortController();setSettings(readVoiceSettings(language));setLoading(true)
    void loadBrowserVoices(controller.signal).then(value=>{if(!controller.signal.aborted){setVoices(value);setLoading(false)}}).catch(()=>{if(!controller.signal.aborted){setVoices([]);setLoading(false)}})
    const changed=()=>setVoices(window.speechSynthesis.getVoices())
    window.speechSynthesis?.addEventListener('voiceschanged',changed)
    return()=>{controller.abort();window.speechSynthesis?.removeEventListener('voiceschanged',changed)}
  },[language])
  const available=Array.from(new Map(voices.filter(voice=>voiceMatchesLanguage(voice,language)).map(voice=>[voiceKey(voice),voice])).values())
  const selectedMissing=!!settings.voiceURI&&!available.some(voice=>voiceKey(voice)===settings.voiceURI)
  const suggested=pickBestVoice(voices,language)
  function change(next:Settings){setSettings(next);setStored(saveVoiceSettings(language,next));onPreferenceChange()}
  return <details className="voice-settings" onToggle={event=>onOpenChange?.(event.currentTarget.open)}><summary>{t('声音与试听','Voice & sample')}<span>{zh?'中文':'English'} · {settings.rate.toFixed(2)}×</span></summary><div className="voice-settings-content">
    <p>{t('选择适合你的婉娘声音。中英文分别记住设置，人物形象始终一致。','Choose Wanniang’s voice. Chinese and English settings are saved separately; her portrait stays the same.')}</p>
    <label htmlFor={voiceId}>{t('当前语言的音色','Voice for this language')}<select id={voiceId} className="input" value={settings.voiceURI} onChange={event=>change({...settings,voiceURI:event.target.value})}>
      <option value="">{t('推荐音色（自动）','Recommended voice (automatic)')}</option>
      {selectedMissing&&<option disabled value={settings.voiceURI}>{t('之前选择的音色当前不可用','Previously selected voice is unavailable')}</option>}
      {available.map(voice=><option key={voiceKey(voice)} value={voiceKey(voice)}>{voice.name} · {voice.lang}</option>)}
    </select></label>
    <small>{loading?t('正在读取设备音色…','Loading device voices…'):selectedMissing?t('请重新选择音色，或恢复推荐设置。','Choose another voice or restore the recommended settings.'):settings.voiceURI?t('使用所选设备音色。','Using the selected device voice.'):mode==='viseme'?t('使用当前在线服务的推荐声音。','Using the available online voice service.'):suggested?t(`此设备推荐：${suggested.name}`,`Device recommendation: ${suggested.name}`):t('此设备暂无对应语言音色；可尝试推荐服务或检查系统语音。','No matching device voice. Try the recommended service or check system voices.')}</small>
    <label className="voice-rate-label" htmlFor={rateId}>{t('讲解语速','Speaking rate')}<span aria-hidden="true">{settings.rate.toFixed(2)}×</span><input id={rateId} type="range" aria-label={t('讲解语速','Speaking rate')} min="0.8" max="1.15" step="0.01" value={settings.rate} aria-valuetext={`${settings.rate.toFixed(2)}×`} onChange={event=>change({...settings,rate:Number(event.target.value)})}/></label>
    <p className="voice-sample-text">{VOICE_SAMPLES[language]}</p>
    <div className="voice-settings-actions"><button className="btn-primary" disabled={selectedMissing} onClick={()=>previewing?onStop():onPreview(VOICE_SAMPLES[language])}>{previewing?(phase==='synthesizing'?t('取消准备','Cancel sample'):t('停止试听','Stop sample')):t('试听当前声音','Try this voice')}</button><button className="journey-text-button" onClick={()=>change({...VOICE_DEFAULTS[language]})}>{t('恢复推荐设置','Restore defaults')}</button></div>
    {!stored&&<p role="status">{t('本次设置已生效，浏览器未能保存；关闭页面后可能需要重选。','Settings are active, but this browser could not save them for your next visit.')}</p>}
  </div></details>
}
