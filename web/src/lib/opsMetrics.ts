import type { BookingStatus, JourneyBooking, SessionSlot } from './journey'
import type { OpsCohort } from './opsCohort'

export const STATUS_ORDER: BookingStatus[] = ['pending', 'confirmed', 'completed', 'declined', 'cancelled']

const SHANGHAI_DAY = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit',
})

export function shanghaiDay(iso: string) {
  const date = new Date(iso)
  return Number.isNaN(date.getTime()) ? '' : SHANGHAI_DAY.format(date)
}

export function byCohort(bookings: JourneyBooking[], cohort: OpsCohort) {
  return bookings.filter(booking => booking.batch_id === cohort)
}

export function countByStatus(bookings: JourneyBooking[]) {
  const counts = Object.fromEntries(STATUS_ORDER.map(status => [status, 0])) as Record<BookingStatus, number>
  bookings.forEach(booking => { counts[booking.status] += 1 })
  return counts
}

/** Pending requests are oldest first; settled requests are newest first. */
export function sortForReview(bookings: JourneyBooking[]) {
  return [...bookings].sort((a, b) => {
    const pendingA = a.status === 'pending' ? 0 : 1
    const pendingB = b.status === 'pending' ? 0 : 1
    if (pendingA !== pendingB) return pendingA - pendingB
    const timeA = Date.parse(a.created_at)
    const timeB = Date.parse(b.created_at)
    return pendingA === 0 ? timeA - timeB : timeB - timeA
  })
}

export function pendingQueue(bookings: JourneyBooking[]) {
  return bookings
    .filter(booking => booking.status === 'pending')
    .sort((a, b) => Date.parse(a.created_at) - Date.parse(b.created_at))
}

export function confirmedWithin(bookings: JourneyBooking[], now: number, days: number) {
  const end = now + days * 24 * 60 * 60 * 1000
  return bookings.filter(booking => {
    if (booking.status !== 'confirmed') return false
    const start = Date.parse(booking.sessions?.starts_at ?? '')
    return Number.isFinite(start) && start >= now && start <= end
  })
}

export function averageRating(bookings: JourneyBooking[]) {
  const ratings = bookings.flatMap(booking => typeof booking.feedback?.rating === 'number' ? [booking.feedback.rating] : [])
  if (!ratings.length) return null
  return ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length
}

export function recentFeedback(bookings: JourneyBooking[], limit = 3) {
  return bookings
    .filter(booking => booking.feedback && typeof booking.feedback.rating === 'number')
    .sort((a, b) => (Date.parse(b.feedback?.created_at ?? '') || 0) - (Date.parse(a.feedback?.created_at ?? '') || 0))
    .slice(0, limit)
}

/** participant_roster returns registered guest accounts, including those without activity. */
export interface RegisteredGuest { id: string; batch_id: string }

export function registeredCohortCounts(participants: RegisteredGuest[]) {
  const guests: Record<OpsCohort, Set<string>> = { demo: new Set(), 'pilot-01': new Set() }
  participants.forEach(participant => {
    if (participant.batch_id === 'demo' || participant.batch_id === 'pilot-01') guests[participant.batch_id].add(participant.id)
  })
  return { demo: guests.demo.size, 'pilot-01': guests['pilot-01'].size }
}

export function sessionBooked(session: Pick<SessionSlot, 'capacity' | 'available'>) {
  return Math.max(0, session.capacity - session.available)
}

export function upcomingSessions(sessions: SessionSlot[], now: number, days = 7) {
  const end = now + days * 24 * 60 * 60 * 1000
  return sessions
    .filter(session => {
      const start = Date.parse(session.starts_at)
      return Number.isFinite(start) && start >= now && start <= end
    })
    .sort((a, b) => Date.parse(a.starts_at) - Date.parse(b.starts_at))
}

export function todaySessions(sessions: SessionSlot[], now: number) {
  const today = shanghaiDay(new Date(now).toISOString())
  return sessions
    .filter(session => shanghaiDay(session.starts_at) === today)
    .sort((a, b) => Date.parse(a.starts_at) - Date.parse(b.starts_at))
}

export function relativeTime(iso: string, now: number, language: 'zh' | 'en') {
  const time = Date.parse(iso)
  if (!Number.isFinite(time)) return ''
  const minutes = Math.round((now - time) / 60000)
  if (minutes < 1) return language === 'zh' ? '刚刚' : 'Just now'
  if (minutes < 60) return language === 'zh' ? `${minutes} 分钟前` : `${minutes} min ago`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return language === 'zh' ? `${hours} 小时前` : `${hours} h ago`
  const days = Math.round(hours / 24)
  if (days < 7) return language === 'zh' ? `${days} 天前` : `${days} d ago`
  return new Intl.DateTimeFormat(language === 'zh' ? 'zh-CN' : 'en-GB', { timeZone: 'Asia/Shanghai', month: 'short', day: 'numeric' }).format(new Date(time))
}
