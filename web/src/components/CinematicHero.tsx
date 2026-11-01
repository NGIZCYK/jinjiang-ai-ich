import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import type { Language } from '../lib/i18n'

interface CinematicHeroProps {
  language: Language
  title: string
  lead: string
  primaryLabel: string
  primaryTo: string
  secondaryLabel: string
  secondaryTo: string
  onDismissContinuation?: () => void
}

type NavigatorWithConnection = Navigator & {
  connection?: { saveData?: boolean }
}

export const HERO_MEDIA = {
  desktop: { video: '/videos/home-embroidery-20261101-v2-desktop.mp4', poster: '/assets/home-embroidery-20261101-v2-desktop.webp', width: 1920, height: 1080 },
  mobile: { video: '/videos/home-embroidery-20261101-v2-mobile.mp4', poster: '/assets/home-embroidery-20261101-v2-mobile.webp', width: 720, height: 1280 },
} as const

export function CinematicHero({
  language,
  title,
  lead,
  primaryLabel,
  primaryTo,
  secondaryLabel,
  secondaryTo,
  onDismissContinuation,
}: CinematicHeroProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const [isPaused, setIsPaused] = useState(false)
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && !window.matchMedia('(min-width: 768px)').matches)
  const [mobileRequested, setMobileRequested] = useState(false)
  const [readyVariant, setReadyVariant] = useState<string | null>(null)
  const [failedVariant, setFailedVariant] = useState<string | null>(null)
  const variant = isMobile ? 'mobile' : 'desktop'
  const media = HERO_MEDIA[variant]
  const wantsVideo = !isMobile || mobileRequested
  const videoFailed = failedVariant === variant
  const isReady = readyVariant === variant
  const [staticMode, setStaticMode] = useState(() => {
    if (typeof window === 'undefined') return false
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const saveData = (navigator as NavigatorWithConnection).connection?.saveData === true
    return reducedMotion || saveData
  })

  useEffect(() => {
    const query = window.matchMedia('(min-width: 768px)')
    const sync = () => { setIsMobile(!query.matches); setReadyVariant(null); setFailedVariant(null) }
    query.addEventListener('change', sync)
    return () => query.removeEventListener('change', sync)
  }, [])

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    const syncPreference = () => {
      const saveData = (navigator as NavigatorWithConnection).connection?.saveData === true
      setStaticMode(mediaQuery.matches || saveData)
    }
    mediaQuery.addEventListener('change', syncPreference)
    return () => mediaQuery.removeEventListener('change', syncPreference)
  }, [])

  useEffect(() => {
    if (!staticMode) return
    setReadyVariant(null)
    videoRef.current?.pause()
  }, [staticMode])

  const togglePlayback = async () => {
    if (!wantsVideo && !staticMode && !videoFailed) { setIsPaused(false); setMobileRequested(true); return }
    const video = videoRef.current
    if (!video || staticMode || videoFailed) return
    if (video.paused) {
      try {
        await video.play()
      } catch {
        setIsPaused(true)
      }
      return
    }
    video.pause()
  }

  const copy = language === 'zh'
    ? {
        pause: '暂停影像',
        play: '继续播放',
        unavailable: '视频暂不可用，已显示封面。',
      }
    : {
        pause: 'Pause film',
        play: 'Resume film',
        unavailable: 'The film is unavailable. Its cover is shown.',
      }

  const showPlay = !wantsVideo || isPaused
  const playbackLabel = !wantsVideo ? (language === 'zh' ? '播放影像' : 'Play film') : isPaused ? copy.play : copy.pause

  return (
    <div className="home-opening">
      <section id="home-introduction" className="home-introduction" aria-labelledby="home-title" tabIndex={-1}>
        <h1 id="home-title">{title}</h1>
        <p className="home-hero-lead">{lead}</p>
        <div className="home-hero-actions">
          <Link to={primaryTo} className="home-hero-primary">{primaryLabel}<span aria-hidden="true">→</span></Link>
          <Link to={secondaryTo} className="home-hero-secondary">{secondaryLabel}<span aria-hidden="true">↗</span></Link>
        </div>
        {onDismissContinuation && <button type="button" className="journey-text-button home-continue-dismiss" onClick={onDismissContinuation}>{language === 'zh' ? '稍后再说' : 'Maybe later'}</button>}
      </section>
      <section className="home-hospitality-hero home-cinematic-hero" aria-label={language === 'zh' ? '苏绣主题影像' : 'Embroidery film'}>
        <div className={`home-film-media ${isReady && !videoFailed && !staticMode ? 'is-ready' : ''}`} aria-hidden="true">
          <img src={media.poster} alt="" width={media.width} height={media.height} {...{ fetchpriority: 'high' }} />
          {!staticMode && !videoFailed && wantsVideo && (
            <video
              key={variant}
              ref={videoRef}
              autoPlay={!isPaused}
              muted
              loop
              playsInline
              preload="metadata"
              poster={media.poster}
              tabIndex={-1}
              onPlaying={() => setReadyVariant(variant)}
              onPlay={() => setIsPaused(false)}
              onPause={() => setIsPaused(true)}
              onError={() => setFailedVariant(variant)}
            >
              <source src={media.video} type="video/mp4" />
            </video>
          )}
        </div>

        {!staticMode && !videoFailed && <button
          type="button"
          className={`home-film-control ${isMobile && !isReady ? 'home-film-control-center' : ''}`}
          onClick={togglePlayback}
          aria-label={playbackLabel}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            {showPlay ? <path d="m9 5 11 7-11 7Z" fill="currentColor" /> : <path d="M8 5v14M16 5v14" fill="none" stroke="currentColor" strokeWidth="3" />}
          </svg>
        </button>}
        <a className="home-film-next" href="#stay-chapters" aria-label={language === 'zh' ? '向下探索住中三章' : 'Explore the three chapters below'}>
          <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M12 4v15m-6-6 6 6 6-6" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </a>
        <p className="sr-only" role="status">{videoFailed ? copy.unavailable : ''}</p>
      </section>
    </div>
  )
}
