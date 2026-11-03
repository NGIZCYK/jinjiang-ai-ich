import type { Exploration } from '../lib/journey'
import { useState, type CSSProperties } from 'react'
import { ArtworkStudy } from './ArtworkStudy'
import { SilkFormStudy, SILK_FORM_IMAGE } from './SilkFormStudy'
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
    { id: 'artwork', index: '01', code: '01 · 观绣', label: '观绣 · 花韵', hint: '从完整花卉绣品到独立细节窗，比较色阶与线向' },
    { id: 'silk', index: '02', code: '02 · 识线', label: '识线 · 丝色百宝阁', hint: '观察材料、策展色样与相对细度' },
    { id: 'workbench', index: '03', code: '03 · 试针', label: '试针 · 传统绣台', hint: '认识上绷、配线、起针与留存四步工序' },
  ],
  en: [
    { id: 'artwork', index: '01', code: '01 · OBSERVE', label: '01 · Observe Masterpiece', hint: 'Compare floral colours and threads in a separate detail view' },
    { id: 'silk', index: '02', code: '02 · THREAD', label: '02 · Thread & Palettes', hint: 'Explore materials, curated colours and relative fineness' },
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
    image: '/assets/silk-cocoons-wood-20261103.webp',
    captionZh: '观察茧体表面细密交叠的纹理，认识丝线的材料起点。',
    captionEn: 'Observe the closely interwoven surface of a cocoon, the material starting point of silk.',
    leadZh: '观察木碗中蚕茧表面细密交叠的纹理，认识丝线从原料到缫丝的材料旅程。图像来自 FAVORRIC 丝绸材料介绍所引用的图库照片，用作材料观察参考。',
    leadEn: 'Observe the closely interwoven cocoon surface in a wooden bowl and explore the material journey from cocoon to silk thread. A stock photograph referenced in FAVORRIC’s introduction to silk provides this material reference.',
  },
  {
    id: 'splitting',
    titleZh: '劈丝 · 相对细度',
    titleEn: 'Splitting · Relative Fineness',
    navZh: '劈丝',
    navEn: 'Splitting',
    image: '/assets/suxiu-silk-splitting-20261029.webp',
    captionZh: '细丝分离概念图；下方线条用于比较相对细度，不代表实测丝径。',
    captionEn: 'Illustrated silk separation. The lines below compare relative fineness, not measured diameters.',
    leadZh: '用细丝分离概念图认识劈丝，再比较线条细度在轮廓与色彩层次中的表现。图像由 AI 生成，不作为真实操作或丝径测量记录。',
    leadEn: 'An AI-generated concept image introduces silk separation. Compare the illustrated line weights below; the image is not a record of an actual operation or diameter measurement.',
  },
  {
    id: 'palette',
    titleZh: '取色 · 五组策展色样',
    titleEn: 'Palette · Five Curated Swatches',
    navZh: '取色',
    navEn: 'Palette',
    image: '/assets/silk-pastel-tray-20261103.webp',
    captionZh: '染色丝线实物参考；搭配右侧五组数字色卡，比较冷暖与明度。',
    captionEn: 'Real dyed silk hanks alongside five digital swatches for comparing colour temperature and value.',
    leadZh: '图像来自 Lansei China 的 Spring 桑蚕丝材料展示，以木托盘上的浅绿、淡粉、淡紫等丝色作配色参考。五组数字色卡用于比较冷暖、明度与丝光，是本项目的策展配色，不是照片逐色采样或传统标准色谱。',
    leadEn: 'A photograph from Lansei China’s Spring mulberry-silk material display provides a reference in pale greens, pinks and violets on a wooden tray. The five digital swatches are project-curated colours, not exact samples of the photograph or a traditional colour standard.',
  },
  {
    id: 'lustre',
    titleZh: '丝光 · 以线塑形',
    titleEn: 'Lustre · Shaping with Thread',
    navZh: '丝光',
    navEn: 'Lustre',
    image: SILK_FORM_IMAGE,
    captionZh: '观察花瓣随形排线、明暗色阶与前后叠压怎样共同呈现立体感。',
    captionEn: 'Observe how thread direction, tonal transitions and overlapping petals work together to suggest volume.',
    leadZh: '图像来自英国皇家刺绣学院的苏绣丝线晕色课程介绍（导师：Joni Zhou）。通过花瓣的线向、色阶和遮挡关系观察视觉体积；旁侧局部窗取自同一图片，只改变观察区域。',
    leadEn: 'Image published by the Royal School of Needlework for its Su embroidery silk-shading course with Joni Zhou. Explore visual volume through petal thread directions, tonal transitions and overlap; the adjacent detail view crops different areas of the same photograph.',
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

function SilkMaterialImage({ view, isZh }: { view: SilkGalleryView; isZh: boolean }) {
  const [failed, setFailed] = useState(false)
  return (
    <div className={`silk-material-image is-${view.id}-photo`}>
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

function SilkThreadPreview({ palette, gauge, label }: {
  palette: typeof SILK_PALETTES[number]
  gauge: number
  label: string
}) {
  const style = {
    '--silk-color': palette.hex,
    '--silk-highlight': palette.lightHex,
    '--silk-gauge': `${gauge}px`,
    '--silk-light-position': '50%',
    '--silk-light-opacity': 0.7,
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

  // 丝线百宝阁状态
  const [silkViewIndex, setSilkViewIndex] = useState(0)
  const [selectedPalette, setSelectedPalette] = useState(SILK_PALETTES[0])
  const [splitIndex, setSplitIndex] = useState(1) // 默认相对 1/4
  const silkView = SILK_GALLERY_VIEWS[silkViewIndex]
  const splitLabel = splitIndex === 0 ? (isZh ? '整股' : 'Full') : ['full', '1/4', '1/16', '1/32'][splitIndex]
  const paletteName = isZh ? selectedPalette.nameZh : selectedPalette.nameEn

  // 绣台工序状态
  const [currentStepIndex, setCurrentStepIndex] = useState(0)

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
        {currentTab === 'artwork' && <ArtworkStudy language={language} focusRequest={focusRequest} onExplore={onExplore} />}

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
                  {silkView.id === 'cocoons' && <p className="silk-photo-credit">{isZh ? '图像参考：' : 'Image reference: '}<a href="https://favorric.com/blogs/column/whatis-silk" target="_blank" rel="noreferrer">FAVORRIC · Adobe Stock</a></p>}
                  {silkView.id === 'palette' && <p className="silk-photo-credit">Lansei China · <a href="https://www.lanseichina.com/products/untwisted-mulberry-silk-threads-spring" target="_blank" rel="noreferrer">{isZh ? '材料图像来源' : 'Material image source'}</a></p>}
                  {silkView.id === 'lustre' && <p className="silk-photo-credit">{isZh ? '英国皇家刺绣学院 · ' : 'Royal School of Needlework · '}<a href="https://rsn.org.uk/products/the-double-sided-art-chinese-silk-shading-in-the-su-embroidery-tradition-with-joni-zhou" target="_blank" rel="noreferrer">{isZh ? '课程图像来源' : 'Course image source'}</a></p>}
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

                {silkView.id === 'lustre' && <SilkFormStudy isZh={isZh} />}

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
