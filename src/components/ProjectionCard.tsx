import { CircleHelp } from 'lucide-react';
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
        <CircleHelp className="h-4 w-4 text-slate-500" />
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
  const width = 520;
  const height = 188;
  const padding = { top: 18, right: 18, bottom: 30, left: 48 };
  const maxYear = Math.max(points.at(-1)?.year ?? 30, 1);
  const rawMaxValue = Math.max(...points.map(({ value }) => value), 1);
  const ticks = buildValueTicks(rawMaxValue);
  const maxValue = ticks.at(-1) ?? rawMaxValue;
  const xScale = (year: number) => padding.left + (year / maxYear) * (width - padding.left - padding.right);
  const yScale = (value: number) => padding.top + (1 - value / maxValue) * (height - padding.top - padding.bottom);
  const line = points.map((point) => `${xScale(point.year)},${yScale(point.value)}`).join(' ');
  const area = `${padding.left},${height - padding.bottom} ${line} ${xScale(maxYear)},${height - padding.bottom}`;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="mt-2 aspect-[2.75/1] w-full overflow-visible">
      {ticks.map((tick) => (
        <g key={tick}>
          <line x1={padding.left} x2={width - padding.right} y1={yScale(tick)} y2={yScale(tick)} stroke="rgba(100,116,139,.2)" />
          <text x={4} y={yScale(tick) + 4} className="fill-slate-700 text-[10px]">
            {formatAxisValue(tick)}
          </text>
        </g>
      ))}
      {buildYearTicks(maxYear).map((year) => (
        <text key={year} x={xScale(year)} y={height - 7} textAnchor="middle" className="fill-slate-700 text-[11px]">
          {year}
        </text>
      ))}
      <polygon points={area} fill={palette.fill} />
      <polyline points={line} fill="none" stroke={palette.stroke} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      {points.filter((point) => point.year % 3 === 0).map((point) => (
        <circle key={point.year} cx={xScale(point.year)} cy={yScale(point.value)} r="3.2" fill={palette.stroke} stroke="white" strokeWidth="1.4" />
      ))}
      <g transform={`translate(${xScale(maxYear) - 29} ${yScale(points.at(-1)?.value ?? 0) - 31})`}>
        <rect width="50" height="23" rx="5" fill={palette.stroke} />
        <text x="25" y="15" textAnchor="middle" className="fill-white text-[10px] font-bold">
          {currency(points.at(-1)?.value ?? 0, true)}
        </text>
      </g>
      <text x={width / 2} y={height + 12} textAnchor="middle" className="fill-slate-800 text-[11px]">
        Years
      </text>
    </svg>
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
