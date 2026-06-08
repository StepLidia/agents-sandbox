import {
  calculateMortgageRepaymentProjection,
  type MortgageAmortizationStrategy,
} from './mortgageCalculations';

export type MortgageRentComparisonPoint = {
  mortgageCost: number;
  rentCost: number;
  year: number;
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

function normalizeMoney(value: number) {
  return Number.isFinite(value) ? Math.max(value, 0) : 0;
}
