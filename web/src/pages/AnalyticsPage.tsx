import { scenarioInputs, calculateScenario, operatingDecision, type SimulationInputs } from '../lib/roi'
import { TrialDashboard, type TrialData } from '../components/TrialDashboard'
import { useEffect, useMemo, useState } from 'react'
import type { AnalyticsSnapshot } from '../types'
import { requestOperatingBrief, type AiOperatingBrief, type OperatingDecision } from '../lib/analytics'
import { useLanguage } from '../lib/i18n'

const SNAPSHOT_URL = '/analytics/analytics_snapshot.json'

type Filters = {
  segmentId: string
  minStayHours: number
  minRoomSpend: number
  minInterest: number
}

function Bar({ value, max }: { value: number; max: number }) {
  const pct = Math.max(4, Math.min(100, Math.round((value / Math.max(max, 1)) * 100)))
  return (
    <div className="mt-1 h-2 w-full rounded-full bg-stone-100">
      <div className="h-2 rounded-full bg-jade transition-[width] duration-300" style={{ width: `${pct}%` }} />
    </div>
  )
}

function NumberField({
  label,
  value,
  suffix,
  step = 1,
  onChange,
}: {
  label: string
  value: number
  suffix: string
  step?: number
  onChange: (value: number) => void
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-stone-700">{label}</span>
      <div className="relative">
        <input
          className="input pr-12"
          min="0"
          step={step}
          type="number"
          value={value}
          onChange={(event) => onChange(Math.max(0, Number(event.target.value) || 0))}
        />
        <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-stone-400">{suffix}</span>
      </div>
    </label>
  )
}

export function AnalyticsPage() {
  const { language } = useLanguage()
  const [data, setData] = useState<AnalyticsSnapshot | null>(null)
  const [loadError, setLoadError] = useState('')
  const [reloadKey, setReloadKey] = useState(0)
  const [scenarioId, setScenarioId] = useState('themed-room-workshop')
  const [filters, setFilters] = useState<Filters>({ segmentId: 'all', minStayHours: 0, minRoomSpend: 0, minInterest: 0 })
  const [inputs, setInputs] = useState<SimulationInputs | null>(null)
  const [aiBrief, setAiBrief] = useState<AiOperatingBrief | null>(null)
  const [aiBriefLoading, setAiBriefLoading] = useState(false)
  const [aiBriefError, setAiBriefError] = useState('')
  const [trialData, setTrialData] = useState<TrialData | null>(null)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const isZh = language === 'zh'
  const t = (zh: string, en: string) => isZh ? zh : en

  useEffect(() => {
    const controller = new AbortController()
    setLoadError('')
    void fetch(SNAPSHOT_URL, { signal: controller.signal, cache: 'no-store' })
      .then(async (response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`)
        return response.json() as Promise<AnalyticsSnapshot>
      })
      .then((snapshot) => {
        const initialScenarioId = snapshot.revenueScenarios.some((item) => item.id === 'themed-room-workshop')
          ? 'themed-room-workshop'
          : snapshot.revenueScenarios[0].id
        setData(snapshot)
        setScenarioId(initialScenarioId)
        setInputs(scenarioInputs(snapshot, initialScenarioId))
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === 'AbortError') return
        setLoadError(error instanceof Error ? error.message : '无法读取分析快照')
      })
    return () => controller.abort()
  }, [reloadKey])

  const guideSignalSummary = trialData?.guideIntent ?? {
    total: 0,
    uniqueUsers: 0,
    topicCounts: {},
    partyCounts: {},
    sentimentCounts: {},
    averageStayHours: null,
    averageBudget: null,
  }
  const sentimentStats = {
    positive: guideSignalSummary.sentimentCounts.positive ?? 0,
    neutral: guideSignalSummary.sentimentCounts.neutral ?? 0,
    negative: guideSignalSummary.sentimentCounts.negative ?? 0,
  }

  const filteredRecords = useMemo(() => {
    if (!data) return []
    return data.records.filter((record) => (
      (filters.segmentId === 'all' || record.segmentId === filters.segmentId)
      && record.stayHours >= filters.minStayHours
      && record.roomSpend >= filters.minRoomSpend
      && record.interest >= filters.minInterest
    ))
  }, [data, filters])

  const filteredSegments = useMemo(() => {
    if (!data) return []
    const allAverageSpend = data.records.reduce((sum, record) => sum + record.totalSpend, 0) / data.records.length
    return data.segments.map((segment) => {
      const records = filteredRecords.filter((record) => record.segmentId === segment.id)
      const average = (key: 'totalSpend' | 'stayHours' | 'roomSpend' | 'interest') => records.length
        ? records.reduce((sum, record) => sum + record[key], 0) / records.length
        : 0
      return {
        ...segment,
        sampleCount: records.length,
        share: filteredRecords.length ? records.length / filteredRecords.length : 0,
        avgSpendIndex: records.length ? average('totalSpend') / allAverageSpend : 0,
        avgStayHours: average('stayHours'),
        avgRoomSpend: average('roomSpend'),
        avgInterest: average('interest'),
      }
    }).filter((segment) => segment.sampleCount > 0)
  }, [data, filteredRecords])

  const eligibleShare = data && data.records.length ? filteredRecords.length / data.records.length : 0
  const activeScenario = data?.revenueScenarios.find((item) => item.id === scenarioId) ?? data?.revenueScenarios[0]
  const result = inputs ? calculateScenario(inputs, eligibleShare) : null
  const scenarioResults = useMemo(() => {
    if (!data || !inputs) return []
    return data.revenueScenarios.map((scenario) => ({
      ...scenario,
      result: calculateScenario(scenario.id === scenarioId ? inputs : scenarioInputs(data, scenario.id), eligibleShare),
    }))
  }, [data, eligibleShare, inputs, scenarioId])
  const maxRevenueIndex = Math.max(100, ...scenarioResults.map((item) => item.result.revenueIndex))
  const maxShare = Math.max(1, ...filteredSegments.map((segment) => segment.share))
  const confirmedCount = trialData?.statusCounts.confirmed ?? 0
  const primarySegment = filteredSegments.reduce<typeof filteredSegments[number] | null>((best, segment) => {
    if (!best) return segment
    const segmentScore = segment.share * segment.avgInterest * segment.avgSpendIndex
    const bestScore = best.share * best.avgInterest * best.avgSpendIndex
    return segmentScore > bestScore ? segment : best
  }, null)
  const topicLabels: Record<string, string> = isZh
    ? { craft: '工艺', experience: '体验课', culture: '文化故事' }
    : { craft: 'Craft', experience: 'Workshop', culture: 'Culture' }
  const partyLabels: Record<string, string> = isZh
    ? { solo: '独自出行', family: '亲子/家庭', business: '商务', unspecified: '未标注' }
    : { solo: 'Solo', family: 'Family', business: 'Business', unspecified: 'Unspecified' }
  const topTopics = Object.entries(guideSignalSummary.topicCounts).sort(([, a], [, b]) => b - a).slice(0, 3)
  const topParties = Object.entries(guideSignalSummary.partyCounts).sort(([, a], [, b]) => b - a).slice(0, 2)

  function selectScenario(nextId: string) {
    if (!data) return
    clearAiBrief()
    setScenarioId(nextId)
    setInputs(scenarioInputs(data, nextId))
  }

  function changeInput(key: keyof SimulationInputs, value: number) {
    clearAiBrief()
    setInputs((current) => current ? { ...current, [key]: value } : current)
  }

  function clearAiBrief() {
    setAiBrief(null)
    setAiBriefError('')
  }

  if (!data || !inputs || !activeScenario || !result) {
    return (
      <div className="card p-6">
        <p className="eyebrow">ANALYSIS PIPELINE</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">{t('商业分析看板', 'Commercial insights')}</h1>
        {loadError ? (
          <div className="mt-4 rounded-xl bg-rose-50 p-4 text-sm text-rose-800">
            <p>{t('无法读取 Python 分析快照：', 'Unable to load the Python analysis snapshot: ')}{loadError}</p>
            <button className="btn-ghost mt-3" onClick={() => setReloadKey((value) => value + 1)}>{t('重新读取', 'Retry')}</button>
          </div>
        ) : <p className="mt-4 text-sm text-stone-600">{t('正在读取 Python 分析快照…', 'Loading the Python analysis snapshot…')}</p>}
      </div>
    )
  }

  // 异步生成简报时固定当前快照，避免状态更新后出现空值或混用新旧参数。
  const currentSnapshot = data
  const currentScenario = activeScenario
  const currentResult = result

  const decision: OperatingDecision = operatingDecision(scenarioId, result, filteredRecords.length)
  const decisionLabel = decision === 'scale'
    ? t('建议扩大', 'Ready to scale')
    : decision === 'pause'
      ? t('暂缓投入', 'Pause investment')
      : t('建议试点', 'Pilot recommended')
  const decisionClass = decision === 'scale'
    ? 'bg-jade-light text-jade-dark'
    : decision === 'pause'
      ? 'bg-rose-50 text-rose-800'
      : 'bg-amber-50 text-amber-900'
  const targetConversion = Math.max(12, Math.min(35, Math.round(inputs.conversionRate * 100)))
  const scaleGate = t(
    `连续 4 周体验转化率 ≥ ${targetConversion}%，到课率 ≥ 75%，12 个月 ROI ≥ 30%，且 Study 01 至少 10 名真人参与者经过核验并完成经营数据人工复核。`,
    `For four consecutive weeks: conversion ≥ ${targetConversion}%, attendance ≥ 75%, 12-month ROI ≥ 30%, with at least 10 verified human participants in Study 01 and manual review of operating evidence.`,
  )
  const pauseGate = t(
    `连续 4 周转化率低于 ${Math.max(8, targetConversion - 5)}%，或月度贡献不为正时，暂停扩大投入并复核价格、场次与成本。`,
    `Pause expansion if conversion stays below ${Math.max(8, targetConversion - 5)}% for four weeks or monthly contribution is not positive; review price, capacity and cost.`,
  )
  const recommendation = decision === 'scale'
    ? t('情景达到数值阈值；扩大仍须以真实试验和人工复核为依据。', 'The scenario meets numerical thresholds. Expansion still requires verified real trials and manual review.')
    : decision === 'pause'
      ? t('当前假设尚不支持投入扩大。先通过导览收集更多意向，或下调固定成本、场次与启动投入后重新模拟。', 'The current assumptions do not support expansion. Gather more guide signals or reduce fixed cost, capacity and startup investment before modelling again.')
      : t('先进行 4 周、小容量试点；以匿名导览意向、预约转化、到课率和单客成本作为下次经营决策依据。', 'Run a four-week, limited-capacity pilot and use anonymous guide intent, booking conversion, attendance and unit cost for the next decision.')
  const executionActions = [
    {
      title: t('试点对象与排期', 'Pilot audience and schedule'),
      body: t(
        `${primarySegment ? primarySegment.name : '当前筛选客群'} · 每周约 ${Math.max(1, Math.ceil(inputs.sessions / 4))} 场，每场 ${inputs.seatsPerSession} 席；先执行 4 周。`,
        `${primarySegment ? primarySegment.nameEn : 'Current filtered segment'} · about ${Math.max(1, Math.ceil(inputs.sessions / 4))} sessions each week, ${inputs.seatsPerSession} seats per session, for four weeks.`,
      ),
    },
    {
      title: t('首要观察指标', 'Primary metrics'),
      body: t(
        `目标转化 ${targetConversion}%；预估承接 ${result.expectedBookings.toFixed(0)} 人/月；同步记录到课率和单客材料成本。`,
        `Target conversion ${targetConversion}%; expected ${result.expectedBookings.toFixed(0)} monthly bookings; also track attendance and unit material cost.`,
      ),
    },
    { title: t('扩大门槛', 'Scale gate'), body: scaleGate },
    { title: t('暂停条件', 'Pause condition'), body: pauseGate },
  ]

  async function generateAiBrief() {
    setAiBriefLoading(true)
    setAiBriefError('')
    try {
      const response = await requestOperatingBrief(language, {
        batch: trialData?.batch ?? 'pilot-01',
        dataBoundary: 'Trial events are observations; revenue figures are synthetic forecasts; completed means simulation only.',
        scenario: { id: currentScenario.id, name: currentScenario.name },
        filter: filters,
        filteredSample: { count: filteredRecords.length, total: currentSnapshot.sampleSize, primarySegment: primarySegment?.name ?? null },
        assumptions: inputs,
        forecast: {
          expectedBookings: currentResult.expectedBookings,
          capacity: currentResult.capacity,
          incrementalRevenue: currentResult.incrementalRevenue,
          monthlyContribution: currentResult.monthlyContribution,
          twelveMonthRoiPct: currentResult.roiPct,
          paybackMonths: currentResult.paybackMonths,
        },
        ruleDecision: { decision, scaleGate, pauseGate },
      })
      setAiBrief(response.brief)
    } catch (error) {
      setAiBriefError(error instanceof Error ? error.message : t('AI 运营简报暂时不可用', 'AI operating brief is unavailable'))
    } finally {
      setAiBriefLoading(false)
    }
  }

  const formatCurrency = (value: number) => new Intl.NumberFormat(isZh ? 'zh-CN' : 'en-US', {
    style: 'currency', currency: 'CNY', maximumFractionDigits: 0,
  }).format(value)
  const generatedAt = new Intl.DateTimeFormat(isZh ? 'zh-CN' : 'en-US', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(data.generatedAt))

  return (
    <div className="ops-page analytics-page">
      <div className="ops-masthead analytics-masthead">
        <div>
          <p className="eyebrow">EXECUTIVE OPERATIONS BRIEF · SUZHOU</p>
          <h1>{t('运营高管简报', 'Executive operating brief')}</h1>
          <p>{t('把住客意向、经营假设与回报门槛压缩为一页可执行判断。', 'One decision view connecting guest intent, operating assumptions and return gates.')}</p>
        </div>
        <div className="ops-masthead-actions">
          <span>{t('快照更新：', 'Snapshot: ')}{generatedAt}</span>
          <button type="button" className="btn-ghost" onClick={() => setShowAdvanced((value) => !value)} aria-expanded={showAdvanced}>
            {showAdvanced ? t('收起分析依据', 'Hide analysis') : t('展开分析依据', 'View analysis')}
          </button>
        </div>
      </div>

      <TrialDashboard onData={setTrialData} />
      <h2>{t('经营情景预测', 'Business scenario forecast')}</h2>
      <section className="card analytics-executive">
        <div className="analytics-executive-copy">
          <div className="analytics-executive-label">
            <span>{t('本期经营判断', 'CURRENT DECISION')}</span>
            <strong className={decisionClass}>{decisionLabel}</strong>
          </div>
          <h2>{recommendation}</h2>
          <p>{t('结合住客意向、客群特征与经营参数，比较当前方案的投入与预期回报。', 'Compare investment and expected returns using guest interests, segments and operating parameters.')}</p>
        </div>
        <dl className="analytics-executive-metrics">
          <div>
            <dt>{t('月度贡献', 'Monthly contribution')}</dt>
            <dd>{formatCurrency(result.monthlyContribution)}</dd>
          </div>
          <div>
            <dt>{t('12 个月 ROI', '12-month ROI')}</dt>
            <dd>{result.roiPct === null ? '—' : `${result.roiPct.toFixed(1)}%`}</dd>
          </div>
          <div>
            <dt>{t('预计回本', 'Payback')}</dt>
            <dd>{result.paybackMonths === null ? '—' : `${result.paybackMonths.toFixed(1)} ${t('个月', 'mo')}`}</dd>
          </div>
        </dl>
      </section>

      <section className="analytics-signal-strip">
        <div className="card analytics-kpi p-4">
          <div className="text-xs text-stone-500">{t('筛选后的匿名样本', 'Filtered anonymous sample')}</div>
          <div className="mt-1 text-2xl font-semibold">{filteredRecords.length}<span className="ml-1 text-sm font-normal text-stone-500">/ {data.sampleSize}</span></div>
        </div>
        <div className="card analytics-kpi p-4">
          <div className="text-xs text-stone-500">{t('当前批次：已确认 · 关键词表达倾向', 'Current cohort: confirmed · keyword expression trend')}</div>
          <div className="mt-1 text-2xl font-semibold">{confirmedCount} <span className="text-sm font-normal text-stone-500">· {sentimentStats.positive}/{sentimentStats.neutral}/{sentimentStats.negative}</span></div>
          <p className="mt-1 text-xs text-stone-500">{t('关键词表达条数：正向 / 中性 / 负向。', 'Keyword expressions: positive / neutral / negative.')}</p>
        </div>
        <div className="card analytics-kpi p-4">
          <div className="text-xs text-stone-500">{t('当前情景收入指数', 'Current scenario revenue index')}</div>
          <div className="mt-1 text-2xl font-semibold">{result.revenueIndex.toFixed(1)}</div>
          <div className="text-xs text-stone-500">{t('基线 = 100', 'Baseline = 100')}</div>
        </div>
      </section>

      {showAdvanced && (
      <div className="analytics-evidence-stack">
      <section className="card p-5 analytics-segmentation">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="eyebrow">PANDAS + KMEANS</p>
            <h2 className="mt-1 font-semibold">{t('客群分层与样本筛选', 'Guest segmentation and sample filters')}</h2>
          </div>
          <p className="text-xs text-stone-500">{t('筛选会同步影响下方经营模拟的可触达客群规模。', 'Filters also update the reachable guest pool in the simulation below.')}</p>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-stone-700">{t('目标客群', 'Target segment')}</span>
            <select className="input" value={filters.segmentId} onChange={(event) => { clearAiBrief(); setFilters((current) => ({ ...current, segmentId: event.target.value })) }}>
              <option value="all">{t('全部客群', 'All segments')}</option>
              {data.segments.map((segment) => <option key={segment.id} value={segment.id}>{isZh ? segment.name : segment.nameEn}</option>)}
            </select>
          </label>
          <NumberField label={t('最低停留时长', 'Minimum stay')} suffix="h" value={filters.minStayHours} onChange={(value) => { clearAiBrief(); setFilters((current) => ({ ...current, minStayHours: value })) }} />
          <NumberField label={t('最低客房消费', 'Minimum room spend')} suffix="¥" value={filters.minRoomSpend} onChange={(value) => { clearAiBrief(); setFilters((current) => ({ ...current, minRoomSpend: value })) }} />
          <NumberField label={t('最低非遗兴趣指数', 'Minimum heritage interest')} suffix="0–1" step={0.05} value={filters.minInterest} onChange={(value) => { clearAiBrief(); setFilters((current) => ({ ...current, minInterest: Math.min(1, value) })) }} />
        </div>
        {filteredSegments.length ? (
          <div className="mt-5 grid gap-4 lg:grid-cols-3">
            {filteredSegments.map((segment) => (
              <div key={segment.id} className="rounded-xl border border-stone-200 bg-stone-50/70 p-4">
                <div className="flex items-start justify-between gap-3 text-sm">
                  <span className="font-semibold">{isZh ? segment.name : segment.nameEn}</span>
                  <span className="text-stone-500">{segment.sampleCount} {t('条', 'records')}</span>
                </div>
                <Bar value={segment.share} max={maxShare} />
                <p className="mt-2 text-xs leading-5 text-stone-600">
                  {t('筛选后占比 ', 'Filtered share ')}{(segment.share * 100).toFixed(1)}% · {t('平均停留 ', 'mean stay ')}{segment.avgStayHours.toFixed(1)}h
                </p>
                <p className="mt-1 text-xs leading-5 text-stone-600">
                  {t('平均客房消费 ', 'mean room spend ')}{formatCurrency(segment.avgRoomSpend)} · {t('兴趣 ', 'interest ')}{segment.avgInterest.toFixed(2)}
                </p>
              </div>
            ))}
          </div>
        ) : <p className="mt-5 rounded-xl bg-amber-50 p-4 text-sm text-amber-900">{t('没有样本符合当前筛选，请放宽条件后继续分析。', 'No records match these filters. Relax the conditions to continue.')}</p>}
      </section>

      <section className="card p-5 analytics-simulation">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="eyebrow">REVENUE + ROI SIMULATION</p>
            <h2 className="mt-1 font-semibold">{t('营收与 ROI 决策模拟', 'Revenue and ROI decision simulation')}</h2>
          </div>
          <p className="text-xs text-stone-500">{t('人民币/月；调整参数可比较不同经营方案。', 'CNY per month; adjust the inputs to compare operating scenarios.')}</p>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {data.revenueScenarios.map((scenario) => (
            <button key={scenario.id} className={scenarioId === scenario.id ? 'btn-primary' : 'btn-ghost'} onClick={() => selectScenario(scenario.id)}>
              {isZh ? scenario.name : scenario.nameEn}
            </button>
          ))}
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <NumberField label={t('月度酒店客量', 'Monthly hotel guests')} suffix={t('人', 'guests')} value={inputs.monthlyHotelGuests} onChange={(value) => changeInput('monthlyHotelGuests', value)} />
          <NumberField label={t('体验转化率', 'Experience conversion')} suffix="%" step={0.01} value={Number((inputs.conversionRate * 100).toFixed(2))} onChange={(value) => changeInput('conversionRate', Math.min(1, value / 100))} />
          <NumberField label={t('体验课单价', 'Workshop ticket')} suffix="¥" value={inputs.ticketPrice} onChange={(value) => changeInput('ticketPrice', value)} />
          <NumberField label={t('主题房客单提升', 'Room-ticket uplift')} suffix="%" step={0.01} value={Number((inputs.ticketUplift * 100).toFixed(2))} onChange={(value) => changeInput('ticketUplift', Math.min(1, value / 100))} />
          <NumberField label={t('月度基础营收', 'Monthly base revenue')} suffix="¥" value={inputs.baseMonthlyRevenue} onChange={(value) => changeInput('baseMonthlyRevenue', value)} />
          <NumberField label={t('每月场次', 'Sessions per month')} suffix={t('场', 'sessions')} value={inputs.sessions} onChange={(value) => changeInput('sessions', value)} />
          <NumberField label={t('每场容量', 'Seats per session')} suffix={t('人', 'seats')} value={inputs.seatsPerSession} onChange={(value) => changeInput('seatsPerSession', value)} />
          <NumberField label={t('单客材料/服务成本', 'Unit cost')} suffix="¥" value={inputs.unitCost} onChange={(value) => changeInput('unitCost', value)} />
          <NumberField label={t('月固定运营成本', 'Monthly fixed cost')} suffix="¥" value={inputs.fixedMonthlyCost} onChange={(value) => changeInput('fixedMonthlyCost', value)} />
          <NumberField label={t('一次性启动投入', 'Initial investment')} suffix="¥" value={inputs.initialInvestment} onChange={(value) => changeInput('initialInvestment', value)} />
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-[1.08fr_0.92fr]">
          <div className="rounded-2xl bg-stone-50 p-4">
            <h3 className="text-sm font-semibold">{t('情景收入指数对比', 'Scenario revenue-index comparison')}</h3>
            <div className="mt-4 space-y-4">
              {scenarioResults.map((scenario) => (
                <div key={scenario.id}>
                  <div className="flex justify-between gap-3 text-sm">
                    <span>{isZh ? scenario.name : scenario.nameEn}</span>
                    <span className="font-medium">{scenario.result.revenueIndex.toFixed(1)}</span>
                  </div>
                  <Bar value={scenario.result.revenueIndex} max={maxRevenueIndex} />
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-2xl border border-jade/15 bg-jade-light/45 p-4">
            <p className="text-[0.65rem] font-semibold tracking-[0.14em] text-jade-dark">{t('当前可触达客群', 'CURRENT REACHABLE POOL')}</p>
            <div className="mt-2 text-3xl font-semibold text-jade-dark">{result.eligibleGuests.toFixed(0)} <span className="text-sm font-normal">{t('人 / 月', 'guests / month')}</span></div>
            <p className="mt-2 text-xs leading-5 text-stone-600">
              {t('由当前筛选样本占比 ', 'Derived from the filtered-sample share of ')}{(eligibleShare * 100).toFixed(1)}% {t('映射至月度酒店客量。', 'of monthly hotel guests.')}
            </p>
            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div><div className="text-xs text-stone-500">{t('预估需求', 'Estimated demand')}</div><strong>{result.demand.toFixed(0)} {t('人', 'guests')}</strong></div>
              <div><div className="text-xs text-stone-500">{t('可供容量', 'Available capacity')}</div><strong>{result.capacity.toFixed(0)} {t('席', 'seats')}</strong></div>
              <div><div className="text-xs text-stone-500">{t('实际可承接', 'Expected bookings')}</div><strong>{result.expectedBookings.toFixed(0)} {t('人', 'guests')}</strong></div>
              <div><div className="text-xs text-stone-500">{t('月度增量营收', 'Incremental revenue')}</div><strong>{formatCurrency(result.incrementalRevenue)}</strong></div>
            </div>
          </div>
        </div>
      </section>

      <section className="card overflow-hidden p-0 analytics-return-detail">
        <div className="grid lg:grid-cols-[0.75fr_1.25fr]">
          <div className="bg-ink p-5 text-white">
            <p className="text-[0.65rem] font-semibold tracking-[0.16em] text-gold-light">ROI · LIVE MODEL</p>
            <h2 className="mt-3 font-serif text-xl font-semibold">{t('当前方案的年度回报', 'Annual return of the current plan')}</h2>
            <div className="mt-6 grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                <div className="text-[0.65rem] text-stone-400">{t('月度贡献', 'Monthly contribution')}</div>
                <div className="mt-1 text-lg font-semibold text-gold-light">{formatCurrency(result.monthlyContribution)}</div>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                <div className="text-[0.65rem] text-stone-400">{t('12 个月 ROI', '12-month ROI')}</div>
                <div className="mt-1 text-2xl font-semibold text-gold-light">{result.roiPct === null ? '—' : `${result.roiPct.toFixed(1)}%`}</div>
              </div>
            </div>
            <div className="mt-4 text-sm leading-6 text-stone-300">
              {t('预计回本：', 'Payback: ')}{result.paybackMonths === null ? t('当前假设下无法回本', 'not reached under current assumptions') : `${result.paybackMonths.toFixed(1)} ${t('个月', 'months')}`}
            </div>
            <p className="mt-4 text-[0.7rem] leading-5 text-stone-400">{t('公式：体验课收入 + 主题房增收 − 单客成本 − 固定成本；ROI 按首年净收益计算。', 'Formula: workshop revenue + room uplift − unit cost − fixed cost; ROI uses first-year net contribution.')}</p>
          </div>
          <div className="p-5">
            <span className={`rounded-full px-2.5 py-1 text-[0.65rem] font-semibold ${decisionClass}`}>{decisionLabel}</span>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-stone-700">{recommendation}</p>
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-stone-200 p-3">
                <div className="text-xs font-semibold text-stone-800">{t('营收构成', 'Revenue composition')}</div>
                <p className="mt-1 text-xs leading-5 text-stone-500">{t('体验课 ', 'Workshop ')}{formatCurrency(result.workshopRevenue)} · {t('主题房增收 ', 'Room uplift ')}{formatCurrency(result.roomUpliftRevenue)}</p>
              </div>
              <div className="rounded-xl border border-stone-200 p-3">
                <div className="text-xs font-semibold text-stone-800">{t('月度成本', 'Monthly operating cost')}</div>
                <p className="mt-1 text-xs leading-5 text-stone-500">{formatCurrency(result.operatingCost)}</p>
              </div>
              <div className="rounded-xl border border-stone-200 p-3">
                <div className="text-xs font-semibold text-stone-800">{t('下一步验证', 'Next validation')}</div>
                <p className="mt-1 text-xs leading-5 text-stone-500">{t('记录转化、到课率、材料成本与住客反馈。', 'Track conversion, attendance, material cost and guest feedback.')}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="analytics-method-note">
        <strong>{t('分析口径', 'Method note')}</strong>
        <span>{data.method}</span>
      </div>
      </div>
      )}

      <section className="card p-5 analytics-actions">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="eyebrow">EXECUTION PLAN</p>
            <h2 className="mt-1 font-semibold">{t('可执行经营建议', 'Executable operating plan')}</h2>
          </div>
          <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${decisionClass}`}>{decisionLabel}</span>
        </div>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-stone-700">{recommendation}</p>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {executionActions.map((action) => (
            <div key={action.title} className="rounded-xl border border-stone-200 bg-stone-50/70 p-4">
              <h3 className="text-sm font-semibold text-stone-800">{action.title}</h3>
              <p className="mt-2 text-xs leading-5 text-stone-600">{action.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="card p-5 analytics-ai">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="eyebrow">GUIDE → DATA → AI → DECISION</p>
            <h2 className="mt-1 font-semibold">{t('AI 与业务闭环', 'AI and business feedback loop')}</h2>
          </div>
          <button className="btn-primary" disabled={aiBriefLoading} onClick={() => void generateAiBrief()}>
            {aiBriefLoading ? t('正在生成运营简报…', 'Generating brief…') : t('生成 AI 运营简报', 'Generate AI operating brief')}
          </button>
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-2xl border border-stone-200 bg-stone-50/70 p-4">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-semibold">{t('婉娘导览的匿名意向汇总', 'Anonymous intent from Wanniang')}</h3>
              <span className="rounded-full bg-white px-2 py-1 text-xs font-semibold text-jade-dark">{guideSignalSummary.total} {t('条', 'signals')} · {guideSignalSummary.uniqueUsers} {t('人', 'users')}</span>
            </div>
            {guideSignalSummary.total ? (
              <div className="mt-4 space-y-3 text-sm">
                <div className="rounded-xl bg-white p-3 text-stone-700">
                  <span className="text-xs text-stone-500">{t('热门兴趣', 'Top interests')}</span>
                  <p className="mt-1 font-medium">{topTopics.map(([topic, count]) => `${topicLabels[topic] ?? topic} ${count}`).join(' · ') || '—'}</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl bg-white p-3"><span className="text-xs text-stone-500">{t('平均可用时长', 'Average available time')}</span><p className="mt-1 font-medium">{guideSignalSummary.averageStayHours ? `${guideSignalSummary.averageStayHours.toFixed(1)}h` : '—'}</p></div>
                  <div className="rounded-xl bg-white p-3"><span className="text-xs text-stone-500">{t('平均预算', 'Average budget')}</span><p className="mt-1 font-medium">{guideSignalSummary.averageBudget ? formatCurrency(guideSignalSummary.averageBudget) : '—'}</p></div>
                </div>
                <p className="text-xs leading-5 text-stone-500">{t('按关键词规则汇总正向、中性与负向表达。', 'Keyword rules group expressions as positive, neutral or negative.')}</p>
                <p className="text-xs leading-5 text-stone-500">{t('同行偏好：', 'Party mix: ')}{topParties.map(([party, count]) => `${partyLabels[party] ?? party} ${count}`).join(' · ') || '—'}</p>
              </div>
            ) : (
              <p className="mt-4 text-sm leading-6 text-stone-600">{t('当前批次还没有已登录住客提交的结构化导览意向。匿名游客的会话预览不会进入正式统计。', 'This cohort has no structured guide intent from signed-in guests yet. Anonymous session previews are excluded from formal metrics.')}</p>
            )}
          </div>

          <div className="rounded-2xl border border-jade/15 bg-jade-light/35 p-4">
            {aiBrief ? (
              <div>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-[0.65rem] font-semibold tracking-[0.14em] text-jade-dark">DEEPSEEK · STRUCTURED OPERATIONS BRIEF</p>
                    <h3 className="mt-1 text-base font-semibold text-jade-dark">{aiBrief.headline}</h3>
                  </div>
                  <span className="rounded-full bg-white px-2 py-1 text-xs font-semibold text-jade-dark">{aiBrief.decision === 'scale' ? t('扩大', 'Scale') : aiBrief.decision === 'pause' ? t('暂缓', 'Pause') : t('试点', 'Pilot')}</span>
                </div>
                <p className="mt-3 text-sm leading-6 text-stone-700">{aiBrief.rationale}</p>
                {aiBrief.actions.length > 0 && (
                  <div className="mt-4 space-y-2">
                    {aiBrief.actions.map((action, index) => <div key={`${action.action}-${index}`} className="rounded-xl bg-white/85 p-3 text-xs leading-5 text-stone-700"><strong>{action.action}</strong>{action.metric && <> · {action.metric}</>}{action.target && <>：{action.target}</>}</div>)}
                  </div>
                )}
                <div className="mt-4 grid gap-2 sm:grid-cols-2 text-xs leading-5">
                  <p className="rounded-xl border border-white/80 bg-white/65 p-3"><strong>{t('扩大门槛：', 'Scale gate: ')}</strong>{aiBrief.scaleGate}</p>
                  <p className="rounded-xl border border-white/80 bg-white/65 p-3"><strong>{t('暂停条件：', 'Pause gate: ')}</strong>{aiBrief.pauseGate}</p>
                </div>
              </div>
            ) : (
              <div className="flex h-full min-h-48 flex-col justify-center">
                <p className="text-sm font-semibold text-jade-dark">{t('基于当前筛选、ROI 假设与导览意向生成运营简报', 'Create an operating brief from current filters, ROI assumptions and guide intent')}</p>
                <p className="mt-2 text-xs leading-5 text-stone-600">{t('结合聚合指标，整理经营建议、关键指标与下一步行动。', 'Use aggregate metrics to prepare operating recommendations, key measures and next steps.')}</p>
                {aiBriefError && <p className="mt-3 rounded-xl bg-rose-50 p-3 text-xs text-rose-800">{aiBriefError}</p>}
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}
