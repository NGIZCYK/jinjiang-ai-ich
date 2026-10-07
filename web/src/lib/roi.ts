import assumptions from '../../../shared/roi-assumptions.json'
export type SimulationInputs = typeof assumptions.scenarios[number]['inputs']
export const ROI_ASSUMPTIONS = assumptions
export function scenarioInputs(_snapshot: unknown, id: string): SimulationInputs {
  return { ...(assumptions.scenarios.find(s => s.id === id) ?? assumptions.scenarios[0]).inputs }
}
/** CNY/month; eligibleShare affects workshop demand only, not the hotel's room revenue uplift. */
export function calculateScenario(inputs: SimulationInputs, eligibleShare: number) {
  const value = (n: number) => Number.isFinite(n) ? Math.max(0, n) : 0
  const eligibleGuests = value(inputs.monthlyHotelGuests) * Math.min(1, value(eligibleShare))
  const demand = eligibleGuests * Math.min(1, value(inputs.conversionRate))
  const capacity = value(inputs.sessions) * value(inputs.seatsPerSession)
  const expectedBookings = Math.min(demand, capacity)
  const workshopRevenue = expectedBookings * value(inputs.ticketPrice)
  const base = value(inputs.baseMonthlyRevenue), investment = value(inputs.initialInvestment)
  const roomUpliftRevenue = base * Math.min(1, value(inputs.ticketUplift))
  const incrementalRevenue = workshopRevenue + roomUpliftRevenue
  const operatingCost = expectedBookings * value(inputs.unitCost) + value(inputs.fixedMonthlyCost)
  const monthlyContribution = incrementalRevenue - operatingCost
  return { eligibleGuests, demand, capacity, expectedBookings, workshopRevenue, roomUpliftRevenue,
    incrementalRevenue, operatingCost, monthlyContribution, revenueIndex: base > 0 ? 100 * (1 + incrementalRevenue / base) : 100,
    roiPct: investment > 0 ? (monthlyContribution * assumptions.periodMonths - investment) / investment * 100 : null,
    paybackMonths: investment > 0 && monthlyContribution > 0 ? investment / monthlyContribution : null }
}
export interface VerifiedStudyEvidence {
  batch: string; verifiedHumanParticipants: number; consecutiveWeeks: number
  conversionRate: number; attendanceRate: number; reviewed: boolean
}
/** Digital account counts alone cannot supply this evidence; no automatic verification in this prototype. */
export function scaleEvidenceReady(evidence: VerifiedStudyEvidence | undefined, targetConversion: number): boolean {
  return Boolean(evidence && evidence.batch === 'pilot-01' && evidence.reviewed
    && evidence.verifiedHumanParticipants >= 10 && evidence.consecutiveWeeks >= 4
    && evidence.conversionRate >= targetConversion && evidence.attendanceRate >= .75)
}
export function operatingDecision(id: string, result: ReturnType<typeof calculateScenario>, sampleCount: number, evidence?: VerifiedStudyEvidence, targetConversion = .12): 'pause' | 'pilot' | 'scale' {
  if (id === 'baseline' || result.monthlyContribution <= 0 || sampleCount <= 0) return 'pause'
  return result.roiPct !== null && result.roiPct >= 30 && result.capacity > 0
    && result.expectedBookings >= result.capacity * .45 && scaleEvidenceReady(evidence, targetConversion) ? 'scale' : 'pilot'
}
