export const colorClasses = {
  blue: {
    text: 'text-blue-600',
    bg: 'bg-blue-500/12',
    border: 'border-blue-300/40',
    fill: 'rgba(37, 99, 235, 0.18)',
    stroke: '#2563eb',
  },
  violet: {
    text: 'text-violet-600',
    bg: 'bg-violet-500/12',
    border: 'border-violet-300/40',
    fill: 'rgba(124, 58, 237, 0.18)',
    stroke: '#6d28d9',
  },
  emerald: {
    text: 'text-emerald-700',
    bg: 'bg-emerald-500/12',
    border: 'border-emerald-300/40',
    fill: 'rgba(5, 150, 105, 0.16)',
    stroke: '#047857',
  },
  coral: {
    text: 'text-rose-600',
    bg: 'bg-rose-500/12',
    border: 'border-rose-300/40',
    fill: 'rgba(244, 114, 94, 0.16)',
    stroke: '#f4725e',
  },
};

export type ChartPalette = (typeof colorClasses)['blue'];
