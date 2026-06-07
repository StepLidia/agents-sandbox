import { describe, expect, it } from 'vitest';
import {
  buildMortgageChartTicks,
  calculateAffordabilityRatio,
  calculateDownPayment,
  calculateLoanToValueRatio,
  calculateMonthlyHousingPayment,
  calculateMortgageCosts,
  calculateMortgageRepaymentProjection,
  calculateMortgageAmount,
  calculateMortgageOverview,
  calculateRequiredAnnualAmortization,
  calculateRequiredAnnualAmortizationRate,
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
        annualAmortization: 6000,
        annualInterestRate: 5,
        maintenanceRate: 1,
        mortgageAmount: 640000,
        propertyPrice: 800000,
      }),
    ).toBeCloseTo(3833.33, 2);
  });

  it('calculates required amortization from target LTV and repayment years', () => {
    expect(
      calculateRequiredAnnualAmortization({
        mortgageAmount: 400000,
        propertyPrice: 500000,
        targetLoanToValueRatio: 65,
        years: 20,
      }),
    ).toBe(3750);
    expect(
      calculateRequiredAnnualAmortizationRate({
        mortgageAmount: 400000,
        propertyPrice: 500000,
        targetLoanToValueRatio: 65,
        years: 20,
      }),
    ).toBeCloseTo(0.9375, 4);
  });

  it('calculates one-time and ongoing mortgage costs', () => {
    const costs = calculateMortgageCosts({
      maintenanceRate: 1,
      propertyPrice: 800000,
    });

    expect(costs.oneTimeCosts.map((cost) => cost.amount)).toEqual([14400, 2000, 1000, 500, 1100]);
    expect(costs.ongoingAnnualCosts.map((cost) => cost.amount)).toEqual([8000, 1200, 600, 300]);
    expect(costs.totalOneTimeCosts).toBe(19000);
    expect(costs.totalOngoingAnnualCosts).toBe(10100);
    expect(costs.monthlyOngoingCosts).toBeCloseTo(841.67, 2);
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
    expect(overview.maxAffordablePropertyPrice).toBeCloseTo(717419, 0);
  });

  it('uses the selected down payment when calculating max affordable price', () => {
    const overview = calculateMortgageOverview({
      ...defaultMortgageInputs,
      downPayment: 200000,
    });

    expect(overview.maxAffordablePropertyPrice).toBeCloseTo(769032, 0);
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

  it('builds readable thousands ticks for mortgage charts', () => {
    expect(buildMortgageChartTicks([640000, 520000])).toEqual([0, 200000, 400000, 600000, 800000]);
    expect(buildMortgageChartTicks([10752, 8064])).toEqual([0, 5000, 10000, 15000]);
  });
});
