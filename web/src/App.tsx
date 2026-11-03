import { lazy, Suspense, useEffect } from 'react'
import { useAppStore } from './lib/store'
import { useJourneyStore, loadPublicCatalog } from './lib/journeyStore'
import { RequireRole } from './components/JourneyCommon'
import { Navigate, Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { OpsShell } from './components/ops/OpsShell'
import { RequireOps } from './components/ops/RequireOps'
import { LegacyOpsRedirect } from './components/ops/LegacyOpsRedirect'
import { STAYS_ENABLED, clearStayDraft, useStayStore } from './lib/stays'

const OperationsPage=lazy(()=>import('./pages/OperationsPage').then(module=>({default:module.OperationsPage})))
const OpsDashboardPage=lazy(()=>import('./pages/ops/OpsDashboardPage').then(module=>({default:module.OpsDashboardPage})))
const AnalyticsPage=lazy(()=>import('./pages/AnalyticsPage').then(module=>({default:module.AnalyticsPage})))
const AuthPage=lazy(()=>import('./pages/AuthPage').then(module=>({default:module.AuthPage})))
const GuidePage=lazy(()=>import('./pages/GuidePage').then(module=>({default:module.GuidePage})))
const PremiumHomePage=lazy(()=>import('./pages/PremiumHomePage').then(module=>({default:module.PremiumHomePage})))
const ImmersivePage=lazy(()=>import('./pages/ImmersivePage').then(module=>({default:module.ImmersivePage})))
const MyPage=lazy(()=>import('./pages/MyPage').then(module=>({default:module.MyPage})))
const StudioPage=lazy(()=>import('./pages/StudioPage').then(module=>({default:module.StudioPage})))
const StaysPage=lazy(()=>import('./pages/StaysPage').then(module=>({default:module.StaysPage})))
const RoomDetailPage=lazy(()=>import('./pages/RoomDetailPage').then(module=>({default:module.RoomDetailPage})))
const StayCheckoutPage=lazy(()=>import('./pages/StayCheckoutPage').then(module=>({default:module.StayCheckoutPage})))
const OpsStaysPage=lazy(()=>import('./pages/ops/OpsStaysPage').then(module=>({default:module.OpsStaysPage})))

export default function App() {
  const user = useAppStore(s => s.user)
  useEffect(() => { useAppStore.getState().initialize(); void loadPublicCatalog() }, [])
  useEffect(() => {
    useJourneyStore.getState().reset()
    useStayStore.getState().reset()
    if (!user) return
    const refresh = () => { void useJourneyStore.getState().refresh(); if (STAYS_ENABLED) void useStayStore.getState().refresh() }
    refresh()
    window.addEventListener('focus', refresh)
    return () => window.removeEventListener('focus', refresh)
  }, [user?.id])
  useEffect(() => {
    if (!STAYS_ENABLED) return
    let previous = useAppStore.getState().user?.id
    return useAppStore.subscribe(state => {
      const next = state.user?.id
      if (previous && next !== previous) clearStayDraft()
      previous = next
    })
  }, [])
  return (
    <Suspense fallback={<div className="card m-6 p-6" role="status">Loading…</div>}><Routes>
      <Route path="/operations" element={<LegacyOpsRedirect to="/ops/experiences" />} />
      <Route path="/studio" element={<LegacyOpsRedirect to="/ops/studio" />} />
      <Route path="/analytics" element={<LegacyOpsRedirect to="/ops/insights" />} />

      <Route element={<Layout />}>
        <Route path="/" element={<PremiumHomePage />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/guide" element={<GuidePage />} />
        {STAYS_ENABLED && <Route path="/stays" element={<StaysPage />} />}
        {STAYS_ENABLED && <Route path="/stays/book" element={<RequireRole><StayCheckoutPage /></RequireRole>} />}
        {STAYS_ENABLED && <Route path="/stays/:roomId" element={<RoomDetailPage />} />}
        <Route path="/immersive" element={<ImmersivePage />} />
        <Route path="/my" element={<RequireRole><MyPage /></RequireRole>} />
        <Route path="/experience" element={<Navigate to="/immersive" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>

      <Route path="/ops" element={<RequireOps><OpsShell /></RequireOps>}>
        <Route index element={<OpsDashboardPage />} />
        <Route path="experiences" element={<OperationsPage />} />
        {STAYS_ENABLED && <Route path="stays" element={<OpsStaysPage />} />}
        <Route path="studio" element={<StudioPage />} />
        <Route path="insights" element={<AnalyticsPage />} />
        <Route path="*" element={<Navigate to="/ops" replace />} />
      </Route>
    </Routes></Suspense>
  )
}
