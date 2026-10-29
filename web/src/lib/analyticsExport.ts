import type { TrialData } from '../components/TrialDashboard'
import type { SimulationInputs } from './roi'
import { csvText } from './export'
import { feedbackStatistics } from '../../../supabase/functions/_shared/feedbackSummary'

export const FUNNEL_STAGES = ['participants','exploration_started','exploration_completed','recommendation_saved','preference_sent','confirmed','journey_completed','feedback_sent']
export function behaviorExport(data: TrialData, exportedAt = new Date().toISOString()) {
  const rows: unknown[][] = [['exported_at','cohort','metric','value','denominator','rate']]
  FUNNEL_STAGES.forEach((stage,i) => {
    const count=data.counts[i]??0, prior=i>0?data.counts[i-1]??0:0
    rows.push([exportedAt,data.batch,stage,count,i>0?prior:'',i>0&&prior>0?count/prior:''])
  })
  for(const [status,count] of Object.entries(data.statusCounts))rows.push([exportedAt,data.batch,`request_status:${status}`,count,'',''])
  rows.push([exportedAt,data.batch,'guide_unique_users',data.guideIntent.uniqueUsers,'',''])
  rows.push([exportedAt,data.batch,'average_budget',data.guideIntent.averageBudget,'',''])
  const feedback = feedbackStatistics(data)
  rows.push([exportedAt,data.batch,'feedback_scope',feedback.scope,'',''])
  rows.push([exportedAt,data.batch,'feedback_count',feedback.count,'',''])
  rows.push([exportedAt,data.batch,'average_rating',feedback.averageRating??'','',''])
  return csvText(rows)
}
export function forecastExport(payload: { snapshotAt: string; filters: unknown; behavior?: TrialData; scenarios: {id:string;inputs:SimulationInputs;result:object}[]; sensitivity: {parameter:string;factor:number;inputs:SimulationInputs;result:object}[] }, exportedAt=new Date().toISOString()) {
  const rows:unknown[][]=[['exported_at','snapshot_at','section','scenario','metric','value']]
  rows.push([exportedAt,payload.snapshotAt,'context','','filters',JSON.stringify(payload.filters)])
  rows.push([exportedAt,payload.snapshotAt,'context','','data_source','Synthetic course scenarios; not hotel trading results'])
  for(const scenario of payload.scenarios){
    for(const [key,value] of Object.entries(scenario.inputs))rows.push([exportedAt,payload.snapshotAt,'input',scenario.id,key,value])
    for(const [key,value] of Object.entries(scenario.result))rows.push([exportedAt,payload.snapshotAt,'result',scenario.id,key,value])
  }
  for(const row of payload.sensitivity)for(const [key,value] of Object.entries(row.result))rows.push([exportedAt,payload.snapshotAt,`sensitivity:${row.parameter}`,String(row.factor),key,value])
  if(payload.behavior){
    const data=payload.behavior
    const feedback=feedbackStatistics(data)
    for(const [metric,value] of Object.entries(feedback))rows.push([exportedAt,payload.snapshotAt,'feedback_summary',data.batch,metric,value])
    rows.push([exportedAt,payload.snapshotAt,'observed',data.batch,'cohort',data.batch])
    FUNNEL_STAGES.forEach((stage,i)=>{
      const count=data.counts[i]??0, prior=i>0?data.counts[i-1]??0:0
      rows.push([exportedAt,payload.snapshotAt,'observed',data.batch,stage,count])
      if(i>0){rows.push([exportedAt,payload.snapshotAt,'denominator',data.batch,stage,prior]);rows.push([exportedAt,payload.snapshotAt,'conversion',data.batch,stage,prior>0?count/prior:null])}
    })
  }
  return csvText(rows)
}
