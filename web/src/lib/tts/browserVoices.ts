import type { Language } from '../i18n'
import { voiceMatchesLanguage } from './voiceSettings'

export async function loadBrowserVoices(signal?:AbortSignal):Promise<SpeechSynthesisVoice[]> {
  signal?.throwIfAborted()
  if(typeof window==='undefined'||!('speechSynthesis' in window))return []
  const synth=window.speechSynthesis
  const current=synth.getVoices()
  if(current.length)return current
  return new Promise((resolve,reject)=>{
    let timer=0
    const cleanup=()=>{window.clearTimeout(timer);synth.removeEventListener('voiceschanged',changed);signal?.removeEventListener('abort',abort)}
    const changed=()=>{const voices=synth.getVoices();if(voices.length){cleanup();resolve(voices)}}
    const abort=()=>{cleanup();reject(new DOMException('Speech cancelled.','AbortError'))}
    synth.addEventListener('voiceschanged',changed)
    signal?.addEventListener('abort',abort,{once:true})
    timer=window.setTimeout(()=>{cleanup();resolve(synth.getVoices())},1000)
    if(signal?.aborted)abort()
  })
}

export function pickBestVoice(voices:SpeechSynthesisVoice[],language:Language):SpeechSynthesisVoice|undefined {
  const candidates=voices.filter(voice=>voiceMatchesLanguage(voice,language))
  const preferred=language==='zh'?[/xiaoxiao/i,/xiaoyi/i,/xiaohan|xiaomeng/i,/google.*(普通话|mandarin|chinese)/i,/huihui/i]:[/jenny/i,/aria/i,/emma|sonia|samantha|zira/i]
  for(const pattern of preferred){const match=candidates.find(voice=>pattern.test(voice.name));if(match)return match}
  // Unknown names do not prove age or gender. Expose their actual names in the selector.
  return candidates.find(voice=>voice.default)??candidates[0]
}
