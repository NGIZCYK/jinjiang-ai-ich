import type { Language } from '../i18n'
const xml = (value:string) => value.replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[char]!))

export function speechMarkup(text:string,language:Language,voice:string,rate:number) {
  const percent=Math.round((Math.min(1.15,Math.max(0.8,rate))-1)*100)
  return `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="${language==='zh'?'zh-CN':'en-US'}"><voice name="${xml(voice)}"><prosody rate="${percent>=0?'+':''}${percent}%">${xml(text)}</prosody></voice></speak>`
}
