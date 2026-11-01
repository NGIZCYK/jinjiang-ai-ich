// @vitest-environment jsdom
import { createElement } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { LanguageProvider } from '../src/lib/i18n'
import { CATALOG, type JourneyBooking } from '../src/lib/journey'
import { OpsDashboardPage } from '../src/pages/ops/OpsDashboardPage'
import { rpc } from '../src/lib/cloud'

const state = vi.hoisted(() => ({ cohort: 'demo', journey: {} as Record<string, unknown> }))
vi.mock('../src/lib/cloud', () => ({ cloud: null, rpc: vi.fn() }))
vi.mock('../src/lib/journeyStore', () => ({ useJourneyStore: () => state.journey }))
vi.mock('../src/lib/store', () => ({ useAppStore: (select: (value: unknown) => unknown) => select({ user: { id: 'operator', role: 'ops' }, contents: [] }) }))
vi.mock('../src/hooks/useMediaQuery', () => ({ useMediaQuery: () => true }))
vi.mock('../src/lib/opsCohort', async original => ({ ...await original<typeof import('../src/lib/opsCohort')>(), useOpsCohort: () => ({ cohort: state.cohort }) }))

function booking(id: string, party_size: number, extra: Partial<JourneyBooking> = {}): JourneyBooking {
  return { id, party_size, user_id: 'requester', session_id: id, status: 'confirmed', reason: '', created_at: '2026-10-20T00:00:00Z',
    batch_id: 'demo', recommendation_id: null, sessions: { starts_at: '2026-11-02T06:00:00Z', experience_id: 'workshop' }, ...extra }
}
function show() { return createElement(LanguageProvider, null, createElement(MemoryRouter, null, createElement(OpsDashboardPage))) }
function section(title: string) { return within(screen.getByRole('heading', { name: title }).closest('section')!) }

beforeEach(() => {
  localStorage.clear(); vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(new Date('2026-11-01T00:00:00Z'))
  state.cohort = 'demo'
  state.journey = { loading: false, error: '', refresh: vi.fn(), catalog: CATALOG,
    sessions: [{ id: 'shared-session', experience_id: 'workshop', starts_at: '2026-11-02T06:00:00Z', capacity: 8, available: 3 }],
    bookings: [booking('one', 2), booking('two', 4), booking('three', 1), booking('study', 5, { batch_id: 'pilot-01' }),
      booking('old-session', 1, { status: 'completed', sessions: { starts_at: '2026-10-20T06:00:00Z', experience_id: 'workshop' }, feedback: { rating: 4, comment: 'Newest submitted feedback', created_at: '2026-11-01T01:00:00Z' } }),
      booking('new-session', 1, { status: 'completed', sessions: { starts_at: '2026-10-30T06:00:00Z', experience_id: 'workshop' }, feedback: { rating: 2, comment: 'Earlier submitted feedback', created_at: '2026-10-30T01:00:00Z' } })] }
  vi.mocked(rpc).mockReset().mockResolvedValue([
    { id: 'requester', batch_id: 'demo' }, { id: 'no-request', batch_id: 'demo' }, { id: 'study', batch_id: 'pilot-01' },
  ])
})
afterEach(() => { cleanup(); vi.useRealTimers() })

describe('operations dashboard reporting scopes', () => {
  it('uses the guest roster, distinguishes requests and places, and dates feedback by submission', async () => {
    render(show())
    await screen.findByText('2 · 67%')
    expect(rpc).toHaveBeenCalledWith('participant_roster')
    expect(section('注册住客账号分布').getByText('1 · 33%')).toBeTruthy()
    const kpis = within(screen.getByRole('region', { name: '运营概览指标' }))
    expect(kpis.getByText('3 条')).toBeTruthy()
    expect(kpis.getByText('当前批次 · 合计 7 个名额（人次）')).toBeTruthy()
    expect(kpis.getByText('当前批次 · 基于 2 条反馈')).toBeTruthy()
    expect(kpis.getByText('全批次共享 · 全部已审核内容')).toBeTruthy()
    const feedback = section('最近反馈').getAllByText(/submitted feedback/)
    expect(feedback.map(element => element.textContent)).toEqual(['Newest submitted feedback', 'Earlier submitted feedback'])
    expect(document.querySelector('time')?.dateTime).toBe('2026-11-01T01:00:00Z')
  })

  it('changes cohort requests while retaining shared capacity and the complete roster distribution', async () => {
    const view = render(show()); await screen.findByText('2 · 67%')
    state.cohort = 'pilot-01'; view.rerender(show())
    expect(screen.getByText('当前批次 · 合计 5 个名额（人次）')).toBeTruthy()
    expect(section('未来 7 天场次').getByText('5/8')).toBeTruthy()
    expect(section('未来 7 天场次').getByText('全批次共享 · 已占名额 / 总容量')).toBeTruthy()
    expect(section('注册住客账号分布').getByText('2 · 67%')).toBeTruthy()
    expect(section('最近反馈').getByText('还没有反馈')).toBeTruthy()
  })

  it('shows a failed roster request without presenting invented zero counts', async () => {
    vi.mocked(rpc).mockRejectedValueOnce(new Error('network failure'))
    render(show())
    await screen.findByText('注册账号分布暂时无法更新，请刷新重试。')
    expect(section('注册住客账号分布').queryByText('0 · 0%')).toBeNull()
  })
})
