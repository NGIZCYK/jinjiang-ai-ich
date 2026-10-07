import type { GuideSource } from './guideContract.ts'

export type GuideIntent =
  | 'suxiu_craft'
  | 'project_itinerary'
  | 'project_booking'
  | 'suzhou_travel'
  | 'suzhou_food'
  | 'suzhou_transport'
  | 'general'

export interface GuideIntentAnalysis {
  intent: GuideIntent
  huqiuAmbiguous: boolean
  timeSensitive: boolean
  firstVisit: boolean
}

const PROJECT_CRAFT = /苏绣|刺绣|劈丝|针法|丝线|丝光|绣娘|双面绣|乱针绣|非遗|su\s*embroidery|embroidery|silk|stitch|heritage/i
const PROJECT_EXPERIENCE = /苏绣体验|刺绣体验|非遗体验|工坊|手作|绣台|体验(?:课|时段|场次|预约|活动)|workshop|atelier|hands-on|embroidery experience|experience session/i
const EXPERIENCE_WORD = /体验|时段|场次|课程|experience|session|workshop/i
const BOOKING_WORD = /预约|报名|时段|场次|几点|开放|有空|book|reserve|availability|time\s*slot|session/i
const PLAN_WORD = /安排|规划|行程|路线|小时|分钟|半天|一天|plan|itinerary|schedule|route|hour|minute|half.?day|full.?day/i
const TRAVEL_WORD = /苏州|姑苏|景点|园林|博物馆|古镇|平江路|山塘街|虎丘|拙政园|留园|寒山寺|金鸡湖|同里|周庄|旅游|游览|打卡|suzhou|sight|attraction|garden|museum|visit|travel/i
const FOOD_WORD = /美食|吃什么|餐厅|苏帮菜|苏式面|小吃|松鼠鳜鱼|生煎|food|restaurant|eat|cuisine|snack/i
const TRANSPORT_WORD = /交通|地铁|公交|打车|高铁|火车站|机场|怎么去|路线|transport|metro|subway|bus|taxi|train|airport|how to get/i
const TIME_SENSITIVE_WORD = /今天|明天|现在|实时|天气|营业时间|开放时间|票价|门票价格|余票|活动|闭馆|拥堵|today|tomorrow|now|live|weather|opening hours|ticket price|availability|event/i

export function analyzeGuideIntent(question: string): GuideIntentAnalysis {
  const hasCraft = PROJECT_CRAFT.test(question)
  const hasProjectExperience = PROJECT_EXPERIENCE.test(question)
  const hasExperienceWord = EXPERIENCE_WORD.test(question)
  const hasBookingWord = BOOKING_WORD.test(question)
  const hasPlanWord = PLAN_WORD.test(question)
  const hasTravelWord = TRAVEL_WORD.test(question)

  let intent: GuideIntent = 'general'

  // 项目体验必须同时具备“体验语境”和明确的预约/规划意图。
  // “推荐景点”之类的通用旅行问题绝不能落入项目行程。
  if ((hasProjectExperience || (hasCraft && hasExperienceWord)) && hasBookingWord) {
    intent = 'project_booking'
  } else if ((hasProjectExperience || (hasCraft && hasExperienceWord)) && hasPlanWord) {
    intent = 'project_itinerary'
  } else if (hasCraft) {
    intent = 'suxiu_craft'
  } else if (FOOD_WORD.test(question)) {
    intent = 'suzhou_food'
  } else if (TRANSPORT_WORD.test(question)) {
    intent = 'suzhou_transport'
  } else if (hasTravelWord) {
    intent = 'suzhou_travel'
  }

  return {
    intent,
    huqiuAmbiguous: /虎丘区/.test(question) && !/行政区|高新区|狮山|大阳山|白马涧|太湖国家湿地公园/.test(question),
    timeSensitive: TIME_SENSITIVE_WORD.test(question),
    firstVisit: /第一次|初次|首次|第一次来|first(?:-|\s)?time|first visit/i.test(question),
  }
}

export function getSuzhouGuideSource(language: 'zh' | 'en'): GuideSource {
  return {
    id: 'suzhou-city-guide-baseline',
    title: language === 'zh' ? '苏州城市导览基础资料' : 'Suzhou city-guide baseline',
    category: 'documented',
    references: language === 'zh'
      ? [
          '苏州市文化广电和旅游局：https://wglj.suzhou.gov.cn/',
          '苏州博物馆：https://www.szmuseum.com/',
          'UNESCO Classical Gardens of Suzhou：https://whc.unesco.org/en/list/813',
        ]
      : [
          'Suzhou Municipal Bureau of Culture, Radio, Television and Tourism: https://wglj.suzhou.gov.cn/',
          'Suzhou Museum: https://www.szmuseum.com/',
          'UNESCO Classical Gardens of Suzhou: https://whc.unesco.org/en/list/813',
        ],
  }
}

export function buildSuzhouContext(analysis: GuideIntentAnalysis, language: 'zh' | 'en'): string {
  if (!['suzhou_travel', 'suzhou_food', 'suzhou_transport'].includes(analysis.intent)) return ''

  if (language === 'en') {
    return `[DOCUMENTED CITY-GUIDE BASELINE — verify all time-sensitive details]
Terminology: Huqiu District is the administrative Suzhou New District. Tiger Hill Scenic Area is a famous attraction in Gusu District; the names must not be conflated.
First-visit anchors: Humble Administrator's Garden and Suzhou Museum form a convenient Gusu pairing; Pingjiang Road is a historic canal-side street; Tiger Hill Scenic Area is known for the leaning Yunyan Pagoda and historical landscape; Shantang Street is best treated as a waterside evening walk. The Classical Gardens of Suzhou are UNESCO-listed.
Huqiu District / Suzhou New District examples: Dayangshan National Forest Park, Baimajian Longchi Scenic Area and Suzhou Taihu National Wetland Park. Confirm current access, booking and opening information with each official venue.
Food baseline: Suzhou-style noodles, squirrel-shaped mandarin fish, braised gluten, seasonal pastries and Biluochun tea are common cultural references; restaurant status and prices are time-sensitive.
Transport baseline: the historic core is best explored by metro plus walking; avoid promising exact journey times without live traffic data.`
  }

  return `[DOCUMENTED 苏州城市导览基础资料——所有时效信息须另行核验]
名词辨析：“虎丘区”通常指行政区苏州高新区；著名的“虎丘山风景名胜区”位于姑苏区，两者不可混为一谈。
首次到访线索：拙政园与苏州博物馆适合连游；平江路适合观察河街并行的古城肌理；虎丘山景区以云岩寺塔与历史景观见长；山塘街适合傍晚沿水漫步。苏州古典园林列入联合国教科文组织世界遗产。
虎丘区／苏州高新区可参考：大阳山国家森林公园、白马涧龙池景区、苏州太湖国家湿地公园。开放、预约与交通信息须以各场所官方最新发布为准。
饮食线索：苏式汤面、松鼠鳜鱼、四喜烤麸、时令糕团与碧螺春可作为文化介绍；具体餐厅状态和价格属于时效信息。
交通线索：古城核心区更适合地铁结合步行；没有实时交通数据时，不承诺精确车程。`
}

function firstVisitReply(language: 'zh' | 'en') {
  if (language === 'en') {
    return `For a first visit, start with Suzhou's four clearest layers: garden, museum, canal street and historic landmark.

1. **Humble Administrator's Garden + Suzhou Museum** — an efficient pairing for classical garden design and the city's artistic context; reserve roughly half a day.
2. **Pingjiang Road** — a slower canal-side walk that reveals the old city's everyday texture; allow 1–2 hours.
3. **Tiger Hill Scenic Area** — worthwhile for history, landscape and Yunyan Pagoda; allow about 2 hours.
4. **Shantang Street** — best as an early-evening waterside walk after the daytime sights.

If you only have one day, choose the first two in the morning, Pingjiang Road in the afternoon and Shantang Street at dusk. Check current booking and opening information with the official venues.`
  }

  return `第一次到苏州，建议先抓住“园林、博物馆、河街、古迹”四条线：

1. **拙政园＋苏州博物馆**：园林空间与城市艺术史可以连起来看，建议预留半天。
2. **平江路**：沿河慢走，更容易感受古城“河街并行”的日常肌理，约 1–2 小时。
3. **虎丘山风景名胜区**：适合看历史景观与云岩寺塔，约 2 小时。
4. **山塘街**：更适合傍晚到夜间沿水散步，作为一天的收尾。

如果只有一天，可以上午安排拙政园与苏州博物馆，下午走平江路，傍晚再去山塘街。预约和开放信息请以各场所官方最新发布为准。`
}

export function buildLocalSuzhouReply(
  question: string,
  analysis: GuideIntentAnalysis,
  language: 'zh' | 'en',
): string | null {
  if (analysis.huqiuAmbiguous) {
    return language === 'en'
      ? `“Huqiu District” and “Tiger Hill Scenic Area” refer to different places:

1. **Huqiu District / Suzhou New District** — consider Dayangshan National Forest Park, Baimajian Longchi Scenic Area and Suzhou Taihu National Wetland Park.
2. **Tiger Hill Scenic Area** — the famous historic attraction with Yunyan Pagoda is in Gusu District, not Huqiu District.

Which one did you mean? I can then narrow the route to three suitable stops. Please verify current opening and booking details with official sources.`
      : `“虎丘区”和“虎丘山景区”是两个不同范围：

1. **虎丘区／苏州高新区**：可以关注大阳山国家森林公园、白马涧龙池景区和苏州太湖国家湿地公园。
2. **虎丘山风景名胜区**：以云岩寺塔等历史景观闻名，但景区位于姑苏区，并不属于虎丘区。

你想问的是哪一个范围？确认后我可以再收窄成三处更合适的路线。开放与预约信息请以官方最新发布为准。`
  }

  if (analysis.intent === 'suzhou_travel') {
    if (analysis.firstVisit || /推荐|哪些|去哪|where|recommend|what should/i.test(question)) {
      return firstVisitReply(language)
    }
    if (/虎丘(?!区)|Tiger Hill/i.test(question)) {
      return language === 'en'
        ? `Yes—Tiger Hill is especially worthwhile if you enjoy layered history and landscape rather than only photogenic streets. Allow about two hours for the Yunyan Pagoda sightline, Sword Pond and the approach through the historic grounds. It is in Gusu District; check the scenic area's current booking and opening notice before departure.`
        : `值得，尤其适合喜欢历史与园林式山水的人。建议预留约 2 小时，把云岩寺塔、剑池和沿途历史景观连起来看。虎丘山景区位于姑苏区；出发前请核对景区最新预约与开放信息。`
    }
    return firstVisitReply(language)
  }

  if (analysis.intent === 'suzhou_food') {
    return language === 'en'
      ? `For a first taste of Suzhou, try a bowl of Suzhou-style noodles, one classic Suzhou dish such as squirrel-shaped mandarin fish, a seasonal pastry, and Biluochun tea. Choose dishes by season and party size; restaurant availability and prices should be checked on the day.`
      : `第一次体验苏州饮食，可以从一碗苏式汤面、一份松鼠鳜鱼等苏帮菜、一款时令糕团和碧螺春开始。苏州饮食很看季节，也要结合人数点菜；具体餐厅营业与价格请当天核对。`
  }

  if (analysis.intent === 'suzhou_transport') {
    return language === 'en'
      ? `Within the historic centre, metro plus walking is usually the clearest approach. Group nearby sights into one area instead of crossing the city repeatedly, and leave extra time for the garden district's narrow streets. Exact journey times depend on live traffic and should be checked in a current map app.`
      : `苏州古城内更适合“地铁＋步行”，并把相邻景点按片区组合，避免一天内反复横穿城市。园林周边街巷较窄，建议预留缓冲时间；精确车程请以当天地图与交通信息为准。`
  }

  return null
}
