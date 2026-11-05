import { useEffect, useMemo, useState } from 'react'
import { rpc } from '../lib/cloud'
import { useJourneyStore } from '../lib/journeyStore'
import { slotTime, statusLabel, titleFor, type BookingStatus } from '../lib/journey'
import { useAction, useCopy } from '../components/JourneyCommon'
import { BookingHistory } from './MyPage'
import { localizedUserName } from '../lib/i18n'
import { useOpsCohort, cohortLabel } from '../lib/opsCohort'
import { STATUS_ORDER, byCohort, countByStatus, relativeTime, shanghaiDay, sortForReview } from '../lib/opsMetrics'
import { useMediaQuery } from '../hooks/useMediaQuery'
import { OpsDrawer, OpsEmpty, OpsNotice, OpsPageHeader, OpsSegmented, OpsStatus, OpsTabs } from '../components/ops/OpsUI'

interface Participant { id: string; name: string; batch_id: 'demo' | 'pilot-01'; created_at: string; has_activity: boolean }

export function OperationsPage() {
  const { language, t } = useCopy()
  const zh = language === 'zh'
  const { cohort } = useOpsCohort()
  const { bookings, catalog, refresh, loading, error } = useJourneyStore()
  const [tab, setTab] = useState<'requests' | 'participants'>('requests')
  const [status, setStatus] = useState<'all' | BookingStatus>('pending')
  const [experience, setExperience] = useState('all')
  const [date, setDate] = useState('')
  const [search, setSearch] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [declining, setDeclining] = useState(false)
  const [reason, setReason] = useState('')
  const [participants, setParticipants] = useState<Participant[]>([])
  const [participantBatch, setParticipantBatch] = useState<Record<string, 'demo' | 'pilot-01'>>({})
  const [participantLoading, setParticipantLoading] = useState(false)
  const [participantError, setParticipantError] = useState('')
  const action = useAction()
  const isWide = useMediaQuery('(min-width: 768px)')
  const now = Date.now()

  const cohortRows = useMemo(() => byCohort(bookings, cohort), [bookings, cohort])
  const baseRows = useMemo(() => {
    const needle = search.trim().toLowerCase()
    return cohortRows.filter(booking => {
      if (experience !== 'all' && booking.sessions?.experience_id !== experience) return false
      if (date && shanghaiDay(booking.sessions?.starts_at ?? '') !== date) return false
      if (!needle) return true
      return booking.id.toLowerCase().includes(needle) || booking.user_id.toLowerCase().includes(needle)
    })
  }, [cohortRows, experience, date, search])
  const counts = useMemo(() => countByStatus(baseRows), [baseRows])
  const rows = useMemo(() => sortForReview(baseRows.filter(booking => status === 'all' || booking.status === status)), [baseRows, status])
  const selected = useMemo(() => bookings.find(booking => booking.id === selectedId) ?? null, [bookings, selectedId])

  const statusItems = useMemo(() => [
    { id: 'all', label: zh ? '全部' : 'All', count: baseRows.length },
    ...STATUS_ORDER.map(item => ({ id: item, label: statusLabel(item, language), count: counts[item] })),
  ], [baseRows.length, counts, language, zh])

  useEffect(() => {
    if (selectedId && !bookings.some(booking => booking.id === selectedId)) setSelectedId(null)
  }, [bookings, selectedId])

  useEffect(() => {
    setSelectedId(null)
    setDeclining(false)
  }, [cohort])

  async function loadParticipants() {
    setParticipantLoading(true)
    setParticipantError('')
    try {
      const roster = await rpc<Participant[]>('participant_roster')
      if (!Array.isArray(roster)) throw new Error(t('参与者数据暂不可用，请重试。', 'Participant data is unavailable. Please retry.'))
      setParticipants(roster)
      setParticipantBatch(Object.fromEntries(roster.map(item => [item.id, item.batch_id])))
    } catch (loadError) {
      setParticipantError(loadError instanceof Error ? loadError.message : String(loadError))
    } finally {
      setParticipantLoading(false)
    }
  }

  useEffect(() => {
    if (tab === 'participants' && !participants.length && !participantLoading) void loadParticipants()
  }, [tab])

  function openBooking(id: string) {
    action.clear()
    setSelectedId(id)
    setDeclining(false)
    setReason('')
  }

  function closeDrawer() {
    setSelectedId(null)
    setDeclining(false)
    setReason('')
  }

  async function transition(id: string, next: BookingStatus) {
    const ok = await action.run(async () => {
      await rpc('transition_booking', { p_id: id, p_status: next, p_reason: reason || '' })
      await refresh()
    }, t('处理结果已保存，住客可刷新查看。', 'Saved. The guest can refresh to view this result.'))
    if (ok) closeDrawer()
  }

  async function assignBatch(participant: Participant) {
    const next = participantBatch[participant.id] ?? participant.batch_id
    await action.run(async () => {
      await rpc('assign_guest_batch', { p_user: participant.id, p_batch: next })
      await loadParticipants()
    }, t('测试批次已更新。', 'The participant cohort was updated.'))
  }

  const drawerFooter = selected ? <>
    {selected.status === 'pending' && !declining && <>
      <button type="button" className="ops-btn ops-btn-primary" disabled={action.busy} onClick={() => void transition(selected.id, 'confirmed')}>
        {t('确认名额', 'Confirm places')}
      </button>
      <button type="button" className="ops-btn ops-btn-danger" disabled={action.busy} onClick={() => setDeclining(true)}>
        {t('未通过并说明原因', 'Decline with reason')}
      </button>
    </>}
    {selected.status === 'pending' && declining && <>
      <button type="button" className="ops-btn ops-btn-danger" disabled={action.busy || !reason.trim()} onClick={() => void transition(selected.id, 'declined')}>
        {t('确认未通过', 'Confirm decline')}
      </button>
      <button type="button" className="ops-btn ops-btn-secondary" disabled={action.busy} onClick={() => { setDeclining(false); setReason('') }}>
        {t('取消', 'Cancel')}
      </button>
    </>}
    {selected.status === 'confirmed' && <button type="button" className="ops-btn ops-btn-primary" disabled={action.busy} onClick={() => void transition(selected.id, 'completed')}>
      {t('标记流程完成', 'Mark journey complete')}
    </button>}
    {!['pending', 'confirmed'].includes(selected.status) && <button type="button" className="ops-btn ops-btn-secondary" onClick={closeDrawer}>
      {t('关闭', 'Close')}
    </button>}
  </> : null

  return <div className="ops-page ops-experiences">
    <OpsPageHeader
      eyebrow="EXPERIENCE OPERATIONS"
      title={t('体验管理', 'Experience management')}
      description={t('查看体验意向、确认名额并跟进处理进度。先处理待处理申请，再按需管理参与者与批次。', 'Review experience preferences, confirm places and follow progress. Handle pending requests first, then manage participants and cohorts when needed.')}
      actions={<button type="button" className="ops-btn ops-btn-secondary" disabled={loading} onClick={() => void refresh()}>
        {loading ? t('同步中…', 'Syncing…') : t('刷新', 'Refresh')}
      </button>}
    />

    <OpsTabs
      label={t('体验管理视图', 'Experience management views')}
      value={tab}
      onChange={id => setTab(id as 'requests' | 'participants')}
      items={[
        { id: 'requests', label: t('申请处理', 'Requests'), count: cohortRows.length },
        { id: 'participants', label: t('参与者与批次', 'Participants & cohorts'), count: participants.length },
      ]}
      panelId={id => `ops-exp-${id}`}
    />

    {(error || action.message) && <OpsNotice error={!!error || action.failed}>{error || action.message}</OpsNotice>}

    {tab === 'requests' ? <div role="tabpanel" id="ops-exp-requests" aria-labelledby="ops-exp-requests-tab" className="ops-tabpanel">
      <OpsSegmented
        label={t('按状态筛选', 'Filter by status')}
        value={status}
        onChange={id => setStatus(id as 'all' | BookingStatus)}
        items={statusItems}
      />

      <div className="ops-toolbar">
        <label className="ops-field">
          <span>{t('体验', 'Experience')}</span>
          <select className="ops-select" value={experience} onChange={event => setExperience(event.target.value)}>
            <option value="all">{t('全部', 'All')}</option>
            {catalog.map(item => <option key={item.id} value={item.id}>{titleFor(item.id, language, catalog)}</option>)}
          </select>
        </label>
        <label className="ops-field">
          <span>{t('北京时间日期', 'Shanghai date')}</span>
          <input className="ops-input" type="date" value={date} onChange={event => setDate(event.target.value)} />
        </label>
        <label className="ops-field ops-toolbar-grow">
          <span>{t('搜索申请编号或住客编号', 'Search request or guest reference')}</span>
          <input className="ops-input" value={search} maxLength={80} onChange={event => setSearch(event.target.value)} />
        </label>
      </div>

      {loading && !cohortRows.length && <OpsNotice>{t('正在读取申请…', 'Loading requests…')}</OpsNotice>}

      {rows.length === 0 ? <OpsEmpty
        title={t('没有符合筛选的申请', 'No matching requests')}
        action={status !== 'all' || experience !== 'all' || date || search ? <button type="button" className="ops-btn ops-btn-secondary ops-btn-sm" onClick={() => { setStatus('all'); setExperience('all'); setDate(''); setSearch('') }}>
          {t('清除筛选', 'Clear filters')}
        </button> : undefined}
      >
        {t('可以切换状态或批次，查看其他申请。', 'Switch status or cohort to see other requests.')}
      </OpsEmpty> : isWide ? <div className="ops-card" style={{ padding: 0 }}>
        <div className="ops-table-wrap">
          <table className="ops-table">
            <caption className="sr-only">{t('体验申请列表', 'Experience requests')}</caption>
            <thead><tr>
              <th scope="col">{t('申请', 'Request')}</th>
              <th scope="col">{t('体验', 'Experience')}</th>
              <th scope="col">{t('场次', 'Session')}</th>
              <th scope="col" className="ops-num">{t('人数', 'Guests')}</th>
              <th scope="col">{t('状态', 'Status')}</th>
              <th scope="col" className="ops-table-actions">{t('操作', 'Action')}</th>
            </tr></thead>
            <tbody>
              {rows.map(booking => <tr key={booking.id}>
                <td>
                  <span className="ops-ref">{booking.id.slice(0, 8)}</span>
                  <span className="ops-meta">{relativeTime(booking.created_at, now, language)}</span>
                </td>
                <td>{titleFor(booking.sessions?.experience_id ?? '', language, catalog)}</td>
                <td>{booking.sessions?.starts_at ? slotTime(booking.sessions.starts_at, language) : '—'}</td>
                <td className="ops-num">{booking.party_size}</td>
                <td><OpsStatus status={booking.status} language={language} /></td>
                <td className="ops-table-actions"><button type="button" className="ops-link" onClick={() => openBooking(booking.id)}>{t('查看', 'View')}</button></td>
              </tr>)}
            </tbody>
          </table>
        </div>
      </div> : <div className="ops-record-list">
        {rows.map(booking => <article className="ops-record" key={booking.id}>
          <div className="ops-record-head">
            <span className="ops-ref">{booking.id.slice(0, 8)}</span>
            <OpsStatus status={booking.status} language={language} />
          </div>
          <h3>{titleFor(booking.sessions?.experience_id ?? '', language, catalog)}</h3>
          <p>{booking.sessions?.starts_at ? slotTime(booking.sessions.starts_at, language) : '—'} · {booking.party_size} {t('人', 'guests')}</p>
          <div className="ops-actions"><button type="button" className="ops-btn ops-btn-secondary ops-btn-sm" onClick={() => openBooking(booking.id)}>{t('查看与处理', 'View & review')} <span aria-hidden="true">→</span></button></div>
        </article>)}
      </div>}
    </div> : <div role="tabpanel" id="ops-exp-participants" aria-labelledby="ops-exp-participants-tab" className="ops-tabpanel">
      <section className="ops-card">
        <div className="ops-card-head">
          <div>
            <h2>{t('测试参与者分配', 'Participant cohort assignment')}</h2>
            <p>{t('新账号默认进入体验组。可在任务开始前分配到研究组；产生记录后批次会锁定。', 'New accounts start in the experience group. Assign the study cohort before tasks begin; the cohort locks after activity is recorded.')}</p>
          </div>
          <button type="button" className="ops-btn ops-btn-secondary ops-btn-sm" disabled={participantLoading} onClick={() => void loadParticipants()}>
            {participantLoading ? t('读取中…', 'Loading…') : t('刷新参与者', 'Refresh participants')}
          </button>
        </div>
        {participantError && <OpsNotice error>{participantError}</OpsNotice>}
        {!participantLoading && !participants.length && !participantError && <OpsEmpty title={t('还没有住客账号', 'No guest accounts yet')} />}
        {participants.length > 0 && <div className="ops-table-wrap">
          <table className="ops-table">
            <caption className="sr-only">{t('测试参与者与批次', 'Participants and cohorts')}</caption>
            <thead><tr>
              <th scope="col">{t('参与者', 'Participant')}</th>
              <th scope="col">{t('编号', 'Reference')}</th>
              <th scope="col">{t('统计批次', 'Cohort')}</th>
              <th scope="col" className="ops-table-actions">{t('操作', 'Action')}</th>
            </tr></thead>
            <tbody>
              {participants.map(participant => {
                const next = participantBatch[participant.id] ?? participant.batch_id
                const locked = participant.has_activity
                return <tr key={participant.id}>
                  <td>{localizedUserName(participant, language)}</td>
                  <td><span className="ops-ref">{participant.id.slice(0, 8)}</span></td>
                  <td>
                    <select
                      className="ops-select ops-select-compact"
                      aria-label={`${t('统计批次', 'Cohort')} ${localizedUserName(participant, language)}`}
                      disabled={locked || action.busy}
                      value={next}
                      onChange={event => setParticipantBatch(current => ({ ...current, [participant.id]: event.target.value as 'demo' | 'pilot-01' }))}
                    >
                      <option value="demo">{cohortLabel('demo', language)}</option>
                      <option value="pilot-01">{cohortLabel('pilot-01', language)}</option>
                    </select>
                    {locked && <span className="ops-meta">{t('已有记录，批次已锁定', 'Locked after activity')}</span>}
                  </td>
                  <td className="ops-table-actions">
                    <button type="button" className="ops-btn ops-btn-secondary ops-btn-sm" disabled={locked || action.busy || next === participant.batch_id} onClick={() => void assignBatch(participant)}>
                      {t('保存批次', 'Save cohort')}
                    </button>
                  </td>
                </tr>
              })}
            </tbody>
          </table>
        </div>}
      </section>
    </div>}

    <OpsDrawer
      open={!!selected}
      onClose={closeDrawer}
      title={selected ? titleFor(selected.sessions?.experience_id ?? '', language, catalog) : t('体验申请', 'Experience request')}
      subtitle={selected ? <>
        <span className="ops-mono">{selected.id.slice(0, 8)}</span>
        <OpsStatus status={selected.status} language={language} />
      </> : undefined}
      footer={drawerFooter}
    >
      {selected && <>
        {action.message && <OpsNotice error={action.failed}>{action.message}</OpsNotice>}
        <dl className="ops-detail-grid">
          <div><dt>{t('住客编号', 'Guest reference')}</dt><dd className="ops-mono">{selected.user_id.slice(0, 8)}</dd></div>
          <div><dt>{t('统计批次', 'Cohort')}</dt><dd>{cohortLabel(selected.batch_id as 'demo' | 'pilot-01', language)}</dd></div>
          <div><dt>{t('场次', 'Session')}</dt><dd>{selected.sessions?.starts_at ? slotTime(selected.sessions.starts_at, language) : '—'}</dd></div>
          <div><dt>{t('人数', 'Guests')}</dt><dd>{selected.party_size}</dd></div>
          <div><dt>{t('提交时间', 'Submitted')}</dt><dd>{new Date(selected.created_at).toLocaleString(zh ? 'zh-CN' : 'en-GB')}</dd></div>
          <div><dt>{t('申请状态', 'Status')}</dt><dd>{statusLabel(selected.status, language)}</dd></div>
        </dl>

        {selected.reason && <section className="ops-drawer-section">
          <h3>{t('处理说明', 'Decision note')}</h3>
          <p>{selected.reason}</p>
        </section>}

        {selected.feedback && <section className="ops-drawer-section">
          <h3>{t('数字流程反馈', 'Digital journey feedback')}</h3>
          <p>{selected.feedback.rating}/5 · {selected.feedback.comment || t('未填写文字', 'No written comment')}</p>
        </section>}

        {declining && <section className="ops-drawer-section">
          <div className="ops-reason">
            <label className="ops-field">
              <span>{t('未通过原因（必填）', 'Reason for declining (required)')}</span>
              <textarea className="ops-input" maxLength={1000} value={reason} onChange={event => setReason(event.target.value)} />
            </label>
            <p className="ops-meta">{t('原因会展示给住客，请写明可执行的下一步。', 'The guest will see this note; include a practical next step.')}</p>
          </div>
        </section>}

        <section className="ops-drawer-section">
          <h3>{t('处理记录', 'Status history')}</h3>
          <BookingHistory id={selected.id} />
        </section>
      </>}
    </OpsDrawer>
  </div>
}
