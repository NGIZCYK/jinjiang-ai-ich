import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { CinematicHero } from '../components/CinematicHero'
import { useLanguage } from '../lib/i18n'
import { useAppStore } from '../lib/store'

export function PremiumHomePage() {
  const user = useAppStore((state) => state.user)
  const { language } = useLanguage()
  const [artIndex, setArtIndex] = useState(0)
  const [isArtworkPaused, setIsArtworkPaused] = useState(false)

  const copy = language === 'zh'
    ? {
        heroEyebrow: 'JINJIANG SUZHOU · A SENSE OF PLACE',
        title: '住进苏州，也住进一门手艺。',
        lead: '以苏绣为线索，让大堂中的一次驻足、客房里的一段静赏与婉娘的一次交谈，成为可感知、可理解、可继续参与的苏州记忆。',
        meet: '咨询婉娘',
        explore: '开始探索',
        heroNote: '锦江苏州文化礼宾 · 苏绣主题住中体验',
        journeyEyebrow: 'A CURATED STAY',
        journeyTitle: '一段住中旅程，三次与苏绣相遇。',
        journeyLead: '不把非遗做成孤立的展板，而是让它自然地出现在抵达、停留与参与的节奏里。',
        chapters: [
          ['01', '大堂 · 观绣', '从《姑苏繁华图》数字纹理长卷进入苏州，在微距观察中辨认水波、桥影与丝光。', '/immersive?focus=artwork'],
          ['02', '客房 · 识线', '通过丝线、色阶与触感线索理解“劈丝”与丝光，让工艺知识成为安静的房内陪伴。', '/immersive?focus=silk'],
          ['03', '工坊 · 试针', '沿上绷、配线与起针的次序，把观看转化为一场可预约、可记录的入门体验。', '/immersive?focus=workbench'],
        ],
        discover: '展开这一章',
        roomEyebrow: 'THE HERITAGE ROOM',
        roomTitle: '非遗不只被观看，也被空间温柔承接。',
        roomBody: '主题房以初白、黛青与老木色为底，将苏绣融入床头绢屏、织物细节和房内阅读。视觉克制，信息有据，让文化进入日常而不喧宾夺主。',
        roomPoints: ['一处苏绣主题陈设', '一份双语房内导览', '一次工坊体验意向'],
        roomCta: '查看我的行程',
        conciergeEyebrow: 'CULTURAL CONCIERGE',
        conciergeTitle: '有问题，问婉娘。',
        conciergeBody: '她既能讲清苏绣的材料、技艺与文脉，也能回答更广泛的苏州旅行问题，并把兴趣延伸为适合住客时间的体验建议。',
        conciergeCta: '开始交谈',
        collectionEyebrow: 'LOBBY COLLECTION',
        collectionTitle: '五幅苏绣风格数字展陈。',
        collectionLead: '以花鸟、瑞禽与江南意象构成大堂轮换展陈，在色彩、纹理与构图中感受苏绣之美。',
        previous: '上一幅展陈图',
        next: '下一幅展陈图',
        pause: '将鼠标停留在作品上可暂停轮换',
      }
    : {
        heroEyebrow: 'JINJIANG SUZHOU · A SENSE OF PLACE',
        title: 'Stay in Suzhou. Enter a living craft.',
        lead: 'Su embroidery connects a moment in the lobby, a quiet encounter in the guest room and a conversation with Wanniang into one considered memory of place.',
        meet: 'Meet Wanniang',
        explore: 'Enter the embroidery atelier',
        heroNote: 'Jinjiang Suzhou cultural concierge · A heritage stay',
        journeyEyebrow: 'A CURATED STAY',
        journeyTitle: 'One stay, three encounters with Su embroidery.',
        journeyLead: 'Heritage is not treated as a detached display. It enters the natural rhythm of arrival, pause and participation.',
        chapters: [
          ['01', 'Lobby · Observe', 'Enter Suzhou through a digital-texture scroll and use the macro view to notice ripples, bridges and silk-like light.', '/immersive?focus=artwork'],
          ['02', 'Room · Read the thread', 'Learn how splitting, colour and lustre shape the craft through quiet, tactile details in the room.', '/immersive?focus=silk'],
          ['03', 'Atelier · Take a stitch', 'Move from mounting and thread selection to a first stitch in an introductory experience that can be saved to your stay.', '/immersive?focus=workbench'],
        ],
        discover: 'Explore this chapter',
        roomEyebrow: 'THE HERITAGE ROOM',
        roomTitle: 'Heritage is not only displayed. It is held by the room.',
        roomBody: 'Silk ivory, muted slate and aged elm form a quiet setting for an embroidered screen, tactile textiles and concise in-room interpretation. Culture becomes part of the stay without becoming decoration alone.',
        roomPoints: ['One curated embroidery setting', 'A bilingual in-room guide', 'One atelier preference'],
        roomCta: 'View my stay',
        conciergeEyebrow: 'CULTURAL CONCIERGE',
        conciergeTitle: 'Ask Wanniang.',
        conciergeBody: 'She explains the materials, techniques and cultural context of Su embroidery, answers wider Suzhou travel questions and shapes an experience around the time you have.',
        conciergeCta: 'Begin a conversation',
        collectionEyebrow: 'LOBBY COLLECTION',
        collectionTitle: 'Five digital studies inspired by Su embroidery.',
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
    if (isArtworkPaused) return undefined
    const timer = window.setInterval(() => setArtIndex((current) => (current + 1) % artworks.length), 5600)
    return () => window.clearInterval(timer)
  }, [artworks.length, isArtworkPaused])

  function selectArtwork(nextIndex: number) {
    setArtIndex((nextIndex + artworks.length) % artworks.length)
  }

  return (
    <div className="home-page">
      <CinematicHero
        language={language}
        eyebrow={copy.heroEyebrow}
        title={copy.title}
        lead={copy.lead}
        primaryLabel={copy.meet}
        primaryTo={'/guide'}
        secondaryLabel={copy.explore}
        secondaryTo="/immersive"
        note={copy.heroNote}
      />

      <section className="home-journey-section">
        <header className="home-section-intro">
          <p className="eyebrow">{copy.journeyEyebrow}</p>
          <h2>{copy.journeyTitle}</h2>
          <p>{copy.journeyLead}</p>
        </header>
        <div className="home-journey-grid">
          {copy.chapters.map(([index, title, body, to]) => (
            <Link to={to} key={index} className="home-journey-item">
              <span>{index}</span>
              <h3>{title}</h3>
              <p>{body}</p>
              <strong>{copy.discover}<span aria-hidden="true">→</span></strong>
            </Link>
          ))}
        </div>
      </section>

      <section className="home-room-story">
        <div className="home-room-image">
          <img src="/assets/hotel-suxiu-theme-room-v1.webp" alt={language === 'zh' ? '融入苏绣绢屏的苏州酒店主题房' : 'Suzhou hotel heritage room with an embroidered silk screen'} width="1672" height="941" loading="lazy" />
        </div>
        <div className="home-room-copy">
          <p className="eyebrow">{copy.roomEyebrow}</p>
          <h2>{copy.roomTitle}</h2>
          <p>{copy.roomBody}</p>
          <ul>{copy.roomPoints.map((point) => <li key={point}>{point}</li>)}</ul>
          <Link to={'/immersive'}>{copy.roomCta}<span aria-hidden="true">→</span></Link>
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

        <div className="home-collection-layout" onMouseEnter={() => setIsArtworkPaused(true)} onMouseLeave={() => setIsArtworkPaused(false)} onFocus={() => setIsArtworkPaused(true)} onBlur={() => setIsArtworkPaused(false)}>
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
            <small>{copy.pause}</small>
          </div>
        </div>
      </section>
    </div>
  )
}
