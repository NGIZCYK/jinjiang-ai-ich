import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useAppStore } from './store'
import type { Language } from './i18n'

/** The two cohorts used by the course demo. Keep the ids in sync with the database. */
export type OpsCohort = 'demo' | 'pilot-01'

export const OPS_COHORTS: { id: OpsCohort; zh: string; en: string }[] = [
  { id: 'demo', zh: '体验组', en: 'Experience group' },
  { id: 'pilot-01', zh: 'Study 01', en: 'Study 01' },
]

const COHORT_KEY = 'jj_ops_cohort'

export function isOpsCohort(value: unknown): value is OpsCohort {
  return value === 'demo' || value === 'pilot-01'
}

export function cohortLabel(id: OpsCohort, language: Language) {
  const row = OPS_COHORTS.find(item => item.id === id) ?? OPS_COHORTS[0]
  return language === 'zh' ? row.zh : row.en
}

function readStoredCohort(): OpsCohort | null {
  try {
    const value = sessionStorage.getItem(COHORT_KEY)
    return isOpsCohort(value) ? value : null
  } catch {
    return null
  }
}

interface OpsCohortValue {
  cohort: OpsCohort
  setCohort: (cohort: OpsCohort) => void
}

// A no-provider fallback keeps single-page tests and previews renderable.
const OpsCohortContext = createContext<OpsCohortValue>({ cohort: 'demo', setCohort: () => {} })

export function OpsCohortProvider({ children }: { children: ReactNode }) {
  const accountBatch = useAppStore(state => state.batch)
  const [cohort, setState] = useState<OpsCohort>(() => readStoredCohort() ?? (accountBatch === 'pilot-01' ? 'pilot-01' : 'demo'))

  useEffect(() => {
    // The account batch is only a starting point; an explicit choice wins for this tab.
    if (readStoredCohort()) return
    if (accountBatch === 'pilot-01') setState('pilot-01')
    else if (accountBatch === 'demo') setState('demo')
  }, [accountBatch])

  const value = useMemo<OpsCohortValue>(() => ({
    cohort,
    setCohort: next => {
      setState(next)
      try { sessionStorage.setItem(COHORT_KEY, next) } catch { /* The in-memory choice still works. */ }
    },
  }), [cohort])

  return <OpsCohortContext.Provider value={value}>{children}</OpsCohortContext.Provider>
}

export function useOpsCohort() {
  return useContext(OpsCohortContext)
}
