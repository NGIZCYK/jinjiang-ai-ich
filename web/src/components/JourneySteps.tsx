import { Link, useLocation } from 'react-router-dom'
import { useCopy } from './JourneyCommon'

export function JourneySteps() {
  const { t } = useCopy()
  const { pathname, hash } = useLocation()
  if (!['/immersive','/my'].includes(pathname)) return null
  const current = pathname === '/immersive' ? 0 : pathname === '/guide' ? 1 : hash === '#booking-results' ? 3 : 2
  const steps = [[t('探索苏绣','Explore'),'/immersive#exploration-task'],[t('找到推荐','Find a fit'),'/guide#recommendations'],[t('选择场次','Choose a session'),'/my#intention-form'],[t('查看结果','Track your request'),'/my#booking-results']]
  return <nav className="journey-steps" aria-label={t('体验旅程','Your experience journey')}><ol>{steps.map(([label,to],index) => <li key={to}><Link to={to} aria-current={index===current?'step':undefined}><span aria-hidden="true">0{index+1}</span><strong>{label}</strong></Link></li>)}</ol></nav>
}
