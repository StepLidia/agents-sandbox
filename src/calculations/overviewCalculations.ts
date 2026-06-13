import { getPercent } from './percent';

export function calculateOverviewProgressPercent(currentValue: number, projectedValue: number) {
  if (projectedValue <= 0) {
    return currentValue > 0 ? 100 : 0;
  }

  return Math.min(Math.max(getPercent(currentValue, projectedValue), 0), 100);
}
