import { Navigate, useLocation } from 'react-router-dom'

/** Keeps old bookmarks and course links working after the /ops move. */
export function LegacyOpsRedirect({ to }: { to: string }) {
  const { search, hash } = useLocation()
  return <Navigate to={{ pathname: to, search, hash }} replace />
}
