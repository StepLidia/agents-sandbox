export type AssetKind = 'savings' | 'investments' | 'pillar2' | 'pillar3';

export type FinancialAsset = {
  id: AssetKind;
  label: string;
  subtitle: string;
  amount: number;
  monthlyContribution: number;
  annualReturn: number;
  years: number;
  color: 'blue' | 'violet' | 'emerald' | 'coral' | 'cyan';
};

export type ProjectionPoint = {
  year: number;
  value: number;
};

export type IncomePlan = {
  monthlyNetIncome: number;
  savingsContribution: number;
  investmentContribution: number;
  pillar3Contribution: number;
  otherExpenses: number;
};

export type InsightAmounts = {
  extraInvestmentContributionValue: number;
  favourableMarketReturnValue: number;
  savingsToInvestmentValue: number;
};

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
    monthlyContribution: 260,
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

export function futureValue(
  principal: number,
  annualReturnPercent: number,
  years: number,
  monthlyContribution = 0,
): number {
  const safeYears = Math.max(0, Math.round(years));
  const yearlyRate = annualReturnPercent / 100;
  const safePrincipal = Math.max(0, principal);
  const yearlyContribution = Math.max(0, monthlyContribution) * 12;
  let value = safePrincipal;

  for (let year = 0; year < safeYears; year += 1) {
    value = value * (1 + yearlyRate) + yearlyContribution;
  }

  return value;
}

export function buildProjection(
  principal: number,
  annualReturnPercent: number,
  years: number,
  monthlyContribution = 0,
): ProjectionPoint[] {
  const safeYears = Math.max(0, Math.round(years));

  return Array.from({ length: safeYears + 1 }, (_, year) => ({
    year,
    value: futureValue(principal, annualReturnPercent, year, monthlyContribution),
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
  const projection = buildProjection(asset.amount, asset.annualReturn, asset.years, asset.monthlyContribution);
  const value = futureValue(asset.amount, asset.annualReturn, asset.years, asset.monthlyContribution);

  return {
    ...asset,
    projection,
    futureValue: Math.round(value),
  };
}

export function calculateDashboard(rawAssets = assets, income = incomePlan) {
  const contributionById = Object.fromEntries(rawAssets.map((asset) => [asset.id, asset.monthlyContribution])) as Record<
    AssetKind,
    number
  >;
  const savingsContribution = Math.max(0, contributionById.savings);
  const investmentContribution = Math.max(0, contributionById.investments);
  const pillar3Contribution = Math.max(0, contributionById.pillar3);
  const derivedOtherExpenses = Math.max(
    0,
    income.monthlyNetIncome - savingsContribution - investmentContribution - pillar3Contribution,
  );
  const derivedIncome = {
    ...income,
    savingsContribution,
    investmentContribution,
    pillar3Contribution,
    otherExpenses: derivedOtherExpenses,
  };
  const calculatedAssets = rawAssets.map(calculateAsset);
  const savingsAsset = rawAssets.find(({ id }) => id === 'savings') ?? assets[0];
  const investmentAsset = rawAssets.find(({ id }) => id === 'investments') ?? assets[1];
  const savingsInvestments = calculatedAssets.filter(({ id }) => id === 'savings' || id === 'investments');
  const pensionAssets = calculatedAssets.filter(({ id }) => id === 'pillar2' || id === 'pillar3');
  const savingsInvestmentProjection = combineProjections(savingsInvestments.map(({ projection }) => projection));
  const pensionProjection = combineProjections(pensionAssets.map(({ projection }) => projection));
  const totalProjection = combineProjections(calculatedAssets.map(({ projection }) => projection));
  const totalWealth = Math.round(totalProjection.at(-1)?.value ?? 0);
  const pensionWealth = Math.round(pensionProjection.at(-1)?.value ?? 0);
  const liquidWealth = Math.round(savingsInvestmentProjection.at(-1)?.value ?? 0);
  const monthlyNetIncome = Math.max(0, derivedIncome.monthlyNetIncome);
  const futureBuildingPercent =
    monthlyNetIncome === 0
      ? 0
      : ((derivedIncome.savingsContribution + derivedIncome.investmentContribution + derivedIncome.pillar3Contribution) /
        monthlyNetIncome) *
      100;
  const insightAmounts: InsightAmounts = {
    extraInvestmentContributionValue: Math.round(futureValue(0, investmentAsset.annualReturn, 30, 200)),
    favourableMarketReturnValue: Math.round(
      futureValue(
        investmentAsset.amount,
        investmentAsset.annualReturn + 1,
        30,
        investmentAsset.monthlyContribution,
      ) -
      futureValue(
        investmentAsset.amount,
        investmentAsset.annualReturn,
        30,
        investmentAsset.monthlyContribution,
      ),
    ),
    savingsToInvestmentValue: Math.round(
      futureValue(10000, investmentAsset.annualReturn, 30) -
      futureValue(10000, savingsAsset.annualReturn, 30),
    ),
  };

  return {
    assets: calculatedAssets,
    totalWealth,
    pensionWealth,
    liquidWealth,
    totalProjection,
    pensionProjection,
    savingsInvestmentProjection,
    futureBuildingPercent,
    insightAmounts,
    income: derivedIncome,
  };
}

export function currency(value: number, compact = false) {
  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 0,
    notation: compact ? 'compact' : 'standard',
  }).format(value);
}
