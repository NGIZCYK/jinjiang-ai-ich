import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { localizedUserName, useLanguage } from '../lib/i18n'
import { useAppStore } from '../lib/store'
import { PageErrorBoundary } from './PageErrorBoundary'

export function Layout() {
  const user = useAppStore((s) => s.user)
  const logout = useAppStore((s) => s.logout)
  const nav = useNavigate()
  const location = useLocation()
  const { language, setLanguage } = useLanguage()
  const isHome = location.pathname === '/'
  const [homeHeaderScrolled, setHomeHeaderScrolled] = useState(false)

  useEffect(() => {
    if (!isHome) {
      setHomeHeaderScrolled(false)
      return undefined
    }
    const syncHeader = () => setHomeHeaderScrolled(window.scrollY > 40)
    syncHeader()
    window.addEventListener('scroll', syncHeader, { passive: true })
    return () => window.removeEventListener('scroll', syncHeader)
  }, [isHome])
  const copy = language === 'zh'
    ? {
        brand: '锦江苏州',
        brandShort: '苏绣礼宾',
        descriptor: '苏绣文化礼宾',
        guestLinks: ['礼遇首页', '婉娘礼宾', '苏绣艺境', '我的行程'],
        opsLinks: ['内容工作台', '运营洞察'],
        opsLabel: '运营空间',
        login: '登录', logout: '退出',
      }
    : {
        brand: 'Jinjiang Suzhou',
        brandShort: 'Su Embroidery',
        descriptor: 'Su Embroidery Cultural Concierge',
        guestLinks: ['Welcome', 'Wanniang', 'Embroidery Gallery', 'My Journey'],
        opsLinks: ['Content Studio', 'Operations'],
        opsLabel: 'Operations',
        login: 'Sign in', logout: 'Sign out',
      }
  const guestLinks = [
    { to: '/', label: copy.guestLinks[0], end: true },
    { to: '/guide', label: copy.guestLinks[1] },
    { to: '/immersive', label: copy.guestLinks[2] },
    { to: '/my', label: copy.guestLinks[3] },
  ]
  const opsLinks = [
    { to: '/operations', label: language === 'zh' ? '体验管理' : 'Experiences' },
    { to: '/studio', label: copy.opsLinks[0] },
    { to: '/analytics', label: copy.opsLinks[1] },
  ]
  const showOperations = user?.role === 'ops'

  return (
    <div className={`page-shell min-h-screen ${isHome ? 'page-shell-home' : ''}`}>
      <a href="#main-content" className="skip-link">
        {language === 'zh' ? '跳到主要内容' : 'Skip to main content'}
      </a>
      <header className={`site-header sticky top-0 z-20 ${isHome ? 'site-header-home' : ''} ${homeHeaderScrolled ? 'site-header-home-scrolled' : ''}`}>
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
            {showOperations && <span className="nav-divider" aria-hidden="true" />}
            {showOperations && opsLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) => `nav-link nav-link-ops ${isActive ? 'nav-link-active' : ''}`}
              >
                {link.label}
              </NavLink>
            ))}
          </nav>

          <div className="site-header-actions">
            {showOperations && <span className="role-indicator">{copy.opsLabel}</span>}
            <div className="language-switch" aria-label="Language selector">
              <button className={language === 'zh' ? 'language-switch-active' : ''} onClick={() => setLanguage('zh')} aria-label="Switch to Chinese">
                中
              </button>
              <span aria-hidden="true" />
              <button className={language === 'en' ? 'language-switch-active' : ''} onClick={() => setLanguage('en')} aria-label="Switch to English">
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
            {showOperations && <span className="mobile-nav-divider">{copy.opsLabel}</span>}
            {showOperations && opsLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) => `mobile-nav-link mobile-nav-link-ops ${isActive ? 'mobile-nav-link-active' : ''}`}
              >
                {link.label}
              </NavLink>
            ))}
          </div>
        </nav>
      </header>
      <main id="main-content" className={`site-main ${isHome ? 'site-main-home' : ''}`}>
        <PageErrorBoundary key={location.pathname} language={language}><Outlet /></PageErrorBoundary>
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
