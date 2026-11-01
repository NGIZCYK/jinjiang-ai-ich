import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAppStore } from '../../lib/store'
import { OpsGate } from './OpsGate'

/** Keeps the operations area outside the guest layout and role model. */
export function RequireOps({ children }: { children: ReactNode }) {
  const ready = useAppStore(state => state.ready)
  const user = useAppStore(state => state.user)
  const authError = useAppStore(state => state.authError)
  const location = useLocation()

  if (!ready) return <OpsGate state="loading" />
  if (!user) {
    const next = location.pathname + location.search + location.hash
    return <Navigate replace to={`/auth?next=${encodeURIComponent(next)}`} />
  }
  if (authError) return <OpsGate state="error" detail={authError} />
  if (user.role !== 'ops') return <OpsGate state="forbidden" />
  return <>{children}</>
}
