import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { localizedUserName, useLanguage } from '../../lib/i18n'
import { useAppStore } from '../../lib/store'
import { PageErrorBoundary } from '../PageErrorBoundary'
import { OpsCohortProvider, useOpsCohort, OPS_COHORTS, cohortLabel } from '../../lib/opsCohort'
import { OpsSheet } from './OpsUI'
import { ExternalIcon, InsightsIcon, OverviewIcon, ExperiencesIcon, StudioIcon } from './icons'
import { STAYS_ENABLED } from '../../lib/stays'

const NAV_ITEMS = [
  { to: '/ops', end: true, zh: '总览', en: 'Overview', Icon: OverviewIcon },
  { to: '/ops/experiences', end: false, zh: '体验管理', en: 'Experiences', Icon: ExperiencesIcon },
  ...(STAYS_ENABLED ? [{ to: '/ops/stays', end: false, zh: '住宿管理', en: 'Stays', Icon: ExperiencesIcon }] : []),
  { to: '/ops/studio', end: false, zh: '内容工作台', en: 'Content studio', Icon: StudioIcon },
  { to: '/ops/insights', end: false, zh: '运营洞察', en: 'Insights', Icon: InsightsIcon },
] as const

const PAGE_TITLES: Record<string, { zh: string; en: string }> = {
  '/ops': { zh: '运营总览', en: 'Operations overview' },
  '/ops/experiences': { zh: '体验管理', en: 'Experience management' },
  '/ops/stays': { zh: '住宿管理', en: 'Accommodation' },
  '/ops/studio': { zh: '内容工作台', en: 'Content studio' },
  '/ops/insights': { zh: '运营洞察', en: 'Operations insights' },
}

export function OpsShell() {
  return <OpsCohortProvider><OpsShellFrame /></OpsCohortProvider>
}

function OpsShellFrame() {
  const { language, setLanguage } = useLanguage()
  const zh = language === 'zh'
  const user = useAppStore(state => state.user)
  const logout = useAppStore(state => state.logout)
  const nav = useNavigate()
  const { pathname } = useLocation()
  const { cohort, setCohort } = useOpsCohort()
  const [menuOpen, setMenuOpen] = useState(false)

  const pageTitle = PAGE_TITLES[pathname] ?? PAGE_TITLES['/ops']
  const showCohort = pathname !== '/ops/studio'

  useEffect(() => {
    document.title = `${zh ? pageTitle.zh : pageTitle.en} · ${zh ? '锦江苏州运营工作台' : 'Jinjiang Suzhou Operations'}`
  }, [pageTitle, zh])

  function signOut() {
    setMenuOpen(false)
    void logout().then(() => { if (!useAppStore.getState().user) nav('/auth') })
  }

  return <div className={`ops-shell ${STAYS_ENABLED ? 'ops-shell-stays' : ''}`}>
    <a className="ops-skip" href="#ops-main">{zh ? '跳到主要内容' : 'Skip to main content'}</a>

    <aside className="ops-rail">
      <Link className="ops-brand" to="/ops" aria-label={zh ? '运营工作台首页' : 'Operations home'}>
        <span className="ops-brand-seal" aria-hidden="true">绣</span>
        <span className="ops-brand-copy">
          <strong>{zh ? '锦江苏州' : 'Jinjiang Suzhou'}</strong>
          <small>{zh ? '运营工作台' : 'Operations workspace'}</small>
        </span>
      </Link>

      <nav className="ops-nav" aria-label={zh ? '运营导航' : 'Operations navigation'}>
        {NAV_ITEMS.map(item => <NavLink key={item.to} to={item.to} end={item.end} className={({ isActive }) => `ops-nav-link ${isActive ? 'is-active' : ''}`}>
          <span className="ops-nav-icon"><item.Icon /></span>
          <span className="ops-nav-label">{zh ? item.zh : item.en}</span>
        </NavLink>)}
      </nav>

      <div className="ops-rail-foot">
        <Link className="ops-guest-link" to="/">
          <span>{zh ? '查看住客端' : 'View guest site'}</span>
          <ExternalIcon />
        </Link>
        <span className="ops-env">DEMO · {zh ? '演示环境' : 'Demo environment'}</span>
      </div>
    </aside>

    <div className="ops-frame">
      <header className="ops-topbar">
        <div className="ops-crumbs">
          <span>{zh ? '运营工作台' : 'Operations'}</span>
          <span aria-hidden="true">/</span>
          <strong>{zh ? pageTitle.zh : pageTitle.en}</strong>
        </div>

        <div className="ops-topbar-tools">
          {showCohort && <label className="ops-cohort">
            <span>{zh ? '统计批次' : 'Cohort'}</span>
            <select className="ops-select ops-select-compact" value={cohort} onChange={event => setCohort(event.target.value as typeof cohort)} aria-label={zh ? '统计批次' : 'Cohort'}>
              {OPS_COHORTS.map(item => <option key={item.id} value={item.id}>{cohortLabel(item.id, language)}</option>)}
            </select>
          </label>}
          <div className="ops-lang" aria-label={zh ? '语言' : 'Language'}>
            <button type="button" aria-pressed={zh} className={zh ? 'is-active' : ''} onClick={() => setLanguage('zh')}>中</button>
            <button type="button" aria-pressed={!zh} className={!zh ? 'is-active' : ''} onClick={() => setLanguage('en')}>EN</button>
          </div>
          <span className="ops-user">{user ? localizedUserName(user, language) : ''}</span>
          <button type="button" className="ops-logout" onClick={signOut}>{zh ? '退出' : 'Sign out'}</button>
        </div>

        {showCohort && <label className="ops-mobile-cohort">
          <select className="ops-select ops-select-compact" value={cohort} onChange={event => setCohort(event.target.value as typeof cohort)} aria-label={zh ? '统计批次' : 'Cohort'}>
            {OPS_COHORTS.map(item => <option key={item.id} value={item.id}>{cohortLabel(item.id, language)}</option>)}
          </select>
        </label>}
        <button type="button" className="ops-more-button" onClick={() => setMenuOpen(true)} aria-label={zh ? '更多操作' : 'More actions'}>⋯</button>
      </header>

      <main id="ops-main" className="ops-main">
        <PageErrorBoundary
          key={pathname}
          language={language}
          homeTo="/ops"
          homeLabelZh="返回运营总览"
          homeLabelEn="Back to operations overview"
        >
          <Outlet />
        </PageErrorBoundary>
      </main>

      <nav className="ops-mobile-tabs" aria-label={zh ? '运营导航' : 'Operations navigation'}>
        {NAV_ITEMS.map(item => <NavLink key={item.to} to={item.to} end={item.end} className={({ isActive }) => `ops-mobile-tab ${isActive ? 'is-active' : ''}`}>
          <span className="ops-nav-icon"><item.Icon /></span>
          <span>{zh ? item.zh : item.en}</span>
        </NavLink>)}
      </nav>
    </div>

    <OpsSheet open={menuOpen} onClose={() => setMenuOpen(false)} title={zh ? '更多操作' : 'More actions'}>
      <div className="ops-sheet-group">
        <span>{zh ? '语言' : 'Language'}</span>
        <div className="ops-lang">
          <button type="button" aria-pressed={zh} className={zh ? 'is-active' : ''} onClick={() => setLanguage('zh')}>中文</button>
          <button type="button" aria-pressed={!zh} className={!zh ? 'is-active' : ''} onClick={() => setLanguage('en')}>English</button>
        </div>
      </div>
      {showCohort && <div className="ops-sheet-group">
        <span>{zh ? '统计批次' : 'Cohort'}</span>
        <select className="ops-select" value={cohort} onChange={event => setCohort(event.target.value as typeof cohort)} aria-label={zh ? '统计批次' : 'Cohort'}>
          {OPS_COHORTS.map(item => <option key={item.id} value={item.id}>{cohortLabel(item.id, language)}</option>)}
        </select>
      </div>}
      <Link className="ops-sheet-link" to="/" onClick={() => setMenuOpen(false)}>{zh ? '查看住客端' : 'View guest site'} <span aria-hidden="true">↗</span></Link>
      <button type="button" className="ops-sheet-link is-danger" onClick={signOut}>{zh ? '退出登录' : 'Sign out'}</button>
    </OpsSheet>
  </div>
}
