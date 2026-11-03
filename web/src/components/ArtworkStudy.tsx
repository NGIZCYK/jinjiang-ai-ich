import { useEffect, useRef, useState } from 'react'
import { FLORAL_ARTWORK, FLORAL_SPOTS, artworkCrop, pointOnArtwork, type ArtworkPoint } from '../lib/artworkStudy'
import type { Exploration } from '../lib/journey'
import type { Language } from '../lib/i18n'

export function ArtworkDetailImage({ point, label, className }: { point: ArtworkPoint; label?: string; className?: string }) {
  const crop = artworkCrop(point)
  return <svg className={className} viewBox={`${crop.left} ${crop.top} ${crop.size} ${crop.size}`}
    role={label ? 'img' : undefined} aria-label={label} aria-hidden={label ? undefined : true} focusable="false">
    <image href={FLORAL_ARTWORK.image} width={FLORAL_ARTWORK.width} height={FLORAL_ARTWORK.height} />
  </svg>
}

export function ArtworkStudy({ language, focusRequest, onExplore }: {
  language: Language; focusRequest: number; onExplore?: (value: Partial<Exploration>) => void
}) {
  const zh = language === 'zh'
  const [point, setPoint] = useState<ArtworkPoint>(FLORAL_SPOTS[0])
  const [selectedId, setSelectedId] = useState<string | null>(FLORAL_SPOTS[0].id)
  const [failed, setFailed] = useState(false)
  const imageRef = useRef<HTMLImageElement>(null)
  const selected = FLORAL_SPOTS.find(spot => spot.id === selectedId)
  const crop = artworkCrop(point)
  useEffect(() => { setPoint(FLORAL_SPOTS[0]); setSelectedId(FLORAL_SPOTS[0].id) }, [focusRequest])

  function focusSpot(spot: typeof FLORAL_SPOTS[number]) {
    setPoint(spot); setSelectedId(spot.id); onExplore?.({ motif: spot.id })
  }
  function inspect(next: ArtworkPoint, snap = true) {
    const near = snap && FLORAL_SPOTS.find(spot => Math.hypot(spot.xPct - next.xPct, spot.yPct - next.yPct) < 6)
    if (near) focusSpot(near)
    else { setPoint(next); setSelectedId(null) }
  }

  return <section className="floral-study" aria-label={zh ? '花卉苏绣观察' : 'Floral embroidery study'}>
    <header className="floral-study-heading">
      <div><p className="eyebrow">{zh ? '01 · 观绣' : '01 · OBSERVE'}</p><h2>{zh ? '花韵 · 花瓣与线向' : 'Floral rhythms · Petals & threads'}</h2></div>
      <p>{zh ? '先看全貌，再选一处细节。' : 'Start with the whole, then choose a detail.'}</p>
    </header>
    <div className="floral-study-layout">
      <figure className="floral-overview">
        {failed ? <div className="floral-image-error" role="status">{zh ? '图片暂时无法加载，请刷新后重试。' : 'The image could not load. Please refresh to try again.'}</div> :
          <button type="button" className="floral-canvas" aria-label={zh ? '在全图中选择观察位置' : 'Choose an observation position on the artwork'}
            aria-describedby="floral-image-help" onClick={event => {
              if (!event.detail || !imageRef.current) return
              const next = pointOnArtwork(event.clientX, event.clientY, imageRef.current.getBoundingClientRect())
              if (next) inspect(next)
            }} onKeyDown={event => {
              const moves: Record<string, [number, number]> = { ArrowLeft: [-3, 0], ArrowRight: [3, 0], ArrowUp: [0, -3], ArrowDown: [0, 3] }
              if (event.key === 'Home') { event.preventDefault(); focusSpot(FLORAL_SPOTS[0]); return }
              const move = moves[event.key]; if (!move) return
              event.preventDefault()
              inspect({ xPct: Math.max(0, Math.min(100, point.xPct + move[0])), yPct: Math.max(0, Math.min(100, point.yPct + move[1])) }, false)
            }}>
            <img ref={imageRef} src={FLORAL_ARTWORK.image} width={1080} height={1880} draggable={false} onError={() => setFailed(true)}
              alt={zh ? '浅紫色绣面上层叠的粉白花卉，《中国梦花韵系列》展览图像' : 'Layered pink and white flowers on violet embroidery, exhibition image of the Chinese Dream Floral Rhythms series'} />
            <span className="floral-crop-marker" aria-hidden="true" style={{ left: `${crop.left / FLORAL_ARTWORK.width * 100}%`, top: `${crop.top / FLORAL_ARTWORK.height * 100}%`, width: `${crop.size / FLORAL_ARTWORK.width * 100}%`, height: `${crop.size / FLORAL_ARTWORK.height * 100}%` }} />
            {FLORAL_SPOTS.map((spot, index) => <span key={spot.id} aria-hidden="true" className={`floral-map-point ${selectedId === spot.id ? 'is-active' : ''}`}
              style={{ left: `${spot.xPct}%`, top: `${spot.yPct}%` }}>{index + 1}</span>)}
          </button>}
        <figcaption id="floral-image-help">{zh ? '点击全图移动观察框；键盘方向键可微调，Home 返回第一处。' : 'Click to move the frame; use arrow keys to adjust and Home to return to the first detail.'}</figcaption>
      </figure>
      <aside className="floral-inspection" aria-label={zh ? '独立细节观察区' : 'Independent detail view'}>
        <div className="floral-detail-heading"><span>{zh ? '局部细看' : 'A closer look'}</span><strong aria-live="polite">{selected ? (zh ? selected.labelZh : selected.labelEn) : (zh ? '自由观察' : 'Free observation')}</strong></div>
        {!failed && <ArtworkDetailImage point={point} className="floral-detail-image" label={zh ? '与全图观察框对应的原图局部' : 'Source image detail matching the overview frame'} />}
        <p className="floral-detail-note">{zh ? '局部取自同一张原图；放大范围受原图清晰度限制。' : 'A crop of the same photograph, limited to the available image detail.'}</p>
        <nav className="floral-spot-list" aria-label={zh ? '选择花卉观察点' : 'Choose a floral detail'}>
          {FLORAL_SPOTS.map((spot, index) => <button type="button" key={spot.id} aria-pressed={selectedId === spot.id} disabled={failed} onClick={() => focusSpot(spot)}>
            <span>0{index + 1}</span><strong>{zh ? spot.labelZh : spot.labelEn}</strong>
          </button>)}
        </nav>
        <p className="floral-reading" aria-live="polite">{selected ? (zh ? selected.descZh : selected.descEn) : (zh ? '比较这一处的色彩与线向。也可以选择上方的观察点，将感兴趣的主题记入探索卡。' : 'Compare colour and thread direction here, or choose a labelled detail to add its theme to your exploration card.')}</p>
        <details className="floral-source"><summary>{zh ? '作品与图像来源' : 'Artwork & image source'}</summary>
          <p>{zh ? '《中国梦花韵系列》展览图像，见中国工艺美术学会“无远弗届——姚建萍苏绣艺术展”介绍。这里观察图像可见的色阶和线向，不将照片视为针法鉴定或显微记录。' : 'Exhibition image of the Chinese Dream Floral Rhythms series, published by the China National Arts and Crafts Society in its Yao Jianping exhibition report. Observe visible tones and thread directions; this photograph is not a stitch identification or microscopic record.'}</p>
          <a href={FLORAL_ARTWORK.source} target="_blank" rel="noreferrer">{zh ? '查看展览介绍' : 'View the exhibition report'} ↗</a>
        </details>
      </aside>
    </div>
  </section>
}
