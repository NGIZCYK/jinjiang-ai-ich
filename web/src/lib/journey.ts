import { FLORAL_SPOTS } from './artworkStudy'
export type Locale = 'zh' | 'en'
export type Party = 'solo' | 'family' | 'business'
export type Interest = 'culture' | 'craft' | 'experience'
export interface Needs { minutes: number; budget: number; party: Party; interest: Interest }
export interface Exploration { motif: string; palette: string; levels: string[]; answer: string }
export interface Experience {
  id: string; title_zh: string; title_en: string; minutes: number; price: number;
  interests: Interest[]; parties: Party[]; active: boolean
}
export interface SessionSlot { id: string; experience_id: string; starts_at: string; capacity: number; available: number }
export type BookingStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'declined'
export interface JourneyBooking {
  stay_entitlement_id?: string | null;
  id: string; user_id: string; session_id: string; party_size: number; status: BookingStatus;
  reason: string; created_at: string; batch_id: string; recommendation_id: string | null;
  // feedback.booking_id is a primary key: the embedded relation is one object or null.
  sessions: { starts_at: string; experience_id: string }; feedback?: { rating: number; comment: string; created_at?: string } | null
}
export interface SavedRecommendation { id: string; experience_id: string; needs: Needs; created_at: string }
export const CATALOG: Experience[] = [
  { id: 'scroll', title_zh: '长卷自助导览', title_en: 'Scroll discovery', minutes: 15, price: 0, interests: ['culture'], parties: ['solo','family','business'], active: true },
  { id: 'materials', title_zh: '丝线材料探索', title_en: 'Silk & colour exploration', minutes: 30, price: 30, interests: ['craft'], parties: ['solo','family','business'], active: true },
  { id: 'workshop', title_zh: '苏绣入门工坊', title_en: 'Embroidery introduction', minutes: 90, price: 128, interests: ['experience','craft'], parties: ['solo','family'], active: true },
]
export const EMPTY_EXPLORATION: Exploration = { motif: '', palette: '', levels: [], answer: '' }
export const DEFAULT_NEEDS: Needs = { minutes: 90, budget: 150, party: 'solo', interest: 'culture' }
export const LEGACY_MOTIFS = [['gate','阊门城楼','Changmen gate'],['bridge','古桥人物','Bridge & figures'],['boats','运河水纹','Canal ripples'],['market','市街层次','Market layers']]
export const FLORAL_MOTIFS = FLORAL_SPOTS.map(spot => [spot.id, spot.labelZh, spot.labelEn])
// Display and validate historic choices without changing their meaning.
export const MOTIFS = [...LEGACY_MOTIFS, ...FLORAL_MOTIFS]
export const PALETTES = [['jade','黛青','Jade','#46665e'],['ivory','初白','Ivory','#ded6bf'],['rose','海棠','Rose','#a66e73'],['gold','秋金','Gold','#aa854b'],['indigo','靛蓝','Indigo','#52617c']]
export const LEVELS = ['full','1/4','1/16','1/32']
export function toggleExplorationChoice(draft: Exploration, field: 'motif' | 'palette' | 'levels', value: string): Exploration {
  if (field === 'levels') {
    return { ...draft, levels: draft.levels.includes(value) ? draft.levels.filter(level => level !== value) : [...draft.levels, value] }
  }
  return { ...draft, [field]: draft[field] === value ? '' : value }
}
export function progress(e: Exploration) {
  return [MOTIFS.some(m => m[0] === e.motif), PALETTES.some(p => p[0] === e.palette) && new Set(e.levels.filter(l => LEVELS.includes(l))).size >= 2, ['relative','universal'].includes(e.answer)].filter(Boolean).length
}
export function explorationInterest(e: Exploration): Interest { return e.levels.length >= 2 ? 'craft' : 'culture' }
export function recommend(needs: Needs, catalog: Experience[] = CATALOG) {
  if (!Number.isFinite(needs.minutes) || !Number.isFinite(needs.budget) || needs.minutes < 0 || needs.budget < 0) return []
  return catalog.filter(e => e.active && e.minutes <= needs.minutes && e.price <= needs.budget && e.parties.includes(needs.party))
    .sort((a,b) => Number(b.interests.includes(needs.interest)) - Number(a.interests.includes(needs.interest)) || b.minutes - a.minutes)
}
export function reasonFor(e: Experience, n: Needs, lang: Locale) {
  return lang === 'zh' ? `${e.minutes} 分钟，费用 ¥${e.price}/人，符合你的时间和单人预算${e.interests.includes(n.interest) ? '，也与你选择的兴趣相符' : '；可作为替代体验'}。` : `${e.minutes} min and ¥${e.price}/person fit your time and per-person budget${e.interests.includes(n.interest) ? ', matching your interest' : '; an alternative experience'}.`
}
export const STATUS: Record<BookingStatus, [string,string]> = { pending:['待处理','Pending'], confirmed:['已确认','Confirmed'], completed:['流程已完成','Journey completed'], cancelled:['已撤回','Withdrawn'], declined:['未通过','Declined'] }
export function statusLabel(s: BookingStatus, l: Locale) { return STATUS[s][l === 'zh' ? 0 : 1] }
export function titleFor(id: string, l: Locale, catalog = CATALOG) { const e = catalog.find(x => x.id === id); return e ? e[l === 'zh' ? 'title_zh' : 'title_en'] : id }
export function slotTime(iso: string, l: Locale) { return new Intl.DateTimeFormat(l === 'zh' ? 'zh-CN' : 'en-GB', { timeZone: 'Asia/Shanghai', month:'short',day:'numeric',hour:'2-digit',minute:'2-digit' }).format(new Date(iso)) + (l === 'zh' ? '（北京时间）' : ' (Shanghai)') }
