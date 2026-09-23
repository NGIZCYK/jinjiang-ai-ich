import { ExplorationTask } from '../components/ExplorationTask'
import type { Exploration } from '../lib/journey'
import { useEffect, useRef, useState } from 'react'
import { useLocation, useSearchParams } from 'react-router-dom'
import { LobbyConciergeScene, type LobbyHotspotId } from '../components/LobbyConciergeScene'
import { useLanguage, type Language } from '../lib/i18n'

type Detail = {
  title: string
  eyebrow: string
  body: string
  tags: string[]
  observe: string
  stay: string
  source: string
}

const DETAIL_COPY: Record<Language, Record<LobbyHotspotId, Detail>> = {
  zh: {
    artwork: {
      title: '观绣：《姑苏繁华图》数字纹理演绎',
      eyebrow: '01 · OBSERVE',
      body: '本页参照清代画家徐扬《姑苏繁华图》所呈现的城市风貌，以数字纹理重新组织阊门、运河、桥梁与市井人物。它引导住客观察构图、色阶与丝光表现的可能性，并非馆藏画作的苏绣复制品。',
      tags: ['姑苏胜景', '数字纹理', '微距观察'],
      observe: '选择画面中的四个点位，比较水波、人物与商铺的纹理方向和色阶变化；需要时再开启 3x 微距镜。',
      stay: '把感兴趣的点位带入婉娘导览继续提问，或在“我的行程”中记录工坊体验意向。',
      source: '图像参照《姑苏繁华图》公开著录的城市风貌；年代、出处与具体针法说明在正式发布前仍需逐条复核。',
    },
    silk: {
      title: '识线：从蚕茧、劈丝到丝光',
      eyebrow: '02 · THREAD',
      body: '从蚕茧到丝光，观察材料、色样与相对细度如何影响绣面的视觉表现。',
      tags: ['材料序列', '相对细度', '策展取色'],
      observe: '依次查看四项材料观察，再选一组色样，对比整股、1/4、1/16 与 1/32 在固定显示倍率下的视觉变化。',
      stay: '选中的色样可作为入门练习的配色参考；实体材料与教学方式以后续合作工坊方案为准。',
      source: '色样由项目数字图像提取；劈丝层级为概念比较，不代表统一标准或实际线径测量。',
    },
    workbench: {
      title: '试针：传统绣台与第一针',
      eyebrow: '03 · STITCH',
      body: '循着上绷、配线、起针与留存四步，认识一枚练习样片的制作过程。',
      tags: ['传统绣绷', '四步工序', '入门体验'],
      observe: '按次序查看四个流程节点，留意绷面张力、丝线方向与落针节奏如何共同影响成绣效果。',
      stay: '原型建议以 90 分钟完成一枚基础练习样片；师资、材料和成品形式仍需与合作方确认。',
      source: '流程整理自公开工艺资料，作为酒店文化体验课程的信息原型，不等同于完整专业工艺规程。',
    },
  },
  en: {
    artwork: {
      title: 'Observe: A Digital Interpretation of Prosperous Suzhou',
      eyebrow: '01 · OBSERVE',
      body: 'Referencing the cityscape recorded in Xu Yang’s Qing-dynasty scroll Prosperous Suzhou, this digital study reorganises Changmen Gate, canals, bridges and street life through textile-like texture. It is an interpretive learning piece, not an embroidered reproduction of a museum work.',
      tags: ['Suzhou cityscape', 'Digital texture', 'Macro study'],
      observe: 'Select one of four points to compare directional texture and tonal transitions across water, figures and shopfronts. Open the 3x loupe only when needed.',
      stay: 'Continue the selected topic with Wanniang or save an atelier preference in My Stay.',
      source: 'The scene refers to published records of Prosperous Suzhou. Dates, provenance and any stitch attribution require review before public release.',
    },
    silk: {
      title: 'Thread: From Cocoon and Splitting to Lustre',
      eyebrow: '02 · THREAD',
      body: 'From cocoon to lustre, explore how materials, colour and relative thread fineness shape the embroidered surface.',
      tags: ['Material sequence', 'Relative fineness', 'Curated palette'],
      observe: 'Review the four material views, choose a swatch, then compare Full, 1/4, 1/16 and 1/32 at a fixed display scale.',
      stay: 'A selected palette can inform an introductory practice piece; physical materials and teaching depend on a future atelier partner.',
      source: 'Swatches are extracted from project imagery. Splitting levels are conceptual comparisons, not universal standards or measured diameters.',
    },
    workbench: {
      title: 'Stitch: The Workbench and a First Stitch',
      eyebrow: '03 · STITCH',
      body: 'Follow mounting, thread selection, the first stitch and keeping a practice sample.',
      tags: ['Embroidery frame', 'Four-step flow', 'Introductory session'],
      observe: 'Move through the four steps and notice how surface tension, thread direction and stitch rhythm shape the result together.',
      stay: 'The prototype proposes a 90-minute introduction resulting in a small practice sample. Tutor, materials and finish remain to be confirmed.',
      source: 'The flow is organised from public craft references as a hotel-experience information prototype, not a complete professional specification.',
    },
  },
}

const PAGE_COPY = {
  zh: {
    eyebrow: 'JINJIANG SUZHOU · HERITAGE ATELIER',
    title: '苏绣艺境',
    lead: '沿“观绣—识线—试针”进入一门手艺。先沉浸观看，再按需展开解释，让场景保持完整，让知识始终可追溯。',
    selected: '当前展签',
    close: '收起展签',
    open: '展开展签',
    observe: '如何观看',
    stay: '住中延伸',
    source: '内容说明',
    routeEyebrow: 'THE GUEST JOURNEY',
    routeTitle: '从驻足，到理解，再到亲手尝试。',
    route: [
      ['01', '观绣', '选择一个微距点位，记录构图与纹理发现。'],
      ['02', '识线', '比较材料、色样与相对细度，观察丝光变化。'],
      ['03', '试针', '认识上绷与配线，了解基础练习样片的制作。'],
    ],
    technical: '原型与内容边界',
    technicalBody: '页面为课程数字原型。图像用于文化叙事与工艺观察，正式发布前需补充逐条出处、版权授权，并由苏绣从业者复核具体技艺表述。',
  },
  en: {
    eyebrow: 'JINJIANG SUZHOU · HERITAGE ATELIER',
    title: 'The Su Embroidery Atelier',
    lead: 'Move through Observe, Thread and Stitch. The scene leads; interpretation opens only when needed, keeping the experience immersive and its claims reviewable.',
    selected: 'Current label',
    close: 'Close label',
    open: 'Open label',
    observe: 'How to look',
    stay: 'Extend the stay',
    source: 'Content note',
    routeEyebrow: 'THE GUEST JOURNEY',
    routeTitle: 'From pause, to understanding, to making.',
    route: [
      ['01', 'Observe', 'Choose one macro point and record a compositional or textural detail.'],
      ['02', 'Thread', 'Compare materials, swatches and relative fineness to observe silk lustre.'],
      ['03', 'Stitch', 'Explore mounting and thread selection, then see how a practice sample is made.'],
    ],
    technical: 'Prototype and content boundaries',
    technicalBody: 'This is a course prototype. Images support cultural storytelling and craft observation. Public release requires itemised sources, image permissions and practitioner review of technical claims.',
  },
} as const

function isHotspotId(value: string | null): value is LobbyHotspotId {
  return value === 'artwork' || value === 'silk' || value === 'workbench'
}

export function ImmersivePage() {
  const { language } = useLanguage()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const explorationDisclosureRef = useRef<HTMLDetailsElement>(null)
  const [active, setActive] = useState<LobbyHotspotId>('artwork')
  const [focusRequest, setFocusRequest] = useState(0)
  const [observation, setObservation] = useState<Partial<Exploration>>()
  const [detailsOpen, setDetailsOpen] = useState(true)
  const copy = PAGE_COPY[language]
  const detail = DETAIL_COPY[language][active]
  const requestedFocus = searchParams.get('focus')

  useEffect(() => {
    if (!isHotspotId(requestedFocus)) return
    setActive(requestedFocus)
    setFocusRequest((request) => request + 1)
  }, [requestedFocus])

  useEffect(() => {
    if (location.hash !== '#exploration-task') return
    if (explorationDisclosureRef.current) explorationDisclosureRef.current.open = true
    requestAnimationFrame(() => document.getElementById('exploration-task')?.scrollIntoView())
  }, [location.hash])

  const focusExhibit = (id: LobbyHotspotId) => {
    setActive(id)
    setDetailsOpen(true)
    setFocusRequest((request) => request + 1)
  }

  return (
    <div className="immersive-page">
      <header className="immersive-page-intro">
        <p className="eyebrow">{copy.eyebrow}</p>
        <div>
          <h1>{copy.title}</h1>
          <p>{copy.lead}</p>
        </div>
      </header>

      <section className={`immersive-workspace ${detailsOpen ? 'has-details' : ''}`}>
        <div className="immersive-scene-frame">
          <LobbyConciergeScene language={language} active={active} focusRequest={focusRequest} onSelect={focusExhibit} onExplore={setObservation} />
        </div>

        {detailsOpen ? (
          <aside className="immersive-label" aria-live="polite">
            <div className="immersive-label-heading">
              <div>
                <span>{detail.eyebrow}</span>
                <small>{copy.selected}</small>
              </div>
              <button type="button" onClick={() => setDetailsOpen(false)}>{copy.close}</button>
            </div>
            <h2>{detail.title}</h2>
            <p className="immersive-label-body">{detail.body}</p>
            {active === 'artwork' && (
              <>
                <p className="immersive-label-tags">{detail.tags.join(' · ')}</p>
                <div className="immersive-label-note">
                  <span>{copy.observe}</span>
                  <p>{detail.observe}</p>
                </div>
                <div className="immersive-label-note">
                  <span>{copy.stay}</span>
                  <p>{detail.stay}</p>
                </div>
              </>
            )}
            <details className="immersive-label-source">
              <summary>{copy.source}</summary>
              <p>{detail.source}</p>
            </details>
          </aside>
        ) : (
          <button className="immersive-label-trigger" type="button" onClick={() => setDetailsOpen(true)}>
            <span>{detail.eyebrow}</span>
            <strong>{copy.open}</strong>
          </button>
        )}
      </section>

      <details className="immersive-exploration-disclosure" ref={explorationDisclosureRef}>
        <summary>
          <span>{language === 'zh' ? '个人探索卡' : 'My exploration card'}</span>
          <small>{language === 'zh' ? '展开记录观察、色样与工序理解' : 'Open to record observations, colours and process insights'}</small>
        </summary>
        <ExplorationTask observation={observation} onFocus={(id) => { focusExhibit(id); document.querySelector('.immersive-workspace')?.scrollIntoView({ behavior: 'smooth' }) }} />
      </details>
      <section className="immersive-journey">
        <header>
          <p className="eyebrow">{copy.routeEyebrow}</p>
          <h2>{copy.routeTitle}</h2>
        </header>
        <div>
          {copy.route.map(([number, title, body]) => (
            <article key={number}>
              <span>{number}</span>
              <h3>{title}</h3>
              <p>{body}</p>
            </article>
          ))}
        </div>
      </section>

      <details className="immersive-boundary-note">
        <summary>{copy.technical}</summary>
        <p>{copy.technicalBody}</p>
      </details>
    </div>
  )
}
