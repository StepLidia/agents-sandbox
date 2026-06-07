import { describe, expect, it } from 'vitest';
import {
  calculateAffordabilityRatio,
  calculateDownPayment,
  calculateLoanToValueRatio,
  calculateMonthlyHousingPayment,
  calculateMortgageRepaymentProjection,
  calculateMortgageAmount,
  calculateMortgageOverview,
  defaultMortgageInputs,
  getTotalAvailableAssets,
} from './mortgageCalculations';

describe('mortgage calculations', () => {
  it('totals available assets', () => {
    expect(getTotalAvailableAssets(defaultMortgageInputs.availableAssets)).toBe(165000);
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
        annualInterestRate: 5,
        maintenanceRate: 1,
        mortgageAmount: 640000,
        propertyPrice: 800000,
      }),
    ).toBeCloseTo(3920.67, 2);
  });

  it('calculates affordability ratio against gross income', () => {
    expect(calculateAffordabilityRatio(3920.67, 127100)).toBeCloseTo(37, 1);
  });

  it('builds mortgage overview values', () => {
    const overview = calculateMortgageOverview(defaultMortgageInputs);

    expect(overview.canAffordProperty).toBe(true);
    expect(overview.downPayment).toBe(160000);
    expect(overview.downPaymentRatio).toBe(32);
    expect(overview.mortgageAmount).toBe(340000);
    expect(overview.maxAffordablePropertyPrice).toBeCloseTo(695117, 0);
  });

  it('uses the selected down payment when calculating max affordable price', () => {
    const overview = calculateMortgageOverview({
      ...defaultMortgageInputs,
      downPayment: 200000,
    });

    expect(overview.maxAffordablePropertyPrice).toBeCloseTo(729484, 0);
  });

  it('projects direct mortgage amortization to the target LTV', () => {
    const projection = calculateMortgageRepaymentProjection({
      annualInterestRate: 1.68,
      mortgageAmount: 640000,
      propertyPrice: 800000,
      strategy: 'direct',
      targetLoanToValueRatio: 65,
      years: 20,
    });

    expect(projection.targetMortgageBalance).toBe(520000);
    expect(projection.annualAmortization).toBe(6000);
    expect(projection.endingMortgageBalance).toBe(520000);
    expect(projection.endingPillar3Assets).toBe(0);
    expect(projection.monthlyPayment).toBeCloseTo(1396, 0);
    expect(projection.totalInterestPaid).toBeCloseTo(195888, 0);
  });

  it('projects indirect amortization as stable debt with 3a assets', () => {
    const projection = calculateMortgageRepaymentProjection({
      annualInterestRate: 1.68,
      mortgageAmount: 640000,
      propertyPrice: 800000,
      strategy: 'indirect',
      targetLoanToValueRatio: 65,
      years: 20,
    });

    expect(projection.endingMortgageBalance).toBe(640000);
    expect(projection.endingPillar3Assets).toBe(120000);
    expect(projection.monthlyPayment).toBeCloseTo(1396, 0);
    expect(projection.totalInterestPaid).toBeCloseTo(215040, 0);
  });
});
