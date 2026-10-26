import type { Exploration } from '../lib/journey'
import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import type { Language } from '../lib/i18n'

export type LobbyHotspotId = 'artwork' | 'silk' | 'workbench'

export interface LobbyHotspotMeta {
  id: LobbyHotspotId
  index: string
  code: string
  label: string
  hint: string
}

const hotspotCopy: Record<Language, LobbyHotspotMeta[]> = {
  zh: [
    { id: 'artwork', index: '01', code: '01 · 观绣', label: '观绣 · 《姑苏繁华图》', hint: '移动 3x 数字微距镜探索运河水纹与阊门繁华' },
    { id: 'silk', index: '02', code: '02 · 识线', label: '识线 · 丝色百宝阁', hint: '江南五度色谱与 1/32 极细发丝级劈丝分级' },
    { id: 'workbench', index: '03', code: '03 · 试针', label: '试针 · 传统绣台', hint: '起针四步曲实录与红木双面台屏成器' },
  ],
  en: [
    { id: 'artwork', index: '01', code: '01 · OBSERVE', label: '01 · Observe Masterpiece', hint: 'Explore canal ripples with 3x digital loupe' },
    { id: 'silk', index: '02', code: '02 · THREAD', label: '02 · Thread & Palettes', hint: '5 Jiangnan palettes & 1/32 filament splitting' },
    { id: 'workbench', index: '03', code: '03 · STITCH', label: '03 · Stitch at Workbench', hint: '4-step sequence & rosewood desk screen' },
  ],
}

export function getLobbyHotspots(language: Language): LobbyHotspotMeta[] {
  return hotspotCopy[language]
}

export const LOBBY_HOTSPOTS = getLobbyHotspots('zh')

interface Props {
  language: Language
  active: LobbyHotspotId | null
  focusRequest: number
  onExplore?: (value: Partial<Exploration>) => void
  onSelect: (id: LobbyHotspotId) => void
}

/** 《姑苏繁华图》微距观察点位 */
interface ArtworkSpot {
  id: string
  xPct: number
  yPct: number
  macroImg: string
  labelZh: string
  labelEn: string
  techniqueZh: string
  techniqueEn: string
  descZh: string
  descEn: string
}

const ARTWORK_SPOTS: ArtworkSpot[] = [
  {
    id: 'gate',
    xPct: 34.0,
    yPct: 10.0,
    macroImg: '/assets/suxiu-macro-gate.webp',
    labelZh: '阊门水关 · 巍峨城楼',
    labelEn: 'Changmen Gate & Bastion',
    techniqueZh: '纹理观察 · 青砖垛口',
    techniqueEn: 'Texture Study · Masonry',
    descZh: '比较城楼砖石的平齐线性肌理，观察线向与明暗如何共同塑造建筑轮廓。',
    descEn: 'Compare aligned linear textures in the masonry and how line direction and shade shape the building.',
  },
  {
    id: 'bridge',
    xPct: 68.0,
    yPct: 7.0,
    macroImg: '/assets/suxiu-macro-bridge.webp',
    labelZh: '古石拱桥 · 市井人潮',
    labelEn: 'Stone Arch Bridge Crowd',
    techniqueZh: '人物细节 · 细丝示意',
    techniqueEn: 'Figure Detail · Fine-thread Study',
    descZh: '聚焦桥上人物的衣褶、姿态与空间层次，比较细密线条与色阶变化。',
    descEn: 'Focus on clothing folds, gestures and spatial depth, comparing fine lines and tonal transitions.',
  },
  {
    id: 'boats',
    xPct: 48.0,
    yPct: 52.0,
    macroImg: '/assets/suxiu-macro-boats.webp',
    labelZh: '万商泊舟 · 运河水纹',
    labelEn: 'River Barges & Water Ripples',
    techniqueZh: '水纹方向 · 丝光示意',
    techniqueEn: 'Ripple Direction · Lustre Study',
    descZh: '交互通过方向性纹理模拟丝线受光差异，帮助理解水面层次如何被组织。',
    descEn: 'Directional texture simulates how silk responds to light and helps explain the organisation of water layers.',
  },
  {
    id: 'market',
    xPct: 88.0,
    yPct: 82.0,
    macroImg: '/assets/suxiu-macro-market.webp',
    labelZh: '山塘市街 · 繁华商埠',
    labelEn: 'Shantang Market & Shops',
    techniqueZh: '层次过渡 · 粉墙黛瓦',
    techniqueEn: 'Layered Gradient · Roofscape',
    descZh: '观察商铺、招牌与粉墙黛瓦的色阶关系；本页呈现的是数字纹理练习而非馆藏绣品复制。',
    descEn: 'Observe tonal transitions across shops and roofs, and compare texture direction and spatial layers.',
  },
]

/** 丝线百宝阁材料观察序列 */
export interface SilkGalleryView {
  id: string
  titleZh: string
  titleEn: string
  navZh: string
  navEn: string
  image: string
  captionZh: string
  captionEn: string
  leadZh: string
  leadEn: string
}

const SILK_GALLERY_VIEWS: SilkGalleryView[] = [
  {
    id: 'cocoons',
    titleZh: '蚕茧 · 原料起点',
    titleEn: 'Cocoon · Material Origin',
    navZh: '蚕茧',
    navEn: 'Cocoon',
    image: '/assets/suxiu-silk-03-cocoons.webp',
    captionZh: '观察茧体表面细密交叠的纹理，认识丝线的材料起点。',
    captionEn: 'Observe the closely interwoven surface of a cocoon, the material starting point of silk.',
    leadZh: '观察茧体表面细密交叠的纹理，认识丝线从原料到缫丝的材料旅程。',
    leadEn: 'Observe the closely interwoven cocoon surface and explore the material journey from cocoon to silk thread.',
  },
  {
    id: 'splitting',
    titleZh: '劈丝 · 相对细度',
    titleEn: 'Splitting · Relative Fineness',
    navZh: '劈丝',
    navEn: 'Splitting',
    image: '/assets/suxiu-silk-02-splitting.webp',
    captionZh: '从针线近景认识劈丝概念，再用示意线比较相对细度。',
    captionEn: 'A needle-and-thread close-up introduces splitting; illustrated lines compare relative fineness.',
    leadZh: '从针具与丝线近景认识劈丝，比较不同相对细度在轮廓和色彩层次中的表现。',
    leadEn: 'A needle-and-thread close-up introduces splitting and the role of relative fineness in outlines and colour layers.',
  },
  {
    id: 'palette',
    titleZh: '取色 · 五组策展色样',
    titleEn: 'Palette · Five Curated Swatches',
    navZh: '取色',
    navEn: 'Palette',
    image: '/assets/suxiu-silk-01-palette.webp',
    captionZh: '观察五组丝色的冷暖与明度，选择一种颜色查看线束示意。',
    captionEn: 'Compare the warmth and value of five colours, then choose a swatch to preview a thread bundle.',
    leadZh: '以数字长卷中的水色、荷粉、青黛、暖金与初白组织五组配色，帮助比较冷暖、明度与丝光；它们是本项目的策展色样，不是传统标准色谱。',
    leadEn: 'Five project swatches drawn from the digital scroll compare temperature, value and sheen. They are a curatorial palette, not a traditional colour standard.',
  },
  {
    id: 'lustre',
    titleZh: '丝光 · 受光观察',
    titleEn: 'Lustre · Light & Direction',
    navZh: '丝光',
    navEn: 'Lustre',
    image: '/assets/suxiu-silk-04-lustre.webp',
    captionZh: '留意成绣表面的线向与明暗，再切换示意中的受光方向。',
    captionEn: 'Notice thread direction and tonal changes on the embroidered surface, then explore illustrated lighting directions.',
    leadZh: '通过成绣表面近景观察丝线方向、覆盖密度与受光角度如何共同形成光泽变化；图片不承担单丝截面或微观结构证明。',
    leadEn: 'A finished-surface close-up shows how thread direction, coverage and viewing angle shape lustre; it does not claim to show a filament cross-section.',
  },
]

/** 丝色百宝阁数据（五度色谱映射） */
const SILK_PALETTES = [
  {
    id: 'jade',
    nameZh: '姑苏水碧',
    nameEn: 'Suzhou Water Jade',
    hex: '#2f6f5e',
    lightHex: '#8cb5a9',
    usageZh: '绣运河水波、两岸垂柳与远山水影',
    usageEn: 'Used for canal currents, weeping willows and distant hills',
  },
  {
    id: 'pink',
    nameZh: '漆朱荷粉',
    nameEn: 'Vermilion & Peony Silk',
    hex: '#9e2a2b',
    lightHex: '#e598a6',
    usageZh: '用于观察商肆彩幌、衣饰与印色之间的暖色层次',
    usageEn: 'A warm-tone study for market banners, clothing and seal colours',
  },
  {
    id: 'slate',
    nameZh: '阊门青黛',
    nameEn: 'Changmen Slate & Tile',
    hex: '#475569',
    lightHex: '#94a3b8',
    usageZh: '绣古城青砖、粉墙黛瓦与石拱桥基',
    usageEn: 'Used for rampart masonry, grey roof tiles and stone bridges',
  },
  {
    id: 'gold',
    nameZh: '锦丝流光',
    nameEn: 'Imperial Autumn Gold',
    hex: '#b08968',
    lightHex: '#f0ce8a',
    usageZh: '绣市井烫金招牌、画舫檐角与斜阳暖光',
    usageEn: 'Used for gilt shop signs, boat eaves and sunset reflections',
  },
  {
    id: 'white',
    nameZh: '桑蚕初白',
    nameEn: 'Raw Mulberry Silk',
    hex: '#eae1d1',
    lightHex: '#faf6ee',
    usageZh: '作为浅色基准，用于比较线条与水面高光层次',
    usageEn: 'A pale baseline for comparing thread and water highlights',
  },
]

/** 劈丝粗细级别 */
const SPLIT_LEVELS = [
  {
    id: 'full',
    gauge: 10,
    descZh: '完整丝线的视觉基准。具体结构、用线与材料会因工坊和作品而异。',
    descEn: 'Visual baseline for a full strand. Material and usage vary by atelier and work.',
  },
  {
    id: 'quarter',
    gauge: 6,
    descZh: '用于对比更细线条在水纹与衣褶表达中的视觉可能性。',
    descEn: 'Compares the visual potential of finer lines in ripples and clothing folds.',
  },
  {
    id: 'fine',
    gauge: 3,
    descZh: '极细等级示意，适合讨论羽毛、枝梢与人物细节的表现需求。',
    descEn: 'Fine-level illustration for discussing feathers, branches and figure detail.',
  },
  {
    id: 'micro',
    gauge: 1,
    descZh: '通过固定显示尺度比较这一档与整股的视觉差异。',
    descEn: 'Compare this level with the full strand at the same display scale.',
  },
]

const SILK_LIGHTS = [
  { id: 'left', labelZh: '左侧光', labelEn: 'Left', position: 20, opacity: 0.65,
    noteZh: '高光偏向左侧，比较线束不同位置的明暗。',
    noteEn: 'The highlight moves left; compare light and shade across the bundle.' },
  { id: 'front', labelZh: '正面光', labelEn: 'Front', position: 50, opacity: 0.95,
    noteZh: '高光集中在中部，留意亮部与周围线色的关系。',
    noteEn: 'The highlight sits in the centre; notice its relation to the surrounding colour.' },
  { id: 'right', labelZh: '右侧光', labelEn: 'Right', position: 80, opacity: 0.65,
    noteZh: '高光移向右侧，回看与左侧受光的视觉差异。',
    noteEn: 'The highlight moves right; compare it with light from the left.' },
]

function SilkMaterialImage({ view, isZh }: { view: SilkGalleryView; isZh: boolean }) {
  const [failed, setFailed] = useState(false)
  return (
    <div className="silk-material-image">
      {failed ? (
        <div className="silk-image-fallback" role="status">
          <strong>{isZh ? view.titleZh : view.titleEn}</strong>
          <p>{isZh ? '图片暂时无法加载，可继续切换主题与观察示意。' : 'Image unavailable. You can still change views and explore the illustrations.'}</p>
        </div>
      ) : (
        <img src={view.image} alt={isZh ? view.titleZh : view.titleEn} onError={() => setFailed(true)} />
      )}
    </div>
  )
}

function SilkThreadPreview({ palette, gauge, light, label }: {
  palette: typeof SILK_PALETTES[number]
  gauge: number
  light?: typeof SILK_LIGHTS[number]
  label: string
}) {
  const style = {
    '--silk-color': palette.hex,
    '--silk-highlight': palette.lightHex,
    '--silk-gauge': `${gauge}px`,
    '--silk-light-position': `${light?.position ?? 50}%`,
    '--silk-light-opacity': light?.opacity ?? 0.7,
  } as CSSProperties
  return (
    <div className={`silk-thread-preview ${palette.id === 'white' ? 'is-pale' : ''}`} style={style} role="img" aria-label={label}>
      <div className="silk-thread-bundle" aria-hidden="true">
        {Array.from({ length: 7 }, (_, index) => <span className="silk-thread" key={index} />)}
      </div>
    </div>
  )
}

/** 起针四步工序 */
const WORKBENCH_STEPS = [
  {
    step: '01',
    titleZh: '上绷 · 紧致如鼓',
    titleEn: 'Mounting the Frame',
    image: '/assets/suxiu-step-01-mounting.webp',
    leadZh: '将底布固定在绣绷上，观察绷面张力如何影响后续落针。',
    leadEn: 'Mount the ground fabric on a frame and observe how its tension affects the first stitches.',
  },
  {
    step: '02',
    titleZh: '配线 · 辨色分丝',
    titleEn: 'Splitting Silk Threads',
    image: '/assets/suxiu-step-02-threading.webp',
    leadZh: '从画面取色，比较不同丝线细度对线条与色阶的影响。',
    leadEn: 'Choose colours from the scene and compare how relative thread fineness changes line and tone.',
  },
  {
    step: '03',
    titleZh: '起针 · 水纹顺光',
    titleEn: 'The First Stitch',
    image: '/assets/suxiu-step-03-stitching.webp',
    leadZh: '观察第一针的位置和走线方向，理解丝光如何随视角变化。',
    leadEn: 'Observe the first stitch and its direction, then notice how lustre changes with the viewing angle.',
  },
  {
    step: '04',
    titleZh: '留存 · 练习样片',
    titleEn: 'Keeping a Practice Sample',
    image: '/assets/suxiu-step-04-keepsake.webp',
    leadZh: '回看练习样片的用色、针路与丝光，记录本次探索中最有印象的发现。',
    leadEn: 'Review colour, stitch direction and lustre in a practice sample, and record what stood out.',
  },
]

export function LobbyConciergeScene({ language, active, focusRequest, onSelect, onExplore }: Props) {
  const currentTab = active ?? 'artwork'
  const isZh = language === 'zh'

  // 放大镜物理与几何参数
  const LOUPE_SCALE = 3

  // 模式与放大镜状态（默认关闭，保持视野完整，支持主动/智能唤醒）
  const [loupeActive, setLoupeActive] = useState(false)
  const [isFreeExploring, setIsFreeExploring] = useState(false)
  const [selectedSpot, setSelectedSpot] = useState<ArtworkSpot>(ARTWORK_SPOTS[0])
  const imageContainerRef = useRef<HTMLDivElement | null>(null)
  const loupeRef = useRef<HTMLDivElement | null>(null)
  const loupeBgRef = useRef<HTMLDivElement | null>(null)

  // 丝线百宝阁状态
  const [silkViewIndex, setSilkViewIndex] = useState(0)
  const [selectedPalette, setSelectedPalette] = useState(SILK_PALETTES[0])
  const [splitIndex, setSplitIndex] = useState(1) // 默认相对 1/4
  const [silkLightIndex, setSilkLightIndex] = useState(1)
  const silkView = SILK_GALLERY_VIEWS[silkViewIndex]
  const splitLabel = splitIndex === 0 ? (isZh ? '整股' : 'Full') : ['full', '1/4', '1/16', '1/32'][splitIndex]
  const paletteName = isZh ? selectedPalette.nameZh : selectedPalette.nameEn
  const silkLight = SILK_LIGHTS[silkLightIndex]

  // 绣台工序状态
  const [currentStepIndex, setCurrentStepIndex] = useState(0)

  // 辅助函数：更新放大镜在长卷上的显示（直接更新 DOM 样式，减少 React 重复重排）
  const updateLoupePosition = (xPct: number, yPct: number) => {
    const container = imageContainerRef.current
    if (!container || !loupeRef.current || !loupeBgRef.current) return
    const rect = container.getBoundingClientRect()
    const x = (xPct / 100) * rect.width
    const y = (yPct / 100) * rect.height

    loupeRef.current.style.display = 'block'
    loupeRef.current.style.left = `${x}px`
    loupeRef.current.style.top = `${y}px`
    loupeBgRef.current.style.backgroundSize = `${rect.width * LOUPE_SCALE}px ${rect.height * LOUPE_SCALE}px`
    const loupeRadius = loupeRef.current.offsetWidth / 2 || 96
    loupeBgRef.current.style.backgroundPosition = `${-x * LOUPE_SCALE + loupeRadius}px ${-y * LOUPE_SCALE + loupeRadius}px`
  }

  // 当外部切换到长卷展位时定位默认点位
  useEffect(() => {
    if (active === 'artwork') {
      setSelectedSpot(ARTWORK_SPOTS[0])
      setIsFreeExploring(false)
      if (loupeActive) {
        const timer = setTimeout(() => {
          updateLoupePosition(ARTWORK_SPOTS[0].xPct, ARTWORK_SPOTS[0].yPct)
        }, 60)
        return () => clearTimeout(timer)
      }
    }
  }, [active, focusRequest])

  // 光标/触控移动自由探索 (支持鼠标与移动端 Touch 指尖滑动)
  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!loupeActive) return
    const container = imageContainerRef.current
    if (!container || !loupeRef.current || !loupeBgRef.current) return
    const rect = container.getBoundingClientRect()
    const clientX = e.clientX - rect.left
    const clientY = e.clientY - rect.top
    const x = Math.max(0, Math.min(rect.width, clientX))
    const y = Math.max(0, Math.min(rect.height, clientY))

    loupeRef.current.style.display = 'block'
    loupeRef.current.style.left = `${x}px`
    loupeRef.current.style.top = `${y}px`
    loupeBgRef.current.style.backgroundSize = `${rect.width * LOUPE_SCALE}px ${rect.height * LOUPE_SCALE}px`
    const loupeRadius = loupeRef.current.offsetWidth / 2 || 96
    loupeBgRef.current.style.backgroundPosition = `${-x * LOUPE_SCALE + loupeRadius}px ${-y * LOUPE_SCALE + loupeRadius}px`

    const xPct = (x / rect.width) * 100
    const yPct = (y / rect.height) * 100
    const nearby = ARTWORK_SPOTS.find((s) => Math.hypot(s.xPct - xPct, s.yPct - yPct) < 7)
    if (nearby) {
      setSelectedSpot(nearby)
      setIsFreeExploring(false)
    } else {
      setIsFreeExploring(true)
    }
  }

  const handleMouseEnter = () => {
    if (loupeActive && loupeRef.current) {
      loupeRef.current.style.display = 'block'
    }
  }

  const handleMouseLeave = () => {
    if (loupeRef.current && selectedSpot && loupeActive) {
      updateLoupePosition(selectedSpot.xPct, selectedSpot.yPct)
      setIsFreeExploring(false)
    }
  }

  // 聚焦选中点位：切换点位详情；若当前微距镜已开启，则平滑移动微距镜至该点位；若未开启，保持关闭状态，绝不强制开启
  const focusSpot = (spot: ArtworkSpot) => {
    onExplore?.({motif: spot.id})
    setSelectedSpot(spot)
    setIsFreeExploring(false)
    if (loupeActive) {
      setTimeout(() => {
        updateLoupePosition(spot.xPct, spot.yPct)
      }, 20)
    }
  }

  // 点击/轻触长卷：若未开启微距镜，仅当点击在点位附近时切换点位，不自动开启微距；若已开启微距镜，则移动微距镜
  const handleScrollPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const container = imageContainerRef.current
    if (!container) return
    const rect = container.getBoundingClientRect()
    const clientX = e.clientX - rect.left
    const clientY = e.clientY - rect.top
    const xPct = (clientX / rect.width) * 100
    const yPct = (clientY / rect.height) * 100

    const nearby = ARTWORK_SPOTS.find((s) => Math.hypot(s.xPct - xPct, s.yPct - yPct) < 7)
    if (nearby) {
      setSelectedSpot(nearby)
      setIsFreeExploring(false)
    } else {
      setIsFreeExploring(true)
    }

    if (loupeActive) {
      setTimeout(() => {
        updateLoupePosition(xPct, yPct)
      }, 20)
    }
  }

  return (
    <div className="atelier-shell">
      <header className="atelier-chrome">
        <nav className="atelier-chapter-tabs" aria-label={isZh ? '工坊章节' : 'Atelier chapters'}>
          {getLobbyHotspots(language).map((h) => {
            const isCurrent = currentTab === h.id
            return (
              <button key={h.id} type="button" onClick={() => onSelect(h.id)} aria-pressed={isCurrent} className={isCurrent ? 'is-active' : ''}>
                <span>{h.index}</span>
                <strong>{h.code.replace(`${h.index} · `, '')}</strong>
              </button>
            )
          })}
        </nav>
      </header>

      {/* 展位主体视口 */}
      <div className="atelier-stage-content relative min-h-[460px] p-3 md:min-h-[530px] md:p-5">
        {/* ======================= 展位 1: 观绣 · 《姑苏繁华图》 ======================= */}
        {currentTab === 'artwork' && (
          <div className="space-y-4">
            {/* 顶部长卷模式状态说明条 */}
            <div className="atelier-context-line">
              <div className="flex items-center gap-2">
                <span className="inline-block h-2 w-2 rounded-full bg-jade" />
                <span className="font-medium text-stone-700">
                  {isZh ? '徐扬《姑苏繁华图》· 苏绣数字肌理演绎长卷（设色画底本）' : 'Prosperous Suzhou Silk Interpretation (Xu Yang Painting Reference)'}
                </span>
                <span className="hidden text-stone-400 sm:inline">|</span>
                <span className="hidden text-stone-500 sm:inline">
                  {isZh ? '支持光标与触控在长卷上滑移微距镜，或点击下方点位' : 'Move the cursor or touch the scroll to inspect digital texture'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-stone-500">
                  {isZh ? '当前聚焦：' : 'Focused: '}
                  <strong className="text-stone-800">
                    {isFreeExploring
                      ? isZh
                        ? '自由探索（经纬走线观察）'
                        : 'Free Exploration (Silk Grain)'
                      : isZh
                      ? selectedSpot.labelZh
                      : selectedSpot.labelEn}
                  </strong>
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  const next = !loupeActive
                  setLoupeActive(next)
                  if (next) setTimeout(() => updateLoupePosition(selectedSpot.xPct, selectedSpot.yPct), 20)
                }}
                aria-pressed={loupeActive}
                className="atelier-loupe-toggle"
              >
                {isZh ? (loupeActive ? '收起 3x 微距' : '开启 3x 微距') : (loupeActive ? 'Close 3x loupe' : 'Open 3x loupe')}
              </button>
            </div>

            {/* 主画卷视窗 */}
            <div
              ref={imageContainerRef}
              onPointerDown={handleScrollPointerDown}
              onPointerMove={handlePointerMove}
              onPointerEnter={handleMouseEnter}
              onPointerLeave={handleMouseLeave}
              className={`atelier-scroll-stage group relative overflow-hidden select-none ${
                loupeActive ? 'cursor-crosshair touch-none' : 'cursor-zoom-in'
              }`}
            >
              {/* 底图：高精度苏绣长卷 */}
              <img
                src="/assets/suxiu-gusu-prosperous.webp"
                alt={isZh ? '参照《姑苏繁华图》城市风貌的数字纹理长卷' : 'Digital texture scroll referencing the cityscape of Prosperous Suzhou'}
                className="block aspect-[16/9] w-full object-cover select-none"
                draggable={false}
              />

              {/* 四个高光点位图钉 */}
              {ARTWORK_SPOTS.map((spot, idx) => (
                <button
                  key={spot.id}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    focusSpot(spot)
                  }}
                  style={{ left: `${spot.xPct}%`, top: `${spot.yPct}%` }}
                  className={`atelier-hotspot group/spot pointer-events-auto absolute -translate-x-1/2 -translate-y-1/2 transition-all ${
                    selectedSpot?.id === spot.id ? 'is-active z-10' : 'hover:scale-105 z-0'
                  }`}
                  title={isZh ? spot.labelZh : spot.labelEn}
                  aria-pressed={selectedSpot?.id === spot.id}
                >
                  <span>
                    0{idx + 1}
                  </span>
                  <span className="pointer-events-none absolute bottom-full left-1/2 mb-1.5 hidden -translate-x-1/2 whitespace-nowrap rounded-md bg-stone-900/90 px-2 py-1 text-[10px] text-stone-100 backdrop-blur group-hover/spot:block">
                    {isZh ? spot.labelZh : spot.labelEn}
                  </span>
                </button>
              ))}

              {/* 黄铜手持微距放大镜 (纯原生 DOM 绝对坐标计算，彻底杜绝偏位与空白卡死) */}
              {loupeActive && (
                <div
                  ref={loupeRef}
                  style={{
                    display: 'none',
                    transform: 'translate(-50%, -50%)',
                  }}
                  className="pointer-events-none absolute z-20 h-48 w-48 overflow-hidden rounded-full border-4 border-amber-400 bg-[#f7f2ea] shadow-[0_12px_45px_rgba(0,0,0,0.7)] ring-4 ring-black/40 sm:h-52 sm:w-52 md:h-56 md:w-56"
                >
                  {/* 高清放大材质层 */}
                  <div
                    ref={loupeBgRef}
                    style={{
                      backgroundImage: 'url(/assets/suxiu-gusu-prosperous-hd.webp)',
                      backgroundRepeat: 'no-repeat',
                    }}
                    className="absolute inset-0 h-full w-full"
                  />
                  {/* 微距十字准星与刻度环 */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="h-5 w-5 rounded-full border border-amber-500/70" />
                    <div className="absolute h-full w-px bg-amber-500/25" />
                    <div className="absolute w-full h-px bg-amber-500/25" />
                  </div>
                  {/* 倍率微标 */}
                  <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 rounded-full bg-black/75 px-2 py-0.5 text-[9px] font-semibold tracking-wider text-amber-300 backdrop-blur">
                    3x MACRO
                  </div>
                </div>
              )}
            </div>

            {/* 点位精读与微距丝缕解析卡（清晰直观，一目了然） */}
            <div className="grid gap-4 rounded-xl border border-stone-200 bg-white p-4 shadow-sm md:grid-cols-12">
              {/* 左侧 4 个点位切换器 */}
              <div className="grid grid-cols-2 gap-2 md:col-span-6 lg:grid-cols-4">
                {ARTWORK_SPOTS.map((spot, idx) => (
                  <button
                    key={spot.id}
                    type="button"
                    onClick={() => focusSpot(spot)}
                    className={`rounded-xl p-2.5 text-left transition ${
                      selectedSpot?.id === spot.id
                        ? 'border-2 border-jade bg-jade/[0.05] ring-2 ring-jade/20 shadow-sm'
                        : 'border border-stone-200 hover:border-stone-300 hover:bg-stone-50'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`flex h-4 w-4 items-center justify-center rounded text-[10px] font-bold ${
                          selectedSpot?.id === spot.id ? 'bg-jade text-white' : 'bg-stone-100 text-stone-500'
                        }`}
                      >
                        0{idx + 1}
                      </span>
                      <span className="text-xs font-semibold text-stone-800">
                        {isZh ? spot.labelZh.split(' · ')[0] : spot.labelEn.split(' · ')[0]}
                      </span>
                    </div>
                    <span className="mt-1 block text-[10px] font-medium text-jade">
                      {isZh ? spot.techniqueZh.split(' · ')[0] : spot.techniqueEn.split(' · ')[0]}
                    </span>
                  </button>
                ))}
              </div>

              {/* 右侧当前选中点位的微距实拍特写与技法解析 */}
              <div className="flex flex-col justify-between rounded-xl border border-stone-100 bg-stone-50/80 p-3.5 sm:flex-row sm:items-center sm:gap-4 md:col-span-6">
                <div className="flex items-center gap-3">
                  <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl border-2 border-amber-400 bg-white shadow-md">
                    <img
                      src={selectedSpot.macroImg}
                      alt={selectedSpot.labelZh}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-xs font-bold text-stone-800">
                        {isZh ? selectedSpot.labelZh : selectedSpot.labelEn}
                      </h3>
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-800">
                        {isZh ? selectedSpot.techniqueZh : selectedSpot.techniqueEn}
                      </span>
                    </div>
                    <p className="mt-1 text-[11px] leading-4 text-stone-600">
                      {isZh ? selectedSpot.descZh : selectedSpot.descEn}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => focusSpot(selectedSpot)}
                  className="mt-2.5 shrink-0 rounded-lg bg-jade/10 px-3 py-1.5 text-center text-xs font-semibold text-jade transition hover:bg-jade hover:text-white sm:mt-0"
                >
                  {isZh ? '定位长卷' : 'Focus'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ======================= 展位 2: 识线 · 丝色百宝阁 ======================= */}
        {currentTab === 'silk' && (
          <div className="silk-study">
            <nav className="silk-view-nav" aria-label={isZh ? '材料观察' : 'Material views'}>
              {SILK_GALLERY_VIEWS.map((view, index) => (
                <button key={view.id} type="button" aria-pressed={silkViewIndex === index}
                  aria-controls="silk-current-view" onClick={() => setSilkViewIndex(index)}>
                  {isZh ? view.navZh : view.navEn}
                </button>
              ))}
            </nav>

            <div className="silk-study-layout" id="silk-current-view">
              <figure className="silk-material-figure">
                <SilkMaterialImage key={silkView.id} view={silkView} isZh={isZh} />
                <figcaption className="silk-material-caption">
                  <h3>{isZh ? silkView.titleZh : silkView.titleEn}</h3>
                  <p>{isZh ? silkView.captionZh : silkView.captionEn}</p>
                </figcaption>
              </figure>

              <aside className="silk-observation" aria-label={isZh ? '主题观察区' : 'Topic study'}>
                {silkView.id === 'cocoons' && (
                  <div className="silk-topic-content">
                    <h3>{isZh ? '从一枚蚕茧开始' : 'Begin with a cocoon'}</h3>
                    <p>{isZh ? '丝线的材料旅程由此开始。先驻足看表面，再进入劈丝与用色的观察。' : 'The material journey of silk starts here. Study the surface before exploring finer threads and colour.'}</p>
                    <div className="silk-observation-note">
                      <h4>{isZh ? '看表面' : 'Look at the surface'}</h4>
                      <p>{isZh ? '留意茧体上细密交叠的纹理，以及不同位置的明暗。' : 'Notice the closely interwoven texture and the light and shade across each cocoon.'}</p>
                    </div>
                  </div>
                )}

                {silkView.id === 'splitting' && (
                  <div className="silk-topic-content">
                    <h3>{isZh ? '比较相对细度' : 'Compare relative fineness'}</h3>
                    <p>{isZh ? '选择一个档位，与整股基准上下对照。' : 'Choose a level and compare it with the full-strand baseline.'}</p>
                    <div className="silk-options silk-level-options" role="group" aria-label={isZh ? '相对细度' : 'Relative fineness'}>
                      {SPLIT_LEVELS.map((level, index) => (
                        <button key={level.id} type="button" aria-pressed={splitIndex === index}
                          onClick={() => {
                            setSplitIndex(index)
                            onExplore?.({ levels: [['full', '1/4', '1/16', '1/32'][index]] })
                          }}>
                          {index === 0 ? (isZh ? '整股' : 'Full') : ['full', '1/4', '1/16', '1/32'][index]}
                        </button>
                      ))}
                    </div>
                    <div className={`silk-line-comparison ${selectedPalette.id === 'white' ? 'is-pale' : ''}`}
                      style={{ '--silk-color': selectedPalette.hex } as CSSProperties}
                      role="img" aria-label={isZh ? `${paletteName}，整股基准与${splitLabel}的相对细度示意` : `${paletteName}: full-strand baseline compared with ${splitLabel}, relative fineness illustration`}>
                      <div className="silk-comparison-row">
                        <span>{isZh ? '整股基准' : 'Full baseline'}</span>
                        <div className="silk-line-space"><i className="silk-comparison-line" style={{ height: '10px' }} /></div>
                      </div>
                      <div className="silk-comparison-row">
                        <span>{isZh ? `当前 ${splitLabel}` : `Selected ${splitLabel}`}</span>
                        <div className="silk-line-space"><i className="silk-comparison-line silk-selected-line" style={{ height: `${SPLIT_LEVELS[splitIndex].gauge}px` }} /></div>
                      </div>
                    </div>
                    <div className="silk-selection-copy" aria-live="polite" aria-atomic="true">
                      <h4>{paletteName} · {splitLabel}</h4>
                      <p>{isZh ? SPLIT_LEVELS[splitIndex].descZh : SPLIT_LEVELS[splitIndex].descEn}</p>
                    </div>
                    <p className="silk-concept-label">{isZh ? '比较相对细度与线条表现' : 'Compare relative fineness and line quality'}</p>
                  </div>
                )}

                {silkView.id === 'palette' && (
                  <div className="silk-topic-content">
                    <h3>{isZh ? '选一缕丝色' : 'Choose a thread colour'}</h3>
                    <p>{isZh ? '五组色样，比较冷暖与明度。' : 'Five swatches to compare warmth and value.'}</p>
                    <div className="silk-swatches" role="group" aria-label={isZh ? '策展色样' : 'Curated swatches'}>
                      {SILK_PALETTES.map((palette) => (
                        <button key={palette.id} type="button" aria-pressed={selectedPalette.id === palette.id}
                          aria-label={isZh ? `选择${palette.nameZh}` : `Select ${palette.nameEn}`}
                          title={isZh ? palette.nameZh : palette.nameEn}
                          onClick={() => {
                            setSelectedPalette(palette)
                            onExplore?.({ palette: ({ pink: 'rose', slate: 'indigo', white: 'ivory' } as Record<string, string>)[palette.id] || palette.id })
                          }}>
                          <span style={{ background: `linear-gradient(135deg, ${palette.lightHex}, ${palette.hex})` }} />
                        </button>
                      ))}
                    </div>
                    <SilkThreadPreview palette={selectedPalette} gauge={SPLIT_LEVELS[splitIndex].gauge}
                      label={isZh ? `${paletteName} · ${splitLabel} 丝线示意` : `${paletteName} · ${splitLabel} thread illustration`} />
                    <div className="silk-selection-copy" aria-live="polite" aria-atomic="true">
                      <h4>{paletteName} · {splitLabel}</h4>
                      <p>{isZh ? selectedPalette.usageZh : selectedPalette.usageEn}</p>
                    </div>
                    <p className="silk-concept-label">{isZh ? '观察丝色的冷暖与明度' : 'Explore colour warmth and value'}</p>
                  </div>
                )}

                {silkView.id === 'lustre' && (
                  <div className="silk-topic-content">
                    <h3>{isZh ? '让光移过丝线' : 'Let light cross the threads'}</h3>
                    <p>{isZh ? '切换受光方向，留意示意线束的高光与明暗。' : 'Change the light direction and watch the highlights and shade in the illustrated bundle.'}</p>
                    <div className="silk-options silk-light-options" role="group" aria-label={isZh ? '受光方向' : 'Light direction'}>
                      {SILK_LIGHTS.map((light, index) => (
                        <button key={light.id} type="button" aria-pressed={silkLightIndex === index}
                          onClick={() => setSilkLightIndex(index)}>{isZh ? light.labelZh : light.labelEn}</button>
                      ))}
                    </div>
                    <SilkThreadPreview palette={selectedPalette} gauge={SPLIT_LEVELS[splitIndex].gauge} light={silkLight}
                      label={isZh ? `${paletteName} · ${splitLabel} · ${silkLight.labelZh}受光示意` : `${paletteName} · ${splitLabel} · ${silkLight.labelEn} light illustration`} />
                    <div className="silk-selection-copy" aria-live="polite" aria-atomic="true">
                      <h4>{isZh ? silkLight.labelZh : `${silkLight.labelEn} light`}</h4>
                      <p>{isZh ? silkLight.noteZh : silkLight.noteEn}</p>
                      <p className="silk-current-material">{paletteName} · {splitLabel}</p>
                    </div>
                    <p className="silk-concept-label">{isZh ? '受光概念示意 · 用于观察明暗关系' : 'Conceptual light illustration · For observing light and shade'}</p>
                  </div>
                )}

                <details className="silk-material-details" key={silkView.id}>
                  <summary>{isZh ? '材料与图像说明' : 'Material & image notes'}</summary>
                  <p>{isZh ? silkView.leadZh : silkView.leadEn}</p>
                </details>
              </aside>
            </div>
          </div>
        )}

        {/* ======================= 展位 3: 试针 · 传统绣台与起针工坊 ======================= */}
        {currentTab === 'workbench' && (
          <div className="grid gap-5 lg:grid-cols-12">
            {/* 照片不再承载任何步骤按钮，避免遮挡工艺细节。 */}
            <div className="lg:col-span-7 xl:col-span-8">
              <div className="overflow-hidden rounded-lg bg-stone-900">
                <img
                  key={WORKBENCH_STEPS[currentStepIndex].image}
                  src={WORKBENCH_STEPS[currentStepIndex].image}
                  alt={isZh ? WORKBENCH_STEPS[currentStepIndex].titleZh : WORKBENCH_STEPS[currentStepIndex].titleEn}
                  className="block aspect-[16/9] w-full object-cover transition-opacity duration-300"
                />

              </div>
            </div>

            <aside className="atelier-workbench-panel lg:col-span-5 xl:col-span-4">
              <header className="atelier-workbench-header">
                <h3>{isZh ? '试针四步' : 'Four steps of stitching'}</h3>
              </header>

              <nav className="atelier-step-list" aria-label={isZh ? '切换试针步骤' : 'Choose a stitching step'}>
                {WORKBENCH_STEPS.map((step, idx) => (
                  <button
                    key={step.step}
                    type="button"
                    aria-pressed={currentStepIndex === idx}
                    className={currentStepIndex === idx ? 'is-active' : ''}
                    onClick={() => setCurrentStepIndex(idx)}
                  >
                    <span className="atelier-step-index">{step.step}</span>
                    <span>{isZh ? step.titleZh.split(' · ')[0] : step.titleEn}</span>
                  </button>
                ))}
              </nav>

              <p className="atelier-step-detail">
                {isZh ? WORKBENCH_STEPS[currentStepIndex].leadZh : WORKBENCH_STEPS[currentStepIndex].leadEn}
              </p>

              <details className="atelier-study-details">
                <summary>{isZh ? '工序观察要点' : 'Process observation notes'}</summary>
                <p>
                  {isZh
                    ? [
                        '观察绷架如何固定底布，再留意布面张力与落针区域。',
                        '按画面配色选丝，比较劈丝带来的相对细度变化。',
                        '观察起针位置、走线方向与丝光变化。',
                        '回看练习样片，记录配色、针路和下一步希望练习的细节。',
                      ][currentStepIndex]
                    : [
                        'Observe how the frame holds the ground fabric, its tension and the stitching area.',
                        'Choose a colour and compare relative fineness through silk splitting.',
                        'Observe the starting point, stitch direction and changing lustre.',
                        'Review the practice sample and record its colour, stitch direction and details to explore next.',
                      ][currentStepIndex]}
                </p>
              </details>

              <div className="atelier-experience-link">
                <Link to="/my?course=workshop">
                  {isZh ? '记录工坊体验意向' : 'Save atelier interest'} <span aria-hidden="true">→</span>
                </Link>
              </div>
            </aside>
          </div>
        )}
      </div>
    </div>
  )
}
