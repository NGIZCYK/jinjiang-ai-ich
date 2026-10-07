import { describe, expect, it } from 'vitest'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { calculateScenario, ROI_ASSUMPTIONS, operatingDecision, scaleEvidenceReady } from '../src/lib/roi'
describe('synthetic ROI and evidence gates', () => {
  const themed=ROI_ASSUMPTIONS.scenarios[2].inputs
  it('has a twelve-month net ROI of 272.8% and a 3.22 month payback', () => {
    const result=calculateScenario(themed,1)
    expect(result.monthlyContribution).toBe(93200)
    expect(result.roiPct).toBeCloseTo(272.8)
    expect(result.paybackMonths).toBeCloseTo(3.218884)
  })
  it('matches Python on defaults, filtering, no investment, losses and clamped rates', () => {
    const cases=[...ROI_ASSUMPTIONS.scenarios.map(s=>({inputs:s.inputs,eligibleShare:1})),
      {inputs:themed,eligibleShare:.1},{inputs:{...themed,initialInvestment:0},eligibleShare:1},
      {inputs:{...themed,fixedMonthlyCost:1000000},eligibleShare:0},
      {inputs:{...themed,conversionRate:2,sessions:-1},eligibleShare:2}]
    const run=spawnSync('python',[fileURLToPath(new URL('../../analytics/roi.py',import.meta.url))],{input:JSON.stringify(cases),encoding:'utf-8'})
    expect(run.status,run.stderr).toBe(0)
    const actual=JSON.parse(run.stdout)
    cases.forEach((c,i)=>{const result=calculateScenario(c.inputs,c.eligibleShare);for(const key of Object.keys(result) as (keyof typeof result)[]) {
      if(result[key]===null)expect(actual[i][key]).toBeNull();else expect(actual[i][key]).toBeCloseTo(result[key]!,8)
    }})
  })
  it('never approves expansion from Demo or account counts', () => {
    const evidence={batch:'demo',verifiedHumanParticipants:100,consecutiveWeeks:4,conversionRate:.32,attendanceRate:.9,reviewed:true}
    expect(scaleEvidenceReady(evidence,.32)).toBe(false)
    expect(operatingDecision('themed-room-workshop',calculateScenario(themed,1),1200)).toBe('pilot')
    expect(scaleEvidenceReady({...evidence,batch:'pilot-01',reviewed:false},.32)).toBe(false)
    expect(scaleEvidenceReady({...evidence,batch:'pilot-01',consecutiveWeeks:3},.32)).toBe(false)
    expect(scaleEvidenceReady({...evidence,batch:'pilot-01',attendanceRate:.5},.32)).toBe(false)
    expect(scaleEvidenceReady({...evidence,batch:'pilot-01'},.32)).toBe(true)
  })
})
