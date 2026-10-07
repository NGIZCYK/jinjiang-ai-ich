import type { ICHItem } from './guideContract.ts'

export const ICH_ITEMS: ICHItem[] = [
  {
    id: 'gusu-scroll-provenance',
    title: '《姑苏繁华图》底本与数字演绎',
    titleEn: 'Prosperous Suzhou: Source Painting & Digital Interpretation',
    summary: '参照徐扬《姑苏繁华图》公开著录的城市风貌，制作数字纹理演绎。',
    summaryEn: 'A digital texture interpretation referencing published records of Xu Yang’s Prosperous Suzhou.',
    body: '《姑苏繁华图》为清代徐扬绘制的纸本设色长卷，现藏辽宁省博物馆。本项目借其姑苏城市、运河与市井空间作为叙事参考，制作数字纹理演绎，用于观察构图、色阶与丝光表现。页面不是馆藏原作的高清扫描，也不是馆藏苏绣复制品；具体年代、尺寸与馆藏级别应在正式展示时以馆方著录逐条复核。',
    bodyEn: 'Prosperous Suzhou is a Qing-dynasty handscroll by Xu Yang in the collection of Liaoning Provincial Museum. This project references its city, canal and street scenes in a digital texture study. The page is neither a museum scan nor an embroidered reproduction; formal publication should verify dates, dimensions and collection details against the museum record.',
    tags: ['史实', '设色底本', '文博考证', '辽宁省博物馆'],
    sources: ['辽宁省博物馆公开著录（正式发布前补录链接与访问日期）', '课程组数字演绎说明'],
    sourcesEn: ['Liaoning Provincial Museum catalogue entry (URL and access date to be added)', 'Project digital-interpretation note'],
    searchTerms: ['姑苏繁华图', '徐扬', '长卷', '阊门', '数字演绎', '画作', 'scroll', 'prosperous suzhou', 'xu yang', 'changmen', 'digital interpretation'],
  },
  {
    id: 'suxiu-history',
    title: '苏绣历史与姑苏织造',
    titleEn: 'Su Embroidery History & Gusu Textile Culture',
    summary: '苏绣以苏州为中心，长期与江南织造、文人审美相互滋养。',
    summaryEn: 'Suzhou embroidery developed alongside Jiangnan textile culture, painting and everyday aesthetics.',
    body: '苏绣以苏州地区的刺绣传统为核心，常与江南丝织、绘画审美和日常生活联系起来。酒店主题空间以“从城市图景到一针一线”为叙事线索，连接公区展陈、数字导览和入门体验；关于顾绣、吴门画派与苏绣之间的具体影响关系，需在课程报告中给出可核查文献。',
    bodyEn: 'Su embroidery centres on embroidery traditions in the Suzhou region and is often discussed alongside Jiangnan silk, painting and daily life. The hotel concept connects lobby interpretation, a digital guide and an introductory activity. Specific relationships with Gu embroidery or the Wu School require verifiable references.',
    tags: ['史实', '吴门画派', '顾绣渊源', '文人文脉'],
    sources: ['苏州丝绸博物馆文献', '中国刺绣源流考'],
    sourcesEn: ['Suzhou Silk Museum literature', 'Research on the historical development of Chinese embroidery'],
    searchTerms: ['苏绣', '历史', '起源', '姑苏织造', '顾绣', '吴门', '文脉', 'su embroidery', 'history', 'origin', 'gusu textile', 'gu embroidery', 'wu school'],
  },
  {
    id: 'suxiu-xuehuan',
    title: '晚清沈寿与《雪宧绣谱》法度',
    titleEn: 'Shen Shou & the Xuehuan Embroidery Manual',
    summary: '中国首部系统性刺绣理论著作，奠定近代苏绣仿真绣学理基础。',
    summaryEn: 'A key written source for understanding modern embroidery observation, needlework and colour practice.',
    body: '沈寿的刺绣实践与《雪宧绣谱》是理解近代刺绣技法、观察方法和经验整理的重要线索。该书由沈寿口述、张謇整理，涉及用针、用色与作品观察。页面只保留与入门体验相关的概念，不把文献中的复杂技法简化成未经核对的固定数量。',
    bodyEn: 'Shen Shou’s practice and the Xuehuan Embroidery Manual are important references for modern embroidery technique, observation and colour. Dictated by Shen Shou and edited by Zhang Jian, the text is used here only for introductory concepts without reducing complex practice to unverified fixed counts.',
    tags: ['文献', '雪宧绣谱', '沈寿仿真绣', '针法法度'],
    sources: ['沈寿·张謇《雪宧绣谱》', '江苏文史资料'],
    sourcesEn: ['Shen Shou and Zhang Jian, Xuehuan Embroidery Manual', 'Jiangsu historical literature'],
    searchTerms: ['沈寿', '雪宧绣谱', '张謇', '绣谱', '仿真绣', '文献', 'shen shou', 'xuehuan', 'zhang jian', 'manual', 'literature'],
  },
  {
    id: 'suxiu-pisi',
    title: '劈丝：工坊口传经验分级',
    titleEn: 'Silk Splitting: An Illustrative Atelier Scale',
    summary: '绣娘将天然桑蚕丝劈分为细丝，表现水纹、翎毛与晨雾渐变。',
    summaryEn: 'Silk splitting creates finer working threads for delicate outlines, colour transitions and lustre.',
    body: '劈丝是把丝线分成更细丝缕的操作，可服务于更细腻的轮廓、色彩与光泽表达。本原型以整股、1/4、1/16、1/32 建立相对粗细交互，帮助住客理解“更细”意味着什么；这些档位并非统一行业标准，也不对应固定微米数。',
    bodyEn: 'Silk splitting divides thread into finer working strands for delicate outlines, colour and lustre. The prototype uses Full, 1/4, 1/16 and 1/32 as relative visual levels; they are not universal standards or fixed diameter measurements.',
    tags: ['工艺', '传统技法', '经验分级', '天然蚕丝'],
    sources: ['公开刺绣工艺资料（待补录具体书目与页码）', '课程组体验分级说明'],
    sourcesEn: ['Public embroidery references (full bibliography and pages pending)', 'Project note on illustrative levels'],
    searchTerms: ['劈丝', '分丝', '丝线', '蚕丝', '细腻', '粗细', '1/16', '1/32', 'silk splitting', 'split silk', 'thread', 'filament', 'fineness', 'intricate'],
  },
  {
    id: 'suxiu-eight',
    title: '八字要诀：平齐细密和光顺匀',
    titleEn: 'Eight Qualities: Even, Neat, Fine, Dense, Harmonious, Lustrous, Smooth and Uniform',
    summary: '传统上以八个字概括苏绣品相追求。',
    summaryEn: 'Eight qualities commonly used to describe the visual and technical aspirations of Su embroidery.',
    body: '「平、齐、细、密、和、光、顺、匀」强调针脚平整、边缘整齐、用线细密、色彩调和、光泽自然、丝理顺滑、分布均匀。数字导览把八字要诀转化为可检验的客房展陈质检参照。',
    bodyEn: 'The eight qualities describe even stitches, neat edges, fine and dense thread, harmonious colour, natural lustre, smooth direction and uniform distribution. The digital guide uses them as an observation prompt rather than a formal appraisal.',
    tags: ['工艺', '品相标准', '质检清单'],
    sources: ['苏绣工艺典籍与行业通用标准'],
    sourcesEn: ['Su embroidery craft literature and commonly cited quality principles'],
    searchTerms: ['八字', '平齐细密', '和光顺匀', '特点', '品相', '标准', 'quality', 'eight qualities', 'fine', 'dense', 'lustre', 'smooth'],
  },
  {
    id: 'suxiu-needles',
    title: '常见基础针法与质感表达',
    titleEn: 'Foundational Stitches & Surface Expression',
    summary: '平针、套针、打籽、抢针等构成不同浮雕质感。',
    summaryEn: 'Different foundational stitches can create flat areas, gradients and textured accents.',
    body: '不同针法可以形成平整块面、色彩过渡或颗粒质感。课程原型不对具体作品作针法鉴定，只建议在 90 分钟入门体验中选择一种基础针法，让住客完成可回看的练习样片。',
    bodyEn: 'Different stitches can form flat areas, colour transitions or granular texture. The prototype does not authenticate stitches in a specific work; it proposes one foundational stitch for an introductory practice sample.',
    tags: ['工艺', '针法分类', '体验设计'],
    sources: ['《雪宧绣谱》针法解构', '工坊实践规范'],
    sourcesEn: ['Stitch discussion in the Xuehuan Embroidery Manual', 'Atelier practice guidance (to be verified)'],
    searchTerms: ['针法', '平针', '套针', '打籽', '抢针', '起针', '质感', 'stitch', 'needlework', 'first stitch', 'texture', 'technique'],
  },
  {
    id: 'suxiu-double',
    title: '双面绣与异色异样绝艺',
    titleEn: 'Double-Sided Embroidery & Advanced Variations',
    summary: '双面绣正反两面同样光洁，异色异样为苏绣技艺绝顶。',
    summaryEn: 'Double-sided embroidery conceals thread ends across both faces; advanced variations can differ in colour and motif.',
    body: '双面绣要求正反面藏针隐线、平整无痕；高阶“双面三异绣”更可做到两面轮廓异样、色调异彩、针法异趣。作为酒店大堂的文化视觉中心具有极高传播力，但住客体验课定位为基础刺绣，不作双面绣承诺。',
    bodyEn: 'Double-sided embroidery hides thread ends and maintains a clean surface on both sides. Advanced variants may differ in motif, colour and stitch. It can inspire a lobby exhibit, but the guest prototype does not promise double-sided embroidery instruction.',
    tags: ['演绎', '高阶绝艺', '镇店展陈'],
    sources: ['国家级非遗名录苏绣项目申报档案'],
    sourcesEn: ['National intangible-cultural-heritage documentation for Su embroidery'],
    searchTerms: ['双面绣', '三异绣', '异色异样', '正反面', '高阶', 'double-sided', 'double sided', 'three variations', 'advanced'],
  },
  {
    id: 'suxiu-class',
    title: '住客工坊流程（90 分钟方案）',
    titleEn: 'Guest Workshop Flow (90-Minute Prototype)',
    summary: '选样定景 → 劈丝体悟 → 基础起针 → 小品装裱。',
    summaryEn: 'Observe references, compare silk, try a foundational stitch, then review the practice sample.',
    body: '课程组提出的体验原型：1) 图像与文脉赏析；2) 丝线与劈丝示意；3) 基础起针练习；4) 回看、记录与材料养护说明。各环节会依据住客输入的总时长按比例调整。本方案用于验证数字原型，不代表酒店已正式采购或上线。',
    bodyEn: 'The course prototype includes image and cultural interpretation, silk comparison, a foundational stitch exercise, and review with care notes. Timing adapts to the guest’s available duration. It tests the digital journey and is not a confirmed hotel product.',
    tags: ['方案', '酒店体验', '预约服务', '文化微度假'],
    sources: ['锦江非遗文化礼宾客房衍生体验设计方案'],
    sourcesEn: ['Jinjiang heritage-concierge experience prototype brief'],
    searchTerms: ['体验', '工坊', '预约', '报名', '行程', '时长', '90分钟', '安排', '酒店', 'workshop', 'experience', 'book', 'reserve', 'itinerary', 'schedule', 'duration', 'hotel'],
  },
  {
    id: 'tea-pairing',
    title: '茶艺搭配：绣茶雅集双重停留',
    titleEn: 'Tea Pairing as an Optional Experience Concept',
    summary: '以碧螺春清茶延长住客文化停留时长，营造苏式闲适心境。',
    summaryEn: 'A possible tea pairing extends the Jiangnan lifestyle narrative but remains an unvalidated service concept.',
    body: '“绣与茶”可作为苏式生活方式的体验构想，但茶品、服务方式、食品安全与文化阐释均需由酒店和合作方确认。当前页面只把它作为待验证的延伸情景，不承诺具体茶品或经营效果。',
    bodyEn: 'Embroidery and tea can form a Suzhou lifestyle concept, but tea selection, service, food safety and interpretation require hotel and partner confirmation. The page presents it only as an idea to test, not a service promise.',
    tags: ['方案', '文化雅集', '增值体验'],
    sources: ['江南文人雅集生活方式考'],
    sourcesEn: ['Research note on Jiangnan literati gatherings (full citation pending)'],
    searchTerms: ['茶', '碧螺春', '茶席', '雅集', '茶歇', 'tea', 'biluochun', 'tea session', 'pairing'],
  },
]

function normalizeSearchText(value: string) {
  return value.toLowerCase().replace(/[\s\p{P}\p{S}]+/gu, '')
}

export function searchICH(query: string, language: 'zh' | 'en' = 'zh', limit = 3): ICHItem[] {
  const normalizedQuery = normalizeSearchText(query)
  if (!normalizedQuery) return ICH_ITEMS.slice(0, limit)

  const englishTokens = query.toLowerCase().match(/[a-z][a-z-]{2,}/g) ?? []
  const ranked = ICH_ITEMS.map((item, index) => {
    const title = language === 'en' ? item.titleEn ?? item.title : item.title
    const summary = language === 'en' ? item.summaryEn ?? item.summary : item.summary
    const body = language === 'en' ? item.bodyEn ?? item.body : item.body
    const terms = item.searchTerms ?? []
    let score = 0

    for (const term of terms) {
      const normalizedTerm = normalizeSearchText(term)
      if (normalizedTerm && normalizedQuery.includes(normalizedTerm)) score += 8
    }
    for (const tag of item.tags) {
      const normalizedTag = normalizeSearchText(tag)
      if (normalizedTag && normalizedQuery.includes(normalizedTag)) score += 5
    }
    const searchable = `${title} ${summary} ${body}`.toLowerCase()
    for (const token of englishTokens) {
      if (searchable.includes(token)) score += 2
    }
    if (normalizeSearchText(`${title}${summary}`).includes(normalizedQuery)) score += 10
    return { item, score, index }
  })
    .filter((entry) => entry.score >= 4)
    .sort((a, b) => b.score - a.score || a.index - b.index)

  return ranked.slice(0, limit).map((entry) => entry.item)
}
