import { useState } from 'react'

export const SILK_FORM_IMAGE = '/assets/silk-shading-petals-20261103.webp'

const STUDIES = [
  { id: 'direction', zh: '看线向', en: 'Thread direction', x: 520, y: 310,
    noteZh: '沿花瓣的转折观察排线，比较相邻区域的线向怎样随花瓣形状变化。',
    noteEn: 'Follow the petal turns and compare how adjacent thread directions relate to the petal shape.' },
  { id: 'tones', zh: '看色阶', en: 'Tonal transitions', x: 350, y: 120,
    noteZh: '比较乳白、浅黄与粉色的过渡，观察明暗层次怎样让花瓣看起来有凹凸。',
    noteEn: 'Compare the transitions between ivory, yellow and pink, and how the tonal layers suggest petal volume.' },
  { id: 'depth', zh: '看层次', en: 'Overlapping layers', x: 850, y: 620,
    noteZh: '沿花瓣相互遮挡的边界观察，分辨翻起的前方花瓣与后方花瓣。',
    noteEn: 'Follow the boundaries where petals overlap to distinguish the turned foreground petals from those behind.' },
] as const

export function SilkFormStudy({ isZh }: { isZh: boolean }) {
  const [index, setIndex] = useState(0)
  const study = STUDIES[index]
  return <div className="silk-topic-content">
    <h3>{isZh ? '以线塑形' : 'Shaping with thread'}</h3>
    <p>{isZh ? '看丝线的排布、色阶与遮挡关系，怎样共同表现花瓣的翻卷和体积。' : 'Explore how thread direction, colour and overlap work together to suggest turned petals and volume.'}</p>
    <div className="silk-options silk-form-options" role="group" aria-label={isZh ? '立体层次观察' : 'Study the sense of depth'}>
      {STUDIES.map((item, i) => <button key={item.id} type="button" aria-pressed={i === index} onClick={() => setIndex(i)}>{isZh ? item.zh : item.en}</button>)}
    </div>
    <svg className="silk-form-detail" viewBox={`${study.x} ${study.y} 660 480`} role="img" aria-label={isZh ? `${study.zh}：同一花瓣绣品的局部` : `${study.en}: a detail of the same embroidered flower`}>
      <image href={SILK_FORM_IMAGE} width="1920" height="1280" />
    </svg>
    <div className="silk-selection-copy" aria-live="polite" aria-atomic="true">
      <h4>{isZh ? study.zh : study.en}</h4><p>{isZh ? study.noteZh : study.noteEn}</p>
    </div>
    <p className="silk-concept-label">{isZh ? '局部取自同一作品图像，用于比较排线与视觉体积。' : 'Details from the same artwork image, for comparing thread arrangement and visual volume.'}</p>
  </div>
}
