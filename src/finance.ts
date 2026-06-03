export type AssetKind = 'savings' | 'investments' | 'pillar2' | 'pillar3';

export type FinancialAsset = {
  id: AssetKind;
  label: string;
  subtitle: string;
  amount: number;
  annualReturn: number;
  years: number;
  color: 'blue' | 'violet' | 'emerald' | 'amber';
};

export type ProjectionPoint = {
  year: number;
  value: number;
};

export type IncomePlan = {
  monthlyNetIncome: number;
  savingsContribution: number;
  investmentContribution: number;
  otherExpenses: number;
};

export const assets: FinancialAsset[] = [
  {
    id: 'savings',
    label: 'Savings Account',
    subtitle: 'Liquid reserve',
    amount: 25000,
    annualReturn: 1.2,
    years: 30,
    color: 'blue',
  },
  {
    id: 'investments',
    label: 'Investments',
    subtitle: 'Securities portfolio',
    amount: 40000,
    annualReturn: 5.5,
    years: 30,
    color: 'violet',
  },
  {
    id: 'pillar2',
    label: '2nd Pillar',
    subtitle: 'Pension fund',
    amount: 85000,
    annualReturn: 2.25,
    years: 30,
    color: 'emerald',
  },
  {
    id: 'pillar3',
    label: '3rd Pillar',
    subtitle: 'Private retirement',
    amount: 15000,
    annualReturn: 3,
    years: 30,
    color: 'amber',
  },
];

export const incomePlan: IncomePlan = {
  monthlyNetIncome: 6000,
  savingsContribution: 1000,
  investmentContribution: 1500,
  otherExpenses: 3500,
};

export function futureValue(principal: number, annualReturnPercent: number, years: number): number {
  return Math.max(0, principal) * (1 + annualReturnPercent / 100) ** Math.max(0, years);
}

export function buildProjection(
  principal: number,
  annualReturnPercent: number,
  years: number,
): ProjectionPoint[] {
  const safeYears = Math.max(0, Math.round(years));

  return Array.from({ length: safeYears + 1 }, (_, year) => ({
    year,
    value: futureValue(principal, annualReturnPercent, year),
  }));
}

export function combineProjections(series: ProjectionPoint[][]): ProjectionPoint[] {
  const longest = Math.max(...series.map((points) => points.length));

  return Array.from({ length: longest }, (_, index) => ({
    year: index,
    value: series.reduce((sum, points) => sum + (points[index]?.value ?? points.at(-1)?.value ?? 0), 0),
  }));
}

export function calculateAsset(asset: FinancialAsset) {
  const projection = buildProjection(asset.amount, asset.annualReturn, asset.years);
  const value = futureValue(asset.amount, asset.annualReturn, asset.years);

  return {
    ...asset,
    projection,
    futureValue: Math.round(value),
  };
}

export function calculateDashboard(rawAssets = assets, income = incomePlan) {
  const calculatedAssets = rawAssets.map(calculateAsset);
  const savingsInvestments = calculatedAssets.filter(({ id }) => id === 'savings' || id === 'investments');
  const pensionAssets = calculatedAssets.filter(({ id }) => id === 'pillar2' || id === 'pillar3');
  const savingsInvestmentProjection = combineProjections(savingsInvestments.map(({ projection }) => projection));
  const pensionProjection = combineProjections(pensionAssets.map(({ projection }) => projection));
  const totalProjection = combineProjections(calculatedAssets.map(({ projection }) => projection));
  const totalWealth = Math.round(totalProjection.at(-1)?.value ?? 0);
  const pensionWealth = Math.round(pensionProjection.at(-1)?.value ?? 0);
  const liquidWealth = Math.round(savingsInvestmentProjection.at(-1)?.value ?? 0);
  const monthlyNetIncome = Math.max(0, income.monthlyNetIncome);
  const futureBuildingPercent =
    monthlyNetIncome === 0 ? 0 : ((income.savingsContribution + income.investmentContribution) / monthlyNetIncome) * 100;

  return {
    assets: calculatedAssets,
    totalWealth,
    pensionWealth,
    liquidWealth,
    totalProjection,
    pensionProjection,
    savingsInvestmentProjection,
    futureBuildingPercent,
    income,
  };
}

export function currency(value: number, compact = false) {
  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 0,
    notation: compact ? 'compact' : 'standard',
  }).format(value);
}
