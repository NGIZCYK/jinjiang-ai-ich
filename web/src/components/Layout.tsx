import { type CSSProperties, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { localizedUserName, useLanguage } from '../lib/i18n'
import { useAppStore } from '../lib/store'
import { PageErrorBoundary } from './PageErrorBoundary'
import { JourneySteps } from './JourneySteps'
import { OpsPreviewBar } from './OpsPreviewBar'
import { clearContinuation, readContinuation } from '../lib/journeyFlow'
import { STAYS_ENABLED } from '../lib/stays'

const GUEST_ROUTES = ['/', '/guide', '/immersive', '/my', '/stays', '/stays/book']

export function Layout() {
  const user = useAppStore((s) => s.user)
  const logout = useAppStore((s) => s.logout)
  const nav = useNavigate()
  const location = useLocation()
  const { language, setLanguage } = useLanguage()
  const isHome = location.pathname === '/'
  const showPreview = user?.role === 'ops' && (GUEST_ROUTES.includes(location.pathname) || location.pathname.startsWith('/stays/'))
  useEffect(() => {
    document.title = language === 'zh' ? '婉娘 · 锦江苏绣非遗体验' : 'Wanniang · Jinjiang Su Embroidery Experience'
  }, [language, location.pathname])
  useEffect(() => { if (user && readContinuation() === location.pathname + location.search + location.hash) clearContinuation() }, [user?.id, location.pathname, location.search, location.hash])
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      if (location.hash) {
        let id = ''
        try { id = decodeURIComponent(location.hash.slice(1)) } catch { return }
        document.getElementById(id)?.scrollIntoView({ block: 'start' })
      } else window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior })
    })
    return () => cancelAnimationFrame(frame)
  }, [location.pathname, location.hash])
  const headerRef = useRef<HTMLElement>(null)
  const [homeHeaderHeight, setHomeHeaderHeight] = useState<number | null>(null)
  useLayoutEffect(() => {
    if (!isHome || !headerRef.current) return
    const header = headerRef.current
    const measure = () => {
      const height = Math.ceil(header.getBoundingClientRect().height)
      if (height > 0) setHomeHeaderHeight(height)
    }
    measure()
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(measure)
    observer?.observe(header)
    window.addEventListener('resize', measure)
    return () => { observer?.disconnect(); window.removeEventListener('resize', measure) }
  }, [isHome])
  const copy = language === 'zh'
    ? {
        brand: '锦江苏州',
        brandShort: '苏绣礼宾',
        descriptor: '苏绣文化礼宾',
        guestLinks: ['礼遇首页', '婉娘礼宾', '苏绣艺境', '我的行程'],
        login: '登录', logout: '退出',
      }
    : {
        brand: 'Jinjiang Suzhou',
        brandShort: 'Su Embroidery',
        descriptor: 'Su Embroidery Cultural Concierge',
        guestLinks: ['Welcome', 'Wanniang', 'Embroidery Gallery', 'My Journey'],
        login: 'Sign in', logout: 'Sign out',
      }
  const guestLinks = [
    { to: '/', label: copy.guestLinks[0], end: true },
    ...(STAYS_ENABLED ? [{ to: '/stays', label: language === 'zh' ? '客房与套餐' : 'Rooms & Packages' }] : []),
    { to: '/guide', label: copy.guestLinks[1] },
    { to: '/immersive', label: copy.guestLinks[2] },
    { to: '/my', label: copy.guestLinks[3] },
  ]

  return (
    <div className={`page-shell guest-ui min-h-screen ${isHome ? 'page-shell-home' : ''}`} style={isHome && homeHeaderHeight !== null ? { '--home-header-height': `${homeHeaderHeight}px` } as CSSProperties : undefined}>
      <a href="#main-content" className="skip-link">
        {language === 'zh' ? '跳到主要内容' : 'Skip to main content'}
      </a>
      {showPreview && <OpsPreviewBar />}
      <header ref={headerRef} className={`site-header sticky top-0 z-20 ${isHome ? 'site-header-home' : ''}`}>
        <div className="site-header-inner">
          <Link to="/" className="brand-lockup" aria-label={language === 'zh' ? '返回礼遇首页' : 'Return to welcome'}>
            <span className="brand-seal" aria-hidden="true">{language === 'zh' ? '绣' : 'S'}</span>
            <span className="brand-copy">
              <strong><span className="hidden sm:inline">{copy.brand}</span><span className="sm:hidden">{copy.brandShort}</span></strong>
              <small>{copy.descriptor}</small>
            </span>
          </Link>

          <nav className="site-primary-nav" aria-label={language === 'zh' ? '住客导航' : 'Guest navigation'}>
            {guestLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                className={({ isActive }) => `nav-link ${isActive ? 'nav-link-active' : ''}`}
              >
                {link.label}
              </NavLink>
            ))}
          </nav>

          <div className="site-header-actions">
            <div className="language-switch" aria-label="Language selector">
              <button className={language === 'zh' ? 'language-switch-active' : ''} onClick={() => setLanguage('zh')} aria-label="Switch to Chinese" aria-pressed={language==='zh'}>
                中
              </button>
              <span aria-hidden="true" />
              <button className={language === 'en' ? 'language-switch-active' : ''} onClick={() => setLanguage('en')} aria-label="Switch to English" aria-pressed={language==='en'}>
                EN
              </button>
            </div>
            {user ? (
              <>
                <span className="account-name">{localizedUserName(user, language)}</span>
                <button
                  className="header-account-action"
                  onClick={() => {
                    void logout().then(() => { if (!useAppStore.getState().user) nav('/auth') })
                  }}
                >
                  {copy.logout}
                </button>
              </>
            ) : (
              <button className="header-account-action" onClick={() => nav('/auth')}>
                {copy.login}
              </button>
            )}
          </div>
          <div className="mobile-header-actions">
            <button
              type="button"
              className="mobile-language-button"
              onClick={() => setLanguage(language === 'zh' ? 'en' : 'zh')}
              aria-label={language === 'zh' ? 'Switch to English' : '切换到中文'}
            >
              {language === 'zh' ? 'EN' : '中'}
            </button>
            {user ? (
              <button className="header-account-action" onClick={() => { void logout().then(() => { if (!useAppStore.getState().user) nav('/auth') }) }}>
                {copy.logout}
              </button>
            ) : (
              <button className="header-account-action" onClick={() => nav('/auth')}>
                {copy.login}
              </button>
            )}
          </div>
        </div>
        <nav className="mobile-nav-shell" aria-label={language === 'zh' ? '移动端导航' : 'Mobile navigation'}>
          <div className="mobile-nav-track">
            {guestLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                className={({ isActive }) => `mobile-nav-link ${isActive ? 'mobile-nav-link-active' : ''}`}
              >
                {link.label}
              </NavLink>
            ))}
          </div>
        </nav>
      </header>
      <main id="main-content" className={`site-main ${isHome ? 'site-main-home' : ''}`}>
        <JourneySteps /><PageErrorBoundary key={location.pathname} language={language}><Outlet /></PageErrorBoundary>
      </main>
      <footer className="site-footer">
        <div className="site-footer-inner">
          <div className="footer-brand">
            <strong>{copy.brand}</strong>
            <span>{copy.descriptor}</span>
          </div>
          <span className="footer-location">SUZHOU · CHINA</span>
        </div>
      </footer>
    </div>
  )
}
