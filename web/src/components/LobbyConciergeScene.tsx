import type { Exploration } from '../lib/journey'
import { useEffect, useRef, useState } from 'react'
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
    descZh: '数字演绎以平齐线性肌理表现城楼砖石；对应针法需由合作工坊进一步复核。',
    descEn: 'This digital study uses aligned linear texture for the masonry; the stitch attribution still requires practitioner review.',
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
    descZh: '聚焦桥上人物的衣褶、姿态与空间层次；细丝等级用于交互示意，不代表原作实测。',
    descEn: 'Focus on clothing folds, gestures and spatial depth. Thread levels are illustrative, not measurements of an original textile.',
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
    descEn: 'Observe tonal transitions across shops and roofs. This is a digital texture study, not a reproduction of a museum textile.',
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
  leadZh: string
  leadEn: string
}

const SILK_GALLERY_VIEWS: SilkGalleryView[] = [
  {
    id: 'cocoons',
    titleZh: '01 蚕茧与缫丝 · 原料起点',
    titleEn: '01 Cocoon & Reeling · Material Origin',
    navZh: '蚕茧',
    navEn: 'Cocoon',
    image: '/assets/suxiu-silk-03-cocoons.webp',
    leadZh: '以桑蚕茧与绕线器物说明丝线形成的起点；图片用于材料认知，不作为具体产地、年代或工坊来源证明。',
    leadEn: 'Cocoons and reeling tools introduce the material journey. The image supports material learning rather than proving a specific origin, date or atelier.',
  },
  {
    id: 'splitting',
    titleZh: '02 劈丝观察 · 相对细度',
    titleEn: '02 Silk Splitting · Relative Fineness',
    navZh: '劈丝',
    navEn: 'Splitting',
    image: '/assets/suxiu-silk-02-splitting.webp',
    leadZh: '借助针具与丝线近景引出劈丝概念；实际分丝手法、材料结构与用线尺度需结合合作工坊演示确认。',
    leadEn: 'A needle-and-thread close-up introduces silk splitting. Technique, material structure and working scale remain subject to atelier demonstration.',
  },
  {
    id: 'palette',
    titleZh: '03 长卷取色 · 五组策展色样',
    titleEn: '03 Scroll Palette · Five Curated Swatches',
    navZh: '取色',
    navEn: 'Palette',
    image: '/assets/suxiu-silk-01-palette.webp',
    leadZh: '以数字长卷中的水色、荷粉、青黛、暖金与初白组织五组配色，帮助比较冷暖、明度与丝光；它们是本项目的策展色样，不是传统标准色谱。',
    leadEn: 'Five project swatches drawn from the digital scroll compare temperature, value and sheen. They are a curatorial palette, not a traditional colour standard.',
  },
  {
    id: 'lustre',
    titleZh: '04 成绣丝光 · 顺逆观察',
    titleEn: '04 Finished Silk · Directional Lustre',
    navZh: '丝光',
    navEn: 'Lustre',
    image: '/assets/suxiu-silk-04-lustre.webp',
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
    descZh: '本档仅作分级概念演示，不表示统一标准或对某件作品的测量结论。',
    descEn: 'Conceptual scale only; it is neither a universal standard nor a measurement of a specific work.',
  },
]

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
    leadZh: '以练习样片回看用色和针路；装裱与带走形式仍待合作确认。',
    leadEn: 'Review colour and stitch direction in a practice sample. Mounting and takeaway format remain unconfirmed.',
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
          <div className="grid gap-5 lg:grid-cols-12">
            {/* 左侧：材料观察画廊 */}
            <div className="space-y-3 lg:col-span-7">
              {/* 16:9 主画幅材料观察视窗 */}
              <div className="relative overflow-hidden rounded-lg bg-stone-900">
                <img
                  key={SILK_GALLERY_VIEWS[silkViewIndex].image}
                  src={SILK_GALLERY_VIEWS[silkViewIndex].image}
                  alt={isZh ? SILK_GALLERY_VIEWS[silkViewIndex].titleZh : SILK_GALLERY_VIEWS[silkViewIndex].titleEn}
                  className="block aspect-[16/9] w-full object-cover transition-opacity duration-300"
                />

              </div>

              <div className="atelier-figure-caption">
                <p>{isZh ? SILK_GALLERY_VIEWS[silkViewIndex].leadZh : SILK_GALLERY_VIEWS[silkViewIndex].leadEn}</p>
              </div>

              {/* 单一材料导航：不再与图上箭头或计数器重复。 */}
              <nav className="atelier-subtabs" aria-label={isZh ? '材料观察' : 'Material views'}>
                {SILK_GALLERY_VIEWS.map((view, idx) => {
                  const isCurrent = silkViewIndex === idx
                  return (
                    <button
                      key={view.id}
                      type="button"
                      onClick={() => setSilkViewIndex(idx)}
                      aria-pressed={isCurrent}
                      className={isCurrent ? 'is-active' : ''}
                    >
                      {isZh ? view.navZh : view.navEn}
                    </button>
                  )
                })}
              </nav>

            </div>

            {/* 右侧：一个连续观察区，不再叠加实验台卡片。 */}
            <div className="atelier-study-panel lg:col-span-5">
              <div>
                <h3>{isZh ? '色样与丝线' : 'Colour & thread'}</h3>
                <p>{isZh ? '选色，再比较丝线的相对细度。五组为项目策展配色。' : 'Select a swatch, then compare relative fineness. These five colours are curated for this project.'}</p>
              </div>

              {/* 紧凑色样选择器：不再作为独立大板块 */}
              <div>
                <h4>{isZh ? '取色' : 'Palette'}</h4>
                <div className="mt-2 grid grid-cols-5 gap-2">
                  {SILK_PALETTES.map((palette) => {
                    const isSelected = selectedPalette.id === palette.id
                    return (
                      <button
                        key={palette.id}
                        type="button"
                        onClick={() => { setSelectedPalette(palette); onExplore?.({palette: ({pink:'rose',slate:'indigo',white:'ivory'} as Record<string,string>)[palette.id] || palette.id}) }}
                        aria-pressed={isSelected}
                        aria-label={isZh ? `选择${palette.nameZh}` : `Select ${palette.nameEn}`}
                        title={isZh ? palette.nameZh : palette.nameEn}
                        className={`min-h-11 rounded-md border p-1.5 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-jade/50 ${
                          isSelected
                            ? 'border-jade bg-jade/[0.04]'
                            : 'border-stone-200 bg-white hover:border-stone-400'
                        }`}
                      >
                        <span
                          className="block h-7 rounded-md border border-black/5 shadow-inner"
                          style={{ background: `linear-gradient(135deg, ${palette.lightHex}, ${palette.hex})` }}
                        />
                      </button>
                    )
                  })}
                </div>
                <p className="mt-2 text-xs leading-5 text-stone-600">
                  <strong className="font-medium text-stone-800">{isZh ? selectedPalette.nameZh : selectedPalette.nameEn}</strong>
                  {' · '}{isZh ? selectedPalette.usageZh : selectedPalette.usageEn}
                </p>
              </div>

              {/* 四档比较保留选择能力，只用一组轻量行。 */}
              <div className="atelier-fineness">
                <h4>{isZh ? '相对细度' : 'Relative fineness'}</h4>

                <div className="space-y-1.5">
                  {SPLIT_LEVELS.map((level, idx) => {
                    const isSelected = splitIndex === idx
                    return (
                      <button
                        key={level.id}
                        type="button"
                        onClick={() => { setSplitIndex(idx); onExplore?.({levels: [['full','1/4','1/16','1/32'][idx]]}) }}
                        aria-pressed={isSelected}
                        className={`grid w-full min-h-11 grid-cols-[4.5rem_1fr] items-center gap-3 border-b px-1 py-2 text-left transition ${
                          isSelected
                            ? 'border-jade bg-jade/[0.035]'
                            : 'border-stone-200 hover:bg-stone-50'
                        }`}
                      >
                        <span className={`text-[11px] font-semibold ${isSelected ? 'text-jade' : 'text-stone-500'}`}>
                          {idx === 0 ? (isZh ? '整股' : 'Full') : idx === 1 ? '1/4' : idx === 2 ? '1/16' : '1/32'}
                        </span>
                        <span className="flex h-3 items-center rounded-full bg-white px-1 shadow-inner">
                          <span
                            className="block w-full rounded-full transition-all duration-300"
                            style={{ height: `${level.gauge}px`, backgroundColor: selectedPalette.hex }}
                          />
                        </span>
                      </button>
                    )
                  })}
                </div>

                <p className="mt-3 text-xs leading-5 text-stone-600">
                  {isZh ? SPLIT_LEVELS[splitIndex].descZh : SPLIT_LEVELS[splitIndex].descEn}
                </p>
                <p className="mt-2 text-[11px] leading-4 text-stone-500">
                  {isZh
                    ? '相对细度为概念示意，非统一标准或实测结果。'
                    : 'Conceptual relative levels—not a standard or measured result.'}
                </p>
              </div>

              <details className="atelier-study-details">
                <summary>{isZh ? '材料与丝光说明' : 'Material & lustre notes'}</summary>
                <p>
                  {isZh
                    ? '丝线方向、排列密度和受光角度共同影响表面反射，因此成绣在移动视角下会出现明暗变化。本页图片用于观察这种表面现象，微观机理仍需由专业资料或从业者复核。'
                    : 'Thread direction, coverage and lighting angle work together to shape surface reflection. The image demonstrates this visible effect; microscopic interpretation remains subject to expert review.'}
                </p>
                <p>{isZh ? '五组色样取自项目数字长卷，属于策展配色；图片不证明具体产地、工坊或单丝结构。' : 'The five swatches are curated from the project scroll; the images do not establish a specific origin, atelier or filament structure.'}</p>
              </details>
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
                <summary>{isZh ? '工序说明与原型边界' : 'Process notes & prototype scope'}</summary>
                <p>
                  {isZh
                    ? [
                        '绷架固定底布并调整张力；实际用布与绷架结构由合作工坊确认。',
                        '按画面配色选丝，观察劈丝带来的相对细度变化；具体材质和分丝级别以从业者演示为准。',
                        '观察起针位置、走线方向与丝光变化；具体针法表述需由从业者复核。',
                        '练习样片可作为住中体验的成果构想；装裱与带走形式需合作方确认。',
                      ][currentStepIndex]
                    : [
                        'Secure the ground fabric and adjust its tension. Materials and frame details require atelier confirmation.',
                        'Choose colour and observe relative fineness through silk splitting. Material and split levels require practitioner confirmation.',
                        'Observe the starting point, stitch direction and changing lustre. Technique details require practitioner review.',
                        'A practice sample is a proposed guest takeaway. Mounting and delivery require partner confirmation.',
                      ][currentStepIndex]}
                </p>
                <p>{isZh ? '本页为课程数字原型，不代表已确认的工坊服务。' : 'This course prototype does not represent a confirmed atelier service.'}</p>
              </details>

              <div className="atelier-experience-link">
                <Link to="/my?course=workshop">
                  {isZh ? '记录工坊体验意向' : 'Save atelier interest'} <span aria-hidden="true">→</span>
                </Link>
                <p>{isZh ? '场次、价格与材料待合作确认。' : 'Schedule, price and materials await partner confirmation.'}</p>
              </div>
            </aside>
          </div>
        )}
      </div>
    </div>
  )
}
