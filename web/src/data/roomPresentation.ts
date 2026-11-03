import type { Language } from '../lib/i18n'
export type RoomId = 'classic' | 'embroidery' | 'suite'
type Copy = Record<Language,string>
export interface RoomImage { id:string; src:string; srcSet:string; width:number; height:number; alt:Copy; caption:Copy }
export interface RoomPresentation {
 id:RoomId; category:'classic'|'theme'; eyebrow:string; title:Copy; lead:Copy; summary:Copy;
 storyTitle:Copy; story:Copy; features:{title:Copy;body:Copy}[]; configurations:Copy[]; images:[RoomImage,RoomImage];
}
const IMAGE_REVISIONS:Record<string,string>={'classic-main':'20261102-v2','classic-detail':'20261102-v2','embroidery-main':'20261102-v2','embroidery-detail':'20261102-v2'}
function image(id:string,alt:Copy,caption:Copy):RoomImage{const revision=IMAGE_REVISIONS[id]||'20261102';return {id,src:`/assets/stays/${revision}/${id}-1440.webp`,srcSet:`/assets/stays/${revision}/${id}-960.webp 960w, /assets/stays/${revision}/${id}-1440.webp 1440w`,width:1440,height:960,alt,caption}}
export const ROOMS:RoomPresentation[]=[
 {
  id:'classic',category:'classic',eyebrow:'01 / JIANGNAN KING',
  title:{zh:'江南雅居大床房',en:'Jiangnan King'},lead:{zh:'留一处安静，给旅途中的自己。',en:'A quiet place to make your own.'},
  summary:{zh:'居中的大床、浅木与米白织物，配上右侧窗边阅读角，让休息回归简洁。',en:'A centred king bed, pale oak and ivory textiles meet a reading nook by the right-hand window.'},
  storyTitle:{zh:'在日常的质感里，慢下来。',en:'Ease into the everyday.'},
  story:{zh:'这间普通客房从江南的清淡色彩中取意。木纹、素净床品和轻柔光线构成安静的底色；窗边阅读角让一本书、一段休息都有自己的位置。文化体验可按兴趣另行选择。',en:'A restrained Jiangnan palette shapes this classic room. Wood grain, plain linen and soft light establish a calm setting, while the window-side reading nook gives a book or a pause its own place. Cultural experiences remain an optional part of your stay.'},
  features:[
   {title:{zh:'窗边阅读角',en:'A reading nook'},body:{zh:'单椅、圆桌与阅读灯，组成一处自在的小空间。',en:'An armchair, round table and lamp create an easy place to pause.'}},
   {title:{zh:'浅木与初白',en:'Light oak & ivory'},body:{zh:'低矮床头、素净墙面与燕麦色织物，留出安静的底色。',en:'A low headboard, plain walls and oatmeal textiles establish a quiet setting.'}},
   {title:{zh:'自由安排停留',en:'A stay at your pace'},body:{zh:'可选纯住宿，也可加入苏绣工坊体验套餐。',en:'Choose room only or add the embroidery workshop package.'}},
  ],
  configurations:[{zh:'大床 · 最多2人',en:'King bed · Up to 2 guests'},{zh:'窗边单椅与阅读灯',en:'Window-side armchair & reading lamp'},{zh:'浅木家具与米白织物',en:'Pale oak & ivory textiles'}],
  images:[image('classic-main',{zh:'江南雅居大床房AI概念图，正面居中大床、浅木床头与右侧阅读角',en:'AI concept of the Jiangnan King: a centred frontal bed, pale-oak headboard and right-side reading nook'},{zh:'空间概念 · 江南雅居',en:'Room concept · Jiangnan King'}),image('classic-detail',{zh:'同一客房右侧阅读角概念细节，米白单椅、浅木圆桌与阅读灯',en:'Concept detail of the same right-side reading nook: ivory chair, pale-oak table and lamp'},{zh:'设计细节 · 窗边阅读角',en:'Design detail · The reading nook'})],
 },
 {
  id:'embroidery',category:'theme',eyebrow:'02 / EMBROIDERY KING',
  title:{zh:'苏绣主题大床房',en:'Embroidery King'},lead:{zh:'让一面绣意，陪伴一夜好眠。',en:'A night in the company of craft.'},
  summary:{zh:'玉兰绣屏与黛青织物，融入现代卧室。看得见的细节，让苏绣从展陈走进停留。',en:'A magnolia silk panel and muted jade textiles bring embroidery into a contemporary bedroom.'},
  storyTitle:{zh:'从一面绣屏，认识丝线的光。',en:'Discover silk in the details.'},
  story:{zh:'空间以暖木和初白为底，将玉兰花枝的绣意留在床头。柔和的黛青织物回应绣面的色泽，窗边坐榻为慢慢欣赏留出片刻。这里的苏绣元素是一种空间设计提案，也是一条继续探索工艺的线索。',en:'Warm wood and ivory frame a magnolia-inspired silk panel above the bed. Muted jade textiles echo its colours, while a window bench offers a moment to look more closely. These embroidery elements are a spatial design concept and an invitation to explore the craft.'},
  features:[
   {title:{zh:'玉兰绣屏',en:'Magnolia silk panel'},body:{zh:'以花枝与留白构成床头视觉，突出细密的丝线质感。',en:'Blossoms and open space form a headboard feature with tactile silk detail.'}},
   {title:{zh:'黛青织物',en:'Muted jade textiles'},body:{zh:'让靠垫与床尾织物轻轻呼应，保持卧室的安静。',en:'Cushions and a bed runner gently connect the palette.'}},
   {title:{zh:'由欣赏到体验',en:'From looking to making'},body:{zh:'可加入工坊套餐，在入住期间继续认识苏绣。',en:'Add the workshop package to continue your discovery during the stay.'}},
  ],
  configurations:[{zh:'大床 · 最多2人',en:'King bed · Up to 2 guests'},{zh:'玉兰绣屏与黛青织物',en:'Magnolia silk panel & jade textiles'},{zh:'窗边坐榻与局部照明',en:'Window bench & considered lighting'}],
  images:[image('embroidery-main',{zh:'苏绣主题大床房AI概念图，左侧斜向大床、玉兰绢屏、黛青织物与右侧坐榻',en:'AI concept of the Embroidery King: diagonal bed on the left, magnolia silk panel, jade textiles and window bench on the right'},{zh:'空间概念 · 苏绣主题大床房',en:'Room concept · Embroidery King'}),image('embroidery-detail',{zh:'同一客房玉兰绣屏、暖木床头与黛青靠垫的概念细节',en:'Concept detail of the same magnolia silk panel, wood headboard and jade cushion'},{zh:'设计细节 · 玉兰与丝光',en:'Design detail · Magnolia & silk'})],
 },
 {
  id:'suite',category:'theme',eyebrow:'03 / EMBROIDERY SUITE',
  title:{zh:'苏绣主题套房',en:'Embroidery Suite'},lead:{zh:'把会客与休息，都留得从容。',en:'Room to gather. Space to unwind.'},
  summary:{zh:'会客区与卧室隔而相连，木格栅、茶席与绣面织物，让停留多一层空间。',en:'A sitting area and bedroom connect through warm-wood lattice, with a tea table and embroidered textiles.'},
  storyTitle:{zh:'一段停留，两种自在。',en:'Two ways to feel at home.'},
  story:{zh:'套房以木格栅梳理会客与休息的层次。沙发、圆茶桌和一处花枝绣意，组成可以交谈、阅读或独坐的角落；卧室延续初白与黛青，让空间彼此呼应。更丰富的空间层次，也让文化体验前后的片刻有了落点。',en:'Wooden lattice gives the sitting area and bedroom their own rhythm. A sofa, round tea table and embroidered cushion form a place for conversation, reading or a quiet pause. Ivory and muted jade continue into the bedroom, connecting the spaces before and after a cultural experience.'},
  features:[
   {title:{zh:'分区会客空间',en:'A distinct sitting area'},body:{zh:'沙发与圆桌独立成景，与卧室保持清楚的空间层次。',en:'A sofa and round table form a distinct setting beside the bedroom.'}},
   {title:{zh:'格栅与通透感',en:'Layered woodwork'},body:{zh:'以暖木框景和格栅，让分区之间仍保留联系。',en:'Warm-wood frames and lattice connect the spaces without closing them off.'}},
   {title:{zh:'绣意落在细处',en:'Craft in the details'},body:{zh:'由床头绣屏到靠垫花枝，让文化元素贯穿停留。',en:'From the silk panel to a floral cushion, craft ties the stay together.'}},
  ],
  configurations:[{zh:'大床 · 最多2人',en:'King bed · Up to 2 guests'},{zh:'分区会客角与圆茶桌',en:'Distinct sitting area & round tea table'},{zh:'木格栅与绣面织物',en:'Wood lattice & embroidered textiles'}],
  images:[image('suite-main',{zh:'苏绣主题套房AI概念图，会客区通过木格栅与大床卧室相连',en:'AI concept of the Embroidery Suite, with a sitting area connected to the king bedroom through wood lattice'},{zh:'空间概念 · 苏绣主题套房',en:'Room concept · Embroidery Suite'}),image('suite-detail',{zh:'同一套房会客区概念细节，绣花靠垫、圆茶桌及后方卧室',en:'Concept detail of the same suite sitting area, with an embroidered cushion, tea table and bedroom beyond'},{zh:'设计细节 · 会客与绣意',en:'Design detail · Sitting with craft'})],
 },
]
export function roomPresentation(id:string|undefined){return ROOMS.find(r=>r.id===id)}
