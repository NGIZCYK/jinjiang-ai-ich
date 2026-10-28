import { describe, expect, it } from 'vitest'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { calculateScenario, ROI_ASSUMPTIONS, sensitivityCases, preferredScenario } from '../src/lib/roi'
describe('forecast ROI parity and decisions', () => {
  const themed=ROI_ASSUMPTIONS.scenarios[2].inputs
  it('has a twelve-month net ROI of 272.8% and a 3.22 month payback', () => {
    const result=calculateScenario(themed,1)
    expect(result.monthlyContribution).toBe(93200)
    expect(result.roiPct).toBeCloseTo(272.8)
    expect(result.paybackMonths).toBeCloseTo(3.218884)
  })
  it('matches Python on defaults, filtering, no investment, losses and clamped rates', () => {
    const cases=[...sensitivityCases(themed,.5).map(row=>({inputs:row.inputs,eligibleShare:.5})),...ROI_ASSUMPTIONS.scenarios.map(s=>({inputs:s.inputs,eligibleShare:1})),
      {inputs:themed,eligibleShare:.1},{inputs:{...themed,initialInvestment:0},eligibleShare:1},
      {inputs:{...themed,fixedMonthlyCost:1000000},eligibleShare:0},
      {inputs:{...themed,conversionRate:2,sessions:-1},eligibleShare:2},
      {inputs:{...themed,ticketUplift:0,ticketPrice:5,unitCost:10},eligibleShare:1},
      {inputs:{...themed,ticketUplift:0,ticketPrice:20,unitCost:10,fixedMonthlyCost:101,sessions:1,seatsPerSession:10},eligibleShare:1}]
    const run=spawnSync('python',[fileURLToPath(new URL('../../analytics/roi.py',import.meta.url))],{input:JSON.stringify(cases),encoding:'utf-8'})
    expect(run.status,run.stderr).toBe(0)
    const actual=JSON.parse(run.stdout)
    cases.forEach((c,i)=>{const result=calculateScenario(c.inputs,c.eligibleShare);for(const key of Object.keys(result) as (keyof typeof result)[]) {
      if(typeof result[key]==='boolean')expect(actual[i][key]).toBe(result[key]);else if(result[key]===null)expect(actual[i][key]).toBeNull();else expect(actual[i][key]).toBeCloseTo(result[key]!,8)
    }})
  })
  it('compares scenarios without asserting a live rollout or four-week course gate', () => {
    const row={id:'themed-room-workshop',result:calculateScenario(themed,1)}
    expect(preferredScenario([row],1200)?.id).toBe('themed-room-workshop')
    expect(preferredScenario([row],0)).toBeNull()
    const zeroInvestment={...row,result:calculateScenario({...themed,initialInvestment:0},1)}
    expect(preferredScenario([zeroInvestment],10)?.id).toBe(row.id)
  })
})
