import { describe, expect, it } from 'vitest';
import {
  calculateAnnualRentCost,
  calculateMortgageRentBreakEvenPoints,
  calculateMortgageRentComparison,
  calculateMortgageRentNetGain,
} from './mortgageRentComparisonCalculations';

describe('mortgage rent comparison calculations', () => {
  it('calculates annual rent from monthly rent', () => {
    expect(calculateAnnualRentCost(2500)).toBe(30000);
    expect(calculateAnnualRentCost(-100)).toBe(0);
  });

  it('adds one-time costs only in the first ownership year', () => {
    const comparison = calculateMortgageRentComparison({
      annualInterestRate: 2,
      mortgageAmount: 640000,
      monthlyRent: 2500,
      propertyPrice: 800000,
      strategy: 'direct',
      targetLoanToValueRatio: 65,
      totalOngoingAnnualCosts: 10000,
      totalOneTimeCosts: 20000,
      years: 20,
    });

    expect(comparison).toHaveLength(20);
    expect(comparison[0]).toEqual({
      year: 1,
      mortgageCost: 48800,
      rentCost: 30000,
    });
    expect(comparison[1]).toEqual({
      year: 2,
      mortgageCost: 28680,
      rentCost: 30000,
    });
  });

  it('keeps indirect mortgage interest stable while comparing with rent', () => {
    const comparison = calculateMortgageRentComparison({
      annualInterestRate: 2,
      mortgageAmount: 640000,
      monthlyRent: 2500,
      propertyPrice: 800000,
      strategy: 'indirect',
      targetLoanToValueRatio: 65,
      totalOngoingAnnualCosts: 10000,
      totalOneTimeCosts: 0,
      years: 20,
    });

    expect(comparison.slice(0, 2).map((point) => point.mortgageCost)).toEqual([28800, 28800]);
  });

  it('calculates net gain from rent savings and owned assets', () => {
    expect(
      calculateMortgageRentNetGain({
        annualInterestRate: 2,
        mortgageAmount: 640000,
        monthlyRent: 2500,
        propertyPrice: 800000,
        strategy: 'direct',
        targetLoanToValueRatio: 65,
        totalOngoingAnnualCosts: 10000,
        totalOneTimeCosts: 20000,
        years: 20,
      }),
    ).toBeCloseTo(146800, 0);
  });

  it('builds break-even rent points across interest rates', () => {
    const points = calculateMortgageRentBreakEvenPoints({
      maxInterestRate: 2,
      minInterestRate: 1,
      mortgageAmount: 640000,
      propertyPrice: 800000,
      step: 0.5,
      strategy: 'direct',
      targetLoanToValueRatio: 65,
      totalOngoingAnnualCosts: 10000,
      totalOneTimeCosts: 20000,
      years: 20,
    });

    expect(points[0].annualInterestRate).toBe(1);
    expect(points[0].breakEvenMonthlyRent).toBeCloseTo(1402.5, 1);
    expect(points[1].annualInterestRate).toBe(1.5);
    expect(points[1].breakEvenMonthlyRent).toBeCloseTo(1645.42, 1);
    expect(points[2].annualInterestRate).toBe(2);
    expect(points[2].breakEvenMonthlyRent).toBeCloseTo(1888.33, 1);
  });
});
