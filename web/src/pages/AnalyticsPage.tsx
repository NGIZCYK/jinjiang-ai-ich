import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import type { AnalyticsSnapshot } from '../types'
import { TrialDashboard, type TrialData } from '../components/TrialDashboard'
import { Notice } from '../components/JourneyCommon'
import { useLanguage } from '../lib/i18n'
import { ROI_ASSUMPTIONS, calculateScenario, scenarioInputs, sensitivityCases, preferredScenario, type SimulationInputs } from '../lib/roi'
import { requestOperatingBrief, type AiOperatingBrief } from '../lib/analytics'
import { behaviorExport, forecastExport } from '../lib/analyticsExport'
import { downloadText } from '../lib/export'

type Filters={segmentId:string;minStayHours:number;minInterest:number}
const defaults=()=>Object.fromEntries(ROI_ASSUMPTIONS.scenarios.map(row=>[row.id,scenarioInputs(null,row.id)])) as Record<string,SimulationInputs>
export function AnalyticsPage(){
 const {language}=useLanguage(),zh=language==='zh',t=(a:string,b:string)=>zh?a:b
 const [tab,setTab]=useState<'behavior'|'forecast'>('behavior')
 const [data,setData]=useState<AnalyticsSnapshot|null>(null),[error,setError]=useState(''),[reload,setReload]=useState(0)
 const [trial,setTrial]=useState<TrialData|null>(null)
 const [filters,setFilters]=useState<Filters>({segmentId:'all',minStayHours:0,minInterest:0})
 const [scenarioId,setScenarioId]=useState('themed-room-workshop'),[parameters,setParameters]=useState(defaults)
 const [brief,setBrief]=useState<AiOperatingBrief|null>(null),[briefLoading,setBriefLoading]=useState(false),[briefError,setBriefError]=useState('')
 const request=useRef(0)
 useEffect(()=>{const controller=new AbortController();setError('');fetch('/analytics/analytics_snapshot.json',{signal:controller.signal,cache:'no-store'})
  .then(async response=>{if(!response.ok)throw Error('HTTP '+response.status);const snapshot=await response.json();if(!snapshot||!Array.isArray(snapshot.records)||!snapshot.records.length||!Array.isArray(snapshot.segments))throw Error('INVALID_SNAPSHOT');setData(snapshot)})
  .catch(e=>{if(!controller.signal.aborted)setError(String(e.message))});return()=>controller.abort()},[reload])
 function invalidate(){request.current++;setBrief(null);setBriefError('');setBriefLoading(false)}
 useEffect(()=>{invalidate()},[trial,language]);useEffect(()=>()=>{request.current++},[])
 const records=useMemo(()=>data?.records.filter(row=>(filters.segmentId==='all'||row.segmentId===filters.segmentId)&&row.stayHours>=filters.minStayHours&&row.interest>=filters.minInterest)??[],[data,filters])
 const share=data?.records.length?records.length/data.records.length:0
 const rows=ROI_ASSUMPTIONS.scenarios.map(scenario=>({...scenario,inputs:parameters[scenario.id],result:calculateScenario(parameters[scenario.id],share)}))
 const selected=rows.find(row=>row.id===scenarioId)!,inputs=selected.inputs,result=selected.result
 const preferred=preferredScenario(rows,records.length),sensitivity=sensitivityCases(inputs,share)
 const segments=(data?.segments??[]).map(segment=>{const group=records.filter(row=>row.segmentId===segment.id);return {...segment,count:group.length,meanInterest:group.length?group.reduce((sum,r)=>sum+r.interest,0)/group.length:0,meanStay:group.length?group.reduce((sum,r)=>sum+r.stayHours,0)/group.length:0}})
 const primary=[...segments].sort((a,b)=>b.count*b.meanInterest-a.count*a.meanInterest)[0]
 const currency=(n:number)=>new Intl.NumberFormat(zh?'zh-CN':'en-GB',{style:'currency',currency:'CNY',maximumFractionDigits:0}).format(n)
 const number=(n:number|null,digits=1)=>n===null?'—':n.toFixed(digits)
 function changeInput(key:keyof SimulationInputs,value:number){invalidate();setParameters(current=>({...current,[scenarioId]:{...current[scenarioId],[key]:Number.isFinite(value)?Math.max(0,value):0}}))}
 function changeFilter(patch:Partial<Filters>){invalidate();setFilters(current=>({...current,...patch}))}
 const comparison=rows.map(row=>({id:row.id,name:zh?row.name:row.nameEn,inputs:row.inputs,result:row.result}))
 const decision=preferred?t(`优先比较${preferred.name}，${preferred.result.roiPct===null?'当前无需启动投入，':`其当前 12 个月 ROI 为 ${number(preferred.result.roiPct)}%，`}预计月度贡献为 ${currency(preferred.result.monthlyContribution)}。`,`Compare ${preferred.nameEn} first: ${preferred.result.roiPct===null?'no initial investment is set;':`its 12-month ROI is ${number(preferred.result.roiPct)}%;`} monthly contribution is ${currency(preferred.result.monthlyContribution)}.`):t('当前筛选或参数下暂无同时满足参与需求、容量与正向贡献的方案。请检查客群、定价与成本。','No option currently meets participation, capacity and positive-contribution conditions. Review the audience, pricing and costs.')
 async function generateBrief(){
  if(!trial||!data)return
  const version=++request.current;setBriefLoading(true);setBriefError('')
  try{const answer=await requestOperatingBrief(language,{batch:trial.batch,scenario:{id:scenarioId,name:zh?selected.name:selected.nameEn},filter:filters,assumptions:inputs,forecast:result,filteredSample:{count:records.length,total:data.sampleSize},comparison,sensitivity:sensitivity.map(row=>({parameter:row.parameter,factor:row.factor,result:row.result})),ruleDecision:{decision:preferred?'pilot':'pause',preferredScenario:preferred?.id??null}});if(version===request.current)setBrief(answer.brief)}
  catch(e){if(version===request.current)setBriefError(e instanceof Error?e.message:String(e))}finally{if(version===request.current)setBriefLoading(false)}
 }
 function exportEvidence(){const stamp=new Date().toISOString().replace(/[:.]/g,'-');if(tab==='behavior'&&trial)downloadText(`user-behavior-${stamp}.csv`,behaviorExport(trial),'text/csv;charset=utf-8');if(tab==='forecast'&&data&&trial)downloadText(`business-forecast-${stamp}.csv`,forecastExport({snapshotAt:data.generatedAt,filters,scenarios:comparison,sensitivity,behavior:trial}),'text/csv;charset=utf-8')}
 const fields:[keyof SimulationInputs,string,string,string][]=[
  ['baseMonthlyRevenue','基线月收入','Baseline monthly revenue','¥'],['monthlyHotelGuests','月度酒店住客量','Monthly hotel guests',t('人','guests')],
  ['conversionRate','体验转化率','Experience conversion','%'],['ticketUplift','主题房增收比例','Room revenue uplift','%'],
  ['ticketPrice','套餐单价','Package price','¥'],['sessions','每月场次数','Monthly sessions',t('场','sessions')],
  ['seatsPerSession','每场席位','Seats per session',t('席','seats')],['unitCost','单客材料成本','Material cost per guest','¥'],
  ['fixedMonthlyCost','月度固定成本','Monthly fixed cost','¥'],['initialInvestment','启动投入','Initial investment','¥'],
 ]
 return <div className="ops-page enhanced-analytics"><header className="ops-masthead"><div><p className="eyebrow">OPERATIONS INSIGHTS</p><h1>{t('运营洞察','Operations insights')}</h1><p>{t('从使用效果到经营方案，清楚连接数据、计算与下一步行动。','Connect usage outcomes and business scenarios with calculations and next actions.')}</p></div><button className="btn-ghost" disabled={!trial||(tab==='forecast'&&!data)} onClick={exportEvidence}>{t('导出当前分析 CSV','Export current analysis CSV')}</button></header>
 <div className="insight-tabs" role="tablist" aria-label={t('分析视图','Analysis view')}><button role="tab" aria-selected={tab==='behavior'} aria-controls="behavior-panel" id="behavior-tab" onClick={()=>setTab('behavior')}>{t('用户行为','User behavior')}</button><button role="tab" aria-selected={tab==='forecast'} aria-controls="forecast-panel" id="forecast-tab" onClick={()=>setTab('forecast')}>{t('经营推演','Business forecast')}</button></div>
 <div role="tabpanel" id="behavior-panel" aria-labelledby="behavior-tab" hidden={tab!=='behavior'}>
  <TrialDashboard onData={setTrial}/>
  <section className="journey-card"><h2>{t('从数据到下一步','From data to next steps')}</h2>{trial?<>
   <div className="insight-kpis"><div><span>{t('本批次注册账户','Registered accounts in cohort')}</span><strong>{trial.counts[0]??0}</strong></div><div><span>{t('已确认体验意向','Confirmed preferences')}</span><strong>{trial.statusCounts.confirmed??0}</strong></div><div><span>{t('已提交评分','Submitted ratings')}</span><strong>{trial.feedback.length}</strong></div><div><span>{t('平均流程评分','Mean journey rating')}</span><strong>{trial.feedback.length?number(trial.feedback.reduce((sum,row)=>sum+row.rating,0)/trial.feedback.length):'—'}</strong></div></div>
   <div className="insight-kpis"><div><span>{t('礼宾独立用户','Unique concierge users')}</span><strong>{trial.guideIntent.uniqueUsers}</strong></div><div><span>{t('平均预算','Average budget')}</span><strong>{trial.guideIntent.averageBudget===null?'—':currency(trial.guideIntent.averageBudget)}</strong></div></div>
   <h3>{t('关键词表达倾向','Keyword expression tendencies')}</h3><div className="choice-row">{Object.entries(trial.guideIntent.sentimentCounts).map(([key,count])=><span className="status-pill" key={key}>{({positive:t('正向','Positive'),neutral:t('中性','Neutral'),negative:t('负向','Negative')} as Record<string,string>)[key]??key}: {count}</span>)}</div>
   <p>{(trial.counts[1]??0)===0?t('先邀请目标用户完成探索任务，记录他们在哪一步停顿、取消或需要帮助。','Invite target users to try exploration and record where they pause, cancel or need help.'):t('优先检查漏斗中流失最明显的步骤，再结合评分与反馈安排下一轮任务测试。','Check the largest funnel drop-off, then use ratings and feedback to plan the next task test.')}</p>
  </>:<p>{t('正在等待所选批次的数据。','Waiting for the selected cohort.')}</p>}</section>
 </div>
 <div role="tabpanel" id="forecast-panel" aria-labelledby="forecast-tab" hidden={tab!=='forecast'}>
  {error&&<Notice error>{error}<button className="btn-ghost" onClick={()=>setReload(n=>n+1)}>{t('重新读取','Retry')}</button></Notice>}
  {!data?<Notice>{t('正在读取 Python 分析快照…','Loading the Python analysis snapshot…')}</Notice>:<>
   <section className="journey-card"><div className="journey-heading"><div><p className="eyebrow">PYTHON · PANDAS · KMEANS</p><h2>{t('客群分层与筛选','Segments and filters')}</h2></div><span className="status-pill">{t('情景样本','Scenario samples')} · {records.length}/{data.sampleSize}</span></div>
    <div className="studio-brief-grid"><label>{t('目标客群','Target segment')}<select className="input" value={filters.segmentId} onChange={e=>changeFilter({segmentId:e.target.value})}><option value="all">{t('全部客群','All segments')}</option>{data.segments.map(segment=><option key={segment.id} value={segment.id}>{zh?segment.name:segment.nameEn}</option>)}</select></label>
    <label>{t('最低停留小时数','Minimum stay hours')}<input className="input" type="number" min={0} value={filters.minStayHours} onChange={e=>changeFilter({minStayHours:Math.max(0,Number(e.target.value)||0)})}/></label>
    <label>{t('最低兴趣指数','Minimum interest index')}<input className="input" type="number" min={0} max={1} step={.05} value={filters.minInterest} onChange={e=>changeFilter({minInterest:Math.min(1,Math.max(0,Number(e.target.value)||0))})}/></label></div>
    <div className="insight-segments">{segments.map(segment=><article key={segment.id}><h3>{zh?segment.name:segment.nameEn}</h3><strong>{segment.count} · {records.length?number(100*segment.count/records.length):'—'}%</strong><p>{segment.id==='business-efficiency'?t('商务特征占比较高，偏好利用短时空档。','Higher business share; suited to shorter free periods.'):segment.id==='culture-led'?t('非遗兴趣较高，适合深入文化与工艺。','Higher heritage interest; suited to deeper cultural study.'):t('商务特征较低，适合轻松观察与探索。','Lower business share; suited to relaxed exploration.')}</p><p>{t('平均停留','Mean stay')} {number(segment.meanStay)}h · {t('兴趣','Interest')} {number(segment.meanInterest,2)}</p></article>)}</div>
    <p className="method-caption">{t('按停留时长、客房消费、非遗兴趣和商务特征标准化后分为三组。','Three groups use standardized stay duration, room spend, heritage interest and business characteristics.')}</p>
    {primary&&primary.count>0&&<Link className="btn-primary" to={`/studio?segment=${encodeURIComponent(primary.id)}`}>{t('按此客群生成内容','Create content for this segment')} → {zh?primary.name:primary.nameEn}</Link>}
   </section>
   <section className="journey-card"><div className="journey-heading"><h2>{t('方案比较','Compare scenarios')}</h2><span>{t('快照时间：','Snapshot: ')}{new Date(data.generatedAt).toLocaleString(zh?'zh-CN':'en-GB')}</span></div><p>{decision}</p>
    <div className="insight-table-wrap"><table className="insight-table"><thead><tr>{['方案|Scenario','预计参与|Expected guests','容量|Capacity','增量收入/月|Incremental revenue/mo','贡献/月|Contribution/mo','12个月 ROI|12-month ROI','回本月数|Payback months'].map(label=><th key={label}>{label.split('|')[zh?0:1]}</th>)}</tr></thead><tbody>{rows.map(row=><tr key={row.id} className={row.id===scenarioId?'is-current':''}><th><button aria-pressed={row.id===scenarioId} onClick={()=>{invalidate();setScenarioId(row.id)}}>{zh?row.name:row.nameEn}</button>{preferred?.id===row.id&&<small>{t('优先比较','Compare first')}</small>}</th><td>{number(row.result.expectedBookings,0)}</td><td>{number(row.result.capacity,0)}</td><td>{currency(row.result.incrementalRevenue)}</td><td>{currency(row.result.monthlyContribution)}</td><td>{row.result.roiPct===null?'—':number(row.result.roiPct)+'%'}</td><td>{number(row.result.paybackMonths)}</td></tr>)}</tbody></table></div>
    {!records.length&&<Notice>{t('没有符合筛选的样本，请放宽条件再比较方案。','No matching samples. Relax the filters before comparing.')}</Notice>}
   </section>
   <section className="journey-card"><h2>{t('调整当前方案：','Adjust current scenario: ')}{zh?selected.name:selected.nameEn}</h2><p>{t('套餐单价用于经营推演；住客页面按单项体验目录报价。各方案分别保留已调整的参数。','Package price is a forecasting input; the guest page uses individual experience prices. Edits are retained separately for each scenario.')}</p>
    <div className="studio-brief-grid">{fields.map(([key,ch,en,unit])=>{const rate=key==='conversionRate'||key==='ticketUplift';return <label key={key}>{zh?ch:en} ({unit})<input className="input" type="number" min={0} max={rate?100:undefined} step={rate ? 0.1 : 1} value={rate?Number((inputs[key]*100).toFixed(4)):inputs[key]} onChange={e=>{const value=Math.max(0,Number(e.target.value)||0);changeInput(key,rate?Math.min(100,value)/100:value)}}/></label>})}</div>
    <button className="btn-ghost" onClick={()=>{invalidate();setParameters(current=>({...current,[scenarioId]:scenarioInputs(data,scenarioId)}))}}>{t('还原本方案参数','Reset this scenario')}</button>
    <div className="insight-kpis"><div><span>{t('单客贡献','Unit contribution')}</span><strong>{currency(result.unitContribution)}</strong></div><div><span>{t('保本参与人数/月','Break-even guests/mo')}</span><strong>{result.breakEvenBookings===null?t('无法达到','Not attainable'):result.breakEvenBookings}</strong></div><div><span>{t('月度固定成本','Monthly fixed cost')}</span><strong>{currency(inputs.fixedMonthlyCost)}</strong></div><div><span>{t('预计材料成本/月','Expected materials/mo')}</span><strong>{currency(result.expectedBookings*inputs.unitCost)}</strong></div><div><span>{t('当前可触达人数/月','Reachable guests/mo')}</span><strong>{number(result.eligibleGuests,0)}</strong></div></div>
    {(!result.breakEvenWithinCapacity||result.unitContribution<=0)&&<Notice>{t('请检查单客贡献与容量是否足以覆盖固定成本。','Check whether unit contribution and capacity can cover fixed costs.')}</Notice>}
    <p className="method-caption">{t('月度贡献 = 套餐收入 + 主题房增收 − 材料成本 − 固定成本；首年净 ROI 扣除启动投入。保本人数按主题房增收抵扣固定成本后计算。','Contribution = package revenue + room uplift − materials − fixed costs. First-year net ROI deducts initial investment. Break-even guests cover fixed costs remaining after room uplift.')}</p>
   </section>
   <section className="journey-card"><h2>{t('敏感性分析','Sensitivity analysis')}</h2><p>{t('每次仅改变一个因素：转化率或单客材料成本上下浮动 20%，其余参数保持不变。','Change one factor at a time: conversion or material cost moves ±20%, with other inputs held fixed.')}</p>
    {result.demand>=result.capacity&&result.capacity>0&&<p className="method-caption">{t('当前方案受容量限制：增加转化率未必增加参与人数，可同时比较场次与席位配置。','This scenario is capacity-limited. Higher conversion may not increase bookings; compare session and seat capacity too.')}</p>}
    <div className="insight-table-wrap"><table className="insight-table"><thead><tr>{[t('因素','Factor'),t('变化','Change'),t('月度贡献','Monthly contribution'),t('12 个月 ROI','12-month ROI'),t('回本月数','Payback months')].map(label=><th key={label}>{label}</th>)}</tr></thead><tbody>{sensitivity.map(row=><tr key={row.parameter+row.factor}><th>{row.parameter==='conversionRate'?t('转化率','Conversion'):t('材料成本','Material cost')}</th><td>{row.factor===1?t('当前值','Current'):`${row.factor>1?'+':''}${Math.round((row.factor-1)*100)}%`}</td><td>{currency(row.result.monthlyContribution)}</td><td>{row.result.roiPct===null?'—':number(row.result.roiPct)+'%'}</td><td>{number(row.result.paybackMonths)}</td></tr>)}</tbody></table></div>
   </section>
   <section className="journey-card"><div className="journey-heading"><h2>{t('AI 经营简报','AI operating brief')}</h2><button className="btn-primary" disabled={briefLoading||!trial} onClick={()=>void generateBrief()}>{briefLoading?t('正在生成…','Generating…'):t('生成经营简报','Generate operating brief')}</button></div>
    <p>{t('结合所选批次的聚合指标、方案比较和敏感性结果，整理可执行的验证行动。','Use cohort aggregates, scenario comparisons and sensitivity results to prepare practical validation actions.')}</p>{briefError&&<Notice error>{briefError}</Notice>}
    {brief&&<div className="operating-brief"><h3>{brief.headline}</h3><p>{brief.rationale}</p>{brief.actions.map((action,index)=><article key={index}><strong>{action.action}</strong><p>{action.metric} · {action.target}</p></article>)}<p><strong>{t('下一阶段验证：','Next-stage validation: ')}</strong>{brief.scaleGate}</p><p><strong>{t('调整条件：','Adjustment conditions: ')}</strong>{brief.pauseGate}</p></div>}
   </section>
  </>}
 </div>
 </div>
}
