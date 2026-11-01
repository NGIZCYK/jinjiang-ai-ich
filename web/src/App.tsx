import { lazy, Suspense, useEffect } from 'react'
import { useAppStore } from './lib/store'
import { useJourneyStore, loadPublicCatalog } from './lib/journeyStore'
import { RequireRole } from './components/JourneyCommon'
import { Navigate, Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { OpsShell } from './components/ops/OpsShell'
import { RequireOps } from './components/ops/RequireOps'
import { LegacyOpsRedirect } from './components/ops/LegacyOpsRedirect'

const OperationsPage=lazy(()=>import('./pages/OperationsPage').then(module=>({default:module.OperationsPage})))
const OpsDashboardPage=lazy(()=>import('./pages/ops/OpsDashboardPage').then(module=>({default:module.OpsDashboardPage})))
const AnalyticsPage=lazy(()=>import('./pages/AnalyticsPage').then(module=>({default:module.AnalyticsPage})))
const AuthPage=lazy(()=>import('./pages/AuthPage').then(module=>({default:module.AuthPage})))
const GuidePage=lazy(()=>import('./pages/GuidePage').then(module=>({default:module.GuidePage})))
const PremiumHomePage=lazy(()=>import('./pages/PremiumHomePage').then(module=>({default:module.PremiumHomePage})))
const ImmersivePage=lazy(()=>import('./pages/ImmersivePage').then(module=>({default:module.ImmersivePage})))
const MyPage=lazy(()=>import('./pages/MyPage').then(module=>({default:module.MyPage})))
const StudioPage=lazy(()=>import('./pages/StudioPage').then(module=>({default:module.StudioPage})))

export default function App() {
  const user = useAppStore(s => s.user)
  useEffect(() => { useAppStore.getState().initialize(); void loadPublicCatalog() }, [])
  useEffect(() => {
    useJourneyStore.getState().reset()
    if (!user) return
    const refresh = () => { void useJourneyStore.getState().refresh() }
    refresh()
    window.addEventListener('focus', refresh)
    return () => window.removeEventListener('focus', refresh)
  }, [user?.id])
  return (
    <Suspense fallback={<div className="card m-6 p-6" role="status">Loading…</div>}><Routes>
      <Route path="/operations" element={<LegacyOpsRedirect to="/ops/experiences" />} />
      <Route path="/studio" element={<LegacyOpsRedirect to="/ops/studio" />} />
      <Route path="/analytics" element={<LegacyOpsRedirect to="/ops/insights" />} />

      <Route element={<Layout />}>
        <Route path="/" element={<PremiumHomePage />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/guide" element={<GuidePage />} />
        <Route path="/immersive" element={<ImmersivePage />} />
        <Route path="/my" element={<RequireRole><MyPage /></RequireRole>} />
        <Route path="/experience" element={<Navigate to="/immersive" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>

      <Route path="/ops" element={<RequireOps><OpsShell /></RequireOps>}>
        <Route index element={<OpsDashboardPage />} />
        <Route path="experiences" element={<OperationsPage />} />
        <Route path="studio" element={<StudioPage />} />
        <Route path="insights" element={<AnalyticsPage />} />
        <Route path="*" element={<Navigate to="/ops" replace />} />
      </Route>
    </Routes></Suspense>
  )
}
