import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { currency, type ProjectionPoint } from '../finance';
import type { ChartPalette } from './colors';

export function ProjectionCard({
  title,
  note,
  amount,
  subtitle,
  points,
  palette,
}: {
  title: string;
  note?: string;
  amount: number;
  subtitle: string;
  points: ProjectionPoint[];
  palette: ChartPalette;
}) {
  return (
    <section className="glass-panel p-4">
      <div className="flex items-center gap-2">
        <h2 className="text-sm font-bold">{title}</h2>
        {note && <span className="text-xs text-slate-600">({note})</span>}
      </div>
      <p className={`mt-1 text-lg font-bold ${palette.text}`}>
        {currency(amount)} <span className="text-xs text-slate-800">CHF</span>
      </p>
      <p className="text-xs text-slate-600">{subtitle}</p>
      <ProjectionChart points={points} palette={palette} />
    </section>
  );
}

function ProjectionChart({ points, palette }: { points: ProjectionPoint[]; palette: ChartPalette }) {
  const maxYear = Math.max(points.at(-1)?.year ?? 30, 1);
  const rawMaxValue = Math.max(...points.map(({ value }) => value), 1);
  const ticks = buildValueTicks(rawMaxValue);
  const maxValue = ticks.at(-1) ?? rawMaxValue;
  const yearTicks = buildYearTicks(maxYear);
  const gradientId = `projection-gradient-${palette.stroke.replace('#', '')}`;
  const chartData = points.map((point) => ({
    year: point.year,
    value: Math.round(point.value),
  }));

  return (
    <div className="mt-2 h-[188px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 14, right: 12, bottom: 6, left: -10 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor={palette.stroke} stopOpacity={0.24} />
              <stop offset="48%" stopColor={palette.stroke} stopOpacity={0.11} />
              <stop offset="100%" stopColor={palette.stroke} stopOpacity={0.01} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="rgba(100,116,139,.18)" strokeDasharray="0" vertical={false} />
          <XAxis
            axisLine={false}
            dataKey="year"
            domain={[0, maxYear]}
            interval="preserveStartEnd"
            tick={{ fill: '#475569', fontSize: 11 }}
            tickLine={false}
            ticks={yearTicks}
            type="number"
          />
          <YAxis
            axisLine={false}
            domain={[0, maxValue]}
            tick={{ fill: '#475569', fontSize: 10 }}
            tickFormatter={formatAxisValue}
            tickLine={false}
            ticks={ticks}
            width={48}
          />
          <Tooltip
            content={<ProjectionTooltip />}
            cursor={{ stroke: palette.stroke, strokeDasharray: '3 5', strokeOpacity: 0.45, strokeWidth: 1.5 }}
            isAnimationActive={false}
            wrapperStyle={{ outline: 'none', pointerEvents: 'none' }}
          />
          <Area
            activeDot={{ r: 5, fill: palette.stroke, stroke: 'white', strokeWidth: 2 }}
            dataKey="value"
            dot={false}
            fill={`url(#${gradientId})`}
            isAnimationActive={false}
            stroke={palette.stroke}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={3}
            type="monotone"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

type ProjectionTooltipProps = {
  active?: boolean;
  payload?: Array<{ value?: number }>;
  label?: number | string;
};

function ProjectionTooltip({ active, payload, label }: ProjectionTooltipProps) {
  const value = payload?.[0]?.value;

  if (!active || typeof value !== 'number') {
    return null;
  }

  return (
    <div className="-translate-y-3 rounded-lg border border-white/70 bg-white/80 px-3 py-2 text-xs shadow-xl shadow-slate-400/20 backdrop-blur-xl">
      <p className="font-bold text-slate-950">{currency(value)} CHF</p>
      <p className="mt-0.5 text-slate-600">Year {label}</p>
    </div>
  );
}

function buildValueTicks(maxValue: number) {
  const roughStep = maxValue / 5;
  const magnitude = 10 ** Math.floor(Math.log10(roughStep));
  const normalized = roughStep / magnitude;
  const niceNormalizedStep = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10;
  const step = niceNormalizedStep * magnitude;
  const niceMax = Math.max(step, Math.ceil(maxValue / step) * step);

  return Array.from({ length: 6 }, (_, index) => (niceMax / 5) * index);
}

function buildYearTicks(maxYear: number) {
  const step = Math.max(1, Math.ceil(maxYear / 6));
  const ticks = Array.from({ length: Math.floor(maxYear / step) + 1 }, (_, index) => index * step);

  return ticks.at(-1) === maxYear ? ticks : [...ticks, maxYear];
}

function formatAxisValue(value: number) {
  if (value === 0) {
    return '0';
  }

  if (value >= 1000000) {
    return `${Number((value / 1000000).toFixed(value >= 10000000 ? 0 : 1))}M`;
  }

  if (value >= 1000) {
    return `${Number((value / 1000).toFixed(value >= 100000 ? 0 : 1))}K`;
  }

  return String(Math.round(value));
}
