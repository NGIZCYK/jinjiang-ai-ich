import { describe, expect, it, vi } from 'vitest'
import { CATALOG, type JourneyBooking, type SessionSlot } from '../src/lib/journey'
import {
  averageRating, byCohort, registeredCohortCounts, confirmedWithin, countByStatus, pendingQueue,
  recentFeedback, relativeTime, sessionBooked, shanghaiDay, sortForReview, upcomingSessions,
} from '../src/lib/opsMetrics'

const now = Date.parse('2026-11-01T04:00:00Z')
const booking = (id: string, status: JourneyBooking['status'], created: string, extra: Partial<JourneyBooking> = {}): JourneyBooking => ({
  id, user_id: `guest-${id}`, session_id: 's1', party_size: 2, status, reason: '', created_at: created,
  batch_id: 'demo', recommendation_id: null, sessions: { starts_at: '2026-11-02T02:00:00Z', experience_id: 'workshop' }, ...extra,
})

describe('operations metrics', () => {
  const rows = [
    booking('a', 'pending', '2026-11-01T02:00:00Z'),
    booking('b', 'pending', '2026-11-01T01:00:00Z'),
    booking('c', 'completed', '2026-10-30T02:00:00Z', { feedback: { rating: 4, comment: 'Good' } }),
    booking('d', 'declined', '2026-10-31T02:00:00Z'),
    booking('e', 'confirmed', '2026-10-29T02:00:00Z', { sessions: { starts_at: '2026-11-03T02:00:00Z', experience_id: 'workshop' } }),
  ]

  it('filters by cohort and counts statuses', () => {
    expect(byCohort(rows, 'demo')).toHaveLength(5)
    expect(byCohort(rows, 'pilot-01')).toHaveLength(0)
    expect(countByStatus(rows)).toMatchObject({ pending: 2, confirmed: 1, completed: 1, declined: 1, cancelled: 0 })
  })

  it('sorts pending first and oldest first, while settled requests are newest first', () => {
    expect(sortForReview(rows).map(row => row.id)).toEqual(['b', 'a', 'd', 'c', 'e'])
    expect(pendingQueue(rows).map(row => row.id)).toEqual(['b', 'a'])
  })

  it('counts confirmations in the next seven days and averages feedback', () => {
    expect(confirmedWithin(rows, now, 7).map(row => row.id)).toEqual(['e'])
    expect(confirmedWithin(rows, now, 1)).toHaveLength(0)
    expect(averageRating(rows)).toBe(4)
    expect(averageRating(rows.filter(row => row.id !== 'c'))).toBeNull()
  })

  it('returns feedback entries', () => {
    expect(recentFeedback(rows).map(row => row.id)).toEqual(['c'])
  })

  it('counts registered guest accounts even without requests, deduplicating roster ids', () => {
    expect(registeredCohortCounts([
      { id: 'registered-without-booking', batch_id: 'demo' },
      { id: 'registered-without-booking', batch_id: 'demo' },
      { id: 'study-guest', batch_id: 'pilot-01' },
    ])).toEqual({ demo: 1, 'pilot-01': 1 })
    expect(registeredCohortCounts([])).toEqual({ demo: 0, 'pilot-01': 0 })
  })

  it('orders recent feedback by submission time instead of session time', () => {
    const feedbackRows = [
      booking('older-feedback', 'completed', '2026-10-10T00:00:00Z', {
        sessions: { starts_at: '2026-10-30T02:00:00Z', experience_id: 'workshop' },
        feedback: { rating: 4, comment: 'Older submission', created_at: '2026-10-30T06:00:00Z' },
      }),
      booking('latest-feedback', 'completed', '2026-10-01T00:00:00Z', {
        sessions: { starts_at: '2026-10-20T02:00:00Z', experience_id: 'workshop' },
        feedback: { rating: 5, comment: 'Latest submission', created_at: '2026-11-01T06:00:00Z' },
      }),
      booking('missing-date', 'completed', '2026-10-15T00:00:00Z', { feedback: { rating: 3, comment: 'No date' } }),
    ]
    expect(recentFeedback(feedbackRows).map(row => row.id)).toEqual(['latest-feedback', 'older-feedback', 'missing-date'])
    expect(recentFeedback(feedbackRows, 1)[0].id).toBe('latest-feedback')
  })

  it('derives session load and upcoming windows', () => {
    const sessions: SessionSlot[] = [
      { id: 's1', experience_id: 'workshop', starts_at: '2026-11-02T02:00:00Z', capacity: 8, available: 3 },
      { id: 's2', experience_id: 'scroll', starts_at: '2026-10-30T02:00:00Z', capacity: 8, available: 8 },
    ]
    expect(sessionBooked(sessions[0])).toBe(5)
    expect(upcomingSessions(sessions, now, 7).map(session => session.id)).toEqual(['s1'])
  })

  it('formats Shanghai days and relative times without leaking invalid dates', () => {
    vi.useFakeTimers()
    try {
      vi.setSystemTime(now)
      expect(shanghaiDay('2026-11-02T02:00:00Z')).toBe('2026-11-02')
      expect(relativeTime('2026-11-01T03:58:00Z', now, 'zh')).toBe('2 分钟前')
      expect(relativeTime('2026-11-01T03:58:00Z', now, 'en')).toBe('2 min ago')
      expect(relativeTime('not-a-date', now, 'zh')).toBe('')
    } finally {
      vi.useRealTimers()
    }
  })

  it('keeps the catalog fixture available to the dashboard', () => {
    expect(CATALOG.find(item => item.id === 'workshop')?.minutes).toBe(90)
  })
})
