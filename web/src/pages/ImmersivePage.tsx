import { ExplorationTask } from '../components/ExplorationTask'
import type { Exploration } from '../lib/journey'
import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useSearchParams } from 'react-router-dom'
import { LobbyConciergeScene, type LobbyHotspotId } from '../components/LobbyConciergeScene'
import { useLanguage, type Language } from '../lib/i18n'

type Detail = {
  title: string
  eyebrow: string
  body: string
  tags: string[]
  observe: string
  stay: string
}

const DETAIL_COPY: Record<Language, Record<LobbyHotspotId, Detail>> = {
  zh: {
    artwork: {
      title: '观绣：花韵与丝线层次',
      eyebrow: '01 · 观绣',
      body: '从浅紫绣面上的粉白花卉出发，先看完整构图，再在独立细节窗中比较花瓣晕色、明暗、花蕊与背景线向。',
      tags: ['花卉苏绣', '色阶层次', '局部观察'],
      observe: '选择四个观察点，或点击全图移动观察框；独立细节窗展示同一原图的对应范围。',
      stay: '把感兴趣的点位带入婉娘导览继续提问，或在“我的行程”中记录工坊体验意向。',
    },
    silk: {
      title: '识线：从蚕茧、劈丝到丝光',
      eyebrow: '02 · 识线',
      body: '从蚕茧到丝光，观察材料、色样与相对细度如何影响绣面的视觉表现。',
      tags: ['材料序列', '相对细度', '策展取色'],
      observe: '从上方切换蚕茧、劈丝、取色与丝光。劈丝可与整股基准比较，取色可预览线束颜色，丝光可从线向、色阶和前后层次观察花瓣的体积感。',
      stay: '选中的色样可作为入门练习的配色参考；也可以继续了解配线与起针的过程。',
    },
    workbench: {
      title: '试针：传统绣台与第一针',
      eyebrow: '03 · 试针',
      body: '循着上绷、配线、起针与留存四步，认识一枚练习样片的制作过程。',
      tags: ['传统绣绷', '四步工序', '入门体验'],
      observe: '按次序查看四个流程节点，留意绷面张力、丝线方向与落针节奏如何共同影响成绣效果。',
      stay: '用 90 分钟探索上绷、配线、起针与回看，把观察到的细节连接到基础练习。',
    },
  },
  en: {
    artwork: {
      title: 'Observe: Floral rhythms and thread layers',
      eyebrow: '01 · OBSERVE',
      body: 'Begin with pink and white flowers on violet embroidery. See the full composition, then compare petal gradients, light, stamens and background threads in a separate detail view.',
      tags: ['Floral embroidery', 'Tonal layers', 'Detail study'],
      observe: 'Choose one of four details or click the overview to move the frame. The independent detail view shows the matching area of the same photograph.',
      stay: 'Continue the selected topic with Wanniang or save an atelier preference in My Stay.',
    },
    silk: {
      title: 'Thread: From Cocoon and Splitting to Lustre',
      eyebrow: '02 · THREAD',
      body: 'From cocoon to lustre, explore how materials, colour and relative thread fineness shape the embroidered surface.',
      tags: ['Material sequence', 'Relative fineness', 'Curated palette'],
      observe: 'Use the navigation above to explore Cocoon, Splitting, Palette and Lustre. Compare fineness with a full-strand baseline, preview a colour, then explore thread direction, tonal transitions and overlapping petals to understand visual volume.',
      stay: 'A selected palette can inform an introductory practice piece; continue with thread selection and the first-stitch process.',
    },
    workbench: {
      title: 'Stitch: The Workbench and a First Stitch',
      eyebrow: '03 · STITCH',
      body: 'Follow mounting, thread selection, the first stitch and keeping a practice sample.',
      tags: ['Embroidery frame', 'Four-step flow', 'Introductory session'],
      observe: 'Move through the four steps and notice how surface tension, thread direction and stitch rhythm shape the result together.',
      stay: 'Spend 90 minutes exploring mounting, thread selection, the first stitch and review, connecting observation with introductory practice.',
    },
  },
}

const PAGE_COPY = {
  zh: {
    eyebrow: '锦江苏州 · 苏绣艺境',
    title: '苏绣艺境',
    lead: '看一幅花卉绣品，识一缕丝线，了解第一针。选择感兴趣的一章，慢慢探索。',
    selected: '当前展签',
    close: '收起展签',
    open: '展开展签',
    observe: '如何观看',
    stay: '住中延伸',
  },
  en: {
    eyebrow: 'JINJIANG SUZHOU · HERITAGE ATELIER',
    title: 'The Su Embroidery Atelier',
    lead: 'A closer look, a silk thread, a first stitch. Choose a chapter and explore at your own pace.',
    selected: 'Current label',
    close: 'Close label',
    open: 'Open label',
    observe: 'How to look',
    stay: 'Extend the stay',
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
  const [detailsOpen, setDetailsOpen] = useState(false)
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

        <div className="immersive-label-container">
          <button className="immersive-label-trigger" type="button" aria-expanded={detailsOpen} aria-controls="exhibit-label" onClick={() => setDetailsOpen(value => !value)}>
            <span>{detail.eyebrow}</span>
            <strong>{detailsOpen ? copy.close : copy.open}</strong>
          </button>
          <aside id="exhibit-label" className="immersive-label" hidden={!detailsOpen} aria-live="polite">
            <div className="immersive-label-heading"><small>{copy.selected}</small></div>
            <h2>{detail.title}</h2>
            <p className="immersive-label-body">{detail.body}</p>
            {active === 'artwork' && <>
              <p className="immersive-label-tags">{detail.tags.join(' · ')}</p>
              <div className="immersive-label-note"><span>{copy.observe}</span><p>{detail.observe}</p></div>
              <div className="immersive-label-note"><span>{copy.stay}</span><p>{detail.stay}</p></div>
            </>}
          </aside>
        </div>
      </section>

      <details className="immersive-exploration-disclosure" ref={explorationDisclosureRef}>
        <summary>
          <span>{language === 'zh' ? '个人探索卡' : 'My exploration card'}</span>
          <small>{language === 'zh' ? '展开记录观察、色样与工序理解' : 'Open to record observations, colours and process insights'}</small>
        </summary>
        <ExplorationTask observation={observation} onFocus={(id) => { focusExhibit(id); document.querySelector('.immersive-workspace')?.scrollIntoView({ behavior: 'smooth' }) }} />
      </details>
      <section className="immersive-next-step">
        <div>
          <p className="eyebrow">{language === 'zh' ? '继续探索' : 'KEEP EXPLORING'}</p>
          <h2>{language === 'zh' ? '带着发现，问问婉娘。' : 'Take a question to Wanniang.'}</h2>
          <p>{language === 'zh' ? '从刚才的一处细节，聊聊苏绣与苏州。' : 'Continue the story of a detail you noticed, in Su embroidery or Suzhou.'}</p>
        </div>
        <Link className="btn-primary" to="/guide">{language === 'zh' ? '继续向婉娘提问' : 'Ask Wanniang'}<span aria-hidden="true"> →</span></Link>
      </section>

    </div>
  )
}
