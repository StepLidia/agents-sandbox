import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  DEFAULT_REPAYMENT_YEARS,
  DEFAULT_TARGET_LOAN_TO_VALUE_RATIO,
  calculateMortgageCosts,
  type MortgageAmortizationStrategy,
  type MortgageCostAmounts,
} from '../calculations/mortgageCalculations';
import {
  calculateMortgageRentComparison,
  type MortgageRentComparisonPoint,
} from '../calculations/mortgageRentComparisonCalculations';
import { colorClasses, type ChartPalette } from '../constants/colors';
import { tooltipContentClasses } from '../constants/tooltipStyles';
import { currency } from '../finance';
import { useEditableNumber } from '../hooks/useEditableNumber';

const strategyLabels: Record<MortgageAmortizationStrategy, string> = {
  direct: 'Direct Amortization',
  indirect: 'Indirect Amortization (3a)',
};

export function CostsVsRentingCard({
  costAmounts,
  interestRate,
  maintenanceRate,
  mortgageAmount,
  onRentPerMonthChange,
  propertyPrice,
  rentPerMonth,
}: {
  costAmounts: MortgageCostAmounts;
  interestRate: number;
  maintenanceRate: number;
  mortgageAmount: number;
  onRentPerMonthChange: (amount: number) => void;
  propertyPrice: number;
  rentPerMonth: number;
}) {
  const costs = calculateMortgageCosts({ costAmounts, maintenanceRate, propertyPrice });
  const { inputValue, onInputChange } = useEditableNumber(rentPerMonth, onRentPerMonthChange, { format: 'money' });
  const charts = (['direct', 'indirect'] as const).map((strategy) => ({
    points: calculateMortgageRentComparison({
      annualInterestRate: interestRate,
      mortgageAmount,
      monthlyRent: rentPerMonth,
      propertyPrice,
      strategy,
      targetLoanToValueRatio: DEFAULT_TARGET_LOAN_TO_VALUE_RATIO,
      totalOngoingAnnualCosts: costs.totalOngoingAnnualCosts,
      totalOneTimeCosts: costs.totalOneTimeCosts,
      years: DEFAULT_REPAYMENT_YEARS,
    }),
    strategy,
  }));

  return (
    <section className="glass-panel p-4">
      <div>
        <h2 className="text-base font-bold tracking-normal text-slate-950 md:text-lg">4. Costs vs Renting</h2>
        <p className="mt-1 text-sm font-semibold text-slate-600">
          Compare annual costs of mortgage with renting costs
        </p>
      </div>

      <label className="mt-4 flex flex-col gap-2 text-sm font-bold text-slate-600 md:w-80">
        <span>Rent per month</span>
        <span className="glass-input h-10 justify-between gap-2 px-3 py-2">
          <input
            aria-label="Rent per month"
            className="min-w-0 flex-1 bg-transparent text-right font-black text-slate-950 outline-none"
            inputMode="numeric"
            type="text"
            value={inputValue}
            onChange={(event) => onInputChange(event.currentTarget.value)}
          />
          <span className="text-sm font-semibold text-slate-600">CHF</span>
        </span>
      </label>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {charts.map((chart) => (
          <CostsVsRentingPlot
            key={chart.strategy}
            palette={chart.strategy === 'direct' ? colorClasses.blue : colorClasses.cyan}
            points={chart.points}
            strategy={chart.strategy}
          />
        ))}
      </div>
    </section>
  );
}

function CostsVsRentingPlot({
  palette,
  points,
  strategy,
}: {
  palette: ChartPalette;
  points: MortgageRentComparisonPoint[];
  strategy: MortgageAmortizationStrategy;
}) {
  const maxYear = points.at(-1)?.year ?? DEFAULT_REPAYMENT_YEARS;
  const rawMaxValue = Math.max(...points.map(({ mortgageCost, rentCost }) => Math.max(mortgageCost, rentCost)), 1);
  const ticks = buildValueTicks(rawMaxValue);
  const maxValue = ticks.at(-1) ?? rawMaxValue;
  const yearTicks = buildYearTicks(maxYear);
  const gradientId = `rent-comparison-gradient-${strategy}`;
  const chartData = points.map((point) => ({
    mortgageCost: Math.round(point.mortgageCost),
    rentCost: Math.round(point.rentCost),
    year: point.year,
  }));
  const firstYearCost = points[0]?.mortgageCost ?? 0;
  const annualRentCost = points[0]?.rentCost ?? 0;

  return (
    <article className="glass-panel p-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-slate-950">{strategyLabels[strategy]}</h3>
          <p className="mt-1 text-sm font-semibold text-slate-600">
            Year 1: <span className={palette.text}>{currency(firstYearCost)} CHF</span>
          </p>
        </div>
        <span className="rounded-lg bg-slate-200/50 px-2 py-1 text-sm font-bold text-slate-600">
          Rent {currency(annualRentCost)} CHF
        </span>
      </div>

      <div className="mt-2 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm font-bold text-slate-700">
        <ChartLegendItem color={palette.stroke} label="Mortgage costs" />
        <ChartLegendItem color="#64748b" dashed label="Renting costs" />
      </div>

      <div className="mt-2 h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 14, right: 12, bottom: 6, left: -6 }}>
            <defs>
              <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor={palette.stroke} stopOpacity={0.22} />
                <stop offset="48%" stopColor={palette.stroke} stopOpacity={0.1} />
                <stop offset="100%" stopColor={palette.stroke} stopOpacity={0.01} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="rgba(100,116,139,.18)" strokeDasharray="0" vertical={false} />
            <XAxis
              axisLine={false}
              dataKey="year"
              domain={[1, maxYear]}
              interval="preserveStartEnd"
              tick={{ fill: '#475569', fontSize: 11, fontWeight: 700 }}
              tickLine={false}
              ticks={yearTicks}
              type="number"
            />
            <YAxis
              axisLine={false}
              domain={[0, maxValue]}
              tick={{ fill: '#475569', fontSize: 10, fontWeight: 700 }}
              tickFormatter={formatAxisValue}
              tickLine={false}
              ticks={ticks}
              width={48}
            />
            <Tooltip
              content={<CostsVsRentingTooltip />}
              cursor={{ stroke: palette.stroke, strokeDasharray: '3 5', strokeOpacity: 0.45, strokeWidth: 1.5 }}
              isAnimationActive={false}
              wrapperStyle={{ outline: 'none', pointerEvents: 'none' }}
            />
            <Area
              activeDot={{ r: 5, fill: palette.stroke, stroke: 'white', strokeWidth: 2 }}
              dataKey="mortgageCost"
              dot={false}
              fill={`url(#${gradientId})`}
              isAnimationActive={false}
              name="Mortgage costs"
              stroke={palette.stroke}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={3}
              type="monotone"
            />
            <Area
              activeDot={{ r: 4, fill: '#64748b', stroke: 'white', strokeWidth: 2 }}
              dataKey="rentCost"
              dot={false}
              fill="transparent"
              isAnimationActive={false}
              name="Renting costs"
              stroke="#64748b"
              strokeDasharray="5 5"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeOpacity={0.78}
              strokeWidth={2}
              type="monotone"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </article>
  );
}

function ChartLegendItem({
  color,
  dashed = false,
  label,
}: {
  color: string;
  dashed?: boolean;
  label: string;
}) {
  return (
    <span className="flex items-center gap-2">
      <span
        className={`h-0.5 w-6 ${dashed ? 'border-t-2 border-dashed bg-transparent' : ''}`}
        style={dashed ? { borderColor: color } : { backgroundColor: color }}
      />
      {label}
    </span>
  );
}

type CostsVsRentingTooltipProps = {
  active?: boolean;
  payload?: Array<{ dataKey?: string; value?: number }>;
  label?: number | string;
};

function CostsVsRentingTooltip({ active, payload, label }: CostsVsRentingTooltipProps) {
  const mortgageCost = payload?.find(({ dataKey }) => dataKey === 'mortgageCost')?.value;
  const rentCost = payload?.find(({ dataKey }) => dataKey === 'rentCost')?.value;

  if (!active || typeof mortgageCost !== 'number') {
    return null;
  }

  return (
    <div className={tooltipContentClasses('-translate-y-3 px-3 py-2')}>
      <p className="font-bold text-slate-950">Year {label}</p>
      <p className="mt-1 text-slate-700">Mortgage: {currency(mortgageCost)} CHF</p>
      {typeof rentCost === 'number' && <p className="text-slate-600">Renting: {currency(rentCost)} CHF</p>}
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
  const ticks = Array.from({ length: Math.floor(maxYear / step) + 1 }, (_, index) => Math.max(1, index * step));
  const uniqueTicks = [...new Set(ticks)];

  return uniqueTicks.at(-1) === maxYear ? uniqueTicks : [...uniqueTicks, maxYear];
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
