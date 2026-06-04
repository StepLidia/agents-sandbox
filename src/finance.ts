export {
  buildProjection,
  calculateAsset,
  calculateDashboard,
  combineProjections,
  futureValue,
  type AssetKind,
  type FinancialAsset,
  type IncomePlan,
  type InsightAmounts,
  type ProjectionPoint,
} from './calculations/financialCalculations';

import type { FinancialAsset, IncomePlan } from './calculations/financialCalculations';

export const assets: FinancialAsset[] = [
  {
    id: 'savings',
    label: 'Savings Account',
    subtitle: 'Liquid reserve',
    amount: 25000,
    monthlyContribution: 1000,
    annualReturn: 0.0,
    years: 30,
    color: 'blue',
  },
  {
    id: 'investments',
    label: 'Investments',
    subtitle: 'Securities portfolio',
    amount: 40000,
    monthlyContribution: 1500,
    annualReturn: 3.0,
    years: 30,
    color: 'coral',
  },
  {
    id: 'pillar2',
    label: 'BVG (2nd Pillar)',
    subtitle: 'Pension fund',
    amount: 85000,
    monthlyContribution: 400,
    annualReturn: 1.25,
    years: 30,
    color: 'emerald',
  },
  {
    id: 'pillar3',
    label: '3rd Pillar',
    subtitle: 'Private retirement',
    amount: 15000,
    monthlyContribution: 604,
    annualReturn: 2,
    years: 30,
    color: 'cyan',
  },
];

export const incomePlan: IncomePlan = {
  monthlyNetIncome: 6000,
  savingsContribution: 1000,
  investmentContribution: 1500,
  pillar3Contribution: 604,
  otherExpenses: 0,
};

export function currency(value: number, compact = false) {
  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 0,
    notation: compact ? 'compact' : 'standard',
  }).format(value);
}
