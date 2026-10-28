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
  const unitContribution = value(inputs.ticketPrice) - value(inputs.unitCost)
  const uncoveredFixedCost = value(inputs.fixedMonthlyCost) - roomUpliftRevenue
  const breakEvenBookings = uncoveredFixedCost <= 0 ? 0 : unitContribution > 0 ? Math.ceil(uncoveredFixedCost / unitContribution) : null
  return { eligibleGuests, demand, capacity, expectedBookings, workshopRevenue, roomUpliftRevenue,
    incrementalRevenue, operatingCost, monthlyContribution, revenueIndex: base > 0 ? 100 * (1 + incrementalRevenue / base) : 100,
    roiPct: investment > 0 ? (monthlyContribution * assumptions.periodMonths - investment) / investment * 100 : null,
    paybackMonths: investment > 0 && monthlyContribution > 0 ? investment / monthlyContribution : null,
    unitContribution, breakEvenBookings, breakEvenWithinCapacity: breakEvenBookings !== null && breakEvenBookings <= capacity }
}
export function sensitivityCases(inputs: SimulationInputs, eligibleShare: number) {
  return (['conversionRate','unitCost'] as const).flatMap(parameter => [.8,1,1.2].map(factor => {
    const adjusted = { ...inputs, [parameter]: parameter === 'conversionRate' ? Math.min(1, inputs[parameter] * factor) : inputs[parameter] * factor }
    return { parameter, factor, inputs: adjusted, result: calculateScenario(adjusted, eligibleShare) }
  }))
}
export function preferredScenario<T extends { id: string; result: ReturnType<typeof calculateScenario> }>(rows: T[], sampleCount: number): T | null {
  if (sampleCount <= 0) return null
  return [...rows].filter(row => row.id !== 'baseline' && row.result.expectedBookings > 0 && row.result.monthlyContribution > 0)
    .sort((a,b) => (a.result.roiPct !== null && b.result.roiPct !== null ? b.result.roiPct - a.result.roiPct : 0) || b.result.monthlyContribution - a.result.monthlyContribution)[0] ?? null
}
