import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useJourneyStore } from '../../lib/journeyStore'
import { useAppStore } from '../../lib/store'
import { rpc } from '../../lib/cloud'
import { useLanguage } from '../../lib/i18n'
import { titleFor } from '../../lib/journey'
import { useMediaQuery } from '../../hooks/useMediaQuery'
import { useOpsCohort, cohortLabel, OPS_COHORTS } from '../../lib/opsCohort'
import {
  averageRating, byCohort, registeredCohortCounts, confirmedWithin, pendingQueue,
  recentFeedback, sessionBooked, upcomingSessions, type RegisteredGuest,
} from '../../lib/opsMetrics'
import { OpsEmpty, OpsKpi, OpsNotice, OpsPageHeader, OpsStatus } from '../../components/ops/OpsUI'

export function OpsDashboardPage() {
  const { language } = useLanguage()
  const zh = language === 'zh'
  const { cohort } = useOpsCohort()
  const { bookings, sessions, catalog, loading, error, refresh } = useJourneyStore()
  const contents = useAppStore(state => state.contents)
  const owner = useAppStore(state => state.user?.id)
  const [refreshing, setRefreshing] = useState(false)
  const [participants, setParticipants] = useState<RegisteredGuest[] | null>(null)
  const [rosterLoading, setRosterLoading] = useState(false)
  const [rosterError, setRosterError] = useState(false)
  const [rosterReload, setRosterReload] = useState(0)
  const isWide = useMediaQuery('(min-width: 768px)')
  const now = Date.now()

  const scoped = useMemo(() => byCohort(bookings, cohort), [bookings, cohort])
  const pending = useMemo(() => pendingQueue(scoped), [scoped])
  const confirmed = useMemo(() => confirmedWithin(scoped, now, 7), [scoped, now])
  const rating = useMemo(() => averageRating(scoped), [scoped])
  const ratingCount = scoped.filter(booking => typeof booking.feedback?.rating === 'number').length
  const confirmedPlaces = confirmed.reduce((total, booking) => total + booking.party_size, 0)
  const feedback = useMemo(() => recentFeedback(scoped, 3), [scoped])
  const upcoming = useMemo(() => upcomingSessions(sessions, now, 7).slice(0, 6), [sessions, now])
  const counts = useMemo(() => registeredCohortCounts(participants ?? []), [participants])
  const total = counts.demo + counts['pilot-01']

  useEffect(() => {
    let active = true
    setRosterLoading(true)
    setRosterError(false)
    void rpc<RegisteredGuest[]>('participant_roster').then(rows => {
      if (!Array.isArray(rows)) throw new Error('INVALID_ROSTER')
      if (active) setParticipants(rows)
    }).catch(() => { if (active) setRosterError(true) })
      .finally(() => { if (active) setRosterLoading(false) })
    return () => { active = false }
  }, [owner, rosterReload])

  async function reload() {
    setRefreshing(true)
    setRosterReload(value => value + 1)
    try {
      await refresh()
      if (useAppStore.getState().user?.role === 'ops') await useAppStore.getState().refreshContents().catch(() => {})
    } finally {
      setRefreshing(false)
    }
  }

  const timeFormat = new Intl.DateTimeFormat(zh ? 'zh-CN' : 'en-GB', { timeZone: 'Asia/Shanghai', hour: '2-digit', minute: '2-digit', hour12: false })
  const dayFormat = new Intl.DateTimeFormat(zh ? 'zh-CN' : 'en-GB', { timeZone: 'Asia/Shanghai', month: 'short', day: 'numeric' })
  const feedbackFormat = new Intl.DateTimeFormat(zh ? 'zh-CN' : 'en-GB', { timeZone: 'Asia/Shanghai', year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false })

  return <div className="ops-page ops-dashboard">
    <OpsPageHeader
      eyebrow="OPERATIONS OVERVIEW"
      title={zh ? '运营总览' : 'Operations overview'}
      description={zh ? '申请与反馈按当前批次查看；场次和内容库为全批次共享。' : 'Requests and feedback follow the selected cohort. Sessions and the content library are shared across cohorts.'}
      actions={<button type="button" className="ops-btn ops-btn-secondary" disabled={refreshing || loading || rosterLoading} onClick={() => void reload()}>
        {refreshing ? (zh ? '正在刷新…' : 'Refreshing…') : (zh ? '刷新数据' : 'Refresh')}
      </button>}
    />

    {error && <OpsNotice error>{zh ? '暂时无法更新数据，已保留上一次读取结果。' : 'Data could not be refreshed. The last loaded values are kept.'} <button type="button" className="ops-link" onClick={() => void reload()}>{zh ? '重试' : 'Retry'}</button></OpsNotice>}

    <section className="ops-kpis" aria-label={zh ? '运营概览指标' : 'Operations summary'}>
      <OpsKpi label={zh ? '待处理申请' : 'Pending requests'} value={zh ? `${pending.length} 条` : `${pending.length} requests`} meta={zh ? '当前批次 · 按提交先后处理' : 'Selected cohort · oldest first'} />
      <OpsKpi label={zh ? '未来 7 天已确认申请' : 'Confirmed requests · next 7 days'} value={zh ? `${confirmed.length} 条` : `${confirmed.length} requests`} meta={zh ? `当前批次 · 合计 ${confirmedPlaces} 个名额（人次）` : `Selected cohort · ${confirmedPlaces} places in total (not unique guests)`} />
      <OpsKpi label={zh ? '平均流程评分' : 'Mean journey rating'} value={rating === null ? '—' : rating.toFixed(1)} meta={zh ? `当前批次 · 基于 ${ratingCount} 条反馈` : `Selected cohort · based on ${ratingCount} feedback entries`} />
      <OpsKpi label={zh ? '内容库条目' : 'Content library'} value={contents.length} meta={zh ? '全批次共享 · 全部已审核内容' : 'All cohorts · reviewed content'} />
    </section>

    <div className="ops-dash-grid">
      <section className="ops-card ops-span-8" aria-labelledby="ops-pending-title">
        <div className="ops-card-head">
          <div>
            <h2 id="ops-pending-title">{zh ? '待处理队列' : 'Pending queue'}</h2>
            <p>{zh ? `当前批次 ${cohortLabel(cohort, language)} · 最早提交的申请排在前面` : `${cohortLabel(cohort, language)} · Oldest requests first`}</p>
          </div>
          <Link className="ops-btn ops-btn-secondary ops-btn-sm" to="/ops/experiences">{zh ? '查看全部申请' : 'All requests'} <span aria-hidden="true">→</span></Link>
        </div>
        {pending.length ? (isWide ? <div className="ops-table-wrap">
          <table className="ops-table">
            <caption className="sr-only">{zh ? '待处理体验申请' : 'Pending experience requests'}</caption>
            <thead><tr>
              <th scope="col">{zh ? '申请' : 'Request'}</th>
              <th scope="col">{zh ? '体验' : 'Experience'}</th>
              <th scope="col">{zh ? '场次' : 'Session'}</th>
              <th scope="col" className="ops-num">{zh ? '人数' : 'Guests'}</th>
              <th scope="col">{zh ? '状态' : 'Status'}</th>
            </tr></thead>
            <tbody>
              {pending.slice(0, 5).map(booking => <tr key={booking.id}>
                <td><span className="ops-ref">{booking.id.slice(0, 8)}</span><span className="ops-meta">{booking.user_id.slice(0, 8)}</span></td>
                <td>{titleFor(booking.sessions?.experience_id ?? '', language, catalog)}</td>
                <td>{booking.sessions?.starts_at ? dayFormat.format(new Date(booking.sessions.starts_at)) : '—'}</td>
                <td className="ops-num">{booking.party_size}</td>
                <td><OpsStatus status={booking.status} language={language} /></td>
              </tr>)}
            </tbody>
          </table>
        </div> : <div className="ops-record-list">
          {pending.slice(0, 5).map(booking => <article className="ops-record" key={booking.id}>
            <div className="ops-record-head">
              <span className="ops-ref">{booking.id.slice(0, 8)}</span>
              <OpsStatus status={booking.status} language={language} />
            </div>
            <h3>{titleFor(booking.sessions?.experience_id ?? '', language, catalog)}</h3>
            <p>{booking.sessions?.starts_at ? dayFormat.format(new Date(booking.sessions.starts_at)) : '—'} · {booking.party_size} {zh ? '人' : 'guests'}</p>
            <div className="ops-actions"><Link className="ops-btn ops-btn-secondary ops-btn-sm" to="/ops/experiences">{zh ? '查看与处理' : 'View & review'} <span aria-hidden="true">→</span></Link></div>
          </article>)}
        </div>) : <OpsEmpty
          title={zh ? '当前没有待处理申请' : 'No pending requests'}
          action={<Link className="ops-btn ops-btn-secondary ops-btn-sm" to="/ops/experiences">{zh ? '打开体验管理' : 'Open experiences'}</Link>}
        >{zh ? '新的体验意向提交后会出现在这里。' : 'New experience requests will appear here.'}</OpsEmpty>}
      </section>

      <div className="ops-span-4 ops-stack">
        <section className="ops-card" aria-labelledby="ops-week-title">
          <div className="ops-card-head"><div><h2 id="ops-week-title">{zh ? '未来 7 天场次' : 'Sessions · next 7 days'}</h2><p>{zh ? '全批次共享 · 已占名额 / 总容量' : 'All cohorts · occupied places / capacity'}</p></div></div>
          {upcoming.length ? <div className="ops-session-list">
            {upcoming.map(session => {
              const booked = sessionBooked(session)
              return <div className="ops-session-row" key={session.id}>
                <span className="ops-session-time">{timeFormat.format(new Date(session.starts_at))}</span>
                <span>
                  <strong>{titleFor(session.experience_id, language, catalog)}</strong>
                  <small>{dayFormat.format(new Date(session.starts_at))}</small>
                </span>
                <span className="ops-session-load">{booked}/{session.capacity}</span>
              </div>
            })}
          </div> : <OpsEmpty title={zh ? '未来 7 天暂无场次' : 'No sessions in the next 7 days'} />}
        </section>

        <section className="ops-card" aria-labelledby="ops-cohort-title">
          <div className="ops-card-head"><div><h2 id="ops-cohort-title">{zh ? '注册住客账号分布' : 'Registered guest accounts by cohort'}</h2><p>{zh ? '全部批次 · 包含未提交意向的住客账号，不含运营账号。账号数不代表独立真人测试人数。' : 'All cohorts · includes guests without requests, excludes operations accounts. Account counts do not establish unique human testers.'}</p></div></div>
          {rosterLoading && <p role="status">{zh ? '正在读取注册账号…' : 'Loading registered accounts…'}</p>}
          {rosterError && <OpsNotice error>{zh ? '注册账号分布暂时无法更新，请刷新重试。' : 'Registered account counts could not be updated. Refresh to retry.'}</OpsNotice>}
          {participants !== null && <div className="ops-cohort-bars">
            {OPS_COHORTS.map(item => {
              const count = counts[item.id]
              const percent = total ? Math.round((count / total) * 100) : 0
              return <div className="ops-cohort-bar" key={item.id}>
                <div className="ops-cohort-bar-head"><span>{cohortLabel(item.id, language)}</span><strong>{count} · {percent}%</strong></div>
                <div className="ops-bar" aria-hidden="true"><span style={{ width: `${percent}%` }} /></div>
              </div>
            })}
          </div>}
        </section>

        <section className="ops-card" aria-labelledby="ops-feedback-title">
          <div className="ops-card-head"><div><h2 id="ops-feedback-title">{zh ? '最近反馈' : 'Recent feedback'}</h2><p>{zh ? '当前批次 · 按反馈提交时间排列' : 'Selected cohort · newest feedback submissions first'}</p></div></div>
          {feedback.length ? <div className="ops-feedback-list">
            {feedback.map(booking => <div className="ops-feedback" key={booking.id}>
              <div className="ops-feedback-head">
                <strong>{booking.feedback?.rating}/5</strong>
                <span>{booking.feedback?.created_at && Number.isFinite(Date.parse(booking.feedback.created_at)) ? <time dateTime={booking.feedback.created_at}>{zh ? '提交于 ' : 'Submitted '}{feedbackFormat.format(new Date(booking.feedback.created_at))}</time> : (zh ? '提交时间未记录' : 'Submission time unavailable')}</span>
              </div>
              <p>{booking.feedback?.comment || (zh ? '未填写文字' : 'No written comment')}</p>
            </div>)}
          </div> : <OpsEmpty title={zh ? '还没有反馈' : 'No feedback yet'} />}
        </section>
      </div>
    </div>
  </div>
}
