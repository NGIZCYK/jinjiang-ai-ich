import { apiFetch } from './cloud'
import { reasonFor, type Experience, type Locale, type Needs } from './journey'

const activities: Record<string, [string, string]> = {
  scroll: [
    '可以先浏览《姑苏繁华图》的整体布局，再选择城楼、古桥、运河或市街中的一个点位，用微距观察比较人物、线条方向和色彩层次。这样的观看顺序能把苏州城市故事与画面细节联系起来，也方便你找到想继续了解的主题。',
    'Start with the overall layout of Prosperous Suzhou, then choose a gate, bridge, canal or market detail. Use the macro view to compare figures, line direction and colour layers. This connects the city story with details you can explore further.',
  ],
  materials: [
    '可以按蚕茧、劈丝、取色和丝光的顺序探索：先认识丝线的材料起点，再比较不同粗细与色样，最后切换受光方向，观察高光和明暗变化。建议保留一种喜欢的配色和两个粗细档位，让探索卡记录具体发现。',
    'Explore cocoon, splitting, colour and lustre in order. Begin with the material, compare thread levels and swatches, then change the light direction to observe highlights and shade. Keep a favourite palette and two comparison levels on your exploration card.',
  ],
  workshop: [
    '可以围绕上绷、配线、起针和回看四个环节了解入门过程。先观察底布张力与配色，再关注落针位置、走线方向和丝光变化，把材料观察连接到基础制作步骤。你也可以先在艺境中完成试针章节，整理希望进一步学习的问题。',
    'Follow mounting, thread selection, the first stitch and review. Notice fabric tension and colour before exploring stitch position, direction and lustre. This connects material observation with the introductory making process. The Stitch chapter can help you prepare questions to explore further.',
  ],
}

export function buildRecommendationExplanation(experience: Experience, needs: Needs, language: Locale) {
  const isZh = language === 'zh'
  const title = isZh ? experience.title_zh : experience.title_en
  const remainingMinutes = Math.max(0, needs.minutes - experience.minutes)
  const remainingBudget = Number(Math.max(0, needs.budget - experience.price).toFixed(2))
  const interest = {
    culture: ['文化故事', 'cultural stories'],
    craft: ['材料与工艺', 'materials and craft'],
    experience: ['动手体验', 'hands-on exploration'],
  }[needs.interest][isZh ? 0 : 1]
  const party = {
    solo: ['独自探索时，可以按自己的节奏停留和比较细节。', 'Exploring on your own lets you pause and compare details at your own pace.'],
    family: ['与家人同行时，可以各自选一个细节或色样，再交流彼此的发现。', 'With family, each person can choose a detail or colour and share what they notice.'],
    business: ['商务出行时，可以把这段体验安排在空闲时段，集中了解一个感兴趣的主题。', 'On a business stay, use a free period to focus on one cultural topic that interests you.'],
  }[needs.party][isZh ? 0 : 1]
  const match = experience.interests.includes(needs.interest)
    ? (isZh ? `它也呼应了你选择的“${interest}”兴趣。` : `It also matches your interest in ${interest}.`)
    : (isZh ? `它可作为“${interest}”之外的补充，提供另一种认识苏绣的角度。` : `It offers another perspective on Su embroidery alongside your interest in ${interest}.`)
  const activity = activities[experience.id]?.[isZh ? 0 : 1]
    ?? (isZh ? '从你感兴趣的主题开始，记录观察发现，再向婉娘提出更具体的问题。' : 'Begin with your chosen topic, record what you notice and ask Wanniang a more specific question.')
  return isZh
    ? [
        `推荐你了解“${title}”。${reasonFor(experience, needs, language)}${match}${party}`,
        activity,
        `按你填写的 ${needs.minutes} 分钟和 ¥${needs.budget}/人预算安排，这项体验占用 ${experience.minutes} 分钟、费用 ¥${experience.price}/人，还可留出 ${remainingMinutes} 分钟和 ¥${remainingBudget}/人的预算空间。你可以先保存这项推荐，再到“我的行程”查看场次并提交体验意向。`,
      ].join('\n\n')
    : [
        `Consider “${title}”. ${reasonFor(experience, needs, language)} ${match} ${party}`,
        activity,
        `With ${needs.minutes} available minutes and a budget of ¥${needs.budget} per person, this ${experience.minutes}-minute option at ¥${experience.price} per person leaves ${remainingMinutes} minutes and ¥${remainingBudget} per person. Save the recommendation, then open My Journey to view sessions and submit your preference.`,
      ].join('\n\n')
}

export async function requestRecommendationExplanation(experience: Experience, needs: Needs, language: Locale) {
  const fallback = () => buildRecommendationExplanation(experience, needs, language)
  try {
    const response = await apiFetch('/api/recommendation/explain', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ experienceId: experience.id, needs, language }),
    })
    if (!response.ok) return fallback()
    const payload = await response.json() as { content?: unknown }
    if (typeof payload.content !== 'string') return fallback()
    const content = payload.content.trim()
    if (/课程原型|演示(?:费用|假设)|尚未开放|course prototype|demo (?:price|assumption)|not live hotel services/i.test(content)) return fallback()
    // Short or empty service replies should still provide a useful explanation.
    if (language === 'zh' ? content.length < 100 : content.split(/\s+/).length < 45) return fallback()
    return content
  } catch {
    return fallback()
  }
}
