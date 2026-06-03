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

export function calculateAsset(asset: FinancialAsset, projectionYears = asset.years) {
  const projection = buildProjection(asset.amount, asset.annualReturn, projectionYears, asset.monthlyContribution);
  const value = futureValue(asset.amount, asset.annualReturn, projectionYears, asset.monthlyContribution);

  return {
    ...asset,
    years: projectionYears,
    projection,
    futureValue: Math.round(value),
  };
}

export function calculateDashboard(rawAssets: FinancialAsset[], income: IncomePlan, projectionYears = 30) {
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
  const calculatedAssets = rawAssets.map((asset) => calculateAsset(asset, projectionYears));
  const savingsAsset = rawAssets.find(({ id }) => id === 'savings') ?? rawAssets[0];
  const investmentAsset = rawAssets.find(({ id }) => id === 'investments') ?? rawAssets[1];
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
  const baselineInvestmentValue = futureValue(
    investmentAsset.amount,
    investmentAsset.annualReturn,
    projectionYears,
    investmentAsset.monthlyContribution,
  );
  const transferFromSavings = Math.min(10000, Math.max(0, savingsAsset.amount));
  const baselineSavingsValue = futureValue(
    savingsAsset.amount,
    savingsAsset.annualReturn,
    projectionYears,
    savingsAsset.monthlyContribution,
  );
  const transferredSavingsValue = futureValue(
    savingsAsset.amount - transferFromSavings,
    savingsAsset.annualReturn,
    projectionYears,
    savingsAsset.monthlyContribution,
  );
  const transferredInvestmentValue = futureValue(
    investmentAsset.amount + transferFromSavings,
    investmentAsset.annualReturn,
    projectionYears,
    investmentAsset.monthlyContribution,
  );
  const insightAmounts: InsightAmounts = {
    extraInvestmentContributionValue: Math.round(
      futureValue(
        investmentAsset.amount,
        investmentAsset.annualReturn,
        projectionYears,
        investmentAsset.monthlyContribution + 200,
      ) - baselineInvestmentValue,
    ),
    favourableMarketReturnValue: Math.round(
      futureValue(
        investmentAsset.amount,
        investmentAsset.annualReturn + 1,
        projectionYears,
        investmentAsset.monthlyContribution,
      ) - baselineInvestmentValue,
    ),
    savingsToInvestmentValue: Math.round(
      transferredSavingsValue + transferredInvestmentValue - baselineSavingsValue - baselineInvestmentValue,
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
