import { type CSSProperties, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { CinematicHero } from '../components/CinematicHero'
import { useLanguage } from '../lib/i18n'
import { useAppStore } from '../lib/store'
import { clearContinuation, readContinuation } from '../lib/journeyFlow'
import { useReducedMotion } from '../hooks/useReducedMotion'

const CHAPTER_MEDIA = [
  { src: '/assets/suxiu-gusu-prosperous.webp', width: 1920, height: 1152, zh: '姑苏水岸与舟船的数字纹理长卷', en: 'A digital-texture scroll of Suzhou waterways and boats' },
  { src: '/assets/suxiu-silk-splitting-20261029.webp', width: 1200, height: 800, zh: '双手劈分细丝的工艺示意', en: 'An illustration of hands splitting fine silk threads' },
  { src: '/assets/suxiu-step-03-stitching.webp', width: 1920, height: 1080, zh: '绷架上持针起绣的工艺示意', en: 'An illustration of a first stitch on an embroidery frame' },
] as const

export function PremiumHomePage() {
  const user = useAppStore((state) => state.user)
  const { language } = useLanguage()
  const [artIndex, setArtIndex] = useState(0)
  const [isArtworkPaused, setIsArtworkPaused] = useState(false)
  const [pausedByUser,setPausedByUser] = useState(false)
  const [continueTo,setContinueTo] = useState(readContinuation)
  const reducedMotion = useReducedMotion()
  const chaptersRef = useRef<HTMLDivElement>(null)
  const chaptersRevealed = useRef(false)

  useEffect(() => {
    const grid = chaptersRef.current
    if (!grid) return
    if (reducedMotion || chaptersRevealed.current) {
      chaptersRevealed.current = true
      grid.removeAttribute('data-reveal')
      return
    }
    if (typeof IntersectionObserver === 'undefined') return
    let observer: IntersectionObserver | undefined
    try {
      observer = new IntersectionObserver((entries) => {
        if (!entries.some(entry => entry.isIntersecting)) return
        observer?.disconnect()
        if (chaptersRevealed.current) return
        chaptersRevealed.current = true
        grid.dataset.reveal = 'visible'
      }, { threshold: 0 })
      grid.dataset.reveal = 'pending'
      observer.observe(grid)
    } catch {
      grid.removeAttribute('data-reveal')
    }
    return () => observer?.disconnect()
  }, [reducedMotion])

  const copy = language === 'zh'
    ? {
        title: '住进苏州，也住进一门手艺。',
        lead: '循一根丝线，认识苏绣的细腻。让婉娘陪你从静静欣赏，走向亲手尝试。',
        meet: '咨询婉娘',
        explore: '开始探索',
        journeyEyebrow: '住中三章',
        journeyTitle: '一段住中旅程，三次与苏绣相遇。',
        journeyLead: '从一幅绣意、一缕丝光到第一针，按自己的节奏慢慢认识。',
        chapters: [
          ['01', '大堂 · 观绣', '循长卷与微距，发现姑苏的绣意。', '/immersive?focus=artwork'],
          ['02', '客房 · 识线', '看丝线的色阶与光泽，认识劈丝。', '/immersive?focus=silk'],
          ['03', '工坊 · 试针', '沿上绷、配线与起针，尝试第一针。', '/immersive?focus=workbench'],
        ],
        discover: '展开这一章',
        roomEyebrow: '苏绣主题客房',
        roomTitle: '让一段手艺，融入停留的片刻。',
        roomBody: '初白、黛青与暖木，衬出绢屏和织物上的细节。停下来，翻一页双语导览，在休息的片刻继续认识苏绣。',
        roomPoints: ['一处苏绣主题陈设', '一份双语房内导览', '一次工坊体验意向'],
        roomCta: '查看我的行程',
        conciergeEyebrow: '你的文化礼宾',
        conciergeTitle: '有问题，问婉娘。',
        conciergeBody: '问苏绣，也问苏州。告诉婉娘你的兴趣与可用时间，找到适合这段停留的体验。',
        conciergeCta: '开始交谈',
        collectionEyebrow: '江南花鸟集',
        collectionTitle: '花鸟之间，看见江南。',
        collectionLead: '以花鸟、瑞禽与江南意象构成大堂轮换展陈，在色彩、纹理与构图中感受苏绣之美。',
        previous: '上一幅展陈图',
        next: '下一幅展陈图',
        pause: '将鼠标停留在作品上可暂停轮换',
      }
    : {
        title: 'Stay in Suzhou. Enter a living craft.',
        lead: 'Discover the quiet detail of Su embroidery. Let Wanniang guide you from a closer look to a first stitch.',
        meet: 'Meet Wanniang',
        explore: 'Enter the embroidery atelier',
        journeyEyebrow: 'A CURATED STAY',
        journeyTitle: 'One stay, three encounters with Su embroidery.',
        journeyLead: 'Heritage is not treated as a detached display. It enters the natural rhythm of arrival, pause and participation.',
        chapters: [
          ['01', 'Lobby · Observe', 'Explore Suzhou through a scroll and its details.', '/immersive?focus=artwork'],
          ['02', 'Room · Read the thread', 'Discover silk splitting, colour and lustre.', '/immersive?focus=silk'],
          ['03', 'Atelier · Take a stitch', 'Follow mounting, threading and your first stitch.', '/immersive?focus=workbench'],
        ],
        discover: 'Explore this chapter',
        roomEyebrow: 'THE HERITAGE ROOM',
        roomTitle: 'A quiet moment with a living craft.',
        roomBody: 'Ivory, muted jade and warm wood frame an embroidered screen and tactile textiles. Pause with the bilingual guide and discover another detail of Su embroidery.',
        roomPoints: ['One curated embroidery setting', 'A bilingual in-room guide', 'One atelier preference'],
        roomCta: 'View my stay',
        conciergeEyebrow: 'CULTURAL CONCIERGE',
        conciergeTitle: 'Ask Wanniang.',
        conciergeBody: 'Ask about Su embroidery or Suzhou. Share your interests and available time, and find an experience that suits your stay.',
        conciergeCta: 'Begin a conversation',
        collectionEyebrow: 'LOBBY COLLECTION',
        collectionTitle: 'Jiangnan, in birds and blossoms.',
        collectionLead: 'Flora, birds and Jiangnan motifs form a rotating lobby collection, exploring the colour, texture and composition of Su embroidery.',
        previous: 'Previous artwork',
        next: 'Next artwork',
        pause: 'Hover over the artwork to pause the rotation',
      }

  const artworks = language === 'zh'
    ? [
        { src: '/assets/suxiu-cats-lobby-art.webp', index: '01', title: '花下双猫', note: '苏绣风格数字创作', alt: '苏绣风格双猫与牡丹数字展陈画' },
        { src: '/assets/suxiu-crane-magnolia.webp', index: '02', title: '鹤与玉兰', note: '苏绣风格数字创作', alt: '苏绣风格白鹤与玉兰数字展陈画' },
        { src: '/assets/suxiu-koi-lotus.webp', index: '03', title: '莲池双鲤', note: '苏绣风格数字创作', alt: '苏绣风格双鲤与荷叶数字展陈画' },
        { src: '/assets/suxiu-ducks-crabapple.webp', index: '04', title: '海棠鸳鸯', note: '苏绣风格数字创作', alt: '苏绣风格鸳鸯与海棠数字展陈画' },
        { src: '/assets/suxiu-kingfisher-wisteria.webp', index: '05', title: '紫藤翠鸟', note: '苏绣风格数字创作', alt: '苏绣风格翠鸟、紫藤与荷叶数字展陈画' },
      ]
    : [
        { src: '/assets/suxiu-cats-lobby-art.webp', index: '01', title: 'Cats beneath Peonies', note: 'Original digital study', alt: 'Su embroidery-inspired artwork of two cats and peonies' },
        { src: '/assets/suxiu-crane-magnolia.webp', index: '02', title: 'Crane & Magnolia', note: 'Original digital study', alt: 'Su embroidery-inspired artwork of a white crane and magnolia' },
        { src: '/assets/suxiu-koi-lotus.webp', index: '03', title: 'Koi beneath Lotus', note: 'Original digital study', alt: 'Su embroidery-inspired artwork of koi and lotus' },
        { src: '/assets/suxiu-ducks-crabapple.webp', index: '04', title: 'Mandarin Ducks & Crabapple', note: 'Original digital study', alt: 'Su embroidery-inspired artwork of mandarin ducks beneath crabapple' },
        { src: '/assets/suxiu-kingfisher-wisteria.webp', index: '05', title: 'Kingfisher & Wisteria', note: 'Original digital study', alt: 'Su embroidery-inspired artwork of a kingfisher, wisteria and lotus' },
      ]

  const artwork = artworks[artIndex] ?? artworks[0]

  useEffect(() => {
    if (isArtworkPaused || pausedByUser || reducedMotion) return undefined
    const timer = window.setInterval(() => setArtIndex((current) => (current + 1) % artworks.length), 5600)
    return () => window.clearInterval(timer)
  }, [artworks.length, isArtworkPaused, pausedByUser, reducedMotion])

  function selectArtwork(nextIndex: number) {
    setArtIndex((nextIndex + artworks.length) % artworks.length)
  }

  return (
    <div className="home-page">
      <CinematicHero
        language={language}
        title={copy.title}
        lead={copy.lead}
        primaryLabel={user&&continueTo?(language==='zh'?'继续刚才的操作':'Continue your experience'):copy.meet}
        primaryTo={user&&continueTo?continueTo:'/guide'}
        secondaryLabel={copy.explore}
        secondaryTo="/immersive"
        onDismissContinuation={user&&continueTo?()=>{clearContinuation();setContinueTo(null)}:undefined}
      />

      <section className="home-journey-section" id="stay-chapters" tabIndex={-1}>
        <header className="home-section-intro">
          <p className="eyebrow">{copy.journeyEyebrow}</p>
          <h2>{copy.journeyTitle}</h2>
          <p>{copy.journeyLead}</p>
        </header>
        <div ref={chaptersRef} className="home-journey-grid" onFocusCapture={() => {
          chaptersRevealed.current = true
          chaptersRef.current?.removeAttribute('data-reveal')
        }}>
          {copy.chapters.map(([index, title, body, to], position) => (
            <Link to={to} key={index} className={`home-journey-item ${position === 0 ? 'home-journey-featured' : ''}`}
              style={{ '--chapter-index': position } as CSSProperties}
              aria-labelledby={`home-chapter-title-${index}`} aria-describedby={`home-chapter-description-${index}`}>
              <div className="home-journey-media">
                <img src={CHAPTER_MEDIA[position].src} width={CHAPTER_MEDIA[position].width} height={CHAPTER_MEDIA[position].height}
                  alt={CHAPTER_MEDIA[position][language]} loading="lazy" decoding="async" />
              </div>
              <div className="home-journey-copy">
                <span className="home-chapter-number">{index}</span>
                <h3 id={`home-chapter-title-${index}`}>{title}</h3>
                <p id={`home-chapter-description-${index}`}>{body}</p>
                <strong>{copy.discover}<span aria-hidden="true">↗</span></strong>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="home-room-story">
        <figure className="home-room-image">
          <img src="/assets/hotel-suxiu-theme-room-v1.webp" alt={language === 'zh' ? '融入苏绣绢屏的苏州酒店主题房' : 'Suzhou hotel heritage room with an embroidered silk screen'} width="1672" height="941" loading="lazy" />
          <figcaption>{language === 'zh' ? '主题客房空间概念图' : 'Heritage room · concept interior'}</figcaption>
        </figure>
        <div className="home-room-copy">
          <p className="eyebrow">{copy.roomEyebrow}</p>
          <h2>{copy.roomTitle}</h2>
          <p>{copy.roomBody}</p>
          <ul>{copy.roomPoints.map((point) => <li key={point}>{point}</li>)}</ul>
          <Link to="/my">{copy.roomCta}<span aria-hidden="true">→</span></Link>
        </div>
      </section>

      <section className="home-concierge-invitation">
        <p className="eyebrow">{copy.conciergeEyebrow}</p>
        <div>
          <h2>{copy.conciergeTitle}</h2>
          <p>{copy.conciergeBody}</p>
        </div>
        <Link to={'/guide'}>{copy.conciergeCta}<span aria-hidden="true">→</span></Link>
      </section>

      <section className="home-collection-section">
        <header className="home-collection-header">
          <div>
            <p className="eyebrow">{copy.collectionEyebrow}</p>
            <h2>{copy.collectionTitle}</h2>
          </div>
          <p>{copy.collectionLead}</p>
        </header>

        <div className="home-collection-layout" onMouseEnter={() => setIsArtworkPaused(true)} onMouseLeave={() => setIsArtworkPaused(false)} onFocus={() => setIsArtworkPaused(true)} onBlur={event => {if(!event.currentTarget.contains(event.relatedTarget))setIsArtworkPaused(false)}}>
          <div className="home-collection-art">
            <img key={artwork.src} className="home-artwork-image" src={artwork.src} alt={artwork.alt} width="1080" height="1440" decoding="async" loading="lazy" />
          </div>
          <div className="home-collection-copy" aria-live="polite">
            <span>{copy.collectionEyebrow} · {artwork.index}</span>
            <h3>{artwork.title}</h3>
            <p>{artwork.note}</p>
            <div className="home-collection-controls" aria-label={language === 'zh' ? '首页展陈图选择' : 'Homepage artwork selector'}>
              <button type="button" onClick={() => selectArtwork(artIndex - 1)} aria-label={copy.previous}>←</button>
              <div>
                {artworks.map((item, index) => (
                  <button key={item.src} type="button" className={index === artIndex ? 'is-active' : ''} onClick={() => selectArtwork(index)} aria-current={index === artIndex ? 'true' : undefined} aria-label={`${language === 'zh' ? '查看' : 'View'} ${item.title}`}>{item.index}</button>
                ))}
              </div>
              <button type="button" onClick={() => selectArtwork(artIndex + 1)} aria-label={copy.next}>→</button>
            </div>
            <button type="button" className="journey-text-button" aria-pressed={pausedByUser||reducedMotion} disabled={reducedMotion} onClick={()=>setPausedByUser(value=>!value)}>{reducedMotion?(language==='zh'?'已按系统偏好停止自动轮换':'Auto rotation is off for reduced motion'):pausedByUser?(language==='zh'?'继续自动轮换':'Resume rotation'):(language==='zh'?'暂停自动轮换':'Pause rotation')}</button>
          </div>
        </div>
      </section>
    </div>
  )
}
