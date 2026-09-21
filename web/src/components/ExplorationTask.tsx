import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { LEVELS, MOTIFS, PALETTES, progress, type Exploration } from '../lib/journey'
import { clearDraft, readDraft, useJourneyStore, writeDraft } from '../lib/journeyStore'
import { useAppStore } from '../lib/store'
import { cloud, rpc } from '../lib/cloud'
import { CloudNotice, Notice, useAction, useCopy } from './JourneyCommon'

export function ExplorationTask({observation,onFocus}:{observation?:Partial<Exploration>;onFocus:(tab:'artwork'|'silk'|'workbench')=>void}) {
 const {language,t}=useCopy();const user=useAppStore(s=>s.user);const saved=useJourneyStore(s=>s.exploration)
 const [draft,setDraft]=useState(readDraft);const [dirty,setDirty]=useState(false);const action=useAction();const started=useRef(false)
 useEffect(()=>{if(saved&&!dirty&&progress(readDraft())===0)setDraft(saved)},[saved,dirty])
 useEffect(()=>{if(!observation)return;setDraft(d=>{const next={...d,...observation,levels:observation.levels?Array.from(new Set([...d.levels,...observation.levels])):d.levels};writeDraft(next);return next});setDirty(true)},[observation])
 function update(patch:Partial<Exploration>){const next={...draft,...patch};setDraft(next);setDirty(true);writeDraft(next);action.clear();if(user&&!started.current){started.current=true;void rpc('start_exploration').catch(()=>{started.current=false})}}
 const count=progress(draft), label=(rows:string[][],value:string)=>rows.find(r=>r[0]===value)?.[language==='zh'?1:2]||t('尚未选择','Not chosen')
 return <section className="journey-card exploration-task" id="exploration-task">
  <div className="journey-heading"><div><p className="eyebrow">YOUR THREAD OF SUZHOU</p><h2>{t('留下一张个人探索卡','Create your exploration card')}</h2></div><strong>{count}/3</strong></div>
  <p>{t('在艺境中观察，再记录你的选择。选择没有审美对错，进度来自实际探索。','Observe the gallery, then record your choices. Aesthetic choices have no right answer; progress follows exploration.')}</p>
  <progress max={3} value={count} aria-label={t('探索进度','Exploration progress')} />
  <div className="journey-grid">
   <fieldset><legend>01 · {t('选择观察主题','Choose a motif')}</legend><button className="journey-text-button" onClick={()=>onFocus('artwork')}>{t('查看长卷','View the scroll')} →</button><div className="choice-grid">{MOTIFS.map(m=><button type="button" key={m[0]} aria-pressed={draft.motif===m[0]} onClick={()=>update({motif:m[0]})}><img src={`/assets/suxiu-macro-${m[0]}.webp`} alt="" loading="lazy"/>{m[language==='zh'?1:2]}</button>)}</div></fieldset>
   <fieldset><legend>02 · {t('配色与细度比较','Palette & thread comparison')}</legend><button className="journey-text-button" onClick={()=>onFocus('silk')}>{t('查看材料展位','Visit materials')} →</button><div className="choice-row">{PALETTES.map(p=><button type="button" key={p[0]} aria-pressed={draft.palette===p[0]} onClick={()=>update({palette:p[0]})}><span className="palette-dot" style={{background:p[3]}}/>{p[language==='zh'?1:2]}</button>)}</div><p>{t('点击至少两个档位观察相对粗细。','Select at least two levels to compare relative thickness.')}</p><div className="choice-row">{LEVELS.map((l,i)=><button type="button" key={l} aria-pressed={draft.levels.includes(l)} onClick={()=>update({levels:Array.from(new Set([...draft.levels,l]))})}><span style={{display:'block',height:[12,7,3,1][i],width:44,background:PALETTES.find(p=>p[0]===draft.palette)?.[3]||'#46665e',margin:'8px auto'}}/>{l==='full'?t('整股','Full'):l}</button>)}</div></fieldset>
   <fieldset><legend>03 · {t('回看并理解','Reflect & understand')}</legend><button className="journey-text-button" onClick={()=>onFocus('workbench')}>{t('查看工序','View the process')} →</button><p>{t('本原型中的 1/4、1/16、1/32 表示什么？','What do 1/4, 1/16 and 1/32 mean in this prototype?')}</p>{[['relative','相对细度示意','Relative visual levels'],['universal','所有作品的统一测量标准','Universal measurements for every work']].map(a=><label className="journey-radio" key={a[0]}><input type="radio" name="thread-question" checked={draft.answer===a[0]} onChange={()=>update({answer:a[0]})}/>{a[language==='zh'?1:2]}</label>)}{draft.answer&&<Notice>{t('这些档位用于比较相对细度，不是统一行业标准，也不是原作实测。依据：项目知识卡「劈丝：工坊口传经验分级」；外部文献页码仍待复核。','These levels illustrate relative fineness, not a universal standard or measurements of the original. Source: project silk-splitting knowledge card; external page references remain under review.')}</Notice>}</fieldset>
  </div>
  <div className="exploration-summary"><h3>{t('我的探索卡','My exploration card')}</h3><p>{label(MOTIFS,draft.motif)} · {label(PALETTES,draft.palette)} · {t('已比较','Compared')}: {draft.levels.join(' / ')||'—'}</p><p>{count===3?t('已完成观察、材料比较和反思。婉娘将优先考虑你的工艺兴趣。','Observation, comparison and reflection complete. Wanniang will prioritise your craft interest.'):t('继续完成三个步骤；也可先保存当前进度。','Continue the three steps, or save your progress now.')}</p></div>
  <CloudNotice/><div className="journey-actions">{user?<button className="btn-primary" disabled={action.busy||!cloud} onClick={()=>void action.run(async()=>{await useJourneyStore.getState().saveExploration(draft);clearDraft();setDirty(false)},t('探索卡已保存，可跨设备查看。','Exploration card saved across devices.'))}>{action.busy?t('保存中…','Saving…'):t('保存探索卡','Save exploration card')}</button>:<Link className="btn-primary" to="/auth?next=%2Fimmersive%23exploration-task" onClick={()=>writeDraft(draft)}>{t('登录后保存','Sign in to save')}</Link>}<Link className="btn-ghost" to="/guide#recommendations" onClick={()=>writeDraft(draft)}>{t('让婉娘推荐体验','Ask Wanniang for recommendations')} →</Link></div>
  {action.message&&<Notice error={action.failed}>{action.message}</Notice>}
 </section>
}
