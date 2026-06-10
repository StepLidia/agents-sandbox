import { describe, expect, it } from 'vitest';
import {
  calculateCurrentWealth,
  calculateMonthlyPlanContribution,
  calculateMonthsTracked,
  calculatePlannedWealth,
  calculateProgressDelta,
  calculateProgressDeltaPercent,
  calculateTotalBalance,
  calculateYearsTracked,
  buildProgressChartData,
  buildOptimisticProgressProjection,
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

  it('calculates total balance from saved monthly balances', () => {
    expect(calculateTotalBalance({ investments: 40000, pillar2: 85000, pillar3: 15000, savings: 25000 })).toBe(165000);
  });

  it('builds planned and actual progress chart points', () => {
    const points = buildProgressChartData({
      actualPoints: [
        { date: new Date(2026, 0, 1), totalWealth: 100000 },
        { date: new Date(2026, 5, 1), totalWealth: 108000 },
      ],
      baselineDate: new Date(2026, 0, 1),
      baselineWealth: 100000,
      monthlyPlanContribution: 1000,
      optimisticAssets: [
        { amount: 100000, annualReturn: 0, id: 'savings', monthlyContribution: 1000 },
      ],
      projectionYears: 1,
    });

    expect(points).toEqual([
      { actualWealth: 100000, optimisticWealth: 100000, plannedWealth: 100000, year: 0 },
      { actualWealth: 108000, optimisticWealth: 105000, plannedWealth: 105000, year: 5 / 12 },
      { actualWealth: null, optimisticWealth: 112000, plannedWealth: 112000, year: 1 },
    ]);
  });

  it('builds an optimistic projection with boosted investment and pension returns', () => {
    const points = buildOptimisticProgressProjection({
      assets: [
        { amount: 50000, annualReturn: 0, id: 'savings', monthlyContribution: 0 },
        { amount: 50000, annualReturn: 3, id: 'investments', monthlyContribution: 0 },
      ],
      baselineWealth: 100000,
      projectionYears: 1,
    });

    expect(points).toEqual([
      { value: 100000, year: 0 },
      { value: 102000, year: 1 },
    ]);
  });
});
