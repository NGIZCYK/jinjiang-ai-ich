import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import type { Language } from '../lib/i18n'

interface CinematicHeroProps {
  language: Language
  eyebrow: string
  title: string
  lead: string
  primaryLabel: string
  primaryTo: string
  secondaryLabel: string
  secondaryTo: string
  note: string
}

type NavigatorWithConnection = Navigator & {
  connection?: { saveData?: boolean }
}

const VIDEO_SRC = '/videos/home-heritage-film-20260915-v1.mp4'
const POSTER_SRC = '/assets/home-heritage-film-poster-20260915-v1.webp'

export function CinematicHero({
  language,
  eyebrow,
  title,
  lead,
  primaryLabel,
  primaryTo,
  secondaryLabel,
  secondaryTo,
  note,
}: CinematicHeroProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const [progress, setProgress] = useState(0)
  const [duration, setDuration] = useState(20)
  const [isPaused, setIsPaused] = useState(false)
  const [isReady, setIsReady] = useState(false)
  const [videoFailed, setVideoFailed] = useState(false)
  const [wantsVideo,setWantsVideo] = useState(() => typeof window !== 'undefined' && window.matchMedia('(min-width: 768px)').matches)
  const [staticMode, setStaticMode] = useState(() => {
    if (typeof window === 'undefined') return false
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const saveData = (navigator as NavigatorWithConnection).connection?.saveData === true
    return reducedMotion || saveData
  })

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
    videoRef.current?.pause()
  }, [staticMode])

  const updateProgress = () => {
    const video = videoRef.current
    if (!video || !Number.isFinite(video.duration) || video.duration <= 0) return
    setDuration(video.duration)
    setProgress((video.currentTime / video.duration) * 100)
  }

  const togglePlayback = async () => {
    if (!wantsVideo && !staticMode && !videoFailed) { setWantsVideo(true); return }
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
        static: '静态模式',
      }
    : {
        pause: 'Pause film',
        play: 'Resume film',
        static: 'Still mode',
      }

  const elapsed = Math.min(duration, (progress / 100) * duration)
  const timeLabel = `${Math.floor(elapsed).toString().padStart(2, '0')} / ${Math.round(duration).toString().padStart(2, '0')} SEC`

  return (
    <section className="home-hospitality-hero home-cinematic-hero">
      <div className={`home-film-media ${isReady ? 'is-ready' : ''}`} aria-hidden="true">
        <img src={POSTER_SRC} alt="" width="1600" height="900" />
        {!staticMode && !videoFailed && wantsVideo && (
          <video
            ref={videoRef}
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            poster={POSTER_SRC}
            tabIndex={-1}
            onCanPlay={() => setIsReady(true)}
            onLoadedMetadata={updateProgress}
            onTimeUpdate={updateProgress}
            onPlay={() => setIsPaused(false)}
            onPause={() => setIsPaused(true)}
            onError={() => setVideoFailed(true)}
          >
            <source src={VIDEO_SRC} type="video/mp4" />
          </video>
        )}
      </div>

      <div className="home-hero-shade" />
      <div className="home-hero-content">
        <p className="home-hero-eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        <p className="home-hero-lead">{lead}</p>
        <div className="home-hero-actions">
          <Link to={primaryTo} className="home-hero-primary">{primaryLabel}</Link>
          <Link to={secondaryTo} className="home-hero-secondary">{secondaryLabel}<span aria-hidden="true">↗</span></Link>
        </div>
        <p className="home-hero-note">{note}</p>
      </div>

      <div className="home-film-console">
        <div className="home-film-meta">
          <strong>{staticMode || videoFailed || !wantsVideo ? copy.static : timeLabel}</strong>
        </div>
        <div className="home-film-progress" aria-hidden="true">
          <span style={{ width: `${staticMode || videoFailed || !wantsVideo ? 100 : progress}%` }} />
        </div>
        <button type="button" onClick={togglePlayback} disabled={staticMode || videoFailed} aria-label={!wantsVideo?(language==='zh'?'播放影像':'Play film'):isPaused ? copy.play : copy.pause}>
          {staticMode || videoFailed ? copy.static : !wantsVideo?(language==='zh'?'播放影像':'Play film'):isPaused ? copy.play : copy.pause}
        </button>
      </div>
    </section>
  )
}
