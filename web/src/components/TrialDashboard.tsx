import { useEffect, useState } from 'react'
import { rpc } from '../lib/cloud'
import { MOTIFS, PALETTES } from '../lib/journey'
import { Notice, useCopy } from './JourneyCommon'
export interface TrialData {
 batch:string; counts:number[];
 interests:{field:string;choice:string;users:number}[];
 feedback:{rating:number;comment:string;created_at:string}[];
 statusCounts:Record<string,number>;
 guideIntent:{
  total:number; uniqueUsers:number; topicCounts:Record<string,number>; partyCounts:Record<string,number>;
  sentimentCounts:Record<string,number>; averageStayHours:number|null; averageBudget:number|null;
 };
}
export function TrialDashboard({onData}:{onData?:(data:TrialData|null)=>void}){
 const {language,t}=useCopy();const [batch,setBatch]=useState('pilot-01');const [data,setData]=useState<TrialData|null>(null);const [error,setError]=useState('');const [loading,setLoading]=useState(false);const [reload,setReload]=useState(0)
 useEffect(()=>{let alive=true;setLoading(true);setData(null);setError('');onData?.(null);void rpc<TrialData>('trial_analytics',{p_batch:batch}).then(d=>{if(alive){setData(d);onData?.(d)}}).catch(e=>{if(alive)setError(e.message)}).finally(()=>{if(alive)setLoading(false)});return()=>{alive=false}},[batch,reload,onData])
 const stages=language==='zh'?['注册参与者','开始探索','完成探索','保存推荐','提交意向','运营确认','模拟完成','提交反馈']:['Participants','Started exploring','Exploration complete','Recommendation saved','Preference sent','Confirmed','Simulation complete','Feedback sent']
 return <section className="journey-card"><div className="journey-heading"><div><p className="eyebrow">USER STUDY · OBSERVED BEHAVIOUR</p><h2>{t('试用行为与兴趣','Trial behaviour & interests')}</h2></div><div className="journey-actions"><label>{t('统计批次','Cohort')}<select className="input" value={batch} onChange={e=>setBatch(e.target.value)}><option value="pilot-01">Study 01</option><option value="demo">{t('体验组','Experience group')}</option></select></label><button className="btn-ghost" disabled={loading} onClick={()=>setReload(n=>n+1)}>{t('刷新统计','Refresh metrics')}</button></div></div><p>{t('各阶段按同批次独立住客去重，逐步统计数字流程的完成情况。','Each stage counts unique guests in the same cohort who completed the preceding steps.')}</p>
 {loading&&<Notice>{t('读取共享数据…','Loading shared data…')}</Notice>}{error&&<Notice error>{error}</Notice>}{data&&<><ol className="trial-funnel">{stages.map((s,i)=>{const n=data.counts[i]||0;const prior=data.counts[i-1]||0;return <li key={s}><span>{s}</span><strong>{n}</strong><div className="funnel-track"><span style={{width:`${data.counts[0]?100*n/data.counts[0]:0}%`}}/></div><small>{i===0?t('本批次人数','Cohort size'):prior?`${(100*n/prior).toFixed(0)}% (${n}/${prior})`:t('无上一步样本','No prior-stage sample')}</small></li>})}</ol><p>{t('当前意向状态（独立申请，包含跳步用户）','Current request states (including users who skipped steps)')}: {Object.entries(data.statusCounts).map(([s,n])=>`${s}: ${n}`).join(' · ')||'0'}</p><h3>{t('探索兴趣分布','Exploration interests')}</h3><div className="choice-row">{data.interests.map(x=><span className="status-pill" key={x.field+x.choice}>{(x.field==='motif'?MOTIFS:PALETTES).find(r=>r[0]===x.choice)?.[language==='zh'?1:2]||x.choice}: {x.users}</span>)}</div>{!data.interests.length&&<p>{t('暂无探索记录。','No exploration records yet.')}</p>}<h3>{t('数字流程反馈（最近 50 条）','Digital journey feedback (latest 50)')}</h3>{data.feedback.length?data.feedback.map((f,i)=><blockquote key={i}>{f.rating}/5 · {f.comment||t('未填写文字','No written comment')}</blockquote>):<p>{t('暂无反馈。','No feedback yet.')}</p>}</>}
 </section>
}
