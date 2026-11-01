import { useEffect, useState } from 'react'
import { rpc } from '../lib/cloud'
import { MOTIFS, PALETTES } from '../lib/journey'
import { Notice, useCopy } from './JourneyCommon'
import type { FeedbackSummary } from '../../../supabase/functions/_shared/feedbackSummary'
import { actionError } from '../lib/actionErrors'

export interface TrialData {
  batch: string
  counts: number[]
  interests: { field: string; choice: string; users: number }[]
  feedback: { rating: number; comment: string; created_at: string }[]
  feedbackSummary?: FeedbackSummary
  statusCounts: Record<string, number>
  guideIntent: {
    total: number; uniqueUsers: number; topicCounts: Record<string, number>; partyCounts: Record<string, number>
    sentimentCounts: Record<string, number>; averageStayHours: number | null; averageBudget: number | null
  }
}

/** `batch` is controlled by the operations shell when supplied; standalone use keeps its own select. */
export function TrialDashboard({ onData, batch: controlledBatch }: { onData?: (data: TrialData | null) => void; batch?: string }) {
  const { language, t } = useCopy()
  const [internalBatch, setInternalBatch] = useState('pilot-01')
  const batch = controlledBatch ?? internalBatch
  const [data, setData] = useState<TrialData | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [reload, setReload] = useState(0)

  useEffect(() => {
    let alive = true
    setLoading(true)
    setData(null)
    setError('')
    onData?.(null)
    void rpc<TrialData>('trial_analytics', { p_batch: batch })
      .then(value => { if (alive) { setData(value); onData?.(value) } })
      .catch(errorValue => { if (alive) setError(actionError(errorValue, language)) })
      .finally(() => { if (alive) setLoading(false) })
    return () => { alive = false }
  }, [batch, reload, onData, language])

  const stages = language === 'zh'
    ? ['注册参与者', '开始探索', '完成探索', '保存推荐', '提交意向', '运营确认', '模拟完成', '提交反馈']
    : ['Participants', 'Started exploring', 'Exploration complete', 'Recommendation saved', 'Preference sent', 'Confirmed', 'Simulation complete', 'Feedback sent']

  return <section className="ops-card">
    <div className="ops-card-head">
      <div>
        <p className="ops-eyebrow">USER STUDY · OBSERVED BEHAVIOUR</p>
        <h2>{t('试用行为与兴趣', 'Trial behaviour & interests')}</h2>
      </div>
      <div className="ops-actions" style={{ marginTop: 0 }}>
        {!controlledBatch && <label className="ops-field">
          <span>{t('统计批次', 'Cohort')}</span>
          <select className="ops-select" value={batch} onChange={e => setInternalBatch(e.target.value)}>
            <option value="pilot-01">Study 01</option>
            <option value="demo">{t('体验组', 'Experience group')}</option>
          </select>
        </label>}
        <button type="button" className="ops-btn ops-btn-secondary ops-btn-sm" disabled={loading} onClick={() => setReload(n => n + 1)}>
          {t('刷新统计', 'Refresh metrics')}
        </button>
      </div>
    </div>
    <p>{t('各阶段按同批次独立住客去重，逐步统计数字流程的完成情况。', 'Each stage counts unique guests in the same cohort who completed the preceding steps.')}</p>
    {loading && <Notice>{t('读取共享数据…', 'Loading shared data…')}</Notice>}
    {error && <Notice error>{error}</Notice>}
    {data && <>
      <ol className="trial-funnel">{stages.map((stage, index) => {
        const count = data.counts[index] || 0
        const prior = data.counts[index - 1] || 0
        return <li key={stage}>
          <span>{stage}</span>
          <strong>{count}</strong>
          <div className="funnel-track"><span style={{ width: `${data.counts[0] ? 100 * count / data.counts[0] : 0}%` }} /></div>
          <small>{index === 0 ? t('本批次人数', 'Cohort size') : prior ? `${(100 * count / prior).toFixed(0)}% (${count}/${prior})` : t('无上一步样本', 'No prior-stage sample')}</small>
        </li>
      })}</ol>
      <p>{t('当前意向状态（独立申请，包含跳步用户）', 'Current request states (including users who skipped steps)')}: {Object.entries(data.statusCounts).map(([key, value]) => `${key}: ${value}`).join(' · ') || '0'}</p>
      <h3>{t('探索兴趣分布', 'Exploration interests')}</h3>
      <div className="choice-row">{data.interests.map(item => <span className="status-pill" key={item.field + item.choice}>
        {(item.field === 'motif' ? MOTIFS : PALETTES).find(row => row[0] === item.choice)?.[language === 'zh' ? 1 : 2] || item.choice}: {item.users}
      </span>)}</div>
      {!data.interests.length && <p>{t('暂无探索记录。', 'No exploration records yet.')}</p>}
      <h3>{t('数字流程反馈（最近 50 条）', 'Digital journey feedback (latest 50)')}</h3>
      {data.feedback.length
        ? data.feedback.map((item, index) => <blockquote key={index}>{item.rating}/5 · {item.comment || t('未填写文字', 'No written comment')}</blockquote>)
        : <p>{t('暂无反馈。', 'No feedback yet.')}</p>}
    </>}
  </section>
}
