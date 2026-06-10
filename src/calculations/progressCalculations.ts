export type ProgressAsset = {
  amount: number;
  monthlyContribution: number;
};

export type ProgressProjectionAsset = ProgressAsset & {
  annualReturn: number;
  id: string;
};

export type ProgressChartActualPoint = {
  date: Date;
  totalWealth: number;
};

export type ProgressChartPoint = {
  actualWealth: number | null;
  optimisticWealth: number;
  plannedWealth: number;
  year: number;
};

export function calculateCurrentWealth(assets: ProgressAsset[]) {
  return assets.reduce((sum, asset) => sum + asset.amount, 0);
}

export function calculateMonthlyPlanContribution(assets: ProgressAsset[]) {
  return assets.reduce((sum, asset) => sum + asset.monthlyContribution, 0);
}

export function calculateMonthsTracked(startDate: Date, endDate: Date) {
  const months = (endDate.getFullYear() - startDate.getFullYear()) * 12 + endDate.getMonth() - startDate.getMonth();

  return Math.max(0, months);
}

export function calculateYearsTracked(monthsTracked: number) {
  return Math.round((monthsTracked / 12) * 10) / 10;
}

export function calculatePlannedWealth({
  baselineWealth,
  monthlyPlanContribution,
  monthsTracked,
}: {
  baselineWealth: number;
  monthlyPlanContribution: number;
  monthsTracked: number;
}) {
  return baselineWealth + monthlyPlanContribution * monthsTracked;
}

export function calculateProgressDelta(currentWealth: number, plannedWealth: number) {
  return currentWealth - plannedWealth;
}

export function calculateProgressDeltaPercent(currentWealth: number, plannedWealth: number) {
  if (plannedWealth === 0) {
    return currentWealth === 0 ? 0 : 100;
  }

  return ((currentWealth - plannedWealth) / plannedWealth) * 100;
}

export function calculateTotalBalance(balances: Record<string, number>) {
  return Object.values(balances).reduce((sum, balance) => sum + balance, 0);
}

export function buildProgressChartData({
  actualPoints,
  baselineDate,
  baselineWealth,
  monthlyPlanContribution,
  optimisticAssets,
  projectionYears,
}: {
  actualPoints: ProgressChartActualPoint[];
  baselineDate: Date;
  baselineWealth: number;
  monthlyPlanContribution: number;
  optimisticAssets: ProgressProjectionAsset[];
  projectionYears: number;
}) {
  const safeProjectionYears = Math.max(1, Math.round(projectionYears));
  const optimisticProjection = buildOptimisticProgressProjection({
    assets: optimisticAssets,
    baselineWealth,
    projectionYears: safeProjectionYears,
  });
  const pointByYear = new Map<string, ProgressChartPoint>();

  function setPoint(year: number, actualWealth: number | null = null) {
    const safeYear = Math.max(0, Math.min(safeProjectionYears, year));
    const key = safeYear.toFixed(4);
    const existingPoint = pointByYear.get(key);
    const plannedWealth = calculatePlannedWealth({
      baselineWealth,
      monthlyPlanContribution,
      monthsTracked: Math.round(safeYear * 12),
    });

    pointByYear.set(key, {
      actualWealth: actualWealth ?? existingPoint?.actualWealth ?? null,
      optimisticWealth: interpolateProgressProjectionValue(optimisticProjection, safeYear),
      plannedWealth,
      year: safeYear,
    });
  }

  for (let year = 0; year <= safeProjectionYears; year += 1) {
    setPoint(year);
  }

  actualPoints.forEach((point) => {
    const monthsTracked = calculateMonthsTracked(baselineDate, point.date);
    const year = monthsTracked / 12;

    if (year <= safeProjectionYears) {
      setPoint(year, point.totalWealth);
    }
  });

  return [...pointByYear.values()].sort((a, b) => a.year - b.year);
}

function interpolateProgressProjectionValue(points: Array<{ value: number; year: number }>, year: number) {
  const lowerPoint = [...points].reverse().find((point) => point.year <= year) ?? points[0];
  const upperPoint = points.find((point) => point.year >= year) ?? points.at(-1);

  if (!lowerPoint || !upperPoint) {
    return 0;
  }

  if (lowerPoint.year === upperPoint.year) {
    return lowerPoint.value;
  }

  const progress = (year - lowerPoint.year) / (upperPoint.year - lowerPoint.year);

  return lowerPoint.value + (upperPoint.value - lowerPoint.value) * progress;
}

export function buildOptimisticProgressProjection({
  assets,
  baselineWealth,
  projectionYears,
}: {
  assets: ProgressProjectionAsset[];
  baselineWealth: number;
  projectionYears: number;
}) {
  const safeProjectionYears = Math.max(1, Math.round(projectionYears));
  const totalAssetWealth = calculateCurrentWealth(assets);

  return Array.from({ length: safeProjectionYears + 1 }, (_, year) => ({
    value: assets.reduce((sum, asset) => {
      const baselineAmount = totalAssetWealth > 0 ? (asset.amount / totalAssetWealth) * baselineWealth : 0;
      const optimisticReturn = shouldBoostOptimisticReturn(asset.id) ? asset.annualReturn + 1 : asset.annualReturn;

      return sum + calculateAssetProjectionValue({
        annualReturnPercent: optimisticReturn,
        monthlyContribution: asset.monthlyContribution,
        principal: baselineAmount,
        years: year,
      });
    }, 0),
    year,
  }));
}

function calculateAssetProjectionValue({
  annualReturnPercent,
  monthlyContribution,
  principal,
  years,
}: {
  annualReturnPercent: number;
  monthlyContribution: number;
  principal: number;
  years: number;
}) {
  const safeYears = Math.max(0, Math.round(years));
  const yearlyRate = annualReturnPercent / 100;
  const yearlyContribution = Math.max(0, monthlyContribution) * 12;
  let value = Math.max(0, principal);

  for (let year = 0; year < safeYears; year += 1) {
    value = value * (1 + yearlyRate) + yearlyContribution;
  }

  return value;
}

function shouldBoostOptimisticReturn(assetId: string) {
  return assetId === 'investments' || assetId === 'pillar2' || assetId === 'pillar3';
}
