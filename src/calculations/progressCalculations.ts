export type ProgressAsset = {
  amount: number;
  monthlyContribution: number;
};

export type ProgressChartActualPoint = {
  date: Date;
  totalWealth: number;
};

export type ProgressChartPoint = {
  actualWealth: number | null;
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
  projectionYears,
}: {
  actualPoints: ProgressChartActualPoint[];
  baselineDate: Date;
  baselineWealth: number;
  monthlyPlanContribution: number;
  projectionYears: number;
}) {
  const safeProjectionYears = Math.max(1, Math.round(projectionYears));
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
