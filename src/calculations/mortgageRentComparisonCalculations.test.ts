import { describe, expect, it } from 'vitest';
import {
  calculateAnnualRentCost,
  calculateMortgageRentComparison,
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
});
