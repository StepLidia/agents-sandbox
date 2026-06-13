import { describe, expect, it } from 'vitest';
import { calculateOverviewProgressPercent } from './overviewCalculations';

describe('overview calculations', () => {
  it('calculates current wealth progress toward projected wealth', () => {
    expect(calculateOverviewProgressPercent(250000, 1000000)).toBe(25);
  });

  it('clamps progress between zero and one hundred', () => {
    expect(calculateOverviewProgressPercent(-100, 1000)).toBe(0);
    expect(calculateOverviewProgressPercent(1200, 1000)).toBe(100);
  });

  it('handles missing projected values', () => {
    expect(calculateOverviewProgressPercent(1000, 0)).toBe(100);
    expect(calculateOverviewProgressPercent(0, 0)).toBe(0);
  });
});
