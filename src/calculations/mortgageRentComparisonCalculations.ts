import {
  calculateMortgageRepaymentProjection,
  type MortgageAmortizationStrategy,
} from './mortgageCalculations';

export type MortgageRentComparisonPoint = {
  mortgageCost: number;
  rentCost: number;
  year: number;
};

export type MortgageRentBreakEvenPoint = {
  annualInterestRate: number;
  breakEvenMonthlyRent: number;
};

export type MortgageRentComparisonInputs = {
  annualInterestRate: number;
  mortgageAmount: number;
  monthlyRent: number;
  propertyPrice: number;
  strategy: MortgageAmortizationStrategy;
  targetLoanToValueRatio: number;
  totalOngoingAnnualCosts: number;
  totalOneTimeCosts: number;
  years: number;
};

export type MortgageRentBreakEvenInputs = Omit<MortgageRentComparisonInputs, 'annualInterestRate' | 'monthlyRent'> & {
  maxInterestRate: number;
  minInterestRate: number;
  step: number;
};

export function calculateAnnualRentCost(monthlyRent: number) {
  return normalizeMoney(monthlyRent) * 12;
}

export function calculateMortgageRentComparison({
  annualInterestRate,
  mortgageAmount,
  monthlyRent,
  propertyPrice,
  strategy,
  targetLoanToValueRatio,
  totalOngoingAnnualCosts,
  totalOneTimeCosts,
  years,
}: MortgageRentComparisonInputs): MortgageRentComparisonPoint[] {
  const projection = calculateMortgageRepaymentProjection({
    annualInterestRate,
    mortgageAmount,
    propertyPrice,
    strategy,
    targetLoanToValueRatio,
    years,
  });
  const annualRentCost = calculateAnnualRentCost(monthlyRent);
  const annualOwnershipCosts = normalizeMoney(totalOngoingAnnualCosts);
  const purchaseCosts = normalizeMoney(totalOneTimeCosts);

  return Array.from({ length: Math.max(Math.round(years), 0) }, (_, index) => {
    const year = index + 1;
    const paymentYear = projection.schedule[index] ?? projection.schedule.at(-1);
    const annualMortgagePayment =
      normalizeMoney(paymentYear?.annualInterestCost ?? 0) + normalizeMoney(projection.annualAmortization);

    return {
      year,
      mortgageCost: annualMortgagePayment + annualOwnershipCosts + (year === 1 ? purchaseCosts : 0),
      rentCost: annualRentCost,
    };
  });
}

export function calculateMortgageRentNetGain(inputs: MortgageRentComparisonInputs) {
  const comparison = calculateMortgageRentComparison(inputs);
  const projection = calculateMortgageRepaymentProjection({
    annualInterestRate: inputs.annualInterestRate,
    mortgageAmount: inputs.mortgageAmount,
    propertyPrice: inputs.propertyPrice,
    strategy: inputs.strategy,
    targetLoanToValueRatio: inputs.targetLoanToValueRatio,
    years: inputs.years,
  });
  const assetValue = inputs.strategy === 'direct' ? projection.totalAmortization : projection.endingPillar3Assets;
  const totalRentCost = comparison.reduce((total, point) => total + point.rentCost, 0);
  const totalMortgageCost = comparison.reduce((total, point) => total + point.mortgageCost, 0);

  return totalRentCost - totalMortgageCost + assetValue;
}

export function calculateMortgageRentBreakEvenPoints({
  maxInterestRate,
  minInterestRate,
  step,
  ...inputs
}: MortgageRentBreakEvenInputs): MortgageRentBreakEvenPoint[] {
  const normalizedStep = Number.isFinite(step) && step > 0 ? step : 0.5;
  const normalizedMinRate = Math.max(0, Number.isFinite(minInterestRate) ? minInterestRate : 0);
  const normalizedMaxRate = Math.max(normalizedMinRate, Number.isFinite(maxInterestRate) ? maxInterestRate : normalizedMinRate);
  const pointCount = Math.floor((normalizedMaxRate - normalizedMinRate) / normalizedStep) + 1;

  return Array.from({ length: pointCount }, (_, index) => {
    const annualInterestRate = Number((normalizedMinRate + normalizedStep * index).toFixed(2));
    const zeroRentNetGain = calculateMortgageRentNetGain({
      ...inputs,
      annualInterestRate,
      monthlyRent: 0,
    });
    const breakEvenMonthlyRent = Math.max(-zeroRentNetGain / (12 * Math.max(Math.round(inputs.years), 1)), 0);

    return {
      annualInterestRate,
      breakEvenMonthlyRent,
    };
  });
}

function normalizeMoney(value: number) {
  return Number.isFinite(value) ? Math.max(value, 0) : 0;
}
