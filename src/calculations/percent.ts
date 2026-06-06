export function getPercent(value: number, total: number) {
  return total > 0 ? (value / total) * 100 : 0;
}

export function formatPercent(value: number, total: number, fractionDigits = 1) {
  return `${getPercent(value, total).toFixed(fractionDigits)}%`;
}
