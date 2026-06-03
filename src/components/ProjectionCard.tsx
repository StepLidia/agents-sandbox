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
      <p className={`mt-1 text-lg font-extrabold ${palette.text}`}>
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
  const padding = { top: 18, right: 18, bottom: 30, left: 42 };
  const maxValue = Math.max(...points.map(({ value }) => value), 500000);
  const xScale = (year: number) => padding.left + (year / 30) * (width - padding.left - padding.right);
  const yScale = (value: number) => padding.top + (1 - value / maxValue) * (height - padding.top - padding.bottom);
  const line = points.map((point) => `${xScale(point.year)},${yScale(point.value)}`).join(' ');
  const area = `${padding.left},${height - padding.bottom} ${line} ${xScale(30)},${height - padding.bottom}`;
  const ticks = [0, 100000, 200000, 300000, 400000, 500000];

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="mt-2 aspect-[2.75/1] w-full overflow-visible">
      {ticks.map((tick) => (
        <g key={tick}>
          <line x1={padding.left} x2={width - padding.right} y1={yScale(tick)} y2={yScale(tick)} stroke="rgba(100,116,139,.2)" />
          <text x={8} y={yScale(tick) + 4} className="fill-slate-700 text-[11px]">
            {tick === 0 ? '0' : `${tick / 1000}K`}
          </text>
        </g>
      ))}
      {[0, 5, 10, 15, 20, 25, 30].map((year) => (
        <text key={year} x={xScale(year)} y={height - 7} textAnchor="middle" className="fill-slate-700 text-[11px]">
          {year}
        </text>
      ))}
      <polygon points={area} fill={palette.fill} />
      <polyline points={line} fill="none" stroke={palette.stroke} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      {points.filter((point) => point.year % 3 === 0).map((point) => (
        <circle key={point.year} cx={xScale(point.year)} cy={yScale(point.value)} r="3.2" fill={palette.stroke} stroke="white" strokeWidth="1.4" />
      ))}
      <g transform={`translate(${xScale(30) - 25} ${yScale(points.at(-1)?.value ?? 0) - 31})`}>
        <rect width="43" height="23" rx="5" fill={palette.stroke} />
        <text x="21.5" y="15" textAnchor="middle" className="fill-white text-[11px] font-bold">
          {currency(points.at(-1)?.value ?? 0, true)}
        </text>
      </g>
      <text x={width / 2} y={height + 12} textAnchor="middle" className="fill-slate-800 text-[11px]">
        Years
      </text>
    </svg>
  );
}
