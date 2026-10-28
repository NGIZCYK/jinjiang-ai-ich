import { ICH_ITEMS, searchICH } from './ichItems.ts'

export type StudioLanguage = 'zh' | 'en'
export interface StudioInputs {
  task: 'itinerary' | 'copy'
  audience: 'weekend' | 'family' | 'business' | 'culture' | 'leisure'
  channel: 'letter' | 'signage' | 'frontdesk' | 'mobile'
  minutes: number
  theme: string
  language: StudioLanguage
}
export interface StudioSegment { title: string; minutes: number; description: string; referenceIds: string[] }
export interface StudioDraft {
  title: string; intro: string; segments: StudioSegment[]; copyText: string; referenceIds: string[]
  language: StudioLanguage; provider: 'deepseek' | 'template'; inputs: StudioInputs
}
export const AUDIENCES = {
  weekend: ['周末微度假住客', 'Weekend escape guests'], family: ['亲子文化体验住客', 'Family culture guests'],
  business: ['商务延住住客', 'Business stay guests'], culture: ['文化体验型住客', 'Culture-led guests'],
  leisure: ['休闲探索型住客', 'Leisure explorers'],
} as const
export const CHANNELS = {
  letter: ['客房欢迎信笺', 'In-room welcome letter'], signage: ['大堂电子展牌', 'Lobby signage'],
  frontdesk: ['前台礼宾推荐卡', 'Concierge card'], mobile: ['手机端推送', 'Mobile message'],
} as const
export const COPY_LIMITS = { letter: 1400, signage: 380, frontdesk: 650, mobile: 300 }
export function parseStudioInputs(raw: unknown): StudioInputs | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null
  const x = raw as StudioInputs
  if (!['itinerary', 'copy'].includes(x.task) || !Object.prototype.hasOwnProperty.call(AUDIENCES, x.audience)
    || !Object.prototype.hasOwnProperty.call(CHANNELS, x.channel) || ![60, 90, 120, 180].includes(x.minutes)
    || !['zh', 'en'].includes(x.language) || typeof x.theme !== 'string' || !x.theme.trim() || x.theme.length > 180) return null
  return { task: x.task, audience: x.audience, channel: x.channel, minutes: x.minutes, theme: x.theme.trim(), language: x.language }
}
export function studioReferences(input: StudioInputs) {
  const ids = new Set(searchICH(`${input.theme} 苏绣 劈丝 长卷 体验`, input.language, 4).map(item => item.id))
  return ICH_ITEMS.filter(item => ids.has(item.id))
}
export function parseStudioDraft(raw: unknown, input: StudioInputs, provider: StudioDraft['provider'] = 'deepseek'): StudioDraft | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null
  const x = raw as StudioDraft
  const text = (v: unknown, max: number) => typeof v === 'string' && v.trim().length > 0 && v.length <= max
  const ids = new Set(studioReferences(input).map(item => item.id))
  const refs = (v: unknown): v is string[] => Array.isArray(v) && v.length >= 1 && v.length <= 4
    && new Set(v).size === v.length && v.every(id => typeof id === 'string' && ids.has(id))
  if (!text(x.title, 200) || !text(x.intro, 1200) || !refs(x.referenceIds)) return null
  if (input.task === 'itinerary') {
    if (!Array.isArray(x.segments) || x.segments.length !== 4 || x.segments.some(s => !s || !text(s.title, 120)
      || !text(s.description, 1000) || !Number.isInteger(s.minutes) || s.minutes < 1 || !refs(s.referenceIds))
      || x.segments.reduce((sum, s) => sum + s.minutes, 0) !== input.minutes) return null
  } else if (!text(x.copyText, COPY_LIMITS[input.channel])) return null
  return { title: x.title.trim(), intro: x.intro.trim(), segments: input.task === 'itinerary' ? x.segments.map(s => ({
    title: s.title.trim(), minutes: s.minutes, description: s.description.trim(), referenceIds: [...s.referenceIds],
  })) : [], copyText: input.task === 'copy' ? x.copyText.trim() : '', referenceIds: [...x.referenceIds],
  language: input.language, provider, inputs: { ...input } }
}
export function templateStudioDraft(input: StudioInputs): StudioDraft {
  const zh = input.language === 'zh', index = zh ? 0 : 1
  const audience = AUDIENCES[input.audience][index], channel = CHANNELS[input.channel][index]
  const focus = {
    weekend: ['放慢节奏，连接城市故事与细节观察', 'Slow down and connect city stories with visual details'],
    family: ['共同选择细节与配色，轮流分享发现', 'Choose details and colours together and take turns sharing discoveries'],
    business: ['利用空闲时段，聚焦材料与城市文脉', 'Use a free period to focus on materials and the city’s cultural context'],
    culture: ['沿长卷与工艺线索，理解苏州文化', 'Follow the scroll and craft references to explore Suzhou culture'],
    leisure: ['从易于观察的画面入手，逐步发现工艺之美', 'Start with accessible visual details and gradually explore the craft'],
  }[input.audience][index]
  const first = Math.floor(input.minutes * (input.audience === 'culture' ? .3 : .2))
  const second = Math.floor(input.minutes * (input.audience === 'family' ? .3 : .2))
  const third = Math.floor(input.minutes * .35)
  const times = [first, second, third, input.minutes - first - second - third]
  const titles = zh ? ['长卷观绣', '丝线与配色', '试针观察', '回看与记录'] : ['Observe the scroll', 'Thread and palette', 'First-stitch study', 'Review and record']
  const descriptions = zh ? [
    `围绕“${input.theme}”选择城楼、古桥或运河细节，${focus}。`,
    `比较整股、1/4、1/16、1/32 的相对细度，选择一种配色。${input.audience === 'family' ? '每位同行者选一种颜色，再比较彼此发现。' : '记录线条与受光变化。'}`,
    '按上绷、配线与起针顺序观察，留意底布张力、走线方向和丝光。',
    '保存探索发现，整理一个希望继续向婉娘提问的主题。',
  ] : [
    `Choose a gate, bridge or canal detail around “${input.theme}”. ${focus}.`,
    `Compare Full, 1/4, 1/16 and 1/32 relative levels and choose a palette. ${input.audience === 'family' ? 'Each person chooses a colour and shares a discovery.' : 'Record changes in lines and lighting.'}`,
    'Observe mounting, thread selection and the first stitch. Notice fabric tension, direction and lustre.',
    'Save your observations and prepare one question to explore with Wanniang.',
  ]
  const referenceIds = studioReferences(input).map(item => item.id).slice(0, 4)
  const cta = zh ? {
    letter: '欢迎从“苏绣艺境”开始，记录喜欢的主题，再向婉娘询问适合你的体验。',
    signage: '打开苏绣艺境，发现一针一线里的苏州。',
    frontdesk: '告诉礼宾你的可用时间与兴趣，选择适合的探索路线。',
    mobile: '进入苏绣艺境，开始探索 →',
  }[input.channel] : {
    letter: 'Begin in the Embroidery Gallery, record a favourite theme, and ask Wanniang for an experience that fits your stay.',
    signage: 'Open the Embroidery Gallery and discover Suzhou through a single thread.',
    frontdesk: 'Share your available time and interests with the concierge to choose your route.',
    mobile: 'Open the Embroidery Gallery and start exploring →',
  }[input.channel]
  const shortTheme = input.theme.slice(0, 70)
  const copyText = (zh ? `用 ${input.minutes} 分钟发现苏州。\n` : `Explore Suzhou in a ${input.minutes}-minute free period.\n`) + (input.channel === 'letter'
    ? (zh ? `亲爱的住客：\n欢迎来到苏州。${focus}。以“${input.theme}”为线索，用一段从观绣到识线的旅程，连接江南图景与丝线细节。\n${cta}`
      : `Dear guest,\nWelcome to Suzhou. ${focus}. Follow “${input.theme}” from the scroll to silk, connecting scenes of Jiangnan with fine threads.\n${cta}`)
    : (zh ? `${shortTheme}｜${focus}。\n${cta}` : `${shortTheme} | ${focus}.\n${cta}`))
  const title = zh ? `${input.theme} · ${input.task === 'itinerary' ? `${input.minutes} 分钟行程` : channel}`
    : `${input.theme} · ${input.task === 'itinerary' ? `${input.minutes}-minute itinerary` : channel}`
  return { title: title.slice(0, 200),
  intro: zh ? `面向${audience}，通过${channel}，${focus}。` : `For ${audience}, through ${channel}. ${focus}.`,
  segments: input.task === 'itinerary' ? titles.map((title, i) => ({ title, minutes: times[i], description: descriptions[i], referenceIds: [referenceIds[i % referenceIds.length]] })) : [],
  copyText: input.task === 'copy' ? copyText : '', referenceIds, language: input.language, provider: 'template', inputs: { ...input } }
}
export function studioMarkdown(draft: StudioDraft) {
  const zh = draft.language === 'zh'
  return [`# ${draft.title}`, draft.intro, draft.inputs.task === 'itinerary'
    ? draft.segments.map((segment, i) => `## ${i + 1}. ${segment.title} · ${segment.minutes} ${zh ? '分钟' : 'min'}\n${segment.description}`).join('\n\n')
    : draft.copyText,
  `## ${zh ? '参考资料' : 'References'}`,
  ...draft.referenceIds.map(id => { const item = ICH_ITEMS.find(row => row.id === id)!; return `- ${zh ? item.title : item.titleEn ?? item.title} [${id}]` }),
  ].join('\n\n')
}
const META = /\n?<!--jj-studio:([^>]+)-->\s*$/
export function encodeStudioContent(body: string, inputs: StudioInputs, provider: StudioDraft['provider'] | 'saved') {
  return `${body.trim()}\n\n<!--jj-studio:${encodeURIComponent(JSON.stringify({ inputs, provider }))}-->`
}
export function decodeStudioContent(content: string) {
  const match = content.match(META)
  let inputs: StudioInputs | null = null, provider: StudioDraft['provider'] | null = null
  try { const meta = JSON.parse(decodeURIComponent(match?.[1] ?? '')); inputs = parseStudioInputs(meta.inputs); provider = meta.provider === 'deepseek' ? 'deepseek' : meta.provider === 'template' ? 'template' : null } catch { /* Legacy plain-text content remains readable. */ }
  return { body: content.replace(META, '').trim(), inputs, provider }
}

/** Check the editable itinerary before approval, including after a saved draft is reopened. */
export function itineraryDuration(body: string, input: StudioInputs): { valid: boolean; total: number; count: number } {
  if (input.task !== 'itinerary') return { valid: true, total: 0, count: 0 }
  const headings = [...body.matchAll(/^##\s+\d+[.)]\s+.+?[·|—-]\s*(\d+)\s*(?:分钟|min(?:utes)?)\s*$/gm)]
  const total = headings.reduce((sum, match) => sum + Number(match[1]), 0)
  return { valid: headings.length === 4 && total === input.minutes && headings.every(match => Number(match[1]) > 0), total, count: headings.length }
}
