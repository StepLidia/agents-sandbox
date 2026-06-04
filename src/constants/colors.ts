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
    text: 'text-rose-500',
    bg: 'bg-rose-400/10',
    border: 'border-rose-200/50',
    fill: 'rgba(251, 113, 133, 0.14)',
    stroke: '#fb7185',
  },
  cyan: {
    text: 'text-cyan-700',
    bg: 'bg-cyan-500/12',
    border: 'border-cyan-300/45',
    fill: 'rgba(6, 182, 212, 0.15)',
    stroke: '#0891b2',
  },
};

export type ChartPalette = (typeof colorClasses)['blue'];
