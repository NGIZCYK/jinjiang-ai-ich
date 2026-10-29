import type { Language } from '../i18n'

export interface VoiceSettings { voiceURI: string; rate: number }
export const VOICE_SETTINGS_EVENT = 'wanniang-voice-settings-changed'
const STORAGE_KEY = 'jj_voice_settings_v1'
const fallback: Partial<Record<Language,VoiceSettings>> = {}
const volatile = new Set<Language>()
export const VOICE_DEFAULTS: Record<Language,VoiceSettings> = {
  zh: { voiceURI:'', rate:0.94 }, en: { voiceURI:'', rate:0.95 }
}
export const VOICE_SAMPLES: Record<Language,string> = {
  zh:'您好，我是婉娘。让我们从一根丝线，慢慢认识苏州。',
  en:"Hello, I'm Wanniang. Let's discover Suzhou through the stories and craft of Su embroidery."
}
function valid(value:unknown): value is VoiceSettings {
  const item=value as VoiceSettings|null
  return !!item && typeof item.voiceURI==='string' && item.voiceURI.length<1000
    && Number.isFinite(item.rate) && item.rate>=0.8 && item.rate<=1.15
}
export function readVoiceSettings(language:Language): VoiceSettings {
  if(volatile.has(language)&&fallback[language])return {...fallback[language]!}
  try {
    const value=JSON.parse(localStorage.getItem(STORAGE_KEY)??'null')?.[language]
    if(valid(value))return {...value}
  } catch { if(fallback[language])return {...fallback[language]!} }
  return {...VOICE_DEFAULTS[language]}
}
export function saveVoiceSettings(language:Language,value:VoiceSettings):boolean {
  if(!valid(value))return false
  const settings={zh:readVoiceSettings('zh'),en:readVoiceSettings('en'),[language]:{...value}}
  fallback[language]={...value}
  let persisted=true
  try { localStorage.setItem(STORAGE_KEY,JSON.stringify(settings));volatile.delete(language) }
  catch { volatile.add(language);persisted=false }
  if(typeof window!=='undefined')window.dispatchEvent(new CustomEvent(VOICE_SETTINGS_EVENT,{detail:language}))
  return persisted
}
export function voiceMatchesLanguage(voice:Pick<SpeechSynthesisVoice,'lang'>,language:Language) {
  const tag=voice.lang.toLowerCase().replace(/_/g,'-')
  return language==='zh' ? /^(zh(?!-hk\b|-yue\b)|cmn)(-|$)/.test(tag) : /^en(-|$)/.test(tag)
}
export function voiceKey(voice:Pick<SpeechSynthesisVoice,'voiceURI'|'name'|'lang'>) { return voice.voiceURI||`${voice.lang}|${voice.name}` }
export function voiceFailureMessage(error:unknown,language:Language) {
  const message=error instanceof Error?error.message:''
  if(message==='VOICE_LANGUAGE_UNAVAILABLE')return language==='zh'?'设备没有可用的普通话音色，请检查系统语音或更换浏览器。':'No English voice is available. Check system voices or try another browser.'
  if(message==='VOICE_SELECTION_UNAVAILABLE')return language==='zh'?'之前选择的音色当前不可用，请在语音设置中重新选择。':'The selected voice is unavailable. Choose another voice in Voice settings.'
  if(message==='VOICE_UNAVAILABLE')return language==='zh'?'此浏览器暂不支持语音播放，文字内容仍可阅读。':'Voice playback is unavailable in this browser. You can still read the response.'
  return language==='zh'?'语音未能播放，请重新试听或选择其他音色。':'The voice could not play. Try the sample again or choose another voice.'
}
