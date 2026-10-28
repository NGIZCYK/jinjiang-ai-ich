"""Shared-input ROI model: CNY/month, 12-month net ROI; synthetic assumptions only."""
import json
import math
from pathlib import Path

ASSUMPTIONS = json.loads((Path(__file__).resolve().parents[1] / 'shared' / 'roi-assumptions.json').read_text(encoding='utf-8'))

def calculate_scenario(inputs: dict, eligible_share: float = 1) -> dict:
    def positive(n):
        return max(0, n) if isinstance(n, (int, float)) and math.isfinite(n) else 0
    guests = positive(inputs['monthlyHotelGuests']) * min(1, positive(eligible_share))
    demand = guests * min(1, positive(inputs['conversionRate']))
    capacity = positive(inputs['sessions']) * positive(inputs['seatsPerSession'])
    bookings = min(demand, capacity)
    workshop = bookings * positive(inputs['ticketPrice'])
    base, investment = positive(inputs['baseMonthlyRevenue']), positive(inputs['initialInvestment'])
    uplift = base * min(1, positive(inputs['ticketUplift']))
    incremental = workshop + uplift
    cost = bookings * positive(inputs['unitCost']) + positive(inputs['fixedMonthlyCost'])
    contribution = incremental - cost
    unit_contribution = positive(inputs['ticketPrice']) - positive(inputs['unitCost'])
    uncovered_fixed = positive(inputs['fixedMonthlyCost']) - uplift
    break_even = 0 if uncovered_fixed <= 0 else math.ceil(uncovered_fixed / unit_contribution) if unit_contribution > 0 else None
    return dict(eligibleGuests=guests, demand=demand, capacity=capacity, expectedBookings=bookings,
        workshopRevenue=workshop, roomUpliftRevenue=uplift, incrementalRevenue=incremental,
        operatingCost=cost, monthlyContribution=contribution,
        revenueIndex=100*(1+incremental/base) if base > 0 else 100,
        roiPct=(contribution*ASSUMPTIONS['periodMonths']-investment)/investment*100 if investment > 0 else None,
        paybackMonths=investment/contribution if investment > 0 and contribution > 0 else None,
        unitContribution=unit_contribution, breakEvenBookings=break_even,
        breakEvenWithinCapacity=break_even is not None and break_even <= capacity)

if __name__ == '__main__':
    import sys
    cases = json.load(sys.stdin)
    json.dump([calculate_scenario(c['inputs'], c['eligibleShare']) for c in cases], sys.stdout)
