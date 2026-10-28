import { describe, expect, it } from 'vitest'
import { calculateScenario, scenarioInputs, sensitivityCases, preferredScenario } from '../src/lib/roi'
import { behaviorExport, forecastExport } from '../src/lib/analyticsExport'
import { csvText } from '../src/lib/export'
import type { TrialData } from '../src/components/TrialDashboard'
const inputs=scenarioInputs(null,'themed-room-workshop')
const observed:TrialData={batch:'pilot-01',counts:[3,2,1,1,0,0,0,0],statusCounts:{confirmed:1},interests:[],feedback:[{rating:4,comment:'PRIVATE CHAT OR CONTACT',created_at:'now'}],guideIntent:{total:2,uniqueUsers:2,topicCounts:{},partyCounts:{},sentimentCounts:{},averageStayHours:24,averageBudget:150}}
describe('actionable forecast edges',()=>{
  it('handles no investment, losses, impossible break-even and capacity limits',()=>{
    const zero=calculateScenario({...inputs,initialInvestment:0},0)
    expect(zero.expectedBookings).toBe(0);expect(zero.roiPct).toBeNull();expect(zero.paybackMonths).toBeNull()
    const loss=calculateScenario({...inputs,ticketUplift:0,ticketPrice:5,unitCost:10,fixedMonthlyCost:100},1)
    expect(loss.monthlyContribution).toBeLessThan(0);expect(loss.breakEvenBookings).toBeNull();expect(loss.paybackMonths).toBeNull()
    const limited=calculateScenario({...inputs,ticketUplift:0,ticketPrice:20,unitCost:10,fixedMonthlyCost:101,sessions:1,seatsPerSession:10},1)
    expect(limited.breakEvenBookings).toBe(11);expect(limited.breakEvenWithinCapacity).toBe(false);expect(limited.expectedBookings).toBe(10)
  })
  it('changes one factor at a time and caps conversion',()=>{
    const cases=sensitivityCases({...inputs,conversionRate:.9},.6)
    expect(cases).toHaveLength(6)
    for(const row of cases){for(const key of Object.keys(inputs) as (keyof typeof inputs)[])if(key!==row.parameter)expect(row.inputs[key]).toBe(({...inputs,conversionRate:.9})[key])}
    expect(cases.find(x=>x.parameter==='conversionRate'&&x.factor===1.2)?.inputs.conversionRate).toBe(1)
    expect(cases.find(x=>x.parameter==='unitCost'&&x.factor===.8)?.inputs.unitCost).toBe(inputs.unitCost*.8)
  })
  it('offers no decision without samples or positive-contribution candidates',()=>{
    const row={id:'themed-room-workshop',result:calculateScenario(inputs,1)}
    expect(preferredScenario([row],0)).toBeNull()
    expect(preferredScenario([{id:'baseline',result:row.result}],10)).toBeNull()
    expect(preferredScenario([row],10)?.id).toBe(row.id)
  })
})
describe('aggregate evidence exports',()=>{
  it('records cohort, denominator and export time, never raw comments',()=>{
    const csv=behaviorExport(observed,'2026-10-28T00:00:00Z')
    expect(csv).toContain('pilot-01');expect(csv).toContain('2026-10-28T00:00:00Z')
    expect(csv).toContain('"exploration_started","2","3","0.6666666666666666"')
    expect(csv).not.toContain('PRIVATE');expect(csv).not.toMatch(/NaN|Infinity/)
    expect(behaviorExport({...observed,counts:[],feedback:[]})).not.toMatch(/NaN|Infinity/)
  })
  it('exports parameters, all three scenarios, sensitivities and observed cohort together',()=>{
    const scenarios=['baseline','light-experience','themed-room-workshop'].map(id=>({id,inputs:scenarioInputs(null,id),result:calculateScenario(scenarioInputs(null,id),1)}))
    const csv=forecastExport({snapshotAt:'2026-10-28',filters:{segmentId:'all'},scenarios,sensitivity:sensitivityCases(inputs,1),behavior:observed},'export-time')
    for(const text of ['baseline','themed-room-workshop','conversionRate','sensitivity:unitCost','denominator','pilot-01','export-time'])expect(csv).toContain(text)
    expect(csv).not.toContain('PRIVATE')
  })
  it('escapes quotes, linebreaks and spreadsheet formulas without corrupting numeric losses',()=>{
    const csv=csvText([['a"b','a\nb','=SUM(1)',-200]])
    expect(csv).toBe('\ufeff"a""b","a\nb","\'=SUM(1)","-200"')
  })
})
