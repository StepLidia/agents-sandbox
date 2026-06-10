import { describe, expect, it } from 'vitest';
import {
  calculateCurrentWealth,
  calculateMonthlyPlanContribution,
  calculateMonthsTracked,
  calculatePlannedWealth,
  calculateProgressDelta,
  calculateProgressDeltaPercent,
  calculateYearsTracked,
} from './progressCalculations';

describe('progress calculations', () => {
  it('calculates current wealth from asset amounts', () => {
    expect(
      calculateCurrentWealth([
        { amount: 1000, monthlyContribution: 100 },
        { amount: 2500, monthlyContribution: 200 },
      ]),
    ).toBe(3500);
  });

  it('calculates monthly planned contribution from assets', () => {
    expect(
      calculateMonthlyPlanContribution([
        { amount: 1000, monthlyContribution: 100 },
        { amount: 2500, monthlyContribution: 200 },
      ]),
    ).toBe(300);
  });

  it('calculates tracked months and years from month boundaries', () => {
    const monthsTracked = calculateMonthsTracked(new Date(2022, 0, 15), new Date(2026, 4, 1));

    expect(monthsTracked).toBe(52);
    expect(calculateYearsTracked(monthsTracked)).toBe(4.3);
  });

  it('does not return negative tracked months', () => {
    expect(calculateMonthsTracked(new Date(2026, 4, 1), new Date(2022, 0, 15))).toBe(0);
  });

  it('calculates planned wealth and progress delta', () => {
    const plannedWealth = calculatePlannedWealth({
      baselineWealth: 100000,
      monthlyPlanContribution: 1000,
      monthsTracked: 12,
    });

    expect(plannedWealth).toBe(112000);
    expect(calculateProgressDelta(120000, plannedWealth)).toBe(8000);
    expect(calculateProgressDeltaPercent(120000, plannedWealth)).toBeCloseTo(7.14, 2);
  });
});
