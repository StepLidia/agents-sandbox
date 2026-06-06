import { describe, expect, it } from 'vitest';
import {
  calculateAffordabilityRatio,
  calculateDownPayment,
  calculateLoanToValueRatio,
  calculateMonthlyHousingPayment,
  calculateMortgageAmount,
  calculateMortgageOverview,
  defaultMortgageInputs,
  getTotalAvailableAssets,
} from './mortgageCalculations';

describe('mortgage calculations', () => {
  it('totals available assets', () => {
    expect(getTotalAvailableAssets(defaultMortgageInputs.availableAssets)).toBe(300000);
  });

  it('calculates down payment and mortgage amount', () => {
    expect(calculateDownPayment(800000, 20)).toBe(160000);
    expect(calculateMortgageAmount(800000, 160000)).toBe(640000);
  });

  it('calculates loan-to-value ratio', () => {
    expect(calculateLoanToValueRatio(640000, 800000)).toBe(80);
  });

  it('calculates monthly housing payment from separate cost rates', () => {
    expect(
      calculateMonthlyHousingPayment({
        amortizationRate: 1.10125,
        annualInterestRate: 1.68,
        maintenanceRate: 1,
        mortgageAmount: 640000,
        propertyPrice: 800000,
      }),
    ).toBeCloseTo(2150, 2);
  });

  it('calculates affordability ratio against gross income', () => {
    expect(calculateAffordabilityRatio(2150.67, 127100)).toBeCloseTo(20.3, 1);
  });

  it('builds mortgage overview values', () => {
    const overview = calculateMortgageOverview(defaultMortgageInputs);

    expect(overview.canAffordProperty).toBe(true);
    expect(overview.downPayment).toBe(160000);
    expect(overview.downPaymentRatio).toBe(20);
    expect(overview.mortgageAmount).toBe(640000);
    expect(overview.maxAffordablePropertyPrice).toBeCloseTo(1300558, 0);
  });
});
