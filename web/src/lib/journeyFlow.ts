import type { GuideSignal } from '../types'
import type { Needs } from './journey'
import { safeSessionStorage } from './guideSignalStorage'

const CONTINUE_KEY = 'jj_continue_journey'
export function continuationPath(value: string | null): string | null {
  if (!value || value.length > 1000 || !/^\/(immersive|guide|my|stays(?:\/book)?)([?#]|$)/.test(value) || /[\\\r\n]/.test(value)) return null
  return value
}
export function rememberContinuation(path: string | null) {
  const safe = continuationPath(path)
  try { if (safe) safeSessionStorage()?.setItem(CONTINUE_KEY, safe) } catch { /* Continue without storage. */ }
}
export function readContinuation() {
  try { return continuationPath(safeSessionStorage()?.getItem(CONTINUE_KEY) ?? null) } catch { return null }
}
export function clearContinuation() { try { safeSessionStorage()?.removeItem(CONTINUE_KEY) } catch { /* Optional storage. */ } }

export function needsFromSignals(signals: GuideSignal[]): Partial<Needs> {
  const patch: Partial<Needs> = {}
  // Newest explicit values win. Missing information does not overwrite the guest's form.
  for (const signal of [...signals].sort((a,b) => b.createdAt-a.createdAt)) {
    if (patch.minutes === undefined && signal.stayHours !== undefined) patch.minutes = Math.min(1440, Math.round(signal.stayHours*60))
    if (patch.budget === undefined && signal.budget !== undefined) patch.budget = signal.budget
    if (patch.party === undefined && signal.partyType !== 'unspecified') patch.party = signal.partyType
    if (patch.interest === undefined) {
      const topic = ['experience','craft','culture'].find(value => signal.topics.includes(value))
      if (topic) patch.interest = topic as Needs['interest']
    }
  }
  return patch
}

export function safeDuration(value: string | null) {
  const minutes = Number(value)
  return Number.isFinite(minutes) && minutes > 0 && minutes <= 1440 ? minutes : null
}

/** A logical submission keeps its key on a network failure; a new submission gets a new key. */
export function createIntentionRequest() {
  let key = crypto.randomUUID()
  return { current: () => key, renew: () => { key = crypto.randomUUID() } }
}
